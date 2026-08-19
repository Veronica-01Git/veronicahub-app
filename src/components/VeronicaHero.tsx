import { useEffect, useRef } from "react";

// Coordenadas UV (0–1, origem no canto superior esquerdo, mesmo espaço de
// `st` no shader abaixo) do centro de cada pupila em
// /images/home/veronica-cyborg-face.webp, medidas visualmente na
// imagem-fonte (1000×1792 — close-up bem mais apertado que o hero antigo,
// rosto ocupa quase o quadro inteiro). Se o rastreio parecer desalinhado ao
// testar, ajuste só estes números — não mexa na lógica do shader.
const LEFT_EYE_UV: [number, number] = [0.215, 0.365]; // olho humano (esquerda da imagem)
const RIGHT_EYE_UV: [number, number] = [0.795, 0.35]; // olho robótico/lente (direita da imagem)
const EYE_MOVEMENT_RADIUS = 0.018; // deslocamento máximo da pupila (fração da imagem) — pequeno de propósito
const EYE_EFFECT_RADIUS = 0.052; // raio da zona de influência ao redor de cada olho — maior que antes porque esse rosto ocupa muito mais do quadro
// Ponto da imagem que fica alinhado ao centro da tela (o crop, por padrão,
// centraliza no meio geométrico da imagem — 0.5,0.5 — que fica bem acima
// dos olhos). Ajuste só este ponto pra reenquadrar sem tocar no resto do
// shader; Y menor sobe os olhos em relação ao centro da tela.
const FRAME_CENTER_UV: [number, number] = [0.505, 0.37];
// Fator de zoom do crop (ver uso de `c *= FRAME_CROP` abaixo) — esse rosto já
// enche o quadro quase todo (sem sobra como o hero antigo tinha), então o
// crop é mais generoso (mais perto de 1) pra não cortar testa/queixo.
const FRAME_CROP = 1.04;

// Duração de um piscar completo (fecha + abre), em segundos — rápido, como
// um piscar humano real.
const BLINK_DURATION = 0.16;
// Intervalo entre piscadas alterna 4s/5s (não é aleatório — alternância fixa,
// como pedido).
const BLINK_INTERVALS = [4, 5];

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
uniform float blink;

