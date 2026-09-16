// Arte de capa da Wire TV, gerada por semente a partir do slug da matéria.
//
// Por que existe: a capa vem do banco curado da biblioteca do Admin (decisão
// de 13/09 — nada de busca ao vivo, que produzia foto parecendo documentar o
// fato). Quando o banco não tem imagem para a editoria, a capa caía numa foto
// fixa por editoria, e a mesma imagem passou a ilustrar dezenas de matérias:
// 22 dos 40 arquivos de public/images/blog-covers eram cópias byte a byte de
// cinco fotos. Este módulo substitui esse nível: em vez de repetir uma foto,
// desenha uma composição abstrata que nenhuma outra matéria terá, porque toda
// variação sai de um hash do slug.
//
// É assumidamente ilustrativa — geometria e cor da editoria, nenhuma foto,
// nenhuma cena. Não finge registrar o fato, que era exatamente o problema da
// busca ao vivo.
//
// SEM TEXTO DE MANCHETE, de propósito: a capa é recortada como fundo do card
// do Instagram (src/lib/wire-instagram-card.ts), que escreve a manchete por
// cima. Manchete na capa apareceria duas vezes no card. A marca fica no canto
// inferior esquerdo, fora do recorte 4:5 do card (que usa só a faixa central
// de 504 px da capa), então identifica a imagem quando ela viaja sozinha como
// og:image sem duplicar o "WIRE TV" do card.
//
// A API usada é o subconjunto do Canvas 2D que existe igual no navegador e no
// @napi-rs/canvas — mesma restrição do card do Instagram, pelo mesmo motivo:
// quem gera é o runner do Actions, sem navegador.
import type { Beat } from "./beats.ts";

export const WIRE_COVER_WIDTH = 1200;
export const WIRE_COVER_HEIGHT = 630;

type Rgb = readonly [number, number, number];

// Cada editoria tem duas cores: a `base` puxa da identidade que o site já usa
// em BEAT_COLOR, a `accent` entra nos degradês para a composição não sair
// monocromática. `deep` é o fundo, quase preto, tingido pela editoria.
const BEAT_PALETTE: Record<Beat, { base: Rgb; accent: Rgb; deep: Rgb }> = {
  ia: { base: [52, 211, 153], accent: [125, 211, 252], deep: [6, 20, 17] },
  clima: { base: [56, 189, 248], accent: [45, 212, 191], deep: [5, 16, 26] },
  economia: { base: [251, 191, 36], accent: [253, 224, 71], deep: [24, 17, 4] },
  geopolitica: { base: [248, 113, 113], accent: [251, 146, 60], deep: [24, 9, 9] },
  mercado: { base: [167, 139, 250], accent: [244, 114, 182], deep: [16, 10, 26] },
};

// Os cinco traçados possíveis. O nome vai no log do gerador para dar pra
// conferir, olhando duas capas, que semente diferente deu composição diferente.
export const WIRE_COVER_MOTIFS = ["sinal", "orbita", "espectro", "malha", "estratos"] as const;
export type WireCoverMotif = (typeof WIRE_COVER_MOTIFS)[number];

