import { useEffect, useRef } from "react";

// Backdrop vivo da hero: o loop de vídeo da Veronica (piscada lenta e gotas
// vêm gravadas no arquivo, geradas no Veo) entra como textura de WebGL, e o
// shader por cima acrescenta o único movimento reativo — a pupila
// acompanhando o cursor. Vídeo sozinho não reage ao mouse; shader sozinho não
// pisca. Juntos, sim.
// Duas fontes: WebM/VP9 primeiro (menor em navegadores que aceitam), MP4/H.264
// como garantia universal — Safari e qualquer build de Chromium sem codecs
// proprietários dependem de um dos dois estar presente.
const VIDEO_WEBM = "/videos/veronica-hero-loop.webm";
const VIDEO_MP4 = "/videos/veronica-hero-loop.mp4";
const POSTER_SRC = "/images/home/veronica-hero-poster.webp";

// Coordenadas UV (0–1, origem no canto superior esquerdo) do centro de cada
// pupila DENTRO do vídeo — medidas na grade sobre o primeiro quadro de
// veronica-hero-loop.mp4 (1152×640). O clipe é estabilizado quadro a quadro
// justamente pra estes dois pontos valerem do começo ao fim; se um dia o
// vídeo for trocado, remeça e ajuste só estes números.
const LEFT_EYE_UV: [number, number] = [0.285, 0.265]; // olho humano (esquerda do quadro)
const RIGHT_EYE_UV: [number, number] = [0.735, 0.255]; // olho com lente/tech (direita do quadro)
// Deslocamento máximo da pupila, em fração da textura. Pequeno de propósito:
// o efeito tem que dar a sensação de estar sendo observado, não de olho solto.
const EYE_MOVEMENT_RADIUS = 0.014;
// Raio da zona de influência ao redor de cada olho. Menor que o da versão
// anterior porque neste enquadramento os olhos ocupam menos do quadro.
const EYE_EFFECT_RADIUS = 0.042;
// Proporção nativa do vídeo — usada pelo enquadramento no shader.
const VIDEO_ASPECT = 1152 / 640;
// Enquadramento. O vídeo é um close macro (olhos e nariz enchem o quadro), e
// "cover" numa faixa larga como a hero ampliava tanto que o rosto virava
// abstração e o olho humano sumia atrás do título. Em vez disso: encaixa pela
// ALTURA (o rosto inteiro do clipe aparece) e desloca pra direita, deixando a
// coluna da esquerda livre pro texto. Valores maiores de FRAME_ZOOM afastam a
// câmera; FRAME_OFFSET_X negativo empurra o rosto pra direita.
const FRAME_ZOOM = 1.7;
const FRAME_OFFSET_X = -0.2;
const FRAME_OFFSET_Y = 0.02;

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
uniform float videoAspect;
uniform float frameZoom;
uniform vec2 frameOffset;
uniform float time;