void main(){
  vec2 st = uv;
  st.y = 1.0 - st.y;

  // corrige aspecto (imagem quadrada em tela larga) recortando ao redor de
  // frameCenter em vez do centro geométrico da imagem — é isso que traz os
  // olhos pro centro da tela em vez do meio do rosto/cabeça.
  float ar = res.x / res.y;
  vec2 c = st - frameCenter;
  if (ar > 1.0) { c.y *= 1.0 / ar; } else { c.x *= ar; }
  c *= frameCrop;
  st = c + frameCenter;

  // rastreio de pupila — ÚNICO movimento reativo ao mouse (sem parallax
  // geral da cena). Desloca a amostra de textura só perto de cada olho,
  // com falloff suave (eyeEffectRadius) pra não criar costura visível.
  // Fecha um pouco o rastreio durante a piscada (blink) — olho fechado não
  // acompanha o cursor.
  vec2 gaze = (mouse - 0.5) * 2.0 * eyeRadius * (1.0 - blink);
  float dL = distance(st, leftEye);
  float dR = distance(st, rightEye);
  float wL = 1.0 - smoothstep(0.0, eyeEffectRadius, dL);
  float wR = 1.0 - smoothstep(0.0, eyeEffectRadius, dR);
  vec2 suv = st + gaze * wL + gaze * wR;

  // base um pouco mais discreta pra dar contraste ao brilho da pupila —
  // sem isso o glow se perdia no resto do rosto na mesma intensidade.
  vec3 col = texture2D(tex, suv).rgb * 1.3;

  // destaque "tecnologia macabra" nos olhos: brilho ciano/verde pulsante +
  // anel fino, tipo mira/scanner — só aparece perto da pupila. Multiplicado
  // por (1-blink) pra "apagar" junto com a piscada.
  vec3 eyeColor = vec3(0.22, 0.95, 0.68);
  float pulse = 0.6 + 0.4 * sin(time * 1.4);
  float openness = 1.0 - blink;
  float glow = wL + wR;
  col += eyeColor * glow * glow * 0.55 * pulse * openness;

  float ringL = smoothstep(eyeEffectRadius * 0.48, eyeEffectRadius * 0.56, dL) - smoothstep(eyeEffectRadius * 0.56, eyeEffectRadius * 0.68, dL);
  float ringR = smoothstep(eyeEffectRadius * 0.48, eyeEffectRadius * 0.56, dR) - smoothstep(eyeEffectRadius * 0.56, eyeEffectRadius * 0.68, dR);
  col += eyeColor * (ringL + ringR) * (0.5 + 0.5 * pulse) * openness;

  // piscada — sombra de "pálpebra" cresce verticalmente a partir do centro
  // de cada olho conforme 'blink' vai de 0 (aberto) a 1 (fechado). Usa o
  // próprio tom já amostrado da pele ao redor (escurecido), então acompanha
  // a iluminação da cena sem precisar de uma textura de "olho fechado".
  float lidReachL = blink * eyeEffectRadius * 0.75;
  float lidReachR = blink * eyeEffectRadius * 0.75;
  float lidL = wL * (1.0 - smoothstep(lidReachL - 0.003, lidReachL, abs(st.y - leftEye.y)));
  float lidR = wR * (1.0 - smoothstep(lidReachR - 0.003, lidReachR, abs(st.y - rightEye.y)));
  vec3 lidShadow = col * 0.32;
  col = mix(col, lidShadow, clamp(lidL + lidR, 0.0, 1.0));

  // vinheta um pouco mais funda — contraste dramático pros olhos se destacarem
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

// Variante em vídeo — preview lado a lado com a versão WebGL atual, ativada
// só por ?hero=video na URL (ver src/routes/index.tsx). Nada muda pra quem
// acessa a home normalmente; existe pra comparação antes de decidir qual vai
// pra produção. Mesmo tratamento visual do canvas (screen blend, vinheta via
// máscara CSS, fallback estático no mobile/reduced-motion).
function VeronicaHeroVideo() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block motion-reduce:md:hidden"
        style={{
          mixBlendMode: "screen",
          opacity: 0.85,
          maskImage:
            "radial-gradient(ellipse 78% 82% at 50% 42%, black 45%, transparent 88%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 78% 82% at 50% 42%, black 45%, transparent 88%)",
        }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/images/home/veronica-cyborg-hero-poster.webp"
          className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 object-cover"
        >
          <source src="/videos/veronica-cyborg-hero.mp4" type="video/mp4" />
        </video>
      </div>
      {/* Fallback estático: mobile sempre, e desktop com prefers-reduced-motion —
          mesmo poster do vídeo, sem autoplay, sem custo de decode. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 block bg-cover bg-center bg-no-repeat opacity-[0.42] md:hidden motion-reduce:md:block"
        style={{
          backgroundImage: "url(/images/home/veronica-cyborg-hero-poster.webp)",
          filter: "contrast(1.08) saturate(0.85) brightness(0.95)",
          mixBlendMode: "screen",
        }}
      />
    </>
  );
}

export function VeronicaHero({ variant = "shader" }: { variant?: "shader" | "video" }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (variant !== "shader") return;
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
    const uMouse = gl.getUniformLocation(prog, "mouse");
    const uRes = gl.getUniformLocation(prog, "res");
    const uTime = gl.getUniformLocation(prog, "time");
    const uBlink = gl.getUniformLocation(prog, "blink");

    // Constantes de calibração dos olhos — declaradas uma vez, fora do loop.
    gl.uniform2f(gl.getUniformLocation(prog, "leftEye"), LEFT_EYE_UV[0], LEFT_EYE_UV[1]);
    gl.uniform2f(gl.getUniformLocation(prog, "rightEye"), RIGHT_EYE_UV[0], RIGHT_EYE_UV[1]);
    gl.uniform1f(gl.getUniformLocation(prog, "eyeRadius"), EYE_MOVEMENT_RADIUS);
    gl.uniform1f(gl.getUniformLocation(prog, "eyeEffectRadius"), EYE_EFFECT_RADIUS);
    gl.uniform2f(gl.getUniformLocation(prog, "frameCenter"), FRAME_CENTER_UV[0], FRAME_CENTER_UV[1]);
    gl.uniform1f(gl.getUniformLocation(prog, "frameCrop"), FRAME_CROP);

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

    const t0 = mkTex(0);
    gl.uniform1i(uTex, 0);

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
    load(small ? "/images/home/veronica-cyborg-face-sm.webp" : "/images/home/veronica-cyborg-face.webp", t0, 0);

    // Mesmo padrão de smoothing (lerp) já usado antes pro parallax geral —
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
    // A janela não é o único jeito da hero mudar de tamanho: conteúdo que
    // cresce por cima dela (ex.: o boot de texto digitando linha a linha)
    // também estica a section — e sem isso o canvas ficava com a resolução
    // interna desatualizada, esticando/deslocando a imagem até o layout
    // assentar. ResizeObserver cobre qualquer mudança de tamanho, não só a
    // da janela.
    const ro = new ResizeObserver(resize);
    ro.observe(cv);

    // Piscada natural — intervalo entre piscadas alterna 4s/5s (não
    // aleatório, alternância fixa). Curva rápida: fecha em 40% da duração,
    // abre nos 60% restantes, como um piscar humano real (fecha mais rápido
    // do que abre).
    const smooth01 = (k: number) => k * k * (3 - 2 * k);
    const blinkCurve = (t: number) => {
      if (t < 0.4) return smooth01(t / 0.4);
      return 1 - smooth01((t - 0.4) / 0.6);
    };
    let blinkToggle = 0;
    let nextBlinkAt = BLINK_INTERVALS[0];
    let blinkStartedAt = -1;

    let raf = 0;
    const start = performance.now();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (ready < 1) return;
      mouse.x += (target.x - mouse.x) * 0.05;
      mouse.y += (target.y - mouse.y) * 0.05;
      const elapsed = (performance.now() - start) / 1000;

      let blinkValue = 0;
      if (blinkStartedAt < 0 && elapsed >= nextBlinkAt) {
        blinkStartedAt = elapsed;
      }
      if (blinkStartedAt >= 0) {
        const t = (elapsed - blinkStartedAt) / BLINK_DURATION;
        if (t >= 1) {
          blinkStartedAt = -1;
          blinkToggle = blinkToggle === 0 ? 1 : 0;
          nextBlinkAt = elapsed + BLINK_INTERVALS[blinkToggle];
        } else {
          blinkValue = blinkCurve(t);
        }
      }

      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform2f(uRes, cv.width, cv.height);
      gl.uniform1f(uTime, elapsed);
      gl.uniform1f(uBlink, blinkValue);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
      ro.disconnect();
    };
  }, [variant]);

  if (variant === "video") return <VeronicaHeroVideo />;

  return (
    <>
      <canvas
        ref={ref}
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden h-full w-full md:block motion-reduce:md:hidden"
        style={{ mixBlendMode: "screen", opacity: 0.75 }}
      />
      {/* Fallback estático: mobile sempre, e desktop quando prefers-reduced-motion
          está ativo — mesma imagem, sem canvas, sem parallax, sem rastreio.
          bg-contain (não cover) garante o rosto inteiro — os dois olhos —
          sempre visível, não importa a proporção da hero nesse viewport;
          cover cortava lado a lado ou topo/base dependendo da altura que o
          TerminalBoot deixava a section, o que podia sumir com um olho. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 block bg-contain bg-center bg-no-repeat opacity-[0.42] md:hidden motion-reduce:md:block"
        style={{
          backgroundImage: "url(/images/home/veronica-cyborg-face-sm.webp)",
          filter: "contrast(1.08) saturate(0.85) brightness(0.95)",
          mixBlendMode: "screen",
        }}
      />
    </>
  );
}