// FNV-1a de 32 bits: estável entre execuções e entre máquinas (Math.random
// não serve — a capa precisa sair igual se for regerada).
export function wireCoverSeed(slug: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < slug.length; index += 1) {
    hash ^= slug.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export function wireCoverMotif(slug: string): WireCoverMotif {
  return WIRE_COVER_MOTIFS[wireCoverSeed(slug) % WIRE_COVER_MOTIFS.length];
}

// mulberry32 — gerador pequeno e determinístico. Toda variação da composição
// (posição, amplitude, quantidade, ângulo) sai daqui.
function makeRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rgba(color: Rgb, alpha: number): string {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

function mix(from: Rgb, to: Rgb, amount: number): Rgb {
  return [
    Math.round(from[0] + (to[0] - from[0]) * amount),
    Math.round(from[1] + (to[1] - from[1]) * amount),
    Math.round(from[2] + (to[2] - from[2]) * amount),
  ];
}

type Scene = {
  width: number;
  height: number;
  random: () => number;
  base: Rgb;
  accent: Rgb;
  deep: Rgb;
};

function paintBackground(context: CanvasRenderingContext2D, scene: Scene) {
  const { width, height, random, base, accent, deep } = scene;

  const backdrop = context.createLinearGradient(0, 0, width, height);
  backdrop.addColorStop(0, rgba(mix(deep, base, 0.1), 1));
  backdrop.addColorStop(0.6, rgba(deep, 1));
  backdrop.addColorStop(1, rgba(mix(deep, [0, 0, 0], 0.5), 1));
  context.fillStyle = backdrop;
  context.fillRect(0, 0, width, height);

  // Dois halos em posições sorteadas: é o que muda a "luz" de uma capa para
  // outra antes mesmo do traçado entrar.
  for (const [color, strength] of [
    [base, 0.42],
    [accent, 0.26],
  ] as const) {
    const x = width * (0.15 + random() * 0.7);
    const y = height * (random() * 0.6 - 0.1);
    const radius = Math.max(width, height) * (0.45 + random() * 0.35);
    const glow = context.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, rgba(color, strength));
    glow.addColorStop(1, rgba(color, 0));
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);
  }

  // Grade técnica de fundo, a mesma leitura de "sala de controle" que o card
  // tipográfico do Wire já tinha.
  context.strokeStyle = rgba([255, 255, 255], 0.035);
  context.lineWidth = 1;
  const step = 48;
  context.beginPath();
  for (let x = step; x < width; x += step) {
    context.moveTo(x + 0.5, 0);
    context.lineTo(x + 0.5, height);
  }
  for (let y = step; y < height; y += step) {
    context.moveTo(0, y + 0.5);
    context.lineTo(width, y + 0.5);
  }
  context.stroke();
}

