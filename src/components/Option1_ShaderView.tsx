import React, { useEffect, useRef, useState } from 'react';
import { Waves, Clock } from 'lucide-react';

/**
 * ============================================================================
 * OPTION 1: "QUIET FLOW" (GLSL Impasto Oil Painting Shader)
 * ============================================================================
 * Modular, self-contained WebGL view implementing domain-warped FBM noise,
 * structured spiral vortex flow, directional impasto brushstroke normal relief,
 * and a deep teal, navy, gold cream, and ivory meditative color palette.
 */

interface Option1Props {
  intensity?: number;
  speedMultiplier?: number;
  className?: string;
  onInteraction?: () => void;
}

const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_mouse_active;
uniform float u_speed;
uniform float u_relief_strength;
uniform float u_mode; // 0 = Calm Swirl, 1 = Slow Swirl

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

// Master Domain Warping Heightmap Function
float heightMap(vec2 p, float t, out vec2 outFlow) {
  vec2 center = vec2(0.0, 0.0);
  
  if (u_mouse_active > 0.01) {
    center += (u_mouse - 0.5) * 0.45 * u_mouse_active;
  }
  
  vec2 d = p - center;
  float r = length(d);
  float angle = atan(d.y, d.x);

  float spiralSpeed = t * (u_mode < 0.5 ? 0.07 : 0.035);
  float spiralTwist = sin(r * 2.2 - t * 0.08) * 1.8;
  float vortexAngle = angle + spiralSpeed + spiralTwist * 0.5;
  
  vec2 spiralP = vec2(cos(vortexAngle), sin(vortexAngle)) * r;

  // Domain Warping Stage 1 (Large Viscous Paint Waves)
  vec2 q = vec2(
    fbm(spiralP * 1.6 + vec2(0.0, t * 0.035)),
    fbm(spiralP * 1.6 + vec2(5.2, 1.3 - t * 0.03))
  );

  // Domain Warping Stage 2 (Secondary Paint Folds and Swirls)
  vec2 rVec = vec2(
    fbm(spiralP * 2.4 + 4.0 * q + vec2(1.7, 9.2) + t * 0.02),
    fbm(spiralP * 2.4 + 4.0 * q + vec2(8.3, 2.8) - t * 0.025)
  );

  outFlow = normalize(rVec + vec2(0.001, 0.001));

  float h = fbm(spiralP * 1.8 + 3.2 * rVec + vec2(t * 0.015, t * 0.012));
  float bristles = brushBristles(p * 4.0, outFlow);
  h += (bristles - 0.5) * 0.18;

  return h;
}

