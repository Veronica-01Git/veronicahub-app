import { useEffect, useRef } from "react";

// Coordenadas UV (0–1, origem no canto superior esquerdo, mesmo espaço de
// `st` no shader abaixo) do centro de cada pupila em /public/veronica-hero.webp,
// medidas visualmente na imagem-fonte (1200×1200). Se o rastreio parecer
// desalinhado ao testar, ajuste só estes números — não mexa na lógica do
// shader.
const LEFT_EYE_UV: [number, number] = [0.32, 0.27];
const RIGHT_EYE_UV: [number, number] = [0.72, 0.28];
const EYE_MOVEMENT_RADIUS = 0.012; // deslocamento máximo da pupila (fração da imagem) — pequeno de propósito
const EYE_EFFECT_RADIUS = 0.032; // raio da zona de influência ao redor de cada olho (falloff suave)

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
uniform vec2 res;
uniform vec2 leftEye;
uniform vec2 rightEye;
uniform float eyeRadius;
uniform float eyeEffectRadius;

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

  // parallax geral por profundidade — move a cena inteira
  vec2 off = (mouse - 0.5) * (d - 0.45) * 0.075;
  vec2 suv = st + off;

  // rastreio de pupila — camada local ADICIONAL, só perto de cada olho.
  // Desloca a amostra de textura dentro de um raio pequeno (eyeRadius),
  // com falloff suave (eyeEffectRadius) pra não criar costura visível.
  vec2 gaze = (mouse - 0.5) * 2.0 * eyeRadius;
  float wL = 1.0 - smoothstep(0.0, eyeEffectRadius, distance(st, leftEye));
  float wR = 1.0 - smoothstep(0.0, eyeEffectRadius, distance(st, rightEye));
  suv += gaze * wL + gaze * wR;

  vec3 col = texture2D(tex, suv).rgb;

  // vinheta discreta
  float v = 1.0 - length((st - 0.5) * vec2(1.15, 1.05));
  col *= smoothstep(-0.05, 0.62, v);

  // grao sutil, evita banding
  float n = fract(sin(dot(st * res, vec2(12.9898, 78.233))) * 43758.5453);
  col += (n - 0.5) * 0.016;

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

export function VeronicaHero() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Mobile skips the WebGL canvas entirely (heavy for small screens/touch —
    // there's no mouse to track anyway) in favor of the flat static image
    // rendered below via CSS (`hidden md:block` / `motion-reduce:md:block`).
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
    const uRes = gl.getUniformLocation(prog, "res");

    // Constantes de calibração dos olhos — declaradas uma vez, fora do loop.
    gl.uniform2f(gl.getUniformLocation(prog, "leftEye"), LEFT_EYE_UV[0], LEFT_EYE_UV[1]);
    gl.uniform2f(gl.getUniformLocation(prog, "rightEye"), RIGHT_EYE_UV[0], RIGHT_EYE_UV[1]);
    gl.uniform1f(gl.getUniformLocation(prog, "eyeRadius"), EYE_MOVEMENT_RADIUS);
    gl.uniform1f(gl.getUniformLocation(prog, "eyeEffectRadius"), EYE_EFFECT_RADIUS);

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

    // Mesmo padrão de smoothing (lerp) já usado pro parallax geral —
    // reaproveitado como está pro rastreio de pupila, sem novo estado.
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
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (ready < 2) return;
      mouse.x += (target.x - mouse.x) * 0.05;
      mouse.y += (target.y - mouse.y) * 0.05;
      gl.uniform2f(uMouse, mouse.x, mouse.y);
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
        className="pointer-events-none absolute inset-0 hidden h-full w-full md:block motion-reduce:md:hidden"
        style={{ mixBlendMode: "screen", opacity: 0.75 }}
      />
      {/* Fallback estático: mobile sempre, e desktop quando prefers-reduced-motion
          está ativo — mesma imagem, sem canvas, sem parallax, sem rastreio. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 block bg-cover bg-no-repeat opacity-[0.42] bg-[position:50%_18%] md:hidden motion-reduce:md:block motion-reduce:md:bg-[position:46%_24%]"
        style={{
          backgroundImage: "url(/veronica-hero-sm.webp)",
          filter: "contrast(1.08) saturate(0.85) brightness(0.95)",
          mixBlendMode: "screen",
        }}
      />
    </>
  );
}