// Linhas de sinal atravessando a capa — amplitude, fase e frequência sorteadas
// por linha, então nem duas linhas da mesma capa se repetem.
function paintSinal(context: CanvasRenderingContext2D, scene: Scene) {
  const { width, height, random, base, accent } = scene;
  const lines = 7 + Math.floor(random() * 5);
  for (let index = 0; index < lines; index += 1) {
    const progress = (index + 1) / (lines + 1);
    const middle = height * (0.16 + progress * 0.7);
    const amplitude = height * (0.03 + random() * 0.13);
    const frequency = 1 + random() * 3;
    const phase = random() * Math.PI * 2;
    const color = mix(base, accent, random());

    const stroke = context.createLinearGradient(0, 0, width, 0);
    stroke.addColorStop(0, rgba(color, 0));
    stroke.addColorStop(0.35, rgba(color, 0.55 + random() * 0.3));
    stroke.addColorStop(1, rgba(color, 0.05));
    context.strokeStyle = stroke;
    context.lineWidth = 1 + random() * 3.5;

    context.beginPath();
    for (let x = 0; x <= width; x += 6) {
      const t = x / width;
      const damp = Math.sin(Math.PI * t);
      const y = middle + Math.sin(phase + t * Math.PI * 2 * frequency) * amplitude * damp;
      if (x === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();
  }
}

// Órbitas concêntricas em torno de um foco sorteado, algumas fechadas e
// algumas em arco, com um núcleo aceso.
function paintOrbita(context: CanvasRenderingContext2D, scene: Scene) {
  const { width, height, random, base, accent } = scene;
  const centerX = width * (0.55 + random() * 0.3);
  const centerY = height * (0.3 + random() * 0.4);

  const core = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, height * 0.3);
  core.addColorStop(0, rgba(mix(base, accent, 0.3), 0.5));
  core.addColorStop(1, rgba(base, 0));
  context.fillStyle = core;
  context.fillRect(0, 0, width, height);

  const rings = 9 + Math.floor(random() * 7);
  for (let index = 0; index < rings; index += 1) {
    const radius = height * (0.06 + (index / rings) * 0.72) * (0.9 + random() * 0.25);
    const closed = random() > 0.45;
    const start = random() * Math.PI * 2;
    const sweep = closed ? Math.PI * 2 : Math.PI * (0.4 + random() * 1.1);
    context.strokeStyle = rgba(mix(base, accent, random()), 0.12 + random() * 0.45);
    context.lineWidth = 1 + random() * 3;
    context.beginPath();
    context.arc(centerX, centerY, radius, start, start + sweep);
    context.stroke();

    // Um ponto sobre a órbita, como marcador de leitura.
    if (random() > 0.5) {
      const angle = start + sweep * random();
      context.fillStyle = rgba(accent, 0.6 + random() * 0.4);
      context.beginPath();
      context.arc(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius,
        2 + random() * 4,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
  }
}

// Espectro: barras verticais ancoradas na base, alturas sorteadas com uma
// envoltória suave para não virar ruído puro.
function paintEspectro(context: CanvasRenderingContext2D, scene: Scene) {
  const { width, height, random, base, accent } = scene;
  const bars = 26 + Math.floor(random() * 22);
  const gap = width / bars;
  const phase = random() * Math.PI * 2;
  const frequency = 1 + random() * 2.5;

  for (let index = 0; index < bars; index += 1) {
    const t = index / bars;
    const envelope = 0.3 + 0.7 * Math.abs(Math.sin(phase + t * Math.PI * frequency));
    const barHeight = height * envelope * (0.25 + random() * 0.6);
    const barWidth = gap * (0.25 + random() * 0.5);
    const x = index * gap + (gap - barWidth) / 2;
    const y = height - barHeight;
    const color = mix(base, accent, t);

    const fill = context.createLinearGradient(0, y, 0, height);
    fill.addColorStop(0, rgba(color, 0.05));
    fill.addColorStop(1, rgba(color, 0.32 + random() * 0.35));
    context.fillStyle = fill;
    context.fillRect(x, y, barWidth, barHeight);

    // Topo aceso: dá borda à barra sem precisar de sombra.
    context.fillStyle = rgba(mix(color, [255, 255, 255], 0.5), 0.55);
    context.fillRect(x, y, barWidth, 2);
  }
}

// Malha de nós conectados — a leitura de rede/fluxo. Só liga vizinhos dentro
// de um raio, senão vira emaranhado sem forma.
function paintMalha(context: CanvasRenderingContext2D, scene: Scene) {
  const { width, height, random, base, accent } = scene;
  const count = 26 + Math.floor(random() * 20);
  const nodes: { x: number; y: number; r: number }[] = [];
  for (let index = 0; index < count; index += 1) {
    nodes.push({
      x: random() * width,
      y: random() * height,
      r: 1.5 + random() * 4.5,
    });
  }

  const reach = Math.min(width, height) * (0.22 + random() * 0.14);
  context.lineWidth = 1;
  for (let a = 0; a < nodes.length; a += 1) {
    for (let b = a + 1; b < nodes.length; b += 1) {
      const dx = nodes[a].x - nodes[b].x;
      const dy = nodes[a].y - nodes[b].y;
      const distance = Math.hypot(dx, dy);
      if (distance > reach) continue;
      const strength = 1 - distance / reach;
      context.strokeStyle = rgba(mix(base, accent, strength), 0.08 + strength * 0.35);
      context.beginPath();
      context.moveTo(nodes[a].x, nodes[a].y);
      context.lineTo(nodes[b].x, nodes[b].y);
      context.stroke();
    }
  }

  for (const node of nodes) {
    context.fillStyle = rgba(mix(accent, [255, 255, 255], 0.25), 0.45 + random() * 0.5);
    context.beginPath();
    context.arc(node.x, node.y, node.r, 0, Math.PI * 2);
    context.fill();
  }
}

// Estratos: faixas horizontais com fronteira ondulada, empilhadas de baixo
// para cima. Lê como camada geológica/gráfico de área.
function paintEstratos(context: CanvasRenderingContext2D, scene: Scene) {
  const { width, height, random, base, accent, deep } = scene;
  const layers = 5 + Math.floor(random() * 4);

  for (let index = 0; index < layers; index += 1) {
    const progress = index / layers;
    const baseline = height * (0.32 + progress * 0.62);
    const amplitude = height * (0.02 + random() * 0.07);
    const frequency = 0.8 + random() * 2.4;
    const phase = random() * Math.PI * 2;
    const color = mix(mix(base, accent, random()), deep, 0.25 + progress * 0.45);

    context.beginPath();
    context.moveTo(0, height);
    for (let x = 0; x <= width; x += 8) {
      const t = x / width;
      const y = baseline + Math.sin(phase + t * Math.PI * 2 * frequency) * amplitude;
      if (x === 0) context.lineTo(0, y);
      else context.lineTo(x, y);
    }
    context.lineTo(width, height);
    context.closePath();
    context.fillStyle = rgba(color, 0.34 + random() * 0.3);
    context.fill();

    // A linha de topo separa uma camada da outra quando as cores ficam
    // próximas — sem ela as faixas se fundem num borrão.
    context.strokeStyle = rgba(mix(color, [255, 255, 255], 0.45), 0.3 + random() * 0.35);
    context.lineWidth = 1 + random();
    context.beginPath();
    for (let x = 0; x <= width; x += 8) {
      const t = x / width;
      const y = baseline + Math.sin(phase + t * Math.PI * 2 * frequency) * amplitude;
      if (x === 0) context.moveTo(0, y);
      else context.lineTo(x, y);
    }
    context.stroke();
  }
}

const MOTIF_PAINTERS: Record<
  WireCoverMotif,
  (context: CanvasRenderingContext2D, scene: Scene) => void
> = {
  sinal: paintSinal,
  orbita: paintOrbita,
  espectro: paintEspectro,
  malha: paintMalha,
  estratos: paintEstratos,
};

// Granulado e vinheta por cima de tudo: tiram o aspecto de gráfico vetorial
// chapado e disfarçam o banding do degradê na compressão JPEG.
function paintFinish(context: CanvasRenderingContext2D, scene: Scene) {
  const { width, height, random } = scene;

  const grains = 2600;
  for (let index = 0; index < grains; index += 1) {
    const tone = random() > 0.5 ? 255 : 0;
    context.fillStyle = `rgba(${tone}, ${tone}, ${tone}, ${0.015 + random() * 0.045})`;
    context.fillRect(random() * width, random() * height, 1 + random() * 2, 1 + random() * 2);
  }

  const vignette = context.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.25,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.78,
  );
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.55)");
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);
}

