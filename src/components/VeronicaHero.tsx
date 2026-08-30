import { useEffect, useRef } from "react";

// Coordenadas UV (0–1, origem no canto superior esquerdo, mesmo espaço de
// `st` no shader abaixo) do centro de cada "olho" em
// /videos/veronica-cyborg-hero.mp4, medidas visualmente num frame do vídeo
// em resolução nativa (1920×1080 — enquadramento fixo o loop inteiro,
// testado em 11 timestamps diferentes). Se o rastreio parecer desalinhado
// ao testar, ajuste só estes números — não mexa na lógica do shader.
const LEFT_EYE_UV: [number, number] = [0.3125, 0.033]; // olho humano (esquerda da imagem)
const RIGHT_EYE_UV: [number, number] = [0.656, 0.051]; // lente robótica na altura do olho (o outro conjunto de engrenagens, mais abaixo, é bochecha/mandíbula — não é "olho")
const EYE_MOVEMENT_RADIUS = 0.0016; // deslocamento máximo da pupila (fração da imagem) — só no olho humano, ver nota abaixo
const EYE_EFFECT_RADIUS = 0.02; // raio da zona de influência ao redor de cada olho
// Ponto da imagem que fica alinhado ao centro da tela — ajuste só este ponto
// pra reenquadrar sem tocar no resto do shader; Y menor sobe o rosto em
// relação ao centro da tela.
const FRAME_CENTER_UV: [number, number] = [0.48, 0.16];
// Fator de zoom do crop (ver uso de `c *= FRAME_CROP` abaixo).
const FRAME_CROP = 1.15;

