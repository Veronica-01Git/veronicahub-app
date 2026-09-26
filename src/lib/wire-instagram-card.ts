// Card 1080×1350 (4:5 — o formato mais alto que o feed do Instagram aceita sem
// cortar) com a identidade da Wire TV.
//
// Mora aqui, fora do componente, porque dois lugares desenham exatamente o
// mesmo card: o botão "Compartilhar no Instagram" em /blog/$slug, que usa o
// canvas do navegador, e scripts/render-instagram-card.mjs, que roda o mesmo
// traçado no @napi-rs/canvas pra gerar o arquivo sem abrir navegador (usado
// pra preparar postagens fora do site). A API 2D dos dois é a mesma; só o
// carregamento da imagem muda, por isso ele entra como parâmetro.
//
// Os stacks de fonte listam Liberation/DejaVu depois de Arial e Georgia:
// no navegador vale a primeira, no Node vale a métrica-compatível instalada
// no container — sem isso o gerador cai numa fonte qualquer e o card sai
// com outro espaçamento.

export const WIRE_INSTAGRAM_HANDLE = "@wire__tv";
export const WIRE_CARD_WIDTH = 1080;
export const WIRE_CARD_HEIGHT = 1350;

const SANS = 'Arial, "Liberation Sans", Helvetica, sans-serif';
const SERIF = 'Georgia, "Liberation Serif", "DejaVu Serif", serif';
const HEADLINE_MAX_WIDTH = 928;
const HEADLINE_MAX_LINES = 5;

export type WireCardInput = {
  headline: string;
  beatLabel: string;
  coverImageUrl: string | null;
  canonicalUrl: string;
};

// Só o que o traçado usa da imagem — mantém o módulo compatível com o
// HTMLImageElement do navegador e com o Image do @napi-rs/canvas.
export type WireCardImage = CanvasImageSource & {
  readonly naturalWidth?: number;
  readonly naturalHeight?: number;
};

export type WireCardImageLoader = (src: string) => Promise<WireCardImage>;

function imageSize(image: WireCardImage): { width: number; height: number } {
  const source = image as {
    naturalWidth?: number;
    naturalHeight?: number;
    width?: number;
    height?: number;
  };
  return {
    width: source.naturalWidth || source.width || 0,
    height: source.naturalHeight || source.height || 0,
  };
}

// Preenche o quadro inteiro com a capa sem distorcer: escala pelo maior lado
// necessário e recorta o excedente pelo centro (equivalente ao object-cover).
function drawCover(
  context: CanvasRenderingContext2D,
  image: WireCardImage,
  width: number,
  height: number,
) {
  const natural = imageSize(image);
  if (!natural.width || !natural.height) return;
  const scale = Math.max(width / natural.width, height / natural.height);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (natural.width - sourceWidth) / 2;
  const sourceY = (natural.height - sourceHeight) / 2;
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
}

// Quebra a manchete no limite de largura e, se ainda sobrar texto depois da
// última linha permitida, encerra com reticências em vez de cortar no meio.
export function wrapHeadline(
  context: CanvasRenderingContext2D,
  headline: string,
  maxWidth: number = HEADLINE_MAX_WIDTH,
  maxLines: number = HEADLINE_MAX_LINES,
): string[] {
  const words = headline.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (context.measureText(test).width <= maxWidth) {
      line = test;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    if (lines.length === maxLines - 1) break;
  }

  if (line && lines.length < maxLines) lines.push(line);
  const usedWords = lines.length ? lines.join(" ").split(/\s+/).length : 0;
  if (usedWords < words.length && lines.length) {
    let last = lines[lines.length - 1];
    while (context.measureText(`${last}…`).width > maxWidth && last.includes(" ")) {
      last = last.slice(0, last.lastIndexOf(" "));
    }
    lines[lines.length - 1] = `${last}…`;
  }
  return lines;
}

// Legenda pronta pro feed: manchete, resumo, endereço canônico da matéria no
// site e a assinatura do perfil. O link fica no texto porque o feed do
// Instagram não aceita link clicável na legenda — quem lê copia daqui.
export function buildWireCaption(input: {
  headline: string;
  excerpt?: string;
  canonicalUrl: string;
  photoCredit?: string | null;
  photoUrl?: string | null;
}): string {
  // O resumo é opcional: quando a legenda é montada fora do site (script de
  // publicação), nem sempre ele está à mão, e um parágrafo vazio no meio da
  // legenda aparece como duas linhas em branco no feed.
  const excerpt = input.excerpt?.trim();
  // O crédito acompanha a imagem; não atribuir ao Pexels uma foto do Pixabay
  // nem tratar uma ilustração gerada por IA como fotografia.
  const credit = input.photoCredit?.trim();
  const source = input.photoUrl?.includes("pixabay.com")
    ? "Pixabay"
    : input.photoUrl?.includes("pexels.com")
      ? "Pexels"
      : null;
  const attribution = credit
    ? /^Ilustração gerada por IA/i.test(credit)
      ? credit
      : `Imagem ilustrativa · ${credit}${source ? ` / ${source}` : ""}`
    : undefined;
  return [
    input.headline,
    excerpt,
    `Leia a matéria completa: ${input.canonicalUrl}`,
    attribution,
    WIRE_INSTAGRAM_HANDLE,
  ]
    .filter(Boolean)
    .join("\n\n");
}