// A marca fica no canto inferior esquerdo porque o card do Instagram recorta
// a capa pelo centro (504 px de 1200) e descarta as laterais — assim a capa
// se identifica sozinha sem duplicar o "WIRE TV" que o card já desenha.
function paintWordmark(context: CanvasRenderingContext2D, scene: Scene) {
  const { height, base } = scene;
  const x = 56;
  const y = height - 52;

  context.fillStyle = rgba(mix(base, [255, 255, 255], 0.25), 0.9);
  context.fillRect(x, y - 13, 26, 4);

  context.textAlign = "left";
  context.fillStyle = "rgba(255, 255, 255, 0.82)";
  context.font = '700 20px Arial, "Liberation Sans", Helvetica, sans-serif';
  context.letterSpacing = "4px";
  context.fillText("WIRE TV", x + 38, y);
  context.letterSpacing = "0px";
}

// Desenha a capa inteira no contexto recebido. Devolve o motivo sorteado só
// para o chamador poder registrar qual saiu.
export function drawWireCoverArt(
  context: CanvasRenderingContext2D,
  input: {
    slug: string;
    beat: Beat;
    width?: number;
    height?: number;
    withWordmark?: boolean;
  },
): { motif: WireCoverMotif; seed: number } {
  const width = input.width ?? WIRE_COVER_WIDTH;
  const height = input.height ?? WIRE_COVER_HEIGHT;
  const seed = wireCoverSeed(input.slug);
  const palette = BEAT_PALETTE[input.beat];
  const scene: Scene = {
    width,
    height,
    random: makeRandom(seed),
    base: palette.base,
    accent: palette.accent,
    deep: palette.deep,
  };
  const motif = WIRE_COVER_MOTIFS[seed % WIRE_COVER_MOTIFS.length];

  context.clearRect(0, 0, width, height);
  paintBackground(context, scene);
  MOTIF_PAINTERS[motif](context, scene);
  paintFinish(context, scene);
  if (input.withWordmark !== false) paintWordmark(context, scene);

  return { motif, seed };
}