void main(){
  vec2 st = uv;
  st.y = 1.0 - st.y;

  // enquadramento: encaixa pela altura e desloca lateralmente. O que cai fora
  // da textura é cortado pelo fade de borda lá embaixo, então vira
  // transparência limpa em vez de pixel esticado.
  float canvasAspect = res.x / res.y;
  vec2 scale = vec2(canvasAspect / videoAspect, 1.0) * frameZoom;
  st = (st - 0.5) * scale + 0.5 + frameOffset;

  // rastreio de pupila — ÚNICO movimento reativo ao mouse (a piscada e as
  // gotas já vêm no vídeo). Desloca a amostra só perto de cada olho, com
  // falloff suave pra não criar costura visível na pele em volta.
  vec2 gaze = (mouse - 0.5) * 2.0 * eyeRadius;
  float dL = distance(st, leftEye);
  float dR = distance(st, rightEye);
  float wL = 1.0 - smoothstep(0.0, eyeEffectRadius, dL);
  float wR = 1.0 - smoothstep(0.0, eyeEffectRadius, dR);
  vec2 suv = st + gaze * wL + gaze * wR;

  vec3 col = texture2D(tex, suv).rgb * 1.15;

  // brilho ciano/verde pulsante nos olhos — o vídeo já é escuro, então isto
  // só reforça o ponto pra onde o olhar do usuário deve ir.
  vec3 eyeColor = vec3(0.22, 0.95, 0.68);
  float pulse = 0.6 + 0.4 * sin(time * 1.4);
  float glow = wL + wR;
  col += eyeColor * glow * glow * 0.28 * pulse;

  // vinheta — contraste dramático e some com as bordas do recorte
  float v = 1.0 - length((st - 0.5) * vec2(1.15, 1.05));
  col *= smoothstep(-0.1, 0.6, v);

  // grão sutil, evita banding nas áreas escuras
  float n = fract(sin(dot(st * res, vec2(12.9898, 78.233))) * 43758.5453);
  col += (n - 0.5) * 0.016;

  // fade nas bordas pra fundir com o fundo da seção. Faixas largas de
  // propósito: o clipe é menor que a hero, e sem um esfumaçado generoso dava
  // pra ver o retângulo do vídeo recortado sobre o fundo escuro.
  float edge = smoothstep(0.0, 0.30, st.x) * smoothstep(1.0, 0.70, st.x)
             * smoothstep(0.0, 0.22, st.y) * smoothstep(1.0, 0.72, st.y);

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
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const video = videoRef.current;
    if (!cv || !video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Mobile pula o canvas e o vídeo por completo (decodificar vídeo em tela
    // pequena custa bateria e não há mouse pra rastrear) — fica só o pôster
    // estático renderizado abaixo via CSS.
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

    const uMouse = gl.getUniformLocation(prog, "mouse");
    const uRes = gl.getUniformLocation(prog, "res");
    const uTime = gl.getUniformLocation(prog, "time");

    gl.uniform1i(gl.getUniformLocation(prog, "tex"), 0);
    gl.uniform2f(gl.getUniformLocation(prog, "leftEye"), LEFT_EYE_UV[0], LEFT_EYE_UV[1]);
    gl.uniform2f(gl.getUniformLocation(prog, "rightEye"), RIGHT_EYE_UV[0], RIGHT_EYE_UV[1]);
    gl.uniform1f(gl.getUniformLocation(prog, "eyeRadius"), EYE_MOVEMENT_RADIUS);
    gl.uniform1f(gl.getUniformLocation(prog, "eyeEffectRadius"), EYE_EFFECT_RADIUS);
    gl.uniform1f(gl.getUniformLocation(prog, "videoAspect"), VIDEO_ASPECT);
    gl.uniform1f(gl.getUniformLocation(prog, "frameZoom"), FRAME_ZOOM);
    gl.uniform2f(gl.getUniformLocation(prog, "frameOffset"), FRAME_OFFSET_X, FRAME_OFFSET_Y);

    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // 1×1 transparente enquanto o primeiro quadro do vídeo não chega
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);

    // autoplay só vinga com muted+playsInline; se o navegador recusar mesmo
    // assim (modo de economia de bateria, por ex.), o canvas fica vazio e o
    // pôster estático continua visível atrás — degrada sem quebrar.
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
    // também estica a section.
    const ro = new ResizeObserver(resize);
    ro.observe(cv);

    // Fora da tela, não adianta decodificar vídeo nem desenhar: pausa tudo.
    let visible = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0 },
    );
    io.observe(cv);

    let raf = 0;
    const start = performance.now();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      if (video.readyState < 2) return;

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);

      mouse.x += (target.x - mouse.x) * 0.05;
      mouse.y += (target.y - mouse.y) * 0.05;

      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform2f(uRes, cv.width, cv.height);
      gl.uniform1f(uTime, (performance.now() - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
      ro.disconnect();
      io.disconnect();
      video.pause();
    };
  }, []);

  return (
    <>
      {/* O <video> nunca aparece na página: serve só de fonte de textura pro
          canvas. Fica com tamanho 1px e invisível em vez de display:none
          porque alguns navegadores não decodificam vídeo escondido. */}
      <video
        ref={videoRef}
        aria-hidden
        muted
        loop
        playsInline
        preload="auto"
        poster={POSTER_SRC}
        className="pointer-events-none absolute h-px w-px opacity-0"
        tabIndex={-1}
      >
        <source src={VIDEO_WEBM} type="video/webm" />
        <source src={VIDEO_MP4} type="video/mp4" />
      </video>

      <canvas
        ref={ref}
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden h-full w-full md:block motion-reduce:md:hidden"
        style={{ mixBlendMode: "screen", opacity: 0.75 }}
      />

      {/* Fallback estático: mobile sempre, e desktop com prefers-reduced-motion
          — mesmo primeiro quadro do vídeo, sem decodificação, sem rastreio. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 block bg-cover bg-center bg-no-repeat opacity-[0.42] md:hidden motion-reduce:md:block"
        style={{
          backgroundImage: `url(${POSTER_SRC})`,
          filter: "contrast(1.08) saturate(0.85) brightness(0.95)",
          mixBlendMode: "screen",
        }}
      />
    </>
  );
}