// No rodapé do card entra só o domínio: o endereço completo de uma matéria
// passa de 60 caracteres e atropelaria o @ do perfil na mesma linha. O link
// inteiro vai na legenda, que é de onde o leitor copia.
function siteLabel(canonicalUrl: string): string {
  try {
    return new URL(canonicalUrl).hostname.replace(/^www\./, "");
  } catch {
    return canonicalUrl.replace(/^https?:\/\//, "").split("/")[0];
  }
}

async function paint(
  context: CanvasRenderingContext2D,
  input: WireCardInput,
  loadImage: WireCardImageLoader | null,
) {
  context.clearRect(0, 0, WIRE_CARD_WIDTH, WIRE_CARD_HEIGHT);

  const base = context.createLinearGradient(0, 0, WIRE_CARD_WIDTH, WIRE_CARD_HEIGHT);
  base.addColorStop(0, "#07110e");
  base.addColorStop(0.55, "#101312");
  base.addColorStop(1, "#050606");
  context.fillStyle = base;
  context.fillRect(0, 0, WIRE_CARD_WIDTH, WIRE_CARD_HEIGHT);

  if (loadImage && input.coverImageUrl) {
    const image = await loadImage(input.coverImageUrl);
    drawCover(context, image, WIRE_CARD_WIDTH, WIRE_CARD_HEIGHT);
  }

  // Véu escuro de cima pra baixo: preserva a capa no topo e garante contraste
  // de leitura na metade de baixo, onde entram manchete e assinatura.
  const veil = context.createLinearGradient(0, 0, 0, WIRE_CARD_HEIGHT);
  veil.addColorStop(0, "rgba(0,0,0,.22)");
  veil.addColorStop(0.42, "rgba(0,0,0,.34)");
  veil.addColorStop(0.68, "rgba(0,0,0,.82)");
  veil.addColorStop(1, "rgba(0,0,0,.97)");
  context.fillStyle = veil;
  context.fillRect(0, 0, WIRE_CARD_WIDTH, WIRE_CARD_HEIGHT);

  context.textAlign = "left";
  context.fillStyle = "#63e6a6";
  context.fillRect(76, 72, 54, 5);
  context.font = `700 30px ${SANS}`;
  context.letterSpacing = "5px";
  context.fillText("WIRE TV", 76, 128);

  context.fillStyle = "rgba(255,255,255,.76)";
  context.font = `700 24px ${SANS}`;
  context.letterSpacing = "3px";
  context.fillText(input.beatLabel.toUpperCase(), 76, 760);

  context.fillStyle = "#ffffff";
  context.font = `700 65px ${SERIF}`;
  context.letterSpacing = "0px";
  const lines = wrapHeadline(context, input.headline);
  lines.forEach((line, index) => context.fillText(line, 76, 842 + index * 76));

  context.fillStyle = "#63e6a6";
  context.fillRect(76, 1240, HEADLINE_MAX_WIDTH, 2);
  context.fillStyle = "rgba(255,255,255,.8)";
  context.font = `500 22px ${SANS}`;
  context.fillText(WIRE_INSTAGRAM_HANDLE, 76, 1295);
  context.textAlign = "right";
  context.fillText(siteLabel(input.canonicalUrl), 1004, 1295);
  context.textAlign = "left";
}

// Desenha o card no contexto recebido. Se a capa não carregar — CORS, rede,
// arquivo fora do ar — redesenha sem ela em vez de devolver erro: card sem
// foto ainda publica, card nenhum não.
export async function drawWireInstagramCard(
  context: CanvasRenderingContext2D,
  input: WireCardInput,
  loadImage: WireCardImageLoader,
): Promise<{ withCover: boolean }> {
  if (!input.coverImageUrl) {
    await paint(context, input, null);
    return { withCover: false };
  }
  try {
    await paint(context, input, loadImage);
    return { withCover: true };
  } catch {
    await paint(context, input, null);
    return { withCover: false };
  }
}
