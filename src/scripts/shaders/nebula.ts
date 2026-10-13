import { MAX_RIPPLES } from '../../lib/background';

export const nebulaVertex = /* glsl */ `
  attribute vec2 aPosition;
  void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
`;

// Domain-warped fbm nebula (after Inigo Quilez, "Warping"), bent by the
// pointer, rippled by clicks and panel swaps, stirred by scrolling, with a
// twinkling star field behind it.
export const nebulaFragment = /* glsl */ `
  precision highp float;

  #define MAX_RIPPLES ${MAX_RIPPLES}

  uniform vec2 uResolution;
  uniform float uTime;
  uniform vec2 uPointer;      // shader space: origin center, y up, units of viewport height
  uniform vec2 uPointerVel;   // eased pointer velocity
  uniform float uPointerOn;   // 0..1 — fades the pointer influence in/out
  uniform float uScroll;      // scroll offset in viewport heights (parallax)
  uniform float uEnergy;      // 0..1 — rises with scroll speed, decays
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform vec4 uRipples[MAX_RIPPLES]; // x, y, start time, strength

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  const mat2 ROT = mat2(0.8, 0.6, -0.6, 0.8);

  float fbm(vec2 p) {
    float value = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amp * noise(p);
      p = ROT * p * 2.02;
      amp *= 0.5;
    }
    return value;
  }

  vec2 rotate(vec2 v, float a) {
    float s = sin(a), c = cos(a);
    return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
  }

  float stars(vec2 p, float density) {
    vec2 cell = floor(p * density);
    vec2 local = fract(p * density) - 0.5;
    float h = hash(cell);
    if (h < 0.92) return 0.0;
    vec2 offset = vec2(hash(cell + 7.1), hash(cell + 3.7)) - 0.5;
    float d = length(local - offset * 0.7);
    float twinkle = 0.5 + 0.5 * sin(uTime * (1.5 + h * 3.0) + h * 40.0);
    return smoothstep(0.08, 0.0, d) * twinkle * (h - 0.92) * 12.0;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
    vec2 p = uv;
    float t = uTime * 0.04;
    float glow = 0.0;

    // Pointer: swirl the field around the cursor and drag it along with motion.
    vec2 toPointer = p - uPointer;
    float pointerFall = exp(-dot(toPointer, toPointer) * 5.0) * uPointerOn;
    p = uPointer + rotate(toPointer, pointerFall * (0.9 + length(uPointerVel) * 6.0));
    p -= uPointerVel * pointerFall * 0.6;
    glow += pointerFall * 0.18;

    // Ripples: expanding rings that displace the field and light it up.
    for (int i = 0; i < MAX_RIPPLES; i++) {
      vec4 r = uRipples[i];
      if (r.w <= 0.0) continue;
      float age = uTime - r.z;
      if (age < 0.0 || age > 3.0) continue;
      vec2 d = uv - r.xy;
      float dist = length(d);
      float k = (dist - age * 0.75) * 9.0; // pow() is undefined for negative bases in GLSL
      float ring = exp(-k * k) * exp(-age * 1.4) * r.w;
      p += (d / max(dist, 0.001)) * ring * 0.06;
      glow += ring * 0.35;
    }

    // Scroll parallax; scroll speed stirs up the warp.
    p.y -= uScroll * 0.25;
    float warp = 3.2 + uEnergy * 2.5;

    vec2 base = p * 1.6;
    vec2 q = vec2(fbm(base + vec2(0.0, t)), fbm(base + vec2(5.2, 1.3) - t));
    vec2 r = vec2(fbm(base + warp * q + vec2(1.7, 9.2) + t * 1.5),
                  fbm(base + warp * q + vec2(8.3, 2.8) - t * 1.2));
    float f = fbm(base + warp * r);

    vec3 color = mix(uColorA * 0.6, uColorB, clamp(f * f * 2.6, 0.0, 1.0));
    color = mix(color, uColorC, clamp(length(q) * 1.1 - 0.3, 0.0, 1.0) * 0.75);
    color = mix(color, vec3(0.0), clamp(1.0 - r.x * 1.8, 0.0, 1.0) * 0.45);
    float density = smoothstep(0.18, 0.9, f);
    color *= density * (0.85 + uEnergy * 0.5);
    // Hot core where the gas is densest: near-white tinted with the accent.
    color += pow(f, 5.0) * mix(uColorC, vec3(1.0), 0.35) * 1.4;
    color += glow * mix(uColorB, uColorC, 0.5);

    // Stars sit behind the gas: dimmed where it's dense, with slower parallax.
    vec2 sp = uv + vec2(0.0, -uScroll * 0.08);
    color += vec3(stars(sp, 38.0) + stars(sp + 11.0, 70.0) * 0.6) * (1.0 - density * 0.8);

    // Vignette keeps the edges deep; filmic tone-map keeps highlights from clipping.
    float vignette = smoothstep(1.35, 0.15, length(uv * vec2(0.8, 1.0)));
    color *= 0.5 + 0.5 * vignette;
    color = 1.0 - exp(-color * 1.6);

    gl_FragColor = vec4(color, 1.0);
  }
`;
