import { useEffect, useRef, useState } from "react";

const VERT = `
attribute vec2 p;
varying vec2 uv;
void main(){ uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
varying vec2 uv;
uniform sampler2D tex;
uniform sampler2D depth;
uniform vec2 mouse;
uniform float time;
uniform vec2 res;

void main(){
  vec2 st = uv;
  st.y = 1.0 - st.y;

  // corrige aspecto (imagem quadrada em tela larga)
  float ar = res.x / res.y;
  vec2 c = st - 0.5;
  if (ar > 1.0) { c.y *= 1.0 / ar; } else { c.x *= ar; }
  c *= 0.92;
  st = c + 0.5;

  float d = texture2D(depth, st).r;

  // parallax por profundidade
  vec2 off = (mouse - 0.5) * (d - 0.45) * 0.075;
  vec2 suv = st + off;

  // aberracao cromatica proporcional a profundidade
  float ab = 0.0022 + d * 0.0042;
  float r = texture2D(tex, suv + vec2(ab, 0.0)).r;
  float g = texture2D(tex, suv).g;
  float b = texture2D(tex, suv - vec2(ab, 0.0)).b;
  vec3 col = vec3(r, g, b);

  // pulso holografico nos circuitos (realca ciano/verde)
  float neon = smoothstep(0.34, 0.72, max(col.g, col.b) - col.r * 0.55);
  float pulse = 0.5 + 0.5 * sin(time * 1.7 + d * 9.0);
  col += neon * pulse * vec3(0.06, 0.34, 0.26);

  // scanlines
  float sl = sin(st.y * res.y * 1.05) * 0.5 + 0.5;
  col *= 1.0 - sl * 0.055;

  // linha de varredura descendo
  float sweep = smoothstep(0.018, 0.0, abs(fract(time * 0.085) - st.y));
  col += sweep * vec3(0.10, 0.42, 0.34);

  // vinheta
  float v = 1.0 - length((st - 0.5) * vec2(1.15, 1.05));
  col *= smoothstep(-0.05, 0.62, v);

  // grao sutil
  float n = fract(sin(dot(st * res + time, vec2(12.9898, 78.233))) * 43758.5453);
  col += (n - 0.5) * 0.022;

  // fade nas bordas para fundir com o fundo
  float edge = smoothstep(0.0, 0.16, st.x) * smoothstep(1.0, 0.84, st.x)
             * smoothstep(0.0, 0.10, st.y) * smoothstep(1.0, 0.80, st.y);

  gl_FragColor = vec4(col, edge * 0.92);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

const HOLO_GREEN = "oklch(0.85 0.22 155)";
const HOLO_CYAN = "oklch(0.88 0.15 195)";

// Small fixed holographic emblem — energy core + two tilted rings. Pure SVG,
// animated with SMIL (rotation/pulse) + one lightweight CSS float on the
// wrapper. No canvas, no WebGL: cheap enough to run on every device, visible
// in both the mobile flat background and the desktop WebGL parallax above.
function HoloBadge() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-5 top-5 animate-holo-badge-float sm:right-8 sm:top-8"
      style={{ width: 110, height: 110 }}
    >
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full"
        style={{ filter: "drop-shadow(0 0 10px oklch(0.85 0.22 155 / 0.35))" }}
      >
        <ellipse
          cx="50"
          cy="50"
          rx="42"
          ry="14"
          fill="none"
          stroke={HOLO_CYAN}
          strokeWidth="1.1"
          opacity="0.5"
          transform="rotate(-16 50 50)"
        >
          {!reduced && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="-16 50 50"
              to="344 50 50"
              dur="14s"
              repeatCount="indefinite"
            />
          )}
        </ellipse>
        <ellipse
          cx="50"
          cy="50"
          rx="33"
          ry="10"
          fill="none"
          stroke={HOLO_GREEN}
          strokeWidth="1"
          opacity="0.65"
          transform="rotate(20 50 50)"
        >
          {!reduced && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="20 50 50"
              to="-340 50 50"
              dur="10s"
              repeatCount="indefinite"
            />
          )}
        </ellipse>
        <polygon
          points="50,31 63,40.5 63,59.5 50,69 37,59.5 37,40.5"
          fill={HOLO_GREEN}
          fillOpacity="0.12"
          stroke={HOLO_GREEN}
          strokeWidth="1.3"
        />
        <circle cx="50" cy="50" r="3.4" fill={HOLO_CYAN}>
          {!reduced && (
            <animate attributeName="opacity" values="1;0.3;1" dur="2.4s" repeatCount="indefinite" />
          )}
        </circle>
      </svg>
    </div>
  );
}

export function VeronicaHero() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Mobile skips the WebGL parallax canvas entirely (heavy for small screens/
    // touch — there's no mouse to parallax against anyway) in favor of a flat
    // gradient background, rendered below via CSS (`hidden md:block`).
    if (window.matchMedia("(max-width: 767px)").matches) return;

    const gl = cv.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: false });
    if (!gl) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const uTex = gl.getUniformLocation(prog, "tex");
    const uDepth = gl.getUniformLocation(prog, "depth");
    const uMouse = gl.getUniformLocation(prog, "mouse");
    const uTime = gl.getUniformLocation(prog, "time");
    const uRes = gl.getUniformLocation(prog, "res");

    const mkTex = (unit: number) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([0, 0, 0, 0]),
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return t;
    };

    const t0 = mkTex(0),
      t1 = mkTex(1);
    gl.uniform1i(uTex, 0);
    gl.uniform1i(uDepth, 1);

    let ready = 0;
    const load = (src: string, tex: WebGLTexture | null, unit: number) => {
      const img = new Image();
      img.onload = () => {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        ready++;
      };
      img.src = src;
    };

    const small = window.innerWidth < 900;
    load(small ? "/veronica-hero-sm.webp" : "/veronica-hero.webp", t0, 0);
    load("/veronica-depth.webp", t1, 1);

    const mouse = { x: 0.5, y: 0.5 };
    const target = { x: 0.5, y: 0.5 };
    const onMove = (e: MouseEvent) => {
      target.x = e.clientX / window.innerWidth;
      target.y = e.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      const r = cv.getBoundingClientRect();
      cv.width = Math.floor(r.width * dpr);
      cv.height = Math.floor(r.height * dpr);
      gl.viewport(0, 0, cv.width, cv.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const start = performance.now();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (ready < 2) return;
      mouse.x += (target.x - mouse.x) * 0.05;
      mouse.y += (target.y - mouse.y) * 0.05;
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uTime, (performance.now() - start) / 1000);
      gl.uniform2f(uRes, cv.width, cv.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      <canvas
        ref={ref}
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden h-full w-full md:block"
        style={{ mixBlendMode: "screen", opacity: 0.9 }}
      />
      {/* Mobile stand-in: flat, cheap gradient — same tone already used for the
          site's base background (see body rule in styles.css), no WebGL, no texture. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 md:hidden"
        style={{
          background:
            "radial-gradient(ellipse at top, oklch(0.22 0.05 180 / 0.25), transparent 60%), linear-gradient(180deg, oklch(0.17 0.02 200) 0%, oklch(0.13 0.015 200) 100%)",
        }}
      />
      <HoloBadge />
    </>
  );
}
