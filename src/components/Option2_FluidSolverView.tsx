import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Droplet, Wind, Compass, Feather, Hand, Sliders, Palette, Check, X, ChevronRight, Sun, Moon, Info } from 'lucide-react';

/**
 * ============================================================================
 * OPTION 2: "INK IN WATER" (Fluid-Mixed Impasto Shader Waves)
 * ============================================================================
 * Blends the Option 1 Impasto Oil & Oceanic Wave GLSL shader with an interactive
 * 2D GPU Navier-Stokes fluid advection and coordinate distortion engine.
 * 
 * When running your finger over the shader, the wave bands, jade depths,
 * and golden bronze crests literally shear, curl, spiral, and mix together
 * like wet oil paint & ink in water, rather than just moving the canvas.
 */

interface Option2Props {
  className?: string;
  splatRadius?: number;
  viscosity?: number;
  dissipation?: number;
  vorticityStrength?: number;
  onInteraction?: () => void;
}

interface DoubleFBO {
  read: { fbo: WebGLFramebuffer; tex: WebGLTexture; width: number; height: number };
  write: { fbo: WebGLFramebuffer; tex: WebGLTexture; width: number; height: number };
  swap: () => void;
}

interface SingleFBO {
  fbo: WebGLFramebuffer;
  tex: WebGLTexture;
  width: number;
  height: number;
}

// Full screen quad vertex shader
const BASE_VERT_SHADER = `
precision highp float;
attribute vec2 a_position;
varying vec2 v_uv;
varying vec2 v_l;
varying vec2 v_r;
varying vec2 v_t;
varying vec2 v_b;
uniform vec2 u_texel_size;

void main() {
  v_uv = (a_position + 1.0) * 0.5;
  v_l = v_uv - vec2(u_texel_size.x, 0.0);
  v_r = v_uv + vec2(u_texel_size.x, 0.0);
  v_t = v_uv + vec2(0.0, u_texel_size.y);
  v_b = v_uv - vec2(0.0, u_texel_size.y);
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Splat Velocity Shader
const SPLAT_VELOCITY_SHADER = `
precision highp float;
uniform sampler2D u_target;
uniform float u_aspect_ratio;
uniform vec2 u_point;
uniform vec2 u_force;
uniform float u_radius;
varying vec2 v_uv;

void main() {
  vec2 p = v_uv - u_point.xy;
  p.x *= u_aspect_ratio;
  float falloff = exp(-dot(p, p) / u_radius);
  vec2 baseVel = texture2D(u_target, v_uv).xy;
  gl_FragColor = vec4(baseVel + u_force * falloff, 0.0, 1.0);
}
`;

// Splat Distortion & Pigment Tracer Shader
const SPLAT_DISTORTION_SHADER = `
precision highp float;
uniform sampler2D u_target;
uniform float u_aspect_ratio;
uniform vec2 u_point;
uniform vec2 u_disp;
uniform float u_shear;
uniform float u_pigment;
uniform float u_radius;
varying vec2 v_uv;

void main() {
  vec2 p = v_uv - u_point.xy;
  p.x *= u_aspect_ratio;
  float falloff = exp(-dot(p, p) / u_radius);
  vec4 base = texture2D(u_target, v_uv);
  
  vec4 splat = vec4(
    u_disp * falloff * 0.8,
    u_shear * falloff,
    u_pigment * falloff
  );
  
  gl_FragColor = base + splat;
}
`;

// Semi-Lagrangian Advection Shader with Dissipation
const ADVECT_FRAG_SHADER = `
precision highp float;
uniform sampler2D u_velocity;
uniform sampler2D u_source;
uniform vec2 u_texel_size;
uniform float u_dt;
uniform float u_dissipation;
varying vec2 v_uv;

void main() {
  vec2 vel = texture2D(u_velocity, v_uv).xy;
  vec2 coord = v_uv - u_dt * vel * u_texel_size;
  gl_FragColor = u_dissipation * texture2D(u_source, coord);
}
`;

// Divergence Shader
const DIVERGENCE_FRAG_SHADER = `
precision highp float;
uniform sampler2D u_velocity;
varying vec2 v_uv;
varying vec2 v_l;
varying vec2 v_r;
varying vec2 v_t;
varying vec2 v_b;

void main() {
  float L = texture2D(u_velocity, v_l).x;
  float R = texture2D(u_velocity, v_r).x;
  float T = texture2D(u_velocity, v_t).y;
  float B = texture2D(u_velocity, v_b).y;
  
  float div = 0.5 * (R - L + T - B);
  gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}
`;

// Curl / Vorticity Shader
const CURL_FRAG_SHADER = `
precision highp float;
uniform sampler2D u_velocity;
varying vec2 v_uv;
varying vec2 v_l;
varying vec2 v_r;
varying vec2 v_t;
varying vec2 v_b;

void main() {
  float L = texture2D(u_velocity, v_l).y;
  float R = texture2D(u_velocity, v_r).y;
  float T = texture2D(u_velocity, v_t).x;
  float B = texture2D(u_velocity, v_b).x;
  float vorticity = R - L - T + B;
  gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}
`;

// Vorticity Confinement Shader (Preserves small swirls and ink filaments)
const VORTICITY_FRAG_SHADER = `
precision highp float;
uniform sampler2D u_velocity;
uniform sampler2D u_curl;
uniform float u_curl_strength;
uniform float u_dt;
varying vec2 v_uv;
varying vec2 v_l;
varying vec2 v_r;
varying vec2 v_t;
varying vec2 v_b;

void main() {
  float L = texture2D(u_curl, v_l).x;
  float R = texture2D(u_curl, v_r).x;
  float T = texture2D(u_curl, v_t).x;
  float B = texture2D(u_curl, v_b).x;
  float C = texture2D(u_curl, v_uv).x;

  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  float len = length(force) + 0.00001;
  force *= (u_curl_strength / len);
  force *= C;
  force.y *= -1.0;

  vec2 vel = texture2D(u_velocity, v_uv).xy;
  gl_FragColor = vec4(vel + force * u_dt, 0.0, 1.0);
}
`;

// Jacobi Pressure Poisson Solver
const PRESSURE_FRAG_SHADER = `
precision highp float;
uniform sampler2D u_pressure;
uniform sampler2D u_divergence;
varying vec2 v_uv;
varying vec2 v_l;
varying vec2 v_r;
varying vec2 v_t;
varying vec2 v_b;

void main() {
  float L = texture2D(u_pressure, v_l).x;
  float R = texture2D(u_pressure, v_r).x;
  float T = texture2D(u_pressure, v_t).x;
  float B = texture2D(u_pressure, v_b).x;
  float div = texture2D(u_divergence, v_uv).x;

  float p = (L + R + T + B - div) * 0.25;
  gl_FragColor = vec4(p, 0.0, 0.0, 1.0);
}
`;

// Gradient Subtraction (Projection step)
const GRADIENT_SUBTRACT_FRAG_SHADER = `
precision highp float;
uniform sampler2D u_pressure;
uniform sampler2D u_velocity;
varying vec2 v_uv;
varying vec2 v_l;
varying vec2 v_r;
varying vec2 v_t;
varying vec2 v_b;