void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  float t = u_time * u_speed;

  vec2 flowDir;
  float h = heightMap(p, t, flowDir);

  // Surface normal computation
  float eps = 0.0035;
  vec2 flowDummy;
  float hR = heightMap(p + vec2(eps, 0.0), t, flowDummy);
  float hT = heightMap(p + vec2(0.0, eps), t, flowDummy);

  vec3 normal = normalize(vec3(
    (h - hR) * u_relief_strength * 45.0,
    (h - hT) * u_relief_strength * 45.0,
    eps * 12.0
  ));

  // Color Palette: Deep Oceanic Teals, Golden Honey Ochre, Creamy Waves
  vec3 deepNavy   = vec3(0.025, 0.075, 0.115);
  vec3 oceanTeal  = vec3(0.065, 0.285, 0.335);
  vec3 richJade   = vec3(0.125, 0.445, 0.465);
  vec3 goldBronze = vec3(0.825, 0.635, 0.325);
  vec3 lightGold  = vec3(0.965, 0.845, 0.565);
  vec3 ivoryFoam  = vec3(0.985, 0.955, 0.885);

  float normH = clamp(h * 0.85 + 0.15, 0.0, 1.0);
  vec3 baseColor = mix(deepNavy, oceanTeal, smoothstep(0.0, 0.38, normH));
  baseColor = mix(baseColor, richJade, smoothstep(0.35, 0.62, normH));
  baseColor = mix(baseColor, goldBronze, smoothstep(0.58, 0.82, normH));
  baseColor = mix(baseColor, lightGold, smoothstep(0.78, 0.94, normH));
  baseColor = mix(baseColor, ivoryFoam, smoothstep(0.92, 1.0, normH));

  // Subtle directional key light
  vec3 lightDir = normalize(vec3(0.45, 0.65, 0.85));
  float diffuse = max(dot(normal, lightDir), 0.0);

  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  vec3 halfVec = normalize(lightDir + viewDir);
  float spec = pow(max(dot(normal, halfVec), 0.0), 32.0);

  float ambient = 0.45;
  vec3 litColor = baseColor * (ambient + diffuse * 0.65);
  litColor += lightGold * spec * 0.75 * smoothstep(0.5, 1.0, normH);

  // Soft Vignette
  float vig = 1.0 - smoothstep(0.65, 1.45, length(p));
  litColor *= mix(0.75, 1.0, vig);

  gl_FragColor = vec4(litColor, 1.0);
}
`;

export const Option1_ShaderView: React.FC<Option1Props> = ({
  intensity = 1.1,
  speedMultiplier = 0.9,
  className = '',
  onInteraction,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number>(0);
  const mouseState = useRef<{ x: number; y: number; active: number }>({ x: 0.5, y: 0.5, active: 0 });
  const [swirlMode, setSwirlMode] = useState<'calm' | 'slow'>('calm');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) {
      console.error('WebGL is not supported in this browser.');
      return;
    }

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation failed:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertShader = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fragShader = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const posAttrLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posAttrLoc);
    gl.vertexAttribPointer(posAttrLoc, 2, gl.FLOAT, false, 0, 0);

    const uResLoc = gl.getUniformLocation(program, 'u_resolution');
    const uTimeLoc = gl.getUniformLocation(program, 'u_time');
    const uMouseLoc = gl.getUniformLocation(program, 'u_mouse');
    const uMouseActiveLoc = gl.getUniformLocation(program, 'u_mouse_active');
    const uSpeedLoc = gl.getUniformLocation(program, 'u_speed');
    const uReliefLoc = gl.getUniformLocation(program, 'u_relief_strength');
    const uModeLoc = gl.getUniformLocation(program, 'u_mode');

    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener('resize', resize);
    resize();

    const startTime = performance.now();
    let currentMouseActive = 0;

    const render = (now: number) => {
      const elapsed = (now - startTime) * 0.001;
      currentMouseActive += (mouseState.current.active - currentMouseActive) * 0.06;

      gl.useProgram(program);
      gl.uniform2f(uResLoc, canvas.width, canvas.height);
      gl.uniform1f(uTimeLoc, elapsed);
      gl.uniform2f(uMouseLoc, mouseState.current.x, mouseState.current.y);
      gl.uniform1f(uMouseActiveLoc, currentMouseActive);
      gl.uniform1f(uSpeedLoc, speedMultiplier);
      gl.uniform1f(uReliefLoc, intensity);
      gl.uniform1f(uModeLoc, swirlMode === 'calm' ? 0.0 : 1.0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameId.current);
      window.removeEventListener('resize', resize);
      if (positionBuffer) gl.deleteBuffer(positionBuffer);
      if (program) gl.deleteProgram(program);
    };
  }, [intensity, speedMultiplier, swirlMode]);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height;
    mouseState.current = { x, y, active: 1.0 };
    if (onInteraction) onInteraction();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    handlePointerMove(e);
  };

  const handlePointerUp = () => {
    mouseState.current.active = 0.0;
  };

  return (
    <div id="option1-quiet-flow-container" className={`relative w-full h-full overflow-hidden bg-stone-950 ${className}`}>
      <canvas
        id="option1-glsl-canvas"
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full h-full block cursor-grab active:cursor-grabbing touch-none select-none"
      />

      {/* Subtle Mobile Touch Cue */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 pointer-events-none z-10 select-none">
        <p className="text-xs text-stone-300/80 bg-stone-950/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/5">
          Gently swirl with your finger
        </p>
      </div>

      {/* Bottom Floating Control Bar (Standardized Height & 1-Word Buttons) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-4 flex flex-col items-center pointer-events-none select-none">
        <div className="bg-stone-950/85 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5 shadow-2xl flex items-center justify-center gap-1.5 pointer-events-auto transition-all">
          <button
            id="mode-calm-swirl"
            type="button"
            onClick={() => setSwirlMode('calm')}
            className={`h-8 flex items-center space-x-1.5 px-3.5 rounded-xl text-xs font-medium transition-all ${
              swirlMode === 'calm'
                ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40 shadow-sm'
                : 'bg-stone-800/80 text-stone-300 border border-stone-700 hover:bg-stone-700/80'
            }`}
          >
            <Waves className="w-3.5 h-3.5 text-amber-300" />
            <span>Calm</span>
          </button>

          <button
            id="mode-slow-swirl"
            type="button"
            onClick={() => setSwirlMode('slow')}
            className={`h-8 flex items-center space-x-1.5 px-3.5 rounded-xl text-xs font-medium transition-all ${
              swirlMode === 'slow'
                ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40 shadow-sm'
                : 'bg-stone-800/80 text-stone-300 border border-stone-700 hover:bg-stone-700/80'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            <span>Slow</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Option1_ShaderView;
