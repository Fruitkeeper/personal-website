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
import { HOP_DURATION, fitDistance, hopOffset, idleYaw } from '../lib/toaster';

const MODEL_URL = '/models/sad-toaster.glb';
const FOV = 35;
const MAX_PIXEL_RATIO = 2;
/** The model is normalized to this height (scene units). */
const MODEL_HEIGHT = 2;
/** The model's face points along +X; turn it to look at the camera. */
const MODEL_YAW = -Math.PI / 2;
const HOP_HEIGHT = 0.35;

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

  // rig: pointer tilt + hop. model inside: normalized + idle sway.
  const rig = new Group();
  const swivel = new Group();
  const modelSize = normalize(model);
  swivel.rotation.y = MODEL_YAW;
  swivel.add(model);
  rig.add(swivel);
  const shadow = createContactShadow(Math.max(modelSize.x, modelSize.z) * 1.6);
  scene.add(rig, shadow);

  const lookAtY = modelSize.y * 0.5;

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Room for the hop above, and for the sway.
    const distance = fitDistance({ ...modelSize, y: modelSize.y + HOP_HEIGHT }, FOV, camera.aspect, 0.15);
    camera.position.set(0, lookAtY + distance * 0.12, distance);
    camera.lookAt(0, lookAtY, 0);
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(() => {
    resize();
    if (!frame) render();
  });
  resizeObserver.observe(canvas);

  // Pointer: the toaster leans toward the cursor, eased so it feels weighty.
  const pointer = { x: 0, y: 0 };
  const eased = { x: 0, y: 0 };
  const onPointerMove = (e: PointerEvent) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Clicking the toaster makes it hop.
  let hopStart = -Infinity;
  const onPointerDown = () => {
    if (reducedMotion.matches) return;
    if (elapsed - hopStart > HOP_DURATION * 0.6) hopStart = elapsed;
    start();
  };
  canvas.addEventListener('pointerdown', onPointerDown);

  const render = () => {
    eased.x += (pointer.x - eased.x) * 0.05;
    eased.y += (pointer.y - eased.y) * 0.05;
    const lift = hopOffset(elapsed - hopStart) * HOP_HEIGHT;
    const bob = reducedMotion.matches ? 0 : Math.sin(elapsed * 1.4) * 0.03;

    swivel.rotation.y = MODEL_YAW + (reducedMotion.matches ? 0 : idleYaw(elapsed));
    rig.rotation.y = eased.x * 0.5;
    rig.rotation.x = eased.y * 0.15;
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
      canvas.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('visibilitychange', onVisibility);
      reducedMotion.removeEventListener('change', onMotionPref);
      disposeTree(scene);
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
