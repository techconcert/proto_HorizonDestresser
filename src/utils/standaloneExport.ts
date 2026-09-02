/**
 * Generators for standalone single-file HTML implementations of Option 1 and Option 2
 * allowing the developer to copy either option directly into their project with zero dependencies.
 */

export function generateOption1StandaloneHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Quiet Flow - Impasto Oil GLSL Meditation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background-color: #070e16; }
    canvas { width: 100%; height: 100%; display: block; touch-action: none; cursor: grab; }
    canvas:active { cursor: grabbing; }
    .overlay {
      position: absolute; inset: 0; display: flex; flex-direction: column;
      align-items: center; justify-content: center; pointer-events: none; text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.25em; text-transform: uppercase; color: rgba(251, 191, 36, 0.85); margin-bottom: 4px; }
    .time { font-size: 52px; font-weight: 300; font-family: monospace; color: rgba(255, 255, 255, 0.92); margin-bottom: 4px; }
    .subtitle { font-size: 13px; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(253, 230, 138, 0.9); }
    .controls {
      position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
      display: flex; gap: 8px; background: rgba(12, 10, 9, 0.75); backdrop-filter: blur(16px);
      padding: 6px; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .btn {
      background: transparent; border: 1px solid transparent; color: #a8a29e;
      padding: 6px 14px; border-radius: 10px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s;
    }
    .btn.active { background: rgba(245, 158, 11, 0.25); color: #fef3c7; border-color: rgba(251, 191, 36, 0.4); }
  </style>
</head>
<body>
  <canvas id="glcanvas"></canvas>
  <div class="overlay">
    <div class="eyebrow">EMERGENCY: Guided Relief</div>
    <div class="time">7:42</div>
    <div class="subtitle">WAVE SWELLING GENTLY</div>
  </div>
  <div class="controls">
    <button id="btnCalm" class="btn active">Calm</button>
    <button id="btnSlow" class="btn">Slow</button>
  </div>

  <script>
  (function() {
    const canvas = document.getElementById('glcanvas');
    const gl = canvas.getContext('webgl', { alpha: false, antialias: true, powerPreference: 'high-performance' });
    if (!gl) { alert('WebGL not supported'); return; }

    let swirlMode = 0.0;
    const btnCalm = document.getElementById('btnCalm');
    const btnSlow = document.getElementById('btnSlow');
    btnCalm.onclick = () => { swirlMode = 0.0; btnCalm.classList.add('active'); btnSlow.classList.remove('active'); };
    btnSlow.onclick = () => { swirlMode = 1.0; btnSlow.classList.add('active'); btnCalm.classList.remove('active'); };

    const VS = \`
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main() {
        v_uv = (a_pos + 1.0) * 0.5;
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    \`;

    const FS = \`
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform float u_mouse_active;
      uniform float u_mode;
      varying vec2 v_uv;

      vec2 hash2(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
      }

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

      mat2 rot(float a) {
        float c = cos(a), s = sin(a);
        return mat2(c, -s, s, c);
      }

      float fbm(vec2 p) {
        float v = 0.0, a = 0.5;
        mat2 m = rot(0.55);
        for (int i = 0; i < 6; ++i) {
          v += a * gnoise(p);
          p = m * p * 2.02 + vec2(100.0, 100.0);
          a *= 0.5;
        }
        return v;
      }

      float heightMap(vec2 p, float t, out vec2 outFlow) {
        vec2 center = vec2(0.0);
        if (u_mouse_active > 0.01) center += (u_mouse - 0.5) * 0.45 * u_mouse_active;
        vec2 d = p - center;
        float r = length(d);
        float angle = atan(d.y, d.x);

        float spiralSpeed = t * (u_mode < 0.5 ? 0.07 : 0.035);
        float spiralTwist = sin(r * 2.2 - t * 0.08) * 1.8;
        float vortexAngle = angle + spiralSpeed + spiralTwist * 0.5;
        vec2 spiralP = vec2(cos(vortexAngle), sin(vortexAngle)) * r;

        vec2 q = vec2(
          fbm(spiralP * 1.6 + vec2(0.0, t * 0.035)),
          fbm(spiralP * 1.6 + vec2(5.2, 1.3 - t * 0.03))
        );
        vec2 rVec = vec2(
          fbm(spiralP * 2.4 + 4.0 * q + vec2(1.7, 9.2) + t * 0.02),
          fbm(spiralP * 2.4 + 4.0 * q + vec2(8.3, 2.8) - t * 0.025)
        );
        outFlow = normalize(rVec + vec2(0.001));

        float h = fbm(spiralP * 1.8 + 3.2 * rVec + vec2(t * 0.015, t * 0.012));
        vec2 perp = vec2(-outFlow.y, outFlow.x);
        float streak = sin(dot(p * 4.0, perp) * 65.0) * 0.5 + 0.5;
        float bristles = mix(streak, gnoise(p * 28.0 + outFlow * 10.0), 0.45);
        h += (bristles - 0.5) * 0.18;
        return h;
      }

      void main() {
        vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
        float t = u_time * 0.9;
        vec2 flowDir;
        float h = heightMap(p, t, flowDir);

        float eps = 0.0035;
        vec2 fd;
        float hR = heightMap(p + vec2(eps, 0.0), t, fd);
        float hT = heightMap(p + vec2(0.0, eps), t, fd);
        vec3 normal = normalize(vec3((h - hR) * 48.0, (h - hT) * 48.0, eps * 12.0));

        vec3 deepNavy   = vec3(0.025, 0.075, 0.115);
        vec3 oceanTeal  = vec3(0.065, 0.285, 0.335);
        vec3 richJade   = vec3(0.125, 0.445, 0.465);
        vec3 goldBronze = vec3(0.825, 0.635, 0.325);
        vec3 lightGold  = vec3(0.965, 0.845, 0.565);
        vec3 ivoryFoam  = vec3(0.985, 0.955, 0.885);

        float normH = clamp(h * 0.85 + 0.15, 0.0, 1.0);
        vec3 base = mix(deepNavy, oceanTeal, smoothstep(0.0, 0.38, normH));
        base = mix(base, richJade, smoothstep(0.35, 0.62, normH));
        base = mix(base, goldBronze, smoothstep(0.58, 0.82, normH));
        base = mix(base, lightGold, smoothstep(0.78, 0.94, normH));
        base = mix(base, ivoryFoam, smoothstep(0.92, 1.0, normH));

        vec3 lightDir = normalize(vec3(0.45, 0.65, 0.85));
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 halfV = normalize(lightDir + vec3(0.0, 0.0, 1.0));
        float spec = pow(max(dot(normal, halfV), 0.0), 32.0);

        vec3 col = base * (0.45 + diff * 0.65) + lightGold * spec * 0.75 * smoothstep(0.5, 1.0, normH);
        float vig = 1.0 - smoothstep(0.65, 1.45, length(p));
        col *= mix(0.75, 1.0, vig);
        gl_FragColor = vec4(col, 1.0);
      }
    \`;

    function createShader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, createShader(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, createShader(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');
    const uMouseActive = gl.getUniformLocation(prog, 'u_mouse_active');
    const uModeLoc = gl.getUniformLocation(prog, 'u_mode');

    let mouse = { x: 0.5, y: 0.5, active: 0 };
    window.addEventListener('pointermove', (e) => {
      mouse.x = e.clientX / window.innerWidth;
      mouse.y = 1.0 - e.clientY / window.innerHeight;
      mouse.active = 1.0;
    });
    window.addEventListener('pointerup', () => { mouse.active = 0; });

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();

    let mouseActiveSmooth = 0;
    const start = performance.now();
    function loop(now) {
      mouseActiveSmooth += (mouse.active - mouseActiveSmooth) * 0.06;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (now - start) * 0.001);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uMouseActive, mouseActiveSmooth);
      gl.uniform1f(uModeLoc, swirlMode);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  })();
  </script>
</body>
</html>`;
}

export function generateOption2StandaloneHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Ink in Water - Navier-Stokes Fluid Meditation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background-color: #060e17; }
    canvas { width: 100%; height: 100%; display: block; touch-action: none; cursor: crosshair; }
    .overlay {
      position: absolute; inset: 0; display: flex; flex-direction: column;
      align-items: center; justify-content: center; pointer-events: none; text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.25em; text-transform: uppercase; color: rgba(52, 211, 153, 0.85); margin-bottom: 4px; }
    .time { font-size: 52px; font-weight: 300; font-family: monospace; color: rgba(255, 255, 255, 0.92); margin-bottom: 4px; }
    .subtitle { font-size: 13px; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(167, 243, 208, 0.9); }
    .controls {
      position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
      display: flex; gap: 6px; background: rgba(12, 10, 9, 0.8); backdrop-filter: blur(16px);
      padding: 6px; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .btn {
      background: transparent; border: 1px solid transparent; color: #a8a29e;
      padding: 6px 12px; border-radius: 10px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s;
    }
    .btn.active { background: rgba(20, 184, 166, 0.25); color: #ccfbf1; border-color: rgba(45, 212, 191, 0.4); }
    .btn-action { color: #fcd34d; border-color: rgba(251, 191, 36, 0.2); }
  </style>
</head>
<body>
  <canvas id="fluidCanvas"></canvas>
  <div class="overlay">
    <div class="eyebrow">EMERGENCY: Guided Relief</div>
    <div class="time">7:42</div>
    <div id="subText" class="subtitle">FEEL THE FLUID FLOW</div>
  </div>
  <div class="controls">
    <button id="btnStir" class="btn active">Stir Fluid</button>
    <button id="btnRiver" class="btn">Calm River</button>
    <button id="btnVortex" class="btn">Dynamic Vortex</button>
    <button id="btnAddDrop" class="btn btn-action">+ Add Ink Drop</button>
    <button id="btnReset" class="btn">Reset</button>
  </div>

  <script>
  (function() {
    const canvas = document.getElementById('fluidCanvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) { alert('WebGL not supported'); return; }

    const extHalf = gl.getExtension('OES_texture_half_float');
    gl.getExtension('OES_texture_half_float_linear');
    const texType = extHalf ? (extHalf.HALF_FLOAT_OES || 0x8d61) : gl.UNSIGNED_BYTE;

    const INK_DROPS = [
      { r: 0.32, g: 0.76, b: 0.62 },
      { r: 0.82, g: 0.62, b: 0.34 },
      { r: 0.42, g: 0.86, b: 0.72 },
      { r: 0.75, g: 0.52, b: 0.22 },
      { r: 0.20, g: 0.60, b: 0.50 },
      { r: 0.90, g: 0.72, b: 0.42 }
    ];

    let flowMode = 0.0;
    const subText = document.getElementById('subText');
    const btnStir = document.getElementById('btnStir');
    const btnRiver = document.getElementById('btnRiver');
    const btnVortex = document.getElementById('btnVortex');

    btnStir.onclick = () => { flowMode = 0.0; btnStir.classList.add('active'); btnRiver.classList.remove('active'); btnVortex.classList.remove('active'); subText.innerText = 'FEEL THE FLUID FLOW'; };
    btnRiver.onclick = () => { flowMode = 1.0; btnRiver.classList.add('active'); btnStir.classList.remove('active'); btnVortex.classList.remove('active'); subText.innerText = 'GENTLE RIVER OF STILLNESS'; };
    btnVortex.onclick = () => { flowMode = 2.0; btnVortex.classList.add('active'); btnStir.classList.remove('active'); btnRiver.classList.remove('active'); subText.innerText = 'TRUST THE VORTEX TO BREAK IT'; };

    const BASE_VERT = \`
      precision highp float;
      attribute vec2 a_position;
      varying vec2 v_uv, v_l, v_r, v_t, v_b;
      uniform vec2 u_texel_size;
      void main() {
        v_uv = (a_position + 1.0) * 0.5;
        v_l = v_uv - vec2(u_texel_size.x, 0.0);
        v_r = v_uv + vec2(u_texel_size.x, 0.0);
        v_t = v_uv + vec2(0.0, u_texel_size.y);
        v_b = v_uv - vec2(0.0, u_texel_size.y);
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    \`;

    const SPLAT_FRAG = \`
      precision highp float;
      uniform sampler2D u_target;
      uniform float u_aspect_ratio;
      uniform vec3 u_color;
      uniform vec2 u_point;
      uniform float u_radius;
      varying vec2 v_uv;
      void main() {
        vec2 p = v_uv - u_point.xy;
        p.x *= u_aspect_ratio;
        vec3 splat = exp(-dot(p, p) / u_radius) * u_color;
        vec3 base = texture2D(u_target, v_uv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
      }
    \`;

    const ADVECT_FRAG = \`
      precision highp float;
      uniform sampler2D u_velocity, u_source;
      uniform vec2 u_texel_size;
      uniform float u_dt, u_dissipation;
      varying vec2 v_uv;
      void main() {
        vec2 coord = v_uv - u_dt * texture2D(u_velocity, v_uv).xy * u_texel_size;
        gl_FragColor = u_dissipation * texture2D(u_source, coord);
      }
    \`;

    const DIV_FRAG = \`
      precision highp float;
      uniform sampler2D u_velocity;
      varying vec2 v_l, v_r, v_t, v_b;
      void main() {
        float L = texture2D(u_velocity, v_l).x, R = texture2D(u_velocity, v_r).x;
        float T = texture2D(u_velocity, v_t).y, B = texture2D(u_velocity, v_b).y;
        gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
      }
    \`;

    const CURL_FRAG = \`
      precision highp float;
      uniform sampler2D u_velocity;
      varying vec2 v_l, v_r, v_t, v_b;
      void main() {
        float L = texture2D(u_velocity, v_l).y, R = texture2D(u_velocity, v_r).y;
        float T = texture2D(u_velocity, v_t).x, B = texture2D(u_velocity, v_b).x;
        gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
      }
    \`;

    const VORT_FRAG = \`
      precision highp float;
      uniform sampler2D u_velocity, u_curl;
      uniform float u_curl_strength, u_dt;
      varying vec2 v_uv, v_l, v_r, v_t, v_b;
      void main() {
        float L = texture2D(u_curl, v_l).x, R = texture2D(u_curl, v_r).x;
        float T = texture2D(u_curl, v_t).x, B = texture2D(u_curl, v_b).x;
        float C = texture2D(u_curl, v_uv).x;
        vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        force *= (u_curl_strength / (length(force) + 0.00001)) * C;
        force.y *= -1.0;
        gl_FragColor = vec4(texture2D(u_velocity, v_uv).xy + force * u_dt, 0.0, 1.0);
      }
    \`;

    const PRESS_FRAG = \`
      precision highp float;
      uniform sampler2D u_pressure, u_divergence;
      varying vec2 v_uv, v_l, v_r, v_t, v_b;
      void main() {
        float L = texture2D(u_pressure, v_l).x, R = texture2D(u_pressure, v_r).x;
        float T = texture2D(u_pressure, v_t).x, B = texture2D(u_pressure, v_b).x;
        float div = texture2D(u_divergence, v_uv).x;
        gl_FragColor = vec4((L + R + T + B - div) * 0.25, 0.0, 0.0, 1.0);
      }
    \`;

    const GRAD_FRAG = \`
      precision highp float;
      uniform sampler2D u_pressure, u_velocity;
      varying vec2 v_uv, v_l, v_r, v_t, v_b;
      void main() {
        float L = texture2D(u_pressure, v_l).x, R = texture2D(u_pressure, v_r).x;
        float T = texture2D(u_pressure, v_t).x, B = texture2D(u_pressure, v_b).x;
        vec2 vel = texture2D(u_velocity, v_uv).xy;
        gl_FragColor = vec4(vel - vec2(R - L, T - B) * 0.5, 0.0, 1.0);
      }
    \`;

    const FORCE_FRAG = \`
      precision highp float;
      uniform sampler2D u_velocity;
      uniform float u_mode, u_time, u_aspect;
      varying vec2 v_uv;
      void main() {
        vec2 vel = texture2D(u_velocity, v_uv).xy;
        vec2 p = v_uv - vec2(0.5);
        p.x *= u_aspect;
        float r = length(p);
        vec2 f = vec2(0.0);
        if (u_mode < 0.5) {
          vec2 tangent = vec2(-p.y, p.x);
          float ring = smoothstep(0.05, 0.35, r) * (1.0 - smoothstep(0.40, 0.75, r));
          vec2 swirl = tangent * 1.8 * ring;
          vec2 wave = vec2(sin(v_uv.y * 4.5 + u_time * 0.6) * 0.35, cos(v_uv.x * 4.0 + u_time * 0.5) * 0.25);
          f = swirl + wave * 0.6;
        } else if (u_mode < 1.5) {
          f = vec2(sin(v_uv.x * 6.28 + u_time * 0.4) * 0.4, 1.8 + cos(u_time * 0.3) * 0.3);
        } else {
          vec2 t = vec2(-p.y, p.x);
          f = t * 8.5 * exp(-r * 3.8) * (1.0 - smoothstep(0.0, 0.65, r));
        }
        gl_FragColor = vec4(vel + f * 0.016, 0.0, 1.0);
      }
    \`;

    const DISP_FRAG = \`
      precision highp float;
      uniform sampler2D u_dye;
      uniform vec2 u_texel_size;
      uniform vec2 u_resolution;
      varying vec2 v_uv, v_l, v_r, v_t, v_b;
      void main() {
        vec3 dye = texture2D(u_dye, v_uv).rgb;
        vec3 lc = texture2D(u_dye, v_l).rgb;
        vec3 rc = texture2D(u_dye, v_r).rgb;
        vec3 tc = texture2D(u_dye, v_t).rgb;
        vec3 bc = texture2D(u_dye, v_b).rgb;
        float dx = length(rc) - length(lc);
        float dy = length(tc) - length(bc);
        vec3 normal = normalize(vec3(dx * 1.8, dy * 1.8, length(u_texel_size) * 1.2));
        vec3 lightDir = normalize(vec3(0.35, 0.55, 0.85));
        float diffuse = clamp(dot(normal, lightDir) * 0.45 + 0.75, 0.65, 1.15);

        vec3 waterBg = mix(vec3(0.015, 0.038, 0.065), vec3(0.035, 0.075, 0.120), gl_FragCoord.y / u_resolution.y);
        vec3 inkColor = (1.0 - exp(-dye * 1.85)) * diffuse;
        float inkAlpha = clamp(dot(inkColor, vec3(0.333, 0.45, 0.22)) * 1.6, 0.0, 0.98);
        vec3 col = mix(waterBg, inkColor, smoothstep(0.01, 0.80, inkAlpha));
        vec3 halfVec = normalize(lightDir + vec3(0.0, 0.0, 1.0));
        float spec = pow(max(dot(normal, halfVec), 0.0), 24.0);
        col += vec3(0.96, 0.85, 0.55) * spec * smoothstep(0.25, 0.85, inkAlpha) * 0.32;

        vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
        col *= mix(0.75, 1.0, 1.0 - smoothstep(0.55, 1.40, length(p)));
        gl_FragColor = vec4(col, 1.0);
      }
    \`;

    function makeShader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }
    function makeProg(vs, fs) {
      const p = gl.createProgram();
      gl.attachShader(p, makeShader(gl.VERTEX_SHADER, vs));
      gl.attachShader(p, makeShader(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(p);
      return p;
    }

    const SIM = 160, DYE = 512;
    const splatP = makeProg(BASE_VERT, SPLAT_FRAG);
    const advectP = makeProg(BASE_VERT, ADVECT_FRAG);
    const divP = makeProg(BASE_VERT, DIV_FRAG);
    const curlP = makeProg(BASE_VERT, CURL_FRAG);
    const vortP = makeProg(BASE_VERT, VORT_FRAG);
    const pressP = makeProg(BASE_VERT, PRESS_FRAG);
    const gradP = makeProg(BASE_VERT, GRAD_FRAG);
    const forceP = makeProg(BASE_VERT, FORCE_FRAG);
    const dispP = makeProg(BASE_VERT, DISP_FRAG);

    const quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);

    function makeFBO(w, h) {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, texType, null);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return { fbo, tex, width: w, height: h };
    }

    function makeDouble(w, h) {
      let f1 = makeFBO(w, h), f2 = makeFBO(w, h);
      return { get read() { return f1; }, get write() { return f2; }, swap() { const t = f1; f1 = f2; f2 = t; } };
    }

    const density = makeDouble(DYE, DYE);
    const velocity = makeDouble(SIM, SIM);
    const divergence = makeFBO(SIM, SIM);
    const curl = makeFBO(SIM, SIM);
    const pressure = makeDouble(SIM, SIM);

    function blit(fbo, w, h) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, w, h);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    function splat(x, y, dx, dy, col, rad) {
      const aspect = canvas.width / canvas.height;
      if (Math.abs(dx) > 0.0001 || Math.abs(dy) > 0.0001) {
        gl.useProgram(splatP);
        gl.uniform1i(gl.getUniformLocation(splatP, 'u_target'), 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
        gl.uniform1f(gl.getUniformLocation(splatP, 'u_aspect_ratio'), aspect);
        gl.uniform2f(gl.getUniformLocation(splatP, 'u_point'), x, y);
        gl.uniform3f(gl.getUniformLocation(splatP, 'u_color'), dx, dy, 0.0);
        gl.uniform1f(gl.getUniformLocation(splatP, 'u_radius'), rad);
        blit(velocity.write.fbo, velocity.write.width, velocity.write.height);
        velocity.swap();
      }
      if (col) {
        gl.useProgram(splatP);
        gl.uniform1i(gl.getUniformLocation(splatP, 'u_target'), 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, density.read.tex);
        gl.uniform1f(gl.getUniformLocation(splatP, 'u_aspect_ratio'), aspect);
        gl.uniform2f(gl.getUniformLocation(splatP, 'u_point'), x, y);
        gl.uniform3f(gl.getUniformLocation(splatP, 'u_color'), col.r, col.g, col.b);
        gl.uniform1f(gl.getUniformLocation(splatP, 'u_radius'), rad * 1.8);
        blit(density.write.fbo, density.write.width, density.write.height);
        density.swap();
      }
    }

    function dropBloom(cx, cy, col, s) {
      splat(cx, cy, 0, 0, { r: col.r * s, g: col.g * s, b: col.b * s }, 0.0045);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + Math.random() * 0.4;
        const d = 0.02 + Math.random() * 0.035;
        splat(cx + Math.cos(a) * d, cy + Math.sin(a) * d, -Math.sin(a) * 18 * s, Math.cos(a) * 18 * s, { r: col.r * 0.7 * s, g: col.g * 0.7 * s, b: col.b * 0.7 * s }, 0.003);
      }
    }

    function seedInk() {
      dropBloom(0.48, 0.58, INK_DROPS[0], 1.2);
      dropBloom(0.54, 0.64, INK_DROPS[2], 0.9);
      dropBloom(0.52, 0.42, INK_DROPS[1], 1.1);
      dropBloom(0.45, 0.38, INK_DROPS[3], 0.8);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        splat(0.5 + Math.cos(a) * 0.12, 0.5 + Math.sin(a) * 0.12, -Math.sin(a) * 35, Math.cos(a) * 35, null, 0.008);
      }
    }
    seedInk();

    let dropIdx = 0;
    document.getElementById('btnAddDrop').onclick = () => {
      dropBloom(0.35 + Math.random() * 0.3, 0.35 + Math.random() * 0.3, INK_DROPS[dropIdx++ % INK_DROPS.length], 1.2);
    };
    document.getElementById('btnReset').onclick = () => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, density.read.fbo); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindFramebuffer(gl.FRAMEBUFFER, density.write.fbo); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindFramebuffer(gl.FRAMEBUFFER, velocity.read.fbo); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindFramebuffer(gl.FRAMEBUFFER, velocity.write.fbo); gl.clear(gl.COLOR_BUFFER_BIT);
      seedInk();
    };

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    }
    window.addEventListener('resize', resize);
    resize();

    let ptr = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, down: false };
    canvas.addEventListener('pointerdown', (e) => {
      ptr.x = ptr.px = e.clientX / window.innerWidth;
      ptr.y = ptr.py = 1.0 - e.clientY / window.innerHeight;
      ptr.down = true;
    });
    canvas.addEventListener('pointermove', (e) => {
      if (ptr.down) {
        ptr.x = e.clientX / window.innerWidth;
        ptr.y = 1.0 - e.clientY / window.innerHeight;
      }
    });
    window.addEventListener('pointerup', () => { ptr.down = false; });

    let last = performance.now();
    function step(now) {
      const dt = Math.min((now - last) * 0.001, 0.033);
      last = now;

      if (ptr.down) {
        const dx = (ptr.x - ptr.px) * 750, dy = (ptr.y - ptr.py) * 750;
        if (Math.sqrt(dx * dx + dy * dy) > 0.001) {
          const col = INK_DROPS[dropIdx % INK_DROPS.length];
          splat(ptr.x, ptr.y, dx, dy, col, 0.0055);
        }
        ptr.px = ptr.x; ptr.py = ptr.y;
      }

      gl.useProgram(forceP);
      gl.uniform1i(gl.getUniformLocation(forceP, 'u_velocity'), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      gl.uniform1f(gl.getUniformLocation(forceP, 'u_mode'), flowMode);
      gl.uniform1f(gl.getUniformLocation(forceP, 'u_time'), now * 0.001);
      gl.uniform1f(gl.getUniformLocation(forceP, 'u_aspect'), canvas.width / canvas.height);
      blit(velocity.write.fbo, velocity.write.width, velocity.write.height);
      velocity.swap();

      gl.useProgram(curlP);
      gl.uniform1i(gl.getUniformLocation(curlP, 'u_velocity'), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      gl.uniform2f(gl.getUniformLocation(curlP, 'u_texel_size'), 1/SIM, 1/SIM);
      blit(curl.fbo, SIM, SIM);

      gl.useProgram(vortP);
      gl.uniform1i(gl.getUniformLocation(vortP, 'u_velocity'), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      gl.uniform1i(gl.getUniformLocation(vortP, 'u_curl'), 1);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, curl.tex);
      gl.uniform1f(gl.getUniformLocation(vortP, 'u_curl_strength'), 28.0);
      gl.uniform1f(gl.getUniformLocation(vortP, 'u_dt'), dt);
      gl.uniform2f(gl.getUniformLocation(vortP, 'u_texel_size'), 1/SIM, 1/SIM);
      blit(velocity.write.fbo, velocity.write.width, velocity.write.height);
      velocity.swap();

      gl.useProgram(divP);
      gl.uniform1i(gl.getUniformLocation(divP, 'u_velocity'), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      gl.uniform2f(gl.getUniformLocation(divP, 'u_texel_size'), 1/SIM, 1/SIM);
      blit(divergence.fbo, SIM, SIM);

      gl.useProgram(pressP);
      gl.uniform1i(gl.getUniformLocation(pressP, 'u_divergence'), 1);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, divergence.tex);
      gl.uniform2f(gl.getUniformLocation(pressP, 'u_texel_size'), 1/SIM, 1/SIM);
      for (let i = 0; i < 24; i++) {
        gl.uniform1i(gl.getUniformLocation(pressP, 'u_pressure'), 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, pressure.read.tex);
        blit(pressure.write.fbo, SIM, SIM);
        pressure.swap();
      }

      gl.useProgram(gradP);
      gl.uniform1i(gl.getUniformLocation(gradP, 'u_pressure'), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, pressure.read.tex);
      gl.uniform1i(gl.getUniformLocation(gradP, 'u_velocity'), 1);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      gl.uniform2f(gl.getUniformLocation(gradP, 'u_texel_size'), 1/SIM, 1/SIM);
      blit(velocity.write.fbo, SIM, SIM);
      velocity.swap();

      gl.useProgram(advectP);
      gl.uniform1i(gl.getUniformLocation(advectP, 'u_velocity'), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      gl.uniform1i(gl.getUniformLocation(advectP, 'u_source'), 0);
      gl.uniform1f(gl.getUniformLocation(advectP, 'u_dt'), dt);
      gl.uniform1f(gl.getUniformLocation(advectP, 'u_dissipation'), 0.985);
      gl.uniform2f(gl.getUniformLocation(advectP, 'u_texel_size'), 1/SIM, 1/SIM);
      blit(velocity.write.fbo, SIM, SIM);
      velocity.swap();

      gl.uniform1i(gl.getUniformLocation(advectP, 'u_source'), 1);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, density.read.tex);
      gl.uniform1f(gl.getUniformLocation(advectP, 'u_dissipation'), 0.996);
      gl.uniform2f(gl.getUniformLocation(advectP, 'u_texel_size'), 1/DYE, 1/DYE);
      blit(density.write.fbo, DYE, DYE);
      density.swap();

      gl.useProgram(dispP);
      gl.uniform1i(gl.getUniformLocation(dispP, 'u_dye'), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, density.read.tex);
      gl.uniform2f(gl.getUniformLocation(dispP, 'u_texel_size'), 1/DYE, 1/DYE);
      gl.uniform2f(gl.getUniformLocation(dispP, 'u_resolution'), canvas.width, canvas.height);
      blit(null, canvas.width, canvas.height);

      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  })();
  </script>
</body>
</html>`;
}

export function generateOption3StandaloneHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Option 3: Clear Depths - Water Reveal & Underwater Discovery</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-user-select: none; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #030911; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #fff; }
    #canvas-container { position: relative; width: 100vw; height: 100vh; touch-action: none; cursor: pointer; }
    canvas { width: 100%; height: 100%; display: block; }
    .hidden-cvs { display: none; }
    .center-overlay { position: absolute; inset: 0; pointer-events: none; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
    .badge-sub { font-size: 11px; font-weight: 600; letter-spacing: 0.25em; text-transform: uppercase; color: rgba(34, 211, 238, 0.9); }
    .timer-val { font-size: 56px; font-weight: 300; font-family: monospace; letter-spacing: -0.02em; color: rgba(255, 255, 255, 0.95); margin: 4px 0; }
    .sub-prompt { font-size: 12px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(165, 243, 252, 0.85); }
    .ui-top { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; z-index: 20; }
    .ui-bottom { position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; z-index: 20; }
    .pill-group { background: rgba(8, 12, 20, 0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 9999px; padding: 4px; display: flex; gap: 4px; }
    .btn { background: transparent; border: 1px solid transparent; color: #94a3b8; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; }
    .btn:hover { color: #fff; }
    .btn.active { background: rgba(6, 182, 212, 0.25); color: #cffafe; border-color: rgba(34, 211, 238, 0.4); }
    .btn-action { background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.1); color: #e2e8f0; border-radius: 12px; padding: 7px 14px; font-size: 12px; cursor: pointer; }
    .btn-action:hover { background: rgba(255, 255, 255, 0.15); color: #fff; }
  </style>
</head>
<body>
  <div id="canvas-container">
    <canvas id="underwater-canvas" class="hidden-cvs"></canvas>
    <canvas id="clarity-canvas" class="hidden-cvs"></canvas>
    <canvas id="display-canvas"></canvas>

    <div class="center-overlay">
      <p class="badge-sub">DISCOVERY: Two-Stage Water Reveal</p>
      <h1 class="timer-val" id="timer-txt">7:42</h1>
      <p class="sub-prompt">Slide Finger to Reveal Depths &bull; Opacity (3/5/8s) &bull; Dark (+10s)</p>
    </div>

    <div class="ui-top">
      <div class="pill-group" id="biome-group">
        <button class="btn active" data-biome="koi_pond">Zen Koi Pond</button>
        <button class="btn" data-biome="ocean_tidepool">Tide Pool</button>
        <button class="btn" data-biome="midnight_lake">Midnight</button>
      </div>
    </div>

    <div style="position: absolute; top: 76px; left: 50%; transform: translateX(-50%); z-index: 20; pointer-events: none;">
      <div style="background: rgba(8, 12, 20, 0.85); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.12); border-radius: 9999px; padding: 4px 12px; font-size: 11px; color: #cbd5e1;" id="stage-badge">
        Stage 1: Veiling to Opacity (5s)
      </div>
    </div>

    <div class="ui-bottom">
      <div class="pill-group">
        <button class="btn-action" id="btn-drop">Drop Pebble</button>
        <button class="btn-action" id="btn-speed">1. Opacity: 5s</button>
        <button class="btn-action" id="btn-reveil">Re-veil</button>
      </div>
    </div>
  </div>

  <script>
  (function() {
    const container = document.getElementById('canvas-container');
    const uCvs = document.getElementById('underwater-canvas');
    const cCvs = document.getElementById('clarity-canvas');
    const dCvs = document.getElementById('display-canvas');
    const uCtx = uCvs.getContext('2d');
    const cCtx = cCvs.getContext('2d');
    const dCtx = dCvs.getContext('2d');

    let biome = 'koi_pond';
    let brushSize = 75;
    let revealSpeed = 'medium'; // slow, medium, fast
    let idleTime = 0;
    let darkFactor = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const BIOMES = {
      koi_pond: {
        deepBg: '#07151f',
        surface: 'rgba(10, 32, 45, 0.88)',
        caustic: 'rgba(120, 220, 200, 0.35)',
        pebbles: [
          { base: '#3a444a', light: '#5e6a73', shadow: '#1b2226' },
          { base: '#7d6b53', light: '#a69074', shadow: '#3d3224' },
          { base: '#2d473e', light: '#466c60', shadow: '#14241e' },
          { base: '#c2a878', light: '#e8cb97', shadow: '#615237' }
        ],
        fish: ['koi_orange', 'koi_calico', 'koi_white_gold']
      },
      ocean_tidepool: {
        deepBg: '#051b26',
        surface: 'rgba(6, 40, 58, 0.85)',
        caustic: 'rgba(80, 240, 230, 0.42)',
        pebbles: [
          { base: '#204354', light: '#356d8a', shadow: '#0d1e26' },
          { base: '#3b757f', light: '#5fa8b5', shadow: '#1c3e45' },
          { base: '#d4bfa8', light: '#fae8d4', shadow: '#6e5e4f' }
        ],
        fish: ['reef_blue', 'reef_gold', 'koi_white_gold']
      },
      midnight_lake: {
        deepBg: '#030812',
        surface: 'rgba(5, 12, 28, 0.92)',
        caustic: 'rgba(90, 180, 255, 0.40)',
        pebbles: [
          { base: '#121d2b', light: '#233752', shadow: '#070c14' },
          { base: '#1f3b4d', light: '#325e7a', shadow: '#0c1821' },
          { base: '#1e3833', light: '#315c54', shadow: '#0b1c19' }
        ],
        fish: ['midnight_glow', 'reef_blue']
      }
    };

    let pebbles = [];
    let fishList = [];
    let ripples = [];
    let pointers = new Map();

    function resize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      [uCvs, cCvs, dCvs].forEach(cvs => {
        cvs.width = w * dpr;
        cvs.height = h * dpr;
      });
      cCtx.clearRect(0, 0, w * dpr, h * dpr);
      initPebbles(w, h);
      initFish(w, h);
    }

    function initPebbles(w, h) {
      pebbles = [];
      const cfg = BIOMES[biome];
      const count = Math.floor((w * h) / 4800);
      for (let i = 0; i < count; i++) {
        const pal = cfg.pebbles[Math.floor(Math.random() * cfg.pebbles.length)];
        const rx = 14 + Math.random() * 32;
        const ry = rx * (0.65 + Math.random() * 0.45);
        pebbles.push({
          x: Math.random(),
          y: Math.random(),
          rx, ry,
          angle: Math.random() * Math.PI,
          base: pal.base, light: pal.light, shadow: pal.shadow
        });
      }
      pebbles.sort((a, b) => a.y - b.y);
    }

    function initFish(w, h) {
      fishList = [];
      const cfg = BIOMES[biome];
      for (let i = 0; i < 6; i++) {
        const type = cfg.fish[i % cfg.fish.length];
        const x = Math.random() * w;
        const y = Math.random() * h;
        const angle = Math.random() * Math.PI * 2;
        const spine = [];
        for (let s = 0; s < 10; s++) spine.push({ x, y });
        fishList.push({
          x, y, targetX: Math.random() * w, targetY: Math.random() * h,
          angle, speed: 1.2 + Math.random() * 0.8,
          size: 34 + Math.random() * 26,
          type, tailPhase: Math.random() * Math.PI * 2, spine
        });
      }
    }

    window.addEventListener('resize', resize);
    resize();

    function dropPebble(x, y) {
      const w = container.clientWidth;
      const h = container.clientHeight;
      const px = x !== undefined ? x : (0.25 + Math.random() * 0.5) * w;
      const py = y !== undefined ? y : (0.25 + Math.random() * 0.5) * h;

      ripples.push({ x: px * dpr, y: py * dpr, r: 10 * dpr, maxR: 160 * dpr, alpha: 0.9 });

      cCtx.save();
      const grad = cCtx.createRadialGradient(px * dpr, py * dpr, 0, px * dpr, py * dpr, 140 * dpr);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.6)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      cCtx.fillStyle = grad;
      cCtx.beginPath();
      cCtx.arc(px * dpr, py * dpr, 140 * dpr, 0, Math.PI * 2);
      cCtx.fill();
      cCtx.restore();

      fishList.forEach(f => {
        if (Math.hypot(px - f.x, py - f.y) < 350) {
          f.targetX = px + (Math.random() - 0.5) * 80;
          f.targetY = py + (Math.random() - 0.5) * 80;
          f.speed = 2.2;
        }
      });
    }

    container.addEventListener('pointerdown', e => {
      const r = container.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      pointers.set(e.pointerId, { x, y, px: x, py: y, down: true });
      dropPebble(x, y);
    });

    container.addEventListener('pointermove', e => {
      const r = container.getBoundingClientRect();
      const ptr = pointers.get(e.pointerId);
      if (ptr) {
        ptr.x = e.clientX - r.left;
        ptr.y = e.clientY - r.top;
      }
    });

    window.addEventListener('pointerup', e => pointers.delete(e.pointerId));
    window.addEventListener('pointercancel', e => pointers.delete(e.pointerId));

    let lastTime = performance.now();
    let time = 0;

    function loop(now) {
      const dt = Math.min((now - lastTime) * 0.001, 0.033);
      lastTime = now;
      time += dt;

      const w = container.clientWidth;
      const h = container.clientHeight;
      const dw = w * dpr, dh = h * dpr;
      const cfg = BIOMES[biome];

      // Draw onto clarity canvas from pointers
      pointers.forEach(ptr => {
        if (ptr.down) {
          const cx = ptr.x * dpr, cy = ptr.y * dpr;
          const px = ptr.px * dpr, py = ptr.py * dpr;
          const rad = brushSize * dpr;

          cCtx.save();
          const grad = cCtx.createRadialGradient(cx, cy, 0, cx, cy, rad);
          grad.addColorStop(0, 'rgba(255,255,255,0.75)');
          grad.addColorStop(0.5, 'rgba(255,255,255,0.4)');
          grad.addColorStop(1, 'rgba(255,255,255,0)');
          cCtx.fillStyle = grad;
          cCtx.beginPath();
          cCtx.arc(cx, cy, rad, 0, Math.PI * 2);
          cCtx.fill();

          if (Math.hypot(cx - px, cy - py) > 4) {
            cCtx.strokeStyle = 'rgba(255,255,255,0.35)';
            cCtx.lineWidth = rad * 1.1;
            cCtx.lineCap = 'round';
            cCtx.beginPath();
            cCtx.moveTo(px, py);
            cCtx.lineTo(cx, cy);
            cCtx.stroke();
          }
          cCtx.restore();

          ptr.px = ptr.x; ptr.py = ptr.y;
        }
      });

      // Two-Stage Veiling: Stage 1 (3s/5s/8s to opacity) + Stage 2 (+10s to complete dark)
      const isTouching = pointers.size > 0;
      if (isTouching) {
        idleTime = 0;
        darkFactor = Math.max(0, darkFactor - dt * 6.0);
      } else {
        idleTime += dt;
      }

      const stage1Duration = revealSpeed === 'slow' ? 8.0 : revealSpeed === 'medium' ? 5.0 : 3.0;
      const stage2Duration = 10.0;

      // Decay clarity mask to opacity
      const fadeAlpha = 1.0 - Math.pow(0.001, Math.min(dt, 0.05) / stage1Duration);
      cCtx.save();
      cCtx.globalCompositeOperation = 'destination-out';
      cCtx.fillStyle = 'rgba(0,0,0,' + fadeAlpha + ')';
      cCtx.fillRect(0, 0, dw, dh);
      cCtx.restore();

      // Dark veil factor
      if (idleTime >= stage1Duration) {
        const p = Math.min(1.0, (idleTime - stage1Duration) / stage2Duration);
        const ep = p * p * (3 - 2 * p);
        darkFactor = Math.min(1.0, darkFactor + (ep - darkFactor) * Math.min(dt * 3.5, 1.0));
      } else if (!isTouching) {
        darkFactor = Math.max(0, darkFactor - dt * 3.0);
      }

      // Update badge text
      const badge = document.getElementById('stage-badge');
      if (badge) {
        if (isTouching) {
          badge.textContent = 'Cleared (Viewing Depths)';
        } else if (idleTime < stage1Duration) {
          const rem = Math.max(0, stage1Duration - idleTime);
          badge.textContent = 'Stage 1: Veiling to Opacity (' + rem.toFixed(1) + 's / ' + stage1Duration + 's)';
        } else if (idleTime < stage1Duration + stage2Duration) {
          const rem = Math.max(0, stage1Duration + stage2Duration - idleTime);
          badge.textContent = 'Stage 2: Veiling to Dark (+' + rem.toFixed(1) + 's / +10s)';
        } else {
          badge.textContent = 'Deep Dark Stillness (Touch to clear)';
        }
      }

      // Render Underwater Canvas
      uCtx.save();
      uCtx.clearRect(0, 0, dw, dh);
      const bgG = uCtx.createLinearGradient(0, 0, 0, dh);
      bgG.addColorStop(0, cfg.deepBg);
      bgG.addColorStop(1, '#02060b');
      uCtx.fillStyle = bgG;
      uCtx.fillRect(0, 0, dw, dh);

      // Pebbles
      pebbles.forEach(p => {
        const px = p.x * dw, py = p.y * dh, rx = p.rx * dpr, ry = p.ry * dpr;
        uCtx.save();
        uCtx.translate(px, py);
        uCtx.rotate(p.angle);
        uCtx.fillStyle = 'rgba(0,0,0,0.4)';
        uCtx.beginPath();
        uCtx.ellipse(3 * dpr, 4 * dpr, rx * 1.05, ry * 1.05, 0, 0, Math.PI * 2);
        uCtx.fill();

        const sG = uCtx.createRadialGradient(-rx * 0.3, -ry * 0.35, rx * 0.1, 0, 0, rx);
        sG.addColorStop(0, p.light);
        sG.addColorStop(0.65, p.base);
        sG.addColorStop(1, p.shadow);
        uCtx.fillStyle = sG;
        uCtx.beginPath();
        uCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        uCtx.fill();
        uCtx.restore();
      });

      // Fish
      fishList.forEach(f => {
        if (Math.hypot(f.targetX - f.x, f.targetY - f.y) < 50 || Math.random() < 0.01) {
          f.targetX = 60 + Math.random() * (w - 120);
          f.targetY = 60 + Math.random() * (h - 120);
        }
        let diff = Math.atan2(f.targetY - f.y, f.targetX - f.x) - f.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        f.angle += diff * 0.045;
        f.x += Math.cos(f.angle) * f.speed;
        f.y += Math.sin(f.angle) * f.speed;
        f.tailPhase += f.speed * 0.18;

        if (f.x < -60) f.x = w + 60;
        if (f.x > w + 60) f.x = -60;
        if (f.y < -60) f.y = h + 60;
        if (f.y > h + 60) f.y = -60;

        const hx = f.x * dpr, hy = f.y * dpr, sz = f.size * dpr;
        uCtx.save();
        uCtx.translate(hx, hy);
        uCtx.rotate(f.angle);
        uCtx.fillStyle = f.type === 'koi_orange' ? '#ff7733' : f.type === 'reef_blue' ? '#1e88e5' : f.type === 'midnight_glow' ? '#00e5ff' : '#ffc107';
        uCtx.beginPath();
        uCtx.ellipse(0, 0, sz * 0.5, sz * 0.22, 0, 0, Math.PI * 2);
        uCtx.fill();
        uCtx.restore();
      });

      // Caustics
      uCtx.strokeStyle = cfg.caustic;
      uCtx.lineWidth = 1.4 * dpr;
      uCtx.globalCompositeOperation = 'screen';
      for (let cx = 0; cx < 6; cx++) {
        for (let cy = 0; cy < 6; cy++) {
          const x0 = cx * (dw / 6) + Math.sin(time * 1.4 + cy) * 15 * dpr;
          const y0 = cy * (dh / 6) + Math.cos(time * 1.2 + cx) * 15 * dpr;
          uCtx.beginPath();
          uCtx.arc(x0, y0, (dw / 6) * 0.35, 0, Math.PI * 2);
          uCtx.stroke();
        }
      }
      uCtx.restore();

      // Composite to Display Canvas
      dCtx.save();
      dCtx.clearRect(0, 0, dw, dh);
      dCtx.fillStyle = cfg.surface;
      dCtx.fillRect(0, 0, dw, dh);

      dCtx.globalCompositeOperation = 'destination-out';
      dCtx.drawImage(cCvs, 0, 0);

      dCtx.globalCompositeOperation = 'destination-over';
      dCtx.drawImage(uCvs, 0, 0);

      dCtx.globalCompositeOperation = 'source-over';
      for (let r = ripples.length - 1; r >= 0; r--) {
        const rip = ripples[r];
        rip.r += 60 * dt * dpr;
        rip.alpha -= 0.6 * dt;
        if (rip.alpha <= 0 || rip.r >= rip.maxR) {
          ripples.splice(r, 1);
          continue;
        }
        dCtx.strokeStyle = 'rgba(180,240,255,' + (rip.alpha * 0.75) + ')';
        dCtx.lineWidth = 2.5 * dpr;
        dCtx.beginPath();
        dCtx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
        dCtx.stroke();
      }

      // Stage 2 Dark Veil Overlay
      if (darkFactor > 0.001) {
        dCtx.save();
        dCtx.fillStyle = 'rgba(0, 2, 6, ' + (darkFactor * 0.99) + ')';
        dCtx.fillRect(0, 0, dw, dh);
        if (isTouching) {
          dCtx.globalCompositeOperation = 'destination-out';
          dCtx.drawImage(cCvs, 0, 0);
        }
        dCtx.restore();
      }
      dCtx.restore();

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    // UI Wireups
    document.querySelectorAll('#biome-group .btn').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('#biome-group .btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        biome = b.getAttribute('data-biome');
        initPebbles(container.clientWidth, container.clientHeight);
        initFish(container.clientWidth, container.clientHeight);
      });
    });

    document.getElementById('btn-drop').addEventListener('click', () => dropPebble());
    document.getElementById('btn-reveil').addEventListener('click', () => {
      cCtx.clearRect(0, 0, cCvs.width, cCvs.height);
      idleTime = stage1Duration;
    });
    const speedBtn = document.getElementById('btn-speed');
    speedBtn.addEventListener('click', () => {
      revealSpeed = revealSpeed === 'slow' ? 'medium' : revealSpeed === 'medium' ? 'fast' : 'slow';
      speedBtn.textContent = '1. Opacity: ' + (revealSpeed === 'slow' ? '8s' : revealSpeed === 'medium' ? '5s' : '3s');
    });
  })();
  </script>
</body>
</html>`;
}

export function generateOption4StandaloneHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Touch Grass - Tactile Meadow & Gentle Breeze Grounding</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    canvas { width: 100%; height: 100%; display: block; touch-action: none; cursor: grab; }
    canvas:active { cursor: grabbing; }
    .overlay {
      position: absolute; top: 24px; left: 50%; transform: translateX(-50%);
      display: flex; flex-direction: column; align-items: center; pointer-events: none; text-align: center;
      background: rgba(10, 15, 20, 0.75); backdrop-filter: blur(16px);
      padding: 8px 18px; border-radius: 20px; border: 1px solid rgba(74, 222, 128, 0.25);
    }
    .eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: #4ade80; }
    .subtitle { font-size: 12px; font-weight: 400; color: #e2e8f0; margin-top: 2px; }
    .controls {
      position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
      display: flex; gap: 8px; background: rgba(10, 15, 20, 0.85); backdrop-filter: blur(16px);
      padding: 6px 10px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1);
      flex-wrap: wrap; justify-content: center;
    }
    .btn {
      background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); color: #cbd5e1;
      padding: 6px 14px; border-radius: 12px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s;
    }
    .btn:hover { background: rgba(255, 255, 255, 0.12); color: #fff; }
    .btn.active { background: rgba(34, 197, 94, 0.25); color: #bbf7d0; border-color: rgba(74, 222, 128, 0.4); }
  </style>
</head>
<body>
  <canvas id="meadowCanvas"></canvas>
  <div class="overlay">
    <div class="eyebrow">Option 4: Touch Grass</div>
    <div class="subtitle">Drag fingers across the meadow to ground yourself &bull; Whisper Breeze</div>
  </div>
  <div class="controls">
    <button id="btnSeeds" class="btn active">Scatter Seeds &amp; Bloom</button>
    <button id="btnSpeed" class="btn">Breeze: Whisper</button>
    <button id="btnReset" class="btn">Reset Meadow</button>
  </div>

  <script>
  (function() {
    const canvas = document.getElementById('meadowCanvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width, height;
    let blades = [];
    let particles = [];
    let breezeLevel = 'whisper'; // still, whisper, gentle

    const pointers = new Map();

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.width = Math.floor(window.innerWidth * dpr);
      height = canvas.height = Math.floor(window.innerHeight * dpr);
      initMeadow();
    }

    function initMeadow() {
      blades = [];
      const count = Math.max(1200, Math.min(2600, Math.floor(width * 1.6)));
      for (let i = 0; i < count; i++) {
        const layerRand = Math.random();
        const layer = layerRand < 0.35 ? 0 : layerRand < 0.75 ? 1 : 2;
        const baseY = height * 0.72 + Math.random() * (height * 0.3);
        let h = height * (0.28 + Math.random() * 0.38);
        let w = 2.5 + Math.random() * 2.5;
        let root = '#1e4624', tip = '#43a047';

        if (layer === 0) { h *= 0.65; w *= 0.7; root = '#133519'; tip = '#276831'; }
        else if (layer === 2) { h *= 1.25; w *= 1.35; root = '#2e6b34'; tip = '#7cb342'; }

        const hasFlower = layer >= 1 && Math.random() < 0.05 ? 'dandelion' : null;

        blades.push({
          x: Math.random() * width,
          baseY: baseY,
          height: h,
          width: w,
          layer: layer,
          naturalAngle: (Math.random() - 0.48) * 0.35,
          currentAngle: 0,
          angularVel: 0,
          stiffness: 14.0 + Math.random() * 10.0,
          damping: 3.2 + Math.random() * 1.2,
          colorRoot: root,
          colorTip: tip,
          hasFlower: hasFlower,
          bloomScale: 1.0
        });
      }
      blades.sort((a, b) => a.layer !== b.layer ? a.layer - b.layer : a.baseY - b.baseY);
    }

    function spawnSeeds(x, y, count) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 25 + Math.random() * 70;
        particles.push({
          x: x + (Math.random() - 0.5) * 20,
          y: y + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed + 15,
          vy: Math.sin(angle) * speed - 15,
          size: 2.5 + Math.random() * 3.5,
          alpha: 0.7 + Math.random() * 0.3,
          rot: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 2.0,
          life: 0,
          maxLife: 6 + Math.random() * 8
        });
      }
    }

    function scatterSeedsFieldWide() {
      const origins = 12 + Math.floor(Math.random() * 6);
      for (let o = 0; o < origins; o++) {
        const ox = Math.random() * width;
        const oy = height * 0.55 + Math.random() * (height * 0.35);
        spawnSeeds(ox, oy, 4);
      }
      // Replant flowers on blades
      let planted = 0;
      for (let b of blades) {
        if (b.layer >= 1 && !b.hasFlower && Math.random() < 0.08 && planted < 16) {
          b.hasFlower = 'dandelion';
          b.bloomScale = 0.05;
          planted++;
        }
      }
    }

    window.addEventListener('resize', resize);
    resize();

    // Pointer listeners
    canvas.addEventListener('pointerdown', e => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const x = (e.clientX - rect.left) * dpr;
      const y = (e.clientY - rect.top) * dpr;
      pointers.set(e.pointerId, { x, y, px: x, py: y });
      spawnSeeds(x, y, 6);
    });

    canvas.addEventListener('pointermove', e => {
      const ptr = pointers.get(e.pointerId);
      if (!ptr) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      ptr.px = ptr.x; ptr.py = ptr.y;
      ptr.x = (e.clientX - rect.left) * dpr;
      ptr.y = (e.clientY - rect.top) * dpr;
      if (Math.random() < 0.22) spawnSeeds(ptr.x, ptr.y, 2);
    });

    const removePtr = e => pointers.delete(e.pointerId);
    canvas.addEventListener('pointerup', removePtr);
    canvas.addEventListener('pointercancel', removePtr);

    document.getElementById('btnSeeds').onclick = () => {
      scatterSeedsFieldWide();
    };

    document.getElementById('btnReset').onclick = () => {
      initMeadow();
    };

    const speedBtn = document.getElementById('btnSpeed');
    speedBtn.onclick = () => {
      breezeLevel = breezeLevel === 'whisper' ? 'gentle' : breezeLevel === 'gentle' ? 'still' : 'whisper';
      speedBtn.textContent = 'Breeze: ' + (breezeLevel === 'still' ? 'Still (Off)' : breezeLevel === 'whisper' ? 'Whisper' : 'Gentle');
    };

    let lastTime = performance.now();
    let simTime = 0;

    function render(now) {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      simTime += dt;

      const isStill = breezeLevel === 'still';
      const bSpeed = isStill ? 0 : breezeLevel === 'whisper' ? 0.45 : 0.95;
      const bAmp = isStill ? 0 : breezeLevel === 'whisper' ? 0.12 : 0.26;

      // Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#3b82f6');
      skyGrad.addColorStop(0.55, '#93c5fd');
      skyGrad.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Blades
      const ptrList = Array.from(pointers.values());
      for (let i = 0; i < blades.length; i++) {
        const b = blades[i];

        if (b.bloomScale < 1.0) {
          b.bloomScale = Math.min(1.0, b.bloomScale + dt * 1.8);
        }

        let targetAngle = b.naturalAngle;
        if (!isStill) {
          const w1 = Math.sin(b.x * 0.0035 - simTime * bSpeed * 1.8 + b.layer * 0.8);
          const w2 = Math.cos(b.x * 0.008 + simTime * bSpeed * 2.5);
          targetAngle += (w1 * 0.65 + w2 * 0.25) * bAmp * (0.6 + b.layer * 0.4);
        }

        for (let p = 0; p < ptrList.length; p++) {
          const ptr = ptrList[p];
          const tipX = b.x + Math.sin(b.currentAngle) * b.height;
          const tipY = b.baseY - Math.cos(b.currentAngle) * b.height;
          const dx = tipX - ptr.x, dy = tipY - ptr.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const touchR = 100 * (window.devicePixelRatio || 1);
          if (dist < touchR) {
            const pushDir = dx >= 0 ? 1 : -1;
            targetAngle += pushDir * (1 - dist / touchR) * 1.1 + (ptr.x - ptr.px) * 0.015;
          }
        }

        const spring = (targetAngle - b.currentAngle) * b.stiffness;
        const damp = -b.angularVel * b.damping;
        b.angularVel += (spring + damp) * dt;
        b.currentAngle += b.angularVel * dt;

        const tipX = b.x + Math.sin(b.currentAngle) * b.height;
        const tipY = b.baseY - Math.cos(b.currentAngle) * b.height;
        const cpX = b.x + Math.sin(b.currentAngle * 0.5) * (b.height * 0.55);
        const cpY = b.baseY - b.height * 0.55;

        const grad = ctx.createLinearGradient(b.x, b.baseY, tipX, tipY);
        grad.addColorStop(0, b.colorRoot);
        grad.addColorStop(1, b.colorTip);
        ctx.strokeStyle = grad;
        ctx.lineWidth = b.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(b.x, b.baseY);
        ctx.quadraticCurveTo(cpX, cpY, tipX, tipY);
        ctx.stroke();

        // Draw flowers
        if (b.hasFlower) {
          const fSize = 10 * (b.bloomScale || 1);
          if (fSize > 0.5) {
            ctx.save();
            ctx.translate(tipX, tipY);
            ctx.rotate(b.currentAngle);
            ctx.fillStyle = '#fbbf24';
            for (let d = 0; d < 12; d++) {
              ctx.beginPath();
              ctx.rotate((Math.PI * 2) / 12);
              ctx.ellipse(0, fSize * 0.45, fSize * 0.15, fSize * 0.35, 0, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.fillStyle = '#d97706';
            ctx.beginPath();
            ctx.arc(0, 0, fSize * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      }

      // Particles
      for (let p = particles.length - 1; p >= 0; p--) {
        const pt = particles[p];
        pt.life += dt;
        if (pt.life >= pt.maxLife) {
          particles.splice(p, 1);
          continue;
        }
        const windX = isStill ? 0 : pt.vx * bSpeed;
        pt.x += (windX + Math.sin(simTime * 0.8 + pt.y * 0.01) * 8) * dt;
        pt.y += (pt.vy + Math.cos(simTime * 1.2 + pt.x * 0.01) * 6) * dt;
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.globalAlpha = Math.sin((pt.life / pt.maxLife) * Math.PI) * pt.alpha;
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, pt.size * 2);
        ctx.stroke();
        ctx.restore();
      }

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  })();
  </script>
</body>
</html>`;
}
