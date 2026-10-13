// Builds public/models/sad-toaster.glb from the source Sketchfab export:
// converts spec/gloss → metal/rough, splits the mesh into Body + Head at the
// neck (so the head can turn on its own), then compresses.
//
//   node tools/build-model.mjs analyze sad_toaster.glb   # height profile, to find the neck
//   node tools/build-model.mjs islands sad_toaster.glb   # connected parts and their bounds
//   node tools/build-model.mjs build sad_toaster.glb     # writes public/models/sad-toaster.glb
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { metalRough, prune, transformPrimitive } from '@gltf-transform/functions';

const OUTPUT = 'public/models/sad-toaster.glb';

/**
 * World height (source units, Y up) separating head from body. Found with
 * `analyze` + `islands`: the toaster head's parts all start at y ≥ 0.79; the
 * body's (shoulder bolts, the toast in its hand) all end at y ≤ 0.77.
 */
const NECK_Y = 0.78;

/** Node names the site's scene looks up (src/scripts/toaster-scene.ts). */
export const HEAD_PIVOT_NODE = 'HeadPivot';

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

/** World-space positions of every vertex, as [x, y, z] (Y up). */
function worldPositions(doc) {
  const out = [];
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    const m = node.getWorldMatrix();
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute('POSITION');
      const v = [0, 0, 0];
      for (let i = 0; i < pos.getCount(); i++) {
        pos.getElement(i, v);
        out.push(applyMatrix(m, v));
      }
    }
  }
  return out;
}

function applyMatrix(m, [x, y, z]) {
  return [
    m[0] * x + m[4] * y + m[8] * z + m[12],
    m[1] * x + m[5] * y + m[9] * z + m[13],
    m[2] * x + m[6] * y + m[10] * z + m[14],
  ];
}

async function analyze(input) {
  const pts = worldPositions(await io.read(input));
  let minY = Infinity, maxY = -Infinity;
  for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
  const BINS = 50;
  const h = (maxY - minY) / BINS;
  console.log(`Y ${minY.toFixed(3)}..${maxY.toFixed(3)}, ${pts.length} vertices. Top → bottom:`);
  for (let b = BINS - 1; b >= 0; b--) {
    const lo = minY + b * h;
    const sel = pts.filter((p) => p[1] >= lo && p[1] < lo + h);
    if (!sel.length) { console.log(`${lo.toFixed(3)}  —`); continue; }
    const ext = (i) => Math.max(...sel.map((p) => p[i])) - Math.min(...sel.map((p) => p[i]));
    const cx = sel.reduce((s, p) => s + p[0], 0) / sel.length;
    const cz = sel.reduce((s, p) => s + p[2], 0) / sel.length;
    console.log(`${lo.toFixed(3)}  n=${String(sel.length).padStart(5)}  w=${ext(0).toFixed(2)} d=${ext(2).toFixed(2)}  c=(${cx.toFixed(2)}, ${cz.toFixed(2)})  ${'#'.repeat(Math.round(sel.length / 120))}`);
  }
}

/**
 * Splits a primitive's triangles into connected islands. Vertices are welded
 * by position first, since UV seams duplicate vertices that are really joined.
 * Returns, per island, its triangle indices and world-space bounds.
 */
function islands(prim, matrix) {
  const pos = prim.getAttribute('POSITION');
  const index = prim.getIndices();
  const triCount = index ? index.getCount() / 3 : pos.getCount() / 3;
  const vertexAt = (t, k) => (index ? index.getScalar(t * 3 + k) : t * 3 + k);

  // Weld: map each vertex to a canonical id by quantized world position.
  const world = [];
  const canon = new Int32Array(pos.getCount());
  const byKey = new Map();
  const v = [0, 0, 0];
  for (let i = 0; i < pos.getCount(); i++) {
    pos.getElement(i, v);
    const w = applyMatrix(matrix, v);
    world.push(w);
    const key = w.map((c) => Math.round(c * 1e4)).join(',');
    if (!byKey.has(key)) byKey.set(key, i);
    canon[i] = byKey.get(key);
  }

  // Union-find over welded vertices.
  const parent = new Int32Array(pos.getCount()).map((_, i) => i);
  const find = (a) => { while (parent[a] !== a) a = parent[a] = parent[parent[a]]; return a; };
  const union = (a, b) => { a = find(a); b = find(b); if (a !== b) parent[a] = b; };
  for (let t = 0; t < triCount; t++) {
    const [a, b, c] = [0, 1, 2].map((k) => canon[vertexAt(t, k)]);
    union(a, b);
    union(b, c);
  }

  const groups = new Map();
  for (let t = 0; t < triCount; t++) {
    const root = find(canon[vertexAt(t, 0)]);
    if (!groups.has(root)) groups.set(root, { tris: [], min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] });
    const g = groups.get(root);
    g.tris.push(t);
    for (let k = 0; k < 3; k++) {
      const p = world[vertexAt(t, k)];
      for (let a = 0; a < 3; a++) { g.min[a] = Math.min(g.min[a], p[a]); g.max[a] = Math.max(g.max[a], p[a]); }
    }
  }
  return { groups: [...groups.values()], vertexAt, triCount };
}

