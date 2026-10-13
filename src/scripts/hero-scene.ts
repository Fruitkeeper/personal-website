import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  IcosahedronGeometry,
  Mesh,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three';
import { simplexNoise3D } from './shaders/noise';

export type SceneHandle = { dispose: () => void };

const MAX_PIXEL_RATIO = 2;
const PARTICLE_COUNT = 1400;

const blobVertex = /* glsl */ `
  ${simplexNoise3D}
  uniform float uTime;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vNoise;

  void main() {
    float n = snoise(normal * 1.6 + uTime * 0.25);
    float detail = snoise(normal * 4.0 - uTime * 0.4) * 0.25;
    float displacement = (n + detail) * uIntensity;
    vec3 displaced = position + normal * displacement;
    vNoise = n;

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const blobFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vNoise;

  void main() {
    float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 2.2);
    float band = 0.5 + 0.5 * sin(vNoise * 3.0 + uTime * 0.6);
    vec3 base = mix(uColorA, uColorB, band);
    vec3 color = mix(base, uColorC, fresnel);
    float alpha = 0.35 + fresnel * 0.65;
    gl_FragColor = vec4(color * (0.6 + fresnel), alpha);
  }
`;

const particleVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aScale;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    p.y += sin(uTime * 0.2 + position.x * 0.5) * 0.15;
    p.x += cos(uTime * 0.15 + position.z * 0.5) * 0.15;
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = aScale * 18.0 * uPixelRatio / -mvPosition.z;
    vAlpha = smoothstep(14.0, 2.0, -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const particleFragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float strength = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor, strength * vAlpha * 0.8);
  }
`;

/** Reads a CSS custom property as a Color so the scene follows the site palette. */
function cssColor(el: Element, name: string, fallback: string): Color {
  const value = getComputedStyle(el).getPropertyValue(name).trim();
  return new Color(value || fallback);
}

function createParticles(): BufferGeometry {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const scales = new Float32Array(PARTICLE_COUNT);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Spherical shell so particles surround the blob rather than overlap it.
    const r = 2.2 + Math.random() * 6;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    scales[i] = 0.4 + Math.random() * 1.2;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aScale', new BufferAttribute(scales, 1));
  return geometry;
}

/**
 * Mounts the hero scene into `canvas`. Returns null when WebGL is unavailable,
 * in which case the CSS fallback behind the canvas stays visible.
 */
export function mountHeroScene(canvas: HTMLCanvasElement): SceneHandle | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    return null;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Colors come from the canvas's inherited CSS vars, so each page's panel can set its own palette.
  const palette = canvas;
  const pixelRatio = Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO);
  renderer.setPixelRatio(pixelRatio);

  const scene = new Scene();
  const camera = new PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  const blobGeometry = new IcosahedronGeometry(1.4, 64);
  const blobMaterial = new ShaderMaterial({
    vertexShader: blobVertex,
    fragmentShader: blobFragment,
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 0.28 },
      uColorA: { value: cssColor(palette, '--accent-1', '#7c5cff') },
      uColorB: { value: cssColor(palette, '--accent-2', '#22d3ee') },
      uColorC: { value: cssColor(palette, '--accent-3', '#f472b6') },
    },
  });
  const blob = new Mesh(blobGeometry, blobMaterial);
  scene.add(blob);

  const particleGeometry = createParticles();
  const particleMaterial = new ShaderMaterial({
    vertexShader: particleVertex,
    fragmentShader: particleFragment,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uColor: { value: cssColor(palette, '--accent-2', '#22d3ee') },
    },
  });
  const particles = new Points(particleGeometry, particleMaterial);
  scene.add(particles);

  // Pointer parallax, eased so the motion feels weighty rather than jittery.
  const pointer = { x: 0, y: 0 };
  const eased = { x: 0, y: 0 };
  const onPointerMove = (e: PointerEvent) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Pull the camera back on narrow screens so the blob isn't cropped.
    camera.position.z = w / h < 1 ? 8 : 6;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  // Elapsed time only advances while animating, so resuming never jumps ahead.
  let elapsed = 0;
  let lastTick = 0;
  let frame = 0;
  let visible = true;

  const render = () => {
    const t = elapsed;
    blobMaterial.uniforms.uTime.value = t;
    particleMaterial.uniforms.uTime.value = t;

    eased.x += (pointer.x - eased.x) * 0.04;
    eased.y += (pointer.y - eased.y) * 0.04;
    blob.rotation.y = t * 0.12 + eased.x * 0.6;
    blob.rotation.x = eased.y * 0.4;
    particles.rotation.y = t * 0.02 - eased.x * 0.15;
    particles.rotation.x = -eased.y * 0.1;

    renderer.render(scene, camera);
  };

  const loop = (now: number) => {
    elapsed += (now - lastTick) / 1000;
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

  // Reduced motion still gets a single, still frame of the scene.
  if (reducedMotion.matches) render();
  else start();

  canvas.dataset.ready = 'true';

  return {
    dispose() {
      stop();
      intersection.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibility);
      reducedMotion.removeEventListener('change', onMotionPref);
      blobGeometry.dispose();
      blobMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
    },
  };
}