void main() {
  float L = texture2D(u_pressure, v_l).x;
  float R = texture2D(u_pressure, v_r).x;
  float T = texture2D(u_pressure, v_t).x;
  float B = texture2D(u_pressure, v_b).x;

  vec2 velocity = texture2D(u_velocity, v_uv).xy;
  velocity.xy -= vec2(R - L, T - B) * 0.5;
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}
`;

// Ambient Continuous Wave Force
const FLOW_FORCE_FRAG_SHADER = `
precision highp float;
uniform sampler2D u_velocity;
uniform float u_mode; // 0 = Rolling Wave, 1 = Calm River, 2 = Dynamic Vortex
uniform float u_time;
uniform float u_aspect;
varying vec2 v_uv;

void main() {
  vec2 vel = texture2D(u_velocity, v_uv).xy;
  vec2 p = v_uv - vec2(0.5);
  p.x *= u_aspect;
  float r = length(p);

  vec2 externalForce = vec2(0.0);

  if (u_mode < 0.5) {
    // Mode 0: Rolling Wave - Gentle circular current with organic undulation
    vec2 tangent = vec2(-p.y, p.x);
    float ring = smoothstep(0.05, 0.35, r) * (1.0 - smoothstep(0.40, 0.75, r));
    vec2 swirl = tangent * 1.5 * ring;

    vec2 wave = vec2(
      sin(v_uv.y * 4.5 + u_time * 0.6) * 0.30,
      cos(v_uv.x * 4.0 + u_time * 0.5) * 0.20
    );
    externalForce = swirl + wave * 0.5;
  } else if (u_mode < 1.5) {
    // Mode 1: Calm River
    float riverStream = sin(v_uv.x * 6.28 + u_time * 0.4) * 0.5;
    externalForce = vec2(riverStream * 0.35, 1.6 + cos(u_time * 0.3) * 0.25);
  } else {
    // Mode 2: Dynamic Vortex
    vec2 tangent = vec2(-p.y, p.x);
    float falloff = exp(-r * 3.6) * (1.0 - smoothstep(0.0, 0.65, r));
    externalForce = tangent * 7.5 * falloff;
  }

  gl_FragColor = vec4(vel + externalForce * 0.016, 0.0, 1.0);
}
`;

/**
 * MASTER IMPASTO WAVE BLENDING DISPLAY FRAGMENT SHADER
 * Evaluates the Option 1 Impasto Oil & Oceanic Wave shader along the
 * Navier-Stokes fluid-advected coordinate stream, so touching the screen
 * literally shears, swirls, and blends the wave bands like ink in water.
 */
const MASTER_IMPASTO_FLUID_FRAG_SHADER = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_speed;
uniform float u_relief_strength;
uniform float u_mix_intensity;
uniform float u_mode;

uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;
uniform vec3 u_c4;
uniform vec3 u_c5;
uniform vec3 u_c6;
uniform vec3 u_tracer1;
uniform vec3 u_tracer2;

uniform sampler2D u_distortion;
uniform sampler2D u_velocity;

varying vec2 v_uv;

// Simplex-inspired hash and 2D value/gradient noise functions
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// 2D Gradient Noise with smooth cubic hermite interpolation
float gnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
        dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
        dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// High-detail Fractal Brownian Motion (FBM) with rotated octaves for organic flow
mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = rot(0.55);
  for (int i = 0; i < 6; ++i) {
    v += a * gnoise(p);
    p = m * p * 2.02 + vec2(100.0, 100.0);
    a *= 0.5;
  }
  return v;
}

// Fine brush stroke texture simulating physical bristles dragging in viscous oil
float brushBristles(vec2 p, vec2 flowDir) {
  vec2 perp = vec2(-flowDir.y, flowDir.x);
  float streak = sin(dot(p, perp) * 65.0) * 0.5 + 0.5;
  float micro = gnoise(p * 28.0 + flowDir * 10.0);
  return mix(streak, micro, 0.45);
}

// Fluid-Advected Impasto Heightmap Function
float heightMap(vec2 p, vec2 uv, float t, out vec2 outFlow, out float outPigment) {
  // Sample fluid-advected coordinate distortion and velocity
  vec4 dist = texture2D(u_distortion, uv);
  vec2 vel = texture2D(u_velocity, uv).xy;

  // Local fluid coordinate warp (stretches and folds the wave coordinates)
  vec2 fluidWarp = dist.xy * (2.2 * u_mix_intensity);
  vec2 mixedP = p + fluidWarp;

  vec2 center = vec2(0.0, 0.0);
  vec2 d = mixedP - center;
  float r = length(d);
  float angle = atan(d.y, d.x);

  float spiralSpeed = t * (u_mode < 0.5 ? 0.07 : 0.035);
  float spiralTwist = sin(r * 2.2 - t * 0.08) * 1.8;
  
  // Fluid curl & shear twists the spiral vortex locally
  float localCurl = dist.z * (3.5 * u_mix_intensity);
  float vortexAngle = angle + spiralSpeed + spiralTwist * 0.5 + localCurl;
  
  vec2 spiralP = vec2(cos(vortexAngle), sin(vortexAngle)) * r;

  // Domain Warping Stage 1 (Waves shear and blend with fluid velocity)
  vec2 q = vec2(
    fbm(spiralP * 1.6 + fluidWarp * 0.85 + vel * 0.45 + vec2(0.0, t * 0.035)),
    fbm(spiralP * 1.6 - fluidWarp * 0.85 - vel * 0.45 + vec2(5.2, 1.3 - t * 0.03))
  );

  // Domain Warping Stage 2 (Secondary Paint Folds and Swirls)
  vec2 rVec = vec2(
    fbm(spiralP * 2.4 + 4.0 * q + fluidWarp * 1.5 + vec2(1.7, 9.2) + t * 0.02),
    fbm(spiralP * 2.4 + 4.0 * q - fluidWarp * 1.5 + vec2(8.3, 2.8) - t * 0.025)
  );

  outFlow = normalize(rVec + vel * 0.8 + vec2(0.001, 0.001));

  float h = fbm(spiralP * 1.8 + 3.2 * rVec + vec2(t * 0.015, t * 0.012));
  float bristles = brushBristles(mixedP * 4.0, outFlow);
  h += (bristles - 0.5) * 0.18;

  outPigment = dist.w; // Injected luminous pigment tracer
  return h;
}

void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  float t = u_time * u_speed;

  vec2 flowDir;
  float pigment;
  float h = heightMap(p, v_uv, t, flowDir, pigment);

  // Surface normal computation
  float eps = 0.0035;
  vec2 flowDummy;
  float pigmentDummy;
  float hR = heightMap(p + vec2(eps, 0.0), v_uv + vec2(eps * 0.5, 0.0), t, flowDummy, pigmentDummy);
  float hT = heightMap(p + vec2(0.0, eps), v_uv + vec2(0.0, eps * 0.5), t, flowDummy, pigmentDummy);

  vec3 normal = normalize(vec3(
    (h - hR) * u_relief_strength * 48.0,
    (h - hT) * u_relief_strength * 48.0,
    eps * 12.0
  ));

  float normH = clamp(h * 0.85 + 0.15, 0.0, 1.0);
  vec3 baseColor = mix(u_c1, u_c2, smoothstep(0.0, 0.38, normH));
  baseColor = mix(baseColor, u_c3, smoothstep(0.35, 0.62, normH));
  baseColor = mix(baseColor, u_c4, smoothstep(0.58, 0.82, normH));
  baseColor = mix(baseColor, u_c5, smoothstep(0.78, 0.94, normH));
  baseColor = mix(baseColor, u_c6, smoothstep(0.92, 1.0, normH));

  // Lighting calculations: Warm high-angle studio keylight + soft cool ambient fill
  vec3 lightDir = normalize(vec3(0.45, 0.65, 0.85));
  float diffuse = max(dot(normal, lightDir), 0.0);
  
  vec3 halfVec = normalize(lightDir + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(normal, halfVec), 0.0), 32.0);

  // Directional brush sheen & specular glint along fluid swirls
  float sheen = pow(max(dot(normal, vec3(0.0, 0.0, 1.0)), 0.0), 4.0);
  vec3 finalColor = baseColor * (0.45 + diffuse * 0.65) + u_c5 * spec * 0.85 * smoothstep(0.5, 1.0, normH);
  finalColor += u_c6 * sheen * 0.12;

  // Organic subtle fluid pigment / tracer injected by touch gestures
  if (pigment > 0.005) {
    // High transparency, soft meditative blend
    float tracerAlpha = clamp(pigment * 0.35, 0.0, 0.28);
    // Naturally blends with the active palette's calming tracer tones
    vec3 tracerColor = mix(u_tracer1, u_tracer2, sin(normH * 3.14) * 0.5 + 0.5);
    
    // Softly illuminates fluid flow lines and brush eddies without harsh glare
    finalColor = mix(finalColor, finalColor * 1.12 + tracerColor * 0.30, tracerAlpha);
  }

  // Edge vignette for deep, focused immersion
  float vig = 1.0 - smoothstep(0.65, 1.45, length(p));
  finalColor *= mix(0.75, 1.0, vig);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

export interface SoothingPalette {
  id: string;
  name: string;
  theme: string;
  category: 'light' | 'dark';
  benefit: string;
  psychology: string;
  description: string;
  previewColors: string[];
  c1: [number, number, number];
  c2: [number, number, number];
  c3: [number, number, number];
  c4: [number, number, number];
  c5: [number, number, number];
  c6: [number, number, number];
  tracer1: [number, number, number];
  tracer2: [number, number, number];
}

export const SOOTHING_PALETTES: SoothingPalette[] = [
  // ==========================================
  // SOOTHING & LIGHT (6 PALETTES)
  // Low-arousal, biophilic & spacious pastels
  // ==========================================
  {
    id: 'sky_cerulean',
    name: 'Cerulean Mist & Morning Sky',
    theme: 'Sky Blue & Expansive Air',
    category: 'light',
    benefit: 'Parasympathetic Activation • Lowers heart rate',
    psychology: 'High-wavelength blue-cyan spectrum triggers parasympathetic vagal stimulation, reducing respiratory rate and inducing expansive mental spaciousness.',
    description: 'Soft sky azure, airy cerulean, cloud cream, and sunlit cyan crests.',
    previewColors: ['#8cb8d9', '#aed6eb', '#c7e6f0', '#f5e6c2', '#faf7eb'],
    c1: [0.55, 0.72, 0.85],
    c2: [0.68, 0.84, 0.92],
    c3: [0.78, 0.90, 0.94],
    c4: [0.96, 0.90, 0.76],
    c5: [0.98, 0.97, 0.92],
    c6: [0.99, 0.99, 1.0],
    tracer1: [0.35, 0.72, 0.88],
    tracer2: [0.92, 0.82, 0.55],
  },
  {
    id: 'sage_celadon',
    name: 'Celadon Meadow & Sweet Mint',
    theme: 'Biophilic Stress Reduction',
    category: 'light',
    benefit: 'Retinal Ease • Reduces mental fatigue & cortisol',
    psychology: 'Low-frequency natural greens provide optimal retinal ease, invoking evolutionary signals of lush shelter and physiological safety.',
    description: 'Soft botanical sage, mint water, spring dew, and fresh celadon.',
    previewColors: ['#84ad94', '#a8cca8', '#c7e3cc', '#ede8bd', '#f5f7e6'],
    c1: [0.52, 0.68, 0.58],
    c2: [0.66, 0.80, 0.70],
    c3: [0.78, 0.89, 0.80],
    c4: [0.93, 0.91, 0.74],
    c5: [0.96, 0.97, 0.90],
    c6: [0.98, 0.99, 0.96],
    tracer1: [0.35, 0.68, 0.52],
    tracer2: [0.85, 0.88, 0.50],
  },
  {
    id: 'wisteria_lilac',
    name: 'Wisteria Dawn & Lilac Quartz',
    theme: 'Calming Violet Serenity',
    category: 'light',
    benefit: 'Anxiety De-escalation • Dispels racing thoughts',
    psychology: 'Soft lavender-lilac wavelengths soothe high-arousal emotional states without heavy sedation, stabilizing autonomic nervous tension.',
    description: 'Pale lavender mist, soft wisteria, powder pink, and opal pearl.',
    previewColors: ['#998abd', '#b8add6', '#d1c4e6', '#eae0f2', '#f7f2fc'],
    c1: [0.60, 0.54, 0.74],
    c2: [0.72, 0.68, 0.84],
    c3: [0.82, 0.77, 0.90],
    c4: [0.92, 0.88, 0.95],
    c5: [0.97, 0.95, 0.99],
    c6: [0.99, 0.98, 1.0],
    tracer1: [0.65, 0.45, 0.80],
    tracer2: [0.85, 0.70, 0.95],
  },
  {
    id: 'cashmere_linen',
    name: 'Cashmere Linen & Warm Sand',
    theme: 'Organic Somatic Grounding',
    category: 'light',
    benefit: 'Sensory Safety • Eliminates visual overstimulation',
    psychology: 'High-luminance warm neutrals mimic sunlight on natural sand and stone, providing comforting somatic grounding without sensory noise.',
    description: 'Oatmeal cream, soft cashmere taupe, spun sand, and warm ivory ecru.',
    previewColors: ['#ad947d', '#c9b59e', '#e0d1bd', '#f0e6d6', '#faf5eb'],
    c1: [0.68, 0.58, 0.49],
    c2: [0.79, 0.71, 0.62],
    c3: [0.88, 0.82, 0.74],
    c4: [0.94, 0.90, 0.84],
    c5: [0.98, 0.96, 0.92],
    c6: [0.99, 0.98, 0.96],
    tracer1: [0.80, 0.62, 0.45],
    tracer2: [0.95, 0.85, 0.68],
  },
  {
    id: 'peach_dawn',
    name: 'Morning Peach & Honey Nectar',
    theme: 'Gentle Distraction & Nurturing',
    category: 'light',
    benefit: 'Attention Channeling • Nurturing mood uplift',
    psychology: 'Soft pastel coral and peach stimulate gentle positive affect, capturing scattered attention and redirecting anxiety into playful tactile flow.',
    description: 'Warm peach sorbet, blush apricot, honey cream, and soft dawn coral.',
    previewColors: ['#c78c80', '#e0ada0', '#f2ccb3', '#fae3cc', '#fcf2e8'],
    c1: [0.78, 0.55, 0.50],
    c2: [0.88, 0.68, 0.60],
    c3: [0.95, 0.80, 0.70],
    c4: [0.98, 0.89, 0.80],
    c5: [0.99, 0.95, 0.91],
    c6: [1.00, 0.98, 0.96],
    tracer1: [0.92, 0.55, 0.45],
    tracer2: [0.98, 0.80, 0.55],
  },
  {
    id: 'glacier_frost',
    name: 'Glacial Frost & Arctic Aquamarine',
    theme: 'Cooling Clarity & De-escalation',
    category: 'light',
    benefit: 'Thermal Grounding • Calms physical flushing',
    psychology: 'Crisp high-vibrancy cool tones counter somatic sensations of anxiety flushing and panic overheating, bringing clear mental focus.',
    description: 'Pale aquamarine, crisp ice blue, snow white, and silver shimmer.',
    previewColors: ['#7aadc7', '#a6d1e0', '#c7ebf0', '#e3f5fa', '#f5fafe'],
    c1: [0.48, 0.68, 0.78],
    c2: [0.65, 0.82, 0.88],
    c3: [0.78, 0.92, 0.94],
    c4: [0.89, 0.96, 0.98],
    c5: [0.96, 0.98, 1.0],
    c6: [0.99, 1.00, 1.0],
    tracer1: [0.30, 0.75, 0.85],
    tracer2: [0.60, 0.90, 0.95],
  },

  // ==========================================
  // DEEP & GROUNDING (6 PALETTES)
  // High-immersion, sensory anchoring tones
  // ==========================================
  {
    id: 'ocean_jade',
    name: 'Ocean Jade & Honey Amber',
    theme: 'Deep Oceanic Calm',
    category: 'dark',
    benefit: 'Fluid Anchoring • Rhythmic wave entrainment',
    psychology: 'Deep oceanic abyss tones anchor visual tracking into viscous currents, helping ride out craving waves like cresting swells.',
    description: 'Deep abyss teal, rich jade depths, golden honey ochre, and seafoam crests.',
    previewColors: ['#06131d', '#114956', '#207177', '#d3a253', '#f6d890'],
    c1: [0.025, 0.075, 0.115],
    c2: [0.065, 0.285, 0.335],
    c3: [0.125, 0.445, 0.465],
    c4: [0.825, 0.635, 0.325],
    c5: [0.965, 0.845, 0.565],
    c6: [0.985, 0.955, 0.885],
    tracer1: [0.12, 0.38, 0.37],
    tracer2: [0.28, 0.58, 0.54],
  },
  {
    id: 'midnight_biolum',
    name: 'Midnight Bioluminescence',
    theme: 'Luminous Attention Anchor',
    category: 'dark',
    benefit: 'Visual Anchoring • Channels scattered panic into focus',
    psychology: 'High-contrast phosphorescent ribbons against deep dark void capture fragmented attention and channel acute stress into tactile control.',
    description: 'Deep oceanic abyss, glowing sea glass, and phosphorescent turquoise ribbons.',
    previewColors: ['#020612', '#081736', '#0c4664', '#17b0aa', '#64e2db'],
    c1: [0.01, 0.025, 0.07],
    c2: [0.03, 0.09, 0.21],
    c3: [0.05, 0.27, 0.39],
    c4: [0.09, 0.69, 0.67],
    c5: [0.39, 0.89, 0.86],
    c6: [0.88, 0.98, 0.97],
    tracer1: [0.10, 0.55, 0.55],
    tracer2: [0.25, 0.78, 0.76],
  },
  {
    id: 'twilight_plum',
    name: 'Twilight Plum & Midnight Wisteria',
    theme: 'Nocturnal Sanctuary',
    category: 'dark',
    benefit: 'Sleep-Conducive • Calms evening rumination',
    psychology: 'Low-luminescence deep violets minimize blue-light stimulation while providing an intimate, protective sanctuary for night-time anxiety release.',
    description: 'Deep plum shadows, calming wisteria, soft lilac folds, and moonlit pearl.',
    previewColors: ['#0d0c1e', '#292244', '#5c5280', '#a596c8', '#d7d2ea'],
    c1: [0.05, 0.045, 0.12],
    c2: [0.16, 0.135, 0.27],
    c3: [0.36, 0.32, 0.50],
    c4: [0.65, 0.59, 0.78],
    c5: [0.84, 0.82, 0.92],
    c6: [0.96, 0.95, 0.98],
    tracer1: [0.42, 0.38, 0.60],
    tracer2: [0.65, 0.60, 0.82],
  },
  {
    id: 'zen_charcoal',
    name: 'Zen Charcoal & Raw Silk',
    theme: 'Minimalist Sumi-e Wash',
    category: 'dark',
    benefit: 'Cognitive Reset • Total sensory de-cluttering',
    psychology: 'Stripping away chromatic noise allows overstimulated neurocircuits to reset, fostering pure rhythmic tactile focus and stillness.',
    description: 'Wabi-sabi ink wash, warm slate river stone, smoked quartz, and raw ecru silk.',
    previewColors: ['#0e1012', '#222528', '#46494e', '#7c8188', '#c4c4bc'],
    c1: [0.055, 0.063, 0.07],
    c2: [0.133, 0.145, 0.157],
    c3: [0.275, 0.286, 0.306],
    c4: [0.486, 0.506, 0.533],
    c5: [0.769, 0.769, 0.737],
    c6: [0.97, 0.97, 0.95],
    tracer1: [0.34, 0.36, 0.38],
    tracer2: [0.58, 0.60, 0.62],
  },
  {
    id: 'eucalyptus_moss',
    name: 'Eucalyptus Pine & Forest Moss',
    theme: 'Botanical Forest Shelter',
    category: 'dark',
    benefit: 'Canopy Grounding • Deep somatic refuge',
    psychology: 'Earthen evergreen and moss tones invoke primal forest canopy refuge, encouraging deep diaphragmatic breathing and root grounding.',
    description: 'Restorative pine shade, organic mountain moss, and silver eucalyptus mist.',
    previewColors: ['#08140e', '#153624', '#385f49', '#739d84', '#b5d4c0'],
    c1: [0.03, 0.08, 0.055],
    c2: [0.08, 0.21, 0.14],
    c3: [0.22, 0.37, 0.29],
    c4: [0.45, 0.62, 0.52],
    c5: [0.71, 0.83, 0.75],
    c6: [0.94, 0.97, 0.95],
    tracer1: [0.28, 0.46, 0.36],
    tracer2: [0.50, 0.70, 0.58],
  },
  {
    id: 'amber_hearth',
    name: 'Amber Hearth & Spiced Caramel',
    theme: 'Cozy Fireside Glow',
    category: 'dark',
    benefit: 'Emotional Warmth • Counters isolation & tension',
    psychology: 'Comforting low-color-temperature fireside glow triggers neurobiological associations of safety and kinship, dispelling cold emotional tension.',
    description: 'Comforting fireside warmth, roasted chestnut, maple syrup, and honey caramel.',
    previewColors: ['#140a04', '#301608', '#643414', '#a66223', '#e4ab58'],
    c1: [0.08, 0.04, 0.015],
    c2: [0.19, 0.085, 0.03],
    c3: [0.39, 0.20, 0.08],
    c4: [0.65, 0.38, 0.14],
    c5: [0.89, 0.67, 0.35],
    c6: [0.99, 0.97, 0.91],
    tracer1: [0.48, 0.28, 0.12],
    tracer2: [0.72, 0.46, 0.22],
  },
];

type FlowMode = 'stir' | 'river' | 'vortex';
type TouchInteractionMode = 'mix_and_dye' | 'mix_waves_only';

export const Option2_FluidSolverView: React.FC<Option2Props> = ({
  className = '',
  splatRadius = 0.0075,
  viscosity = 0.985,
  dissipation = 0.992,
  vorticityStrength = 38.0,
  onInteraction,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number>(0);
  const [flowMode, setFlowMode] = useState<FlowMode>('stir');
  const [touchMode, setTouchMode] = useState<TouchInteractionMode>('mix_and_dye');
  const [mixIntensity, setMixIntensity] = useState<number>(1.2);
  const [isInteracting, setIsInteracting] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [selectedPaletteId, setSelectedPaletteId] = useState<string>('ocean_jade');
  const [showPaletteDrawer, setShowPaletteDrawer] = useState<boolean>(false);
  const [paletteFilter, setPaletteFilter] = useState<'all' | 'light' | 'dark'>('all');

  const selectedPaletteRef = useRef<string>('ocean_jade');
  useEffect(() => {
    selectedPaletteRef.current = selectedPaletteId;
  }, [selectedPaletteId]);

  // Current interpolated colors for silky smooth theme cross-fading
  const currColorsRef = useRef<{
    c1: [number, number, number];
    c2: [number, number, number];
    c3: [number, number, number];
    c4: [number, number, number];
    c5: [number, number, number];
    c6: [number, number, number];
    tracer1: [number, number, number];
    tracer2: [number, number, number];
  }>({
    c1: [...SOOTHING_PALETTES[0].c1],
    c2: [...SOOTHING_PALETTES[0].c2],
    c3: [...SOOTHING_PALETTES[0].c3],
    c4: [...SOOTHING_PALETTES[0].c4],
    c5: [...SOOTHING_PALETTES[0].c5],
    c6: [...SOOTHING_PALETTES[0].c6],
    tracer1: [...SOOTHING_PALETTES[0].tracer1],
    tracer2: [...SOOTHING_PALETTES[0].tracer2],
  });

  const dropCounter = useRef<number>(0);

  // Active pointers map
  const pointers = useRef<Map<number, { x: number; y: number; px: number; py: number; down: boolean }>>(new Map());

  // Action references
  const seedFluidRef = useRef<(() => void) | null>(null);
  const addDropRef = useRef<(() => void) | null>(null);
  const resetWavesRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Simulation grid resolution
    const SIM_RES = 192;

    const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) {
      console.error('WebGL not available for Fluid Solver.');
      return;
    }

    const extHalfFloat = gl.getExtension('OES_texture_half_float');
    gl.getExtension('OES_texture_half_float_linear');
    const extFloat = gl.getExtension('OES_texture_float');
    gl.getExtension('OES_texture_float_linear');

    const texType = extHalfFloat ? (extHalfFloat as any).HALF_FLOAT_OES || 0x8d61 : (extFloat ? gl.FLOAT : gl.UNSIGNED_BYTE);

    const compileShader = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const createProgram = (vSrc: string, fSrc: string) => {
      const vs = compileShader(gl.VERTEX_SHADER, vSrc);
      const fs = compileShader(gl.FRAGMENT_SHADER, fSrc);
      if (!vs || !fs) return null;
      const prog = gl.createProgram();
      if (!prog) return null;
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(prog));
        return null;
      }
      return prog;
    };

    // Full screen quad buffer
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]), gl.STATIC_DRAW);

    // Initialize Shader Programs
    const splatVelProgram = createProgram(BASE_VERT_SHADER, SPLAT_VELOCITY_SHADER);
    const splatDistProgram = createProgram(BASE_VERT_SHADER, SPLAT_DISTORTION_SHADER);
    const advectProgram = createProgram(BASE_VERT_SHADER, ADVECT_FRAG_SHADER);
    const divergenceProgram = createProgram(BASE_VERT_SHADER, DIVERGENCE_FRAG_SHADER);
    const curlProgram = createProgram(BASE_VERT_SHADER, CURL_FRAG_SHADER);
    const vorticityProgram = createProgram(BASE_VERT_SHADER, VORTICITY_FRAG_SHADER);
    const pressureProgram = createProgram(BASE_VERT_SHADER, PRESSURE_FRAG_SHADER);
    const gradientSubtractProgram = createProgram(BASE_VERT_SHADER, GRADIENT_SUBTRACT_FRAG_SHADER);
    const flowForceProgram = createProgram(BASE_VERT_SHADER, FLOW_FORCE_FRAG_SHADER);
    const masterImpastoProgram = createProgram(BASE_VERT_SHADER, MASTER_IMPASTO_FLUID_FRAG_SHADER);

    if (
      !splatVelProgram ||
      !splatDistProgram ||
      !advectProgram ||
      !divergenceProgram ||
      !curlProgram ||
      !vorticityProgram ||
      !pressureProgram ||
      !gradientSubtractProgram ||
      !flowForceProgram ||
      !masterImpastoProgram
    ) {
      console.error('Failed to initialize fluid programs.');
      return;
    }

    const createFBO = (w: number, h: number): SingleFBO => {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, texType, null);

      const fbo = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);

      return { fbo, tex, width: w, height: h };
    };

    const createDoubleFBO = (w: number, h: number): DoubleFBO => {
      let fbo1 = createFBO(w, h);
      let fbo2 = createFBO(w, h);
      return {
        get read() { return fbo1; },
        get write() { return fbo2; },
        swap() {
          const temp = fbo1;
          fbo1 = fbo2;
          fbo2 = temp;
        }
      };
    };

    const velocityFBO = createDoubleFBO(SIM_RES, SIM_RES);
    const distortionFBO = createDoubleFBO(SIM_RES, SIM_RES);
    const divergenceFBO = createFBO(SIM_RES, SIM_RES);
    const curlFBO = createFBO(SIM_RES, SIM_RES);
    const pressureFBO = createDoubleFBO(SIM_RES, SIM_RES);

    const blit = (destinationFBO: WebGLFramebuffer | null, w: number, h: number) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, destinationFBO);
      gl.viewport(0, 0, w, h);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    // Ensure correct initial canvas sizing
    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // Splat velocity and distortion
    const applySplat = (
      x: number,
      y: number,
      dx: number,
      dy: number,
      addPigment: boolean,
      radius: number
    ) => {
      const aspect = (canvas.width || 1) / (canvas.height || 1);

      // 1. Splat Velocity
      if (Math.abs(dx) > 0.0001 || Math.abs(dy) > 0.0001) {
        gl.useProgram(splatVelProgram);
        gl.uniform1i(gl.getUniformLocation(splatVelProgram, 'u_target'), 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, velocityFBO.read.tex);
        gl.uniform1f(gl.getUniformLocation(splatVelProgram, 'u_aspect_ratio'), aspect);
        gl.uniform2f(gl.getUniformLocation(splatVelProgram, 'u_point'), x, y);
        gl.uniform2f(gl.getUniformLocation(splatVelProgram, 'u_force'), dx, dy);
        gl.uniform1f(gl.getUniformLocation(splatVelProgram, 'u_radius'), radius);
        blit(velocityFBO.write.fbo, velocityFBO.write.width, velocityFBO.write.height);
        velocityFBO.swap();

        // 2. Splat Coordinate Displacement & Shear into Distortion FBO
        gl.useProgram(splatDistProgram);
        gl.uniform1i(gl.getUniformLocation(splatDistProgram, 'u_target'), 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, distortionFBO.read.tex);
        gl.uniform1f(gl.getUniformLocation(splatDistProgram, 'u_aspect_ratio'), aspect);
        gl.uniform2f(gl.getUniformLocation(splatDistProgram, 'u_point'), x, y);
        gl.uniform2f(gl.getUniformLocation(splatDistProgram, 'u_disp'), dx * 0.0035, dy * 0.0035);
        gl.uniform1f(gl.getUniformLocation(splatDistProgram, 'u_shear'), Math.sqrt(dx * dx + dy * dy) * 0.004);
        gl.uniform1f(gl.getUniformLocation(splatDistProgram, 'u_pigment'), addPigment ? 0.35 : 0.0);
        gl.uniform1f(gl.getUniformLocation(splatDistProgram, 'u_radius'), radius * 1.6);
        blit(distortionFBO.write.fbo, distortionFBO.write.width, distortionFBO.write.height);
        distortionFBO.swap();
      }
    };

    // Drops an authentic blooming vortex swirl into the waves
    const dropInkBloom = (
      cx: number,
      cy: number,
      intensity = 1.0,
      spin = 1.0
    ) => {
      // Swirling tangential velocity to make the waves curl upon contact
      const subDrops = 8;
      for (let i = 0; i < subDrops; i++) {
        const angle = (i / subDrops) * Math.PI * 2;
        const dist = 0.035;
        const px = cx + Math.cos(angle) * dist;
        const py = cy + Math.sin(angle) * dist;

        const vx = -Math.sin(angle) * 35.0 * spin * intensity;
        const vy = Math.cos(angle) * 35.0 * spin * intensity;

        applySplat(px, py, vx, vy, true, splatRadius * 1.8);
      }
    };

    const resetAllBuffers = () => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, velocityFBO.read.fbo);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindFramebuffer(gl.FRAMEBUFFER, velocityFBO.write.fbo);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.bindFramebuffer(gl.FRAMEBUFFER, distortionFBO.read.fbo);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindFramebuffer(gl.FRAMEBUFFER, distortionFBO.write.fbo);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Initial gentle circular stirring impulse
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        const rad = 0.18;
        const px = 0.5 + Math.cos(ang) * rad;
        const py = 0.5 + Math.sin(ang) * rad;
        applySplat(px, py, -Math.sin(ang) * 25.0, Math.cos(ang) * 25.0, false, 0.012);
      }
    };

    seedFluidRef.current = resetAllBuffers;
    addDropRef.current = () => {
      dropCounter.current++;
      const rx = 0.35 + Math.random() * 0.30;
      const ry = 0.35 + Math.random() * 0.30;
      dropInkBloom(rx, ry, 1.4, Math.random() > 0.5 ? 1.2 : -1.2);
    };

    resetWavesRef.current = resetAllBuffers;

    // Initial setup
    resetAllBuffers();

    // Simulation loop
    let lastTime = performance.now();

    const stepSimulation = (now: number) => {
      const dt = Math.min((now - lastTime) * 0.001, 0.033);
      lastTime = now;

      const aspect = (canvas.width || 1) / (canvas.height || 1);
      const simTexelSizeX = 1.0 / SIM_RES;
      const simTexelSizeY = 1.0 / SIM_RES;

      // 1. Process Pointer Touch / Drag interactions
      pointers.current.forEach((ptr) => {
        if (ptr.down) {
          const dx = (ptr.x - ptr.px) * 720.0;
          const dy = (ptr.y - ptr.py) * 720.0;
          const speed = Math.sqrt(dx * dx + dy * dy);

          if (speed > 0.001) {
            applySplat(
              ptr.x,
              ptr.y,
              dx,
              dy,
              touchMode === 'mix_and_dye',
              splatRadius * 1.5
            );
          }
          ptr.px = ptr.x;
          ptr.py = ptr.y;
        }
      });

      // 2. Mode-Based Ambient Flow Force
      const modeVal = flowMode === 'stir' ? 0.0 : flowMode === 'river' ? 1.0 : 2.0;
      gl.useProgram(flowForceProgram);
      gl.uniform1i(gl.getUniformLocation(flowForceProgram, 'u_velocity'), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocityFBO.read.tex);
      gl.uniform1f(gl.getUniformLocation(flowForceProgram, 'u_mode'), modeVal);
      gl.uniform1f(gl.getUniformLocation(flowForceProgram, 'u_time'), now * 0.001);
      gl.uniform1f(gl.getUniformLocation(flowForceProgram, 'u_aspect'), aspect);
      blit(velocityFBO.write.fbo, velocityFBO.write.width, velocityFBO.write.height);
      velocityFBO.swap();

      // 3. Compute Vorticity (Curl)
      gl.useProgram(curlProgram);
      gl.uniform1i(gl.getUniformLocation(curlProgram, 'u_velocity'), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocityFBO.read.tex);
      gl.uniform2f(gl.getUniformLocation(curlProgram, 'u_texel_size'), simTexelSizeX, simTexelSizeY);
      blit(curlFBO.fbo, curlFBO.width, curlFBO.height);

      // 4. Apply Vorticity Confinement (Keeps wave swirls and filaments sharp)
      gl.useProgram(vorticityProgram);
      gl.uniform1i(gl.getUniformLocation(vorticityProgram, 'u_velocity'), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocityFBO.read.tex);
      gl.uniform1i(gl.getUniformLocation(vorticityProgram, 'u_curl'), 1);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, curlFBO.tex);
      gl.uniform1f(gl.getUniformLocation(vorticityProgram, 'u_curl_strength'), vorticityStrength);
      gl.uniform1f(gl.getUniformLocation(vorticityProgram, 'u_dt'), dt);
      gl.uniform2f(gl.getUniformLocation(vorticityProgram, 'u_texel_size'), simTexelSizeX, simTexelSizeY);
      blit(velocityFBO.write.fbo, velocityFBO.write.width, velocityFBO.write.height);
      velocityFBO.swap();

      // 5. Compute Divergence
      gl.useProgram(divergenceProgram);
      gl.uniform1i(gl.getUniformLocation(divergenceProgram, 'u_velocity'), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocityFBO.read.tex);
      gl.uniform2f(gl.getUniformLocation(divergenceProgram, 'u_texel_size'), simTexelSizeX, simTexelSizeY);
      blit(divergenceFBO.fbo, divergenceFBO.width, divergenceFBO.height);

      // 6. Jacobi Pressure Poisson Solver
      gl.useProgram(pressureProgram);
      gl.uniform1i(gl.getUniformLocation(pressureProgram, 'u_divergence'), 1);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, divergenceFBO.tex);
      gl.uniform2f(gl.getUniformLocation(pressureProgram, 'u_texel_size'), simTexelSizeX, simTexelSizeY);

      for (let i = 0; i < 20; i++) {
        gl.uniform1i(gl.getUniformLocation(pressureProgram, 'u_pressure'), 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, pressureFBO.read.tex);
        blit(pressureFBO.write.fbo, pressureFBO.write.width, pressureFBO.write.height);
        pressureFBO.swap();
      }

      // 7. Gradient Subtraction (Projection)
      gl.useProgram(gradientSubtractProgram);
      gl.uniform1i(gl.getUniformLocation(gradientSubtractProgram, 'u_pressure'), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, pressureFBO.read.tex);
      gl.uniform1i(gl.getUniformLocation(gradientSubtractProgram, 'u_velocity'), 1);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, velocityFBO.read.tex);
      gl.uniform2f(gl.getUniformLocation(gradientSubtractProgram, 'u_texel_size'), simTexelSizeX, simTexelSizeY);
      blit(velocityFBO.write.fbo, velocityFBO.write.width, velocityFBO.write.height);
      velocityFBO.swap();

      // 8. Advect Velocity
      gl.useProgram(advectProgram);
      gl.uniform1i(gl.getUniformLocation(advectProgram, 'u_velocity'), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocityFBO.read.tex);
      gl.uniform1i(gl.getUniformLocation(advectProgram, 'u_source'), 0);
      gl.uniform1f(gl.getUniformLocation(advectProgram, 'u_dt'), dt);
      gl.uniform1f(gl.getUniformLocation(advectProgram, 'u_dissipation'), viscosity);
      gl.uniform2f(gl.getUniformLocation(advectProgram, 'u_texel_size'), simTexelSizeX, simTexelSizeY);
      blit(velocityFBO.write.fbo, velocityFBO.write.width, velocityFBO.write.height);
      velocityFBO.swap();

      // 9. Advect Coordinate Distortion & Pigment Tracer Field
      gl.useProgram(advectProgram);
      gl.uniform1i(gl.getUniformLocation(advectProgram, 'u_velocity'), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocityFBO.read.tex);
      gl.uniform1i(gl.getUniformLocation(advectProgram, 'u_source'), 1);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, distortionFBO.read.tex);
      gl.uniform1f(gl.getUniformLocation(advectProgram, 'u_dt'), dt);
      gl.uniform1f(gl.getUniformLocation(advectProgram, 'u_dissipation'), dissipation);
      gl.uniform2f(gl.getUniformLocation(advectProgram, 'u_texel_size'), simTexelSizeX, simTexelSizeY);
      blit(distortionFBO.write.fbo, distortionFBO.write.width, distortionFBO.write.height);
      distortionFBO.swap();

      // 10. Master Impasto Wave Blending Final Display Pass
      gl.useProgram(masterImpastoProgram);
      gl.uniform1i(gl.getUniformLocation(masterImpastoProgram, 'u_distortion'), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, distortionFBO.read.tex);

      gl.uniform1i(gl.getUniformLocation(masterImpastoProgram, 'u_velocity'), 1);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, velocityFBO.read.tex);

      gl.uniform2f(gl.getUniformLocation(masterImpastoProgram, 'u_resolution'), canvas.width, canvas.height);
      gl.uniform1f(gl.getUniformLocation(masterImpastoProgram, 'u_time'), now * 0.001);
      gl.uniform1f(gl.getUniformLocation(masterImpastoProgram, 'u_speed'), 0.85);
      gl.uniform1f(gl.getUniformLocation(masterImpastoProgram, 'u_relief_strength'), 1.0);
      gl.uniform1f(gl.getUniformLocation(masterImpastoProgram, 'u_mix_intensity'), mixIntensity);
      gl.uniform1f(gl.getUniformLocation(masterImpastoProgram, 'u_mode'), modeVal);

      // Smooth Palette Cross-Fading
      const activePal = SOOTHING_PALETTES.find((p) => p.id === selectedPaletteRef.current) || SOOTHING_PALETTES[0];
      const curr = currColorsRef.current;
      const lerpFactor = Math.min(dt * 4.0, 0.20);

      for (let i = 0; i < 3; i++) {
        curr.c1[i] += (activePal.c1[i] - curr.c1[i]) * lerpFactor;
        curr.c2[i] += (activePal.c2[i] - curr.c2[i]) * lerpFactor;
        curr.c3[i] += (activePal.c3[i] - curr.c3[i]) * lerpFactor;
        curr.c4[i] += (activePal.c4[i] - curr.c4[i]) * lerpFactor;
        curr.c5[i] += (activePal.c5[i] - curr.c5[i]) * lerpFactor;
        curr.c6[i] += (activePal.c6[i] - curr.c6[i]) * lerpFactor;
        curr.tracer1[i] += (activePal.tracer1[i] - curr.tracer1[i]) * lerpFactor;
        curr.tracer2[i] += (activePal.tracer2[i] - curr.tracer2[i]) * lerpFactor;
      }

      gl.uniform3fv(gl.getUniformLocation(masterImpastoProgram, 'u_c1'), curr.c1);
      gl.uniform3fv(gl.getUniformLocation(masterImpastoProgram, 'u_c2'), curr.c2);
      gl.uniform3fv(gl.getUniformLocation(masterImpastoProgram, 'u_c3'), curr.c3);
      gl.uniform3fv(gl.getUniformLocation(masterImpastoProgram, 'u_c4'), curr.c4);
      gl.uniform3fv(gl.getUniformLocation(masterImpastoProgram, 'u_c5'), curr.c5);
      gl.uniform3fv(gl.getUniformLocation(masterImpastoProgram, 'u_c6'), curr.c6);
      gl.uniform3fv(gl.getUniformLocation(masterImpastoProgram, 'u_tracer1'), curr.tracer1);
      gl.uniform3fv(gl.getUniformLocation(masterImpastoProgram, 'u_tracer2'), curr.tracer2);

      blit(null, canvas.width, canvas.height);

      animFrameId.current = requestAnimationFrame(stepSimulation);
    };

    animFrameId.current = requestAnimationFrame(stepSimulation);

    return () => {
      cancelAnimationFrame(animFrameId.current);
      window.removeEventListener('resize', resize);
      if (quadBuffer) gl.deleteBuffer(quadBuffer);
      if (splatVelProgram) gl.deleteProgram(splatVelProgram);
      if (splatDistProgram) gl.deleteProgram(splatDistProgram);
      if (advectProgram) gl.deleteProgram(advectProgram);
      if (divergenceProgram) gl.deleteProgram(divergenceProgram);
      if (curlProgram) gl.deleteProgram(curlProgram);
      if (vorticityProgram) gl.deleteProgram(vorticityProgram);
      if (pressureProgram) gl.deleteProgram(pressureProgram);
      if (gradientSubtractProgram) gl.deleteProgram(gradientSubtractProgram);
      if (flowForceProgram) gl.deleteProgram(flowForceProgram);
      if (masterImpastoProgram) gl.deleteProgram(masterImpastoProgram);
    };
  }, [splatRadius, viscosity, dissipation, vorticityStrength, flowMode, touchMode, mixIntensity]);

  // Pointer Handlers for multi-touch drawing & wave blending
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height;

    pointers.current.set(e.pointerId, {
      x,
      y,
      px: x,
      py: y,
      down: true,
    });
    setIsInteracting(true);
    if (onInteraction) onInteraction();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ptr = pointers.current.get(e.pointerId);
    if (!ptr || !ptr.down) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    ptr.x = (e.clientX - rect.left) / rect.width;
    ptr.y = 1.0 - (e.clientY - rect.top) / rect.height;
    if (onInteraction) onInteraction();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) {
      setIsInteracting(false);
    }
  };

  return (
    <div id="option2-fluid-mixing-container" className={`relative w-full h-full overflow-hidden bg-[#070e16] ${className}`}>
      {/* Simulation WebGL Canvas */}
      <canvas
        id="option2-fluid-canvas"
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full h-full block cursor-crosshair touch-none select-none"
      />

      {/* Subtle Mobile Touch Cue */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 pointer-events-none z-10 select-none">
        <p className="text-xs text-stone-300/80 bg-stone-950/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/5">
          Run your finger across the screen
        </p>
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-4 flex flex-col items-center pointer-events-none select-none">
        <div className="bg-stone-950/85 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5 shadow-2xl flex items-center justify-center gap-1.5 pointer-events-auto transition-all">
          {/* Drop Action Button */}
          <button
            id="opt2-add-drop-btn"
            type="button"
            onClick={() => {
              if (addDropRef.current) addDropRef.current();
            }}
            className="h-8 flex items-center space-x-1.5 px-3 rounded-xl text-xs font-medium bg-gradient-to-r from-emerald-600/30 to-teal-600/30 text-amber-100 border border-emerald-500/40 hover:brightness-125 transition-all active:scale-95 shadow-sm"
            title="Drop ripples into the sand"
          >
            <Droplet className="w-3.5 h-3.5 text-amber-300" />
            <span>Drop</span>
          </button>

          {/* Color Theme Drawer Toggle */}
          <button
            id="opt2-palette-toggle"
            type="button"
            onClick={() => {
              setShowPaletteDrawer(!showPaletteDrawer);
              if (showSettings) setShowSettings(false);
            }}
            className={`h-8 flex items-center space-x-1.5 px-3 rounded-xl text-xs font-medium border transition-all ${
              showPaletteDrawer
                ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40 shadow-sm'
                : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:bg-stone-700/80'
            }`}
            title="Choose Theme"
          >
            <Palette className="w-3.5 h-3.5 text-emerald-400" />
            <span>Theme</span>
          </button>

          {/* Flow Mode Switcher: Wave / River / Vortex */}
          <button
            id="opt2-flow-mode-btn"
            type="button"
            onClick={() => {
              setFlowMode((prev) => (prev === 'stir' ? 'river' : prev === 'river' ? 'vortex' : 'stir'));
            }}
            className="h-8 flex items-center space-x-1.5 px-3 rounded-xl text-xs font-medium bg-stone-800/80 text-stone-300 border border-stone-700 hover:bg-stone-700/80 transition-all"
            title="Change Flow Direction"
          >
            {flowMode === 'stir' && <Wind className="w-3.5 h-3.5 text-emerald-400" />}
            {flowMode === 'river' && <Compass className="w-3.5 h-3.5 text-cyan-400" />}
            {flowMode === 'vortex' && <RefreshCw className="w-3.5 h-3.5 text-teal-400" />}
            <span className="capitalize">{flowMode === 'stir' ? 'Wave' : flowMode === 'river' ? 'River' : 'Vortex'}</span>
          </button>

          {/* Reset Baseline Flow */}
          <button
            id="opt2-reset-btn"
            type="button"
            onClick={() => {
              if (resetWavesRef.current) resetWavesRef.current();
            }}
            className="h-8 w-8 flex items-center justify-center rounded-xl text-stone-400 hover:text-stone-200 border border-stone-800 hover:bg-stone-800/80 transition-all"
            title="Reset Sand"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 12 Soothing & Grounding Psychological Color Palettes Drawer */}
        {showPaletteDrawer && (
          <div
            id="opt2-palette-drawer"
            className="mt-2 w-full max-w-2xl max-h-[58vh] overflow-y-auto p-3.5 bg-stone-900/95 backdrop-blur-2xl rounded-2xl border border-stone-800/90 shadow-2xl pointer-events-auto flex flex-col space-y-3 text-xs text-stone-200 animate-in fade-in slide-in-from-bottom-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-800/80">
              <div className="flex items-center space-x-2">
                <Palette className="w-4 h-4 text-emerald-400" />
                <div>
                  <h3 className="font-semibold text-stone-100 text-xs sm:text-sm tracking-wide">
                    Color Psychology Palettes
                  </h3>
                  <p className="text-[10px] text-stone-400">
                    6 Soothing Light &amp; 6 Deep Grounding palettes tailored for anxiety de-escalation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPaletteDrawer(false)}
                className="p-1 text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800 transition-colors"
                title="Close Palettes"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center space-x-1.5 p-1 bg-stone-950/70 rounded-xl border border-stone-800/60">
              <button
                onClick={() => setPaletteFilter('all')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center font-medium text-[11px] transition-all ${
                  paletteFilter === 'all'
                    ? 'bg-stone-800 text-stone-100 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
                }`}
              >
                All Palettes (12)
              </button>
              <button
                onClick={() => setPaletteFilter('light')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center font-medium text-[11px] flex items-center justify-center space-x-1 transition-all ${
                  paletteFilter === 'light'
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30 shadow-sm'
                    : 'text-stone-400 hover:text-amber-200 hover:bg-stone-900/60'
                }`}
              >
                <Sun className="w-3 h-3 text-amber-300" />
                <span>Soothing Light (6)</span>
              </button>
              <button
                onClick={() => setPaletteFilter('dark')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center font-medium text-[11px] flex items-center justify-center space-x-1 transition-all ${
                  paletteFilter === 'dark'
                    ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 shadow-sm'
                    : 'text-stone-400 hover:text-indigo-200 hover:bg-stone-900/60'
                }`}
              >
                <Moon className="w-3 h-3 text-indigo-300" />
                <span>Deep Grounding (6)</span>
              </button>
            </div>

            {/* Palette Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SOOTHING_PALETTES.filter((p) => (paletteFilter === 'all' ? true : p.category === paletteFilter)).map(
                (pal) => {
                  const isSelected = pal.id === selectedPaletteId;
                  const isLight = pal.category === 'light';

                  return (
                    <button
                      key={pal.id}
                      id={`palette-choice-${pal.id}`}
                      onClick={() => {
                        setSelectedPaletteId(pal.id);
                      }}
                      className={`flex flex-col text-left p-3 rounded-xl border transition-all relative group ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/40 shadow-md'
                          : 'bg-stone-950/60 border-stone-800/80 hover:bg-stone-800/60 hover:border-stone-700'
                      }`}
                    >
                      {/* Color Gradient Strip Preview */}
                      <div className="h-3.5 w-full rounded-lg overflow-hidden flex mb-2 border border-white/10 shadow-inner">
                        {pal.previewColors.map((color, idx) => (
                          <div key={idx} className="flex-1 h-full" style={{ backgroundColor: color }} />
                        ))}
                      </div>

                      {/* Header Row with Badge & Selected Indicator */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-1.5">
                          {isLight ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                              <Sun className="w-2.5 h-2.5" />
                              <span>Soothing Light</span>
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center space-x-1">
                              <Moon className="w-2.5 h-2.5" />
                              <span>Deep Grounding</span>
                            </span>
                          )}
                          <span className="text-[10px] text-stone-400 font-mono">{pal.theme}</span>
                        </div>

                        {isSelected && (
                          <div className="flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      {/* Title & Description */}
                      <p
                        className={`font-semibold text-xs transition-colors ${
                          isSelected ? 'text-emerald-200' : 'text-stone-200 group-hover:text-white'
                        }`}
                      >
                        {pal.name}
                      </p>
                      <p className="text-[10px] text-stone-400 line-clamp-1 mt-0.5">{pal.description}</p>

                      {/* Psychological Action Benefit */}
                      <div className="mt-2 pt-1.5 border-t border-stone-800/60 flex items-start space-x-1 text-[10px] text-emerald-300/90 leading-tight">
                        <Feather className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{pal.benefit}</span>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* Expandable Wave Mixing Intensity Slider */}
        {showSettings && (
          <div className="mt-2 p-3 bg-stone-900/90 backdrop-blur-xl rounded-xl border border-stone-800/90 shadow-2xl pointer-events-auto flex items-center space-x-3 text-xs text-stone-300 animate-in fade-in slide-in-from-bottom-2">
            <span className="whitespace-nowrap font-medium text-stone-300">Fluid Mix Strength:</span>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={mixIntensity}
              onChange={(e) => setMixIntensity(parseFloat(e.target.value))}
              className="w-32 accent-emerald-400 cursor-pointer"
            />
            <span className="font-mono text-emerald-400 w-8 text-right">{mixIntensity.toFixed(1)}x</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Option2_FluidSolverView;