const VERT = `
attribute vec2 p;
varying vec2 uv;
void main(){ uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
varying vec2 uv;
uniform sampler2D tex;
uniform vec2 mouse;
uniform vec2 res;
uniform vec2 leftEye;
uniform vec2 rightEye;
uniform float eyeRadius;
uniform float eyeEffectRadius;
uniform vec2 frameCenter;
uniform float frameCrop;
uniform float time;

void main(){
  vec2 st = uv;
  st.y = 1.0 - st.y;

  // corrige aspecto (vídeo 16:9 num canvas que normalmente é bem mais alto
  // que largo, já que a section cresce com o conteúdo abaixo) recortando ao
  // redor de frameCenter em vez do centro geométrico do vídeo — é isso que
  // preenche o retângulo inteiro do canvas sem nunca deixar barra vazia
  // (diferente de object-contain em CSS, que faz letterbox quando o
  // container não bate com a proporção do vídeo).
  float ar = res.x / res.y;
  vec2 c = st - frameCenter;
  if (ar > 1.0) { c.y *= 1.0 / ar; } else { c.x *= ar; }
  c *= frameCrop;
  st = c + frameCenter;

  // rastreio de pupila — só no olho humano (esquerda). A "lente" robótica é
  // vidro/metal rígido: deslocar a amostra de textura ali faz a geometria da
  // engrenagem parecer quebrada/deformada, então ela ganha só o glow aditivo
  // abaixo (que não desloca pixel nenhum, seguro em qualquer superfície).
  vec2 gaze = (mouse - 0.5) * 2.0 * eyeRadius;
  float dL = distance(st, leftEye);
  float dR = distance(st, rightEye);
  float wL = 1.0 - smoothstep(0.0, eyeEffectRadius, dL);
  float wR = 1.0 - smoothstep(0.0, eyeEffectRadius, dR);
  vec2 suv = st + gaze * wL;

  // base um pouco mais discreta pra dar contraste ao brilho da pupila — sem
  // isso o glow se perdia no resto do rosto na mesma intensidade.
  vec3 col = texture2D(tex, suv).rgb * 1.3;

  // destaque "tecnologia macabra" nos dois olhos: brilho ciano/verde
  // pulsante + anel fino, tipo mira/scanner — puramente aditivo (soma cor,
  // não desloca textura), por isso funciona igual bem no olho humano e na
  // lente mecânica.
  vec3 eyeColor = vec3(0.22, 0.95, 0.68);
  float pulse = 0.6 + 0.4 * sin(time * 1.4);
  float glow = wL + wR;
  col += eyeColor * glow * glow * 0.55 * pulse;

  float ringL = smoothstep(eyeEffectRadius * 0.48, eyeEffectRadius * 0.56, dL) - smoothstep(eyeEffectRadius * 0.56, eyeEffectRadius * 0.68, dL);
  float ringR = smoothstep(eyeEffectRadius * 0.48, eyeEffectRadius * 0.56, dR) - smoothstep(eyeEffectRadius * 0.56, eyeEffectRadius * 0.68, dR);
  col += eyeColor * (ringL + ringR) * (0.5 + 0.5 * pulse);

  // vinheta — contraste dramático pros olhos se destacarem
  float v = 1.0 - length((st - 0.5) * vec2(1.15, 1.05));
  col *= smoothstep(-0.1, 0.6, v);

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

// Hero da home — a cyborg (rosto humano/robótico) renderizada num canvas
// WebGL que usa o VÍDEO em loop como textura (atualizada a cada frame), com
// o mesmo truque de recorte-por-shader que a versão anterior usava pra uma
// imagem estática — isso é o que garante que o canvas preenche 100% do
// retângulo do hero sem nunca deixar espaço vazio, não importa quão alta a
// section fique com o conteúdo abaixo. Câmera do vídeo é fixa (mesmo
// enquadramento do início ao fim do loop) — os únicos movimentos são os
// próprios do material (gotas escorrendo, piscar natural) mais o rastreio
// de pupila do olho humano, reativo ao mouse, adicionado aqui.
export function VeronicaHero() {
  const ref = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const video = videoRef.current;
    if (!cv || !video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Mobile skips o canvas WebGL inteiro (pesado pra tela pequena/touch —
    // não tem mouse pra rastrear mesmo) em favor do poster estático via CSS
    // renderizado abaixo (`hidden md:block` / `motion-reduce:md:block`).
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
    const uMouse = gl.getUniformLocation(prog, "mouse");
    const uRes = gl.getUniformLocation(prog, "res");
    const uTime = gl.getUniformLocation(prog, "time");

    gl.uniform2f(gl.getUniformLocation(prog, "leftEye"), LEFT_EYE_UV[0], LEFT_EYE_UV[1]);
    gl.uniform2f(gl.getUniformLocation(prog, "rightEye"), RIGHT_EYE_UV[0], RIGHT_EYE_UV[1]);
    gl.uniform1f(gl.getUniformLocation(prog, "eyeRadius"), EYE_MOVEMENT_RADIUS);
    gl.uniform1f(gl.getUniformLocation(prog, "eyeEffectRadius"), EYE_EFFECT_RADIUS);
    gl.uniform2f(
      gl.getUniformLocation(prog, "frameCenter"),
      FRAME_CENTER_UV[0],
      FRAME_CENTER_UV[1],
    );
    gl.uniform1f(gl.getUniformLocation(prog, "frameCrop"), FRAME_CROP);

    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
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
    gl.uniform1i(uTex, 0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);

    // <source> como filho de <video> nem sempre dispara a seleção de recurso
    // sozinho numa árvore montada pelo React — load() força o browser a
    // (re)rodar o algoritmo, senão o vídeo fica parado em readyState 0.
    video.load();
    video.play().catch(() => {});

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
    // A janela não é o único jeito da hero mudar de tamanho: conteúdo que
    // cresce por cima dela (ex.: o boot de texto digitando linha a linha)
    // também estica a section — sem isso o canvas ficava com a resolução
    // interna desatualizada. ResizeObserver cobre qualquer mudança de
    // tamanho, não só a da janela.
    const ro = new ResizeObserver(resize);
    ro.observe(cv);

    let raf = 0;
    const start = performance.now();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      mouse.x += (target.x - mouse.x) * 0.05;
      mouse.y += (target.y - mouse.y) * 0.05;
      const elapsed = (performance.now() - start) / 1000;

      // Atualiza a textura com o frame atual do vídeo (não só uma vez —
      // todo frame, é isso que anima gotas/piscar através do shader).
      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      }

      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform2f(uRes, cv.width, cv.height);
      gl.uniform1f(uTime, elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
      ro.disconnect();
    };
  }, []);

  return (
    <>
      {/* Fonte da textura — invisível (1x1 opacidade), só existe pra decodificar
          frames que o WebGL lê via texImage2D. display:none pausaria o decode
          em alguns engines, por isso opacity+tamanho mínimo em vez disso. */}
      <video
        ref={videoRef}
        aria-hidden
        autoPlay
        loop
        muted
        playsInline
        className="pointer-events-none absolute h-px w-px opacity-0"
        style={{ left: -9999 }}
      >
        <source src="/videos/veronica-cyborg-hero.mp4" type="video/mp4" />
      </video>
      <canvas
        ref={ref}
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden h-full w-full md:block motion-reduce:md:hidden"
        style={{ mixBlendMode: "screen", opacity: 0.85 }}
      />
      {/* Fallback estático: mobile sempre, e desktop quando prefers-reduced-motion
          está ativo — poster do vídeo, sem canvas, sem WebGL, sem rastreio.
          bg-contain garante o rosto inteiro sempre visível, não importa a
          proporção da hero nesse viewport. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 block bg-contain bg-center bg-no-repeat opacity-[0.42] md:hidden motion-reduce:md:block"
        style={{
          backgroundImage: "url(/images/home/veronica-cyborg-hero-poster.webp)",
          filter: "contrast(1.08) saturate(0.85) brightness(0.95)",
          mixBlendMode: "screen",
        }}
      />
    </>
  );
}
