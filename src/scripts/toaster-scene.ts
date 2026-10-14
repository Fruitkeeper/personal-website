// The hero's 3D sad toaster. Loaded on demand by Hero.astro. Pure math lives
// in src/lib/toaster.ts.
import {
  ACESFilmicToneMapping,
  Box3,
  CanvasTexture,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  type Material,
  type Object3D,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { HOP_DURATION, HOP_EVENT, MOOD_EVENT, fitDistance, frameMargin, headAngles, hopOffset, idleYaw, moodPose } from '../lib/toaster';

const MODEL_URL = '/models/sad-toaster.glb';
const FOV = 35;
const MAX_PIXEL_RATIO = 2;
/** The model is normalized to this height (scene units). */
const MODEL_HEIGHT = 2;
/** The model's face points along +X; turn it to look at the camera. */
const MODEL_YAW = -Math.PI / 2;
const HOP_HEIGHT = 0.35;
/** Node the model build (tools/build-model.mjs) puts at the neck. */
const HEAD_PIVOT_NODE = 'HeadPivot';
/** Idle look-around amplitude (radians), layered on top of cursor tracking. */
const IDLE_HEAD_YAW = 0.15;

export type SceneHandle = { dispose: () => void };

/** A soft radial blob under the toaster, cheaper than real shadows. */
function createContactShadow(width: number): Mesh {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(0,0,0,0.55)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const mesh = new Mesh(
    new PlaneGeometry(width, width * 0.55),
    new MeshBasicMaterial({ map: new CanvasTexture(canvas), transparent: true, depthWrite: false }),
  );
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

/** Centers the model on the origin (feet on y=0) and scales it to MODEL_HEIGHT. */
function normalize(model: Object3D): Vector3 {
  const box = new Box3().setFromObject(model);
  const size = box.getSize(new Vector3());
  const scale = size.y > 0 ? MODEL_HEIGHT / size.y : 1;
  model.scale.setScalar(scale);
  const scaled = new Box3().setFromObject(model);
  const center = scaled.getCenter(new Vector3());
  model.position.sub(new Vector3(center.x, scaled.min.y, center.z));
  return scaled.getSize(new Vector3());
}

function disposeTree(root: Object3D) {
  root.traverse((obj) => {
    if (!(obj instanceof Mesh)) return;
    obj.geometry.dispose();
    const materials: Material[] = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const m of materials) {
      for (const value of Object.values(m)) if (value && typeof value === 'object' && 'isTexture' in value) value.dispose();
      m.dispose();
    }
  });
}

/**
 * Mounts the toaster into `canvas`. Resolves to null when WebGL or the model
 * is unavailable, in which case the CSS fallback behind the canvas stays.
 */
export async function mountToasterScene(canvas: HTMLCanvasElement): Promise<SceneHandle | null> {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environment;

  const key = new DirectionalLight(0xffffff, 1.6);
  key.position.set(2, 4, 3);
  const rim = new DirectionalLight(0x9db4ff, 1.2);
  rim.position.set(-3, 2, -3);
  scene.add(key, rim);

  const camera = new PerspectiveCamera(FOV, 1, 0.1, 100);

  // Animation state. Elapsed time only advances while animating, so resuming never jumps.
  let elapsed = 0;
  let lastTick = 0;
  let frame = 0;
  let visible = true;

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  let model: Object3D;
  try {
    model = (await loader.loadAsync(MODEL_URL)).scene;
  } catch (err) {
    console.warn('Toaster model failed to load; using CSS fallback.', err);
    pmrem.dispose();
    renderer.dispose();
    return null;
  }

  // rig: hop + bob. swivel: faces the model to the camera. Only the head turns.
  const rig = new Group();
  const swivel = new Group();
  const modelSize = normalize(model);
  swivel.rotation.y = MODEL_YAW;
  swivel.add(model);
  rig.add(swivel);
  const shadow = createContactShadow(Math.max(modelSize.x, modelSize.z) * 1.6);
  scene.add(rig, shadow);

  const head = model.getObjectByName(HEAD_PIVOT_NODE);
  if (!head) console.warn(`Model has no "${HEAD_PIVOT_NODE}" node; the head won't turn.`);
  // Yaw about the neck, then pitch about the head's own side axis. The model's
  // face points along its local +X, so its side axis is Z.
  head?.rotation.set(0, 0, 0, 'YZX');

  const lookAtY = modelSize.y * 0.5;

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Room for the hop above, and for the sway.
    const distance = fitDistance({ ...modelSize, y: modelSize.y + HOP_HEIGHT }, FOV, camera.aspect, frameMargin(window.innerWidth));
    camera.position.set(0, lookAtY + distance * 0.12, distance);
    camera.lookAt(0, lookAtY, 0);
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(() => {
    resize();
    if (!frame) render();
  });
  resizeObserver.observe(canvas);

  // Pointer: the head looks toward the cursor, measured from the toaster itself.
  const look = { yaw: 0, pitch: 0 };
  const eased = { yaw: 0, pitch: 0 };
  const onPointerMove = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    // Fully turned when the cursor reaches the screen edge on that axis.
    Object.assign(
      look,
      headAngles(
        e.clientX - (rect.left + rect.width / 2),
        e.clientY - (rect.top + rect.height / 2),
        window.innerWidth / 2,
        window.innerHeight / 2,
      ),
    );
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Market mood (scripts/markets.ts): read what's already known, then follow updates.
  let pose = moodPose(Number(document.documentElement.dataset.mood ?? 0));
  const easedPose = { ...pose };
  const onMood = (e: Event) => {
    pose = moodPose((e as CustomEvent<{ mood: number }>).detail.mood);
    if (!frame) render();
  };
  window.addEventListener(MOOD_EVENT, onMood);

  // Clicking the toaster makes it hop.
  let hopStart = -Infinity;
  const hop = () => {
    if (reducedMotion.matches) return;
    if (elapsed - hopStart > HOP_DURATION * 0.6) hopStart = elapsed;
    start();
  };
  const onPointerDown = hop;
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener(HOP_EVENT, hop);

  const render = () => {
    const still = reducedMotion.matches;
    eased.yaw += (look.yaw - eased.yaw) * 0.08;
    eased.pitch += (look.pitch - eased.pitch) * 0.08;
    const lift = hopOffset(elapsed - hopStart) * HOP_HEIGHT;
    // Ease toward the mood pose so a market update reads as a sigh, not a snap.
    for (const k of ['pitch', 'bobAmplitude', 'bobSpeed'] as const) easedPose[k] += (pose[k] - easedPose[k]) * (still ? 1 : 0.02);
    const bob = still ? 0 : Math.sin(elapsed * easedPose.bobSpeed) * easedPose.bobAmplitude;

    if (head) {
      head.rotation.y = eased.yaw + (still ? 0 : idleYaw(elapsed, IDLE_HEAD_YAW));
      head.rotation.z = eased.pitch + easedPose.pitch;
    }
    rig.position.y = lift + bob;
    // Shadow shrinks and fades as the toaster leaves the ground.
    const away = 1 - Math.min(1, (lift + bob) / HOP_HEIGHT) * 0.5;
    shadow.scale.setScalar(away);
    (shadow.material as MeshBasicMaterial).opacity = away;

    renderer.render(scene, camera);
  };

  const loop = (now: number) => {
    elapsed += Math.min((now - lastTick) / 1000, 0.1); // clamp: no jumps after a stall
    lastTick = now;
    render();
    frame = requestAnimationFrame(loop);
  };
  const start = () => {
    if (frame || reducedMotion.matches || !visible || document.hidden) return;
    lastTick = performance.now();
    frame = requestAnimationFrame(loop);
  };
  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
  };

  // Don't burn GPU while the hero is scrolled away or the tab is hidden.
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    visible ? start() : stop();
  });
  intersection.observe(canvas);
  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVisibility);
  const onMotionPref = () => {
    stop();
    reducedMotion.matches ? render() : start();
  };
  reducedMotion.addEventListener('change', onMotionPref);

  resize();
  render(); // reduced motion keeps this still frame
  start();
  canvas.dataset.ready = 'true';

  return {
    dispose() {
      stop();
      intersection.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener(MOOD_EVENT, onMood);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener(HOP_EVENT, hop);
      document.removeEventListener('visibilitychange', onVisibility);
      reducedMotion.removeEventListener('change', onMotionPref);
      disposeTree(scene);
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