async function listIslands(input) {
  const doc = await io.read(input);
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    for (const prim of mesh.listPrimitives()) {
      const { groups } = islands(prim, node.getWorldMatrix());
      console.log(`${mesh.getName()}: ${groups.length} islands`);
      for (const g of groups.sort((a, b) => b.max[1] - a.max[1])) {
        const f = (a) => a.map((c) => c.toFixed(2)).join(',');
        console.log(`  tris=${String(g.tris.length).padStart(5)}  y ${g.min[1].toFixed(2)}..${g.max[1].toFixed(2)}  min(${f(g.min)}) max(${f(g.max)})`);
      }
    }
  }
}

/**
 * The head turns about the neck rod: the part that crosses NECK_Y with the
 * smallest footprint. Returns [x, y, z] in world space, y = NECK_Y.
 */
function findPivot(allGroups) {
  const crossing = allGroups.filter((g) => g.min[1] < NECK_Y && g.max[1] > NECK_Y);
  if (!crossing.length) throw new Error(`No part crosses NECK_Y=${NECK_Y}; re-run 'analyze'.`);
  const footprint = (g) => (g.max[0] - g.min[0]) * (g.max[2] - g.min[2]);
  const rod = crossing.reduce((a, b) => (footprint(b) < footprint(a) ? b : a));
  return [(rod.min[0] + rod.max[0]) / 2, NECK_Y, (rod.min[2] + rod.max[2]) / 2];
}

async function build(input) {
  const doc = await io.read(input);
  await doc.transform(metalRough());
  const root = doc.getRoot();
  const scene = root.getDefaultScene() ?? root.listScenes()[0];
  const buffer = root.listBuffers()[0];

  const headMesh = doc.createMesh('HeadMesh');
  const bodyMesh = doc.createMesh('BodyMesh');
  const allGroups = [];
  let headTris = 0;
  let bodyTris = 0;

  for (const node of root.listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    const matrix = node.getWorldMatrix();
    for (const prim of mesh.listPrimitives()) {
      // Bake the Sketchfab Z-up → Y-up transform into the vertices, so the new
      // nodes can use identity transforms (and "up" is simply +Y).
      transformPrimitive(prim, matrix);
      const { groups, vertexAt } = islands(prim, IDENTITY);
      allGroups.push(...groups);

      const head = [];
      const body = [];
      for (const g of groups) {
        const target = g.min[1] >= NECK_Y ? head : body;
        for (const t of g.tris) target.push(vertexAt(t, 0), vertexAt(t, 1), vertexAt(t, 2));
      }
      headTris += head.length / 3;
      bodyTris += body.length / 3;

      // Both halves share the original vertex data; only the index lists differ.
      for (const [list, target, label] of [[head, headMesh, 'head'], [body, bodyMesh, 'body']]) {
        if (!list.length) continue;
        const indices = doc.createAccessor(`${mesh.getName()}_${label}_indices`)
          .setType('SCALAR')
          .setArray(new Uint32Array(list))
          .setBuffer(buffer);
        target.addPrimitive(prim.clone().setIndices(indices));
      }
    }
  }

  if (!headTris || !bodyTris) throw new Error(`Bad split: head=${headTris} body=${bodyTris} triangles. Check NECK_Y.`);
  const pivot = findPivot(allGroups);

  // Toaster
  //  ├─ Body
  //  └─ HeadPivot   (at the neck; rotate this to turn the head)
  //      └─ Head    (offset back, so the geometry stays in place)
  for (const child of scene.listChildren()) scene.removeChild(child);
  const toaster = doc.createNode('Toaster');
  const headPivot = doc.createNode(HEAD_PIVOT_NODE).setTranslation(pivot);
  headPivot.addChild(doc.createNode('Head').setMesh(headMesh).setTranslation(pivot.map((c) => -c)));
  toaster.addChild(doc.createNode('Body').setMesh(bodyMesh));
  toaster.addChild(headPivot);
  scene.addChild(toaster);
  await doc.transform(prune());

  const tmp = join(mkdtempSync(join(tmpdir(), 'toaster-')), 'split.glb');
  await io.write(tmp, doc);
  console.log(`split: head ${headTris} tris, body ${bodyTris} tris, pivot (${pivot.map((c) => c.toFixed(3)).join(', ')})`);

  // Compress. flatten/join are off so the Head/Body hierarchy survives.
  execFileSync(
    'npx',
    ['gltf-transform', 'optimize', tmp, OUTPUT, '--flatten', 'false', '--join', 'false',
      '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', '1024'],
    { stdio: 'inherit' },
  );
}

const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

const [command, input] = process.argv.slice(2);
if (command === 'analyze' && input) await analyze(input);
else if (command === 'islands' && input) await listIslands(input);
else if (command === 'build' && input) await build(input);
else {
  console.error('usage: node tools/build-model.mjs <analyze|build> <source.glb>');
  process.exit(1);
}
