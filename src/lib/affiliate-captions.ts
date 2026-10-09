// Legendas prontas que o divulgador da Rede copia junto com o próprio link.
//
// O texto de cada produto fica aqui (gancho, corpo e hashtags) porque é
// copy curada, não dado de catálogo. Preço e link entram na hora da cópia:
// o preço vem do cadastro (muda na Shopee) e o link é o rastreado de quem
// copiou, para a venda cair no Sub_id certo. Produto sem legenda curada
// recebe uma montada a partir do nome e do ângulo do card.
//
// Regra de texto: nada de promessa de saúde, emagrecimento ou resultado
// garantido, e número de vendas só quando veio do painel da Shopee.

type CaptionProduct = {
  id: string;
  name: string;
  priceLabel: string;
  angle: string;
  category: string;
};

type CuratedCaption = { hook: string; body: string; tags: string };

const CURATED: Record<string, CuratedCaption> = {
  "escova-de-silicone-para-massagem-no-couro-cabeludo-42809403599": {
    hook: "Lavar o cabelo virou spa 🧖‍♀️",
    body: "Escova de silicone que massageia o couro cabeludo e espalha o shampoo por igual. Mais de 90 mil vendidas e nota 5,0 na Shopee.",
    tags: "#cabelo #autocuidado",
  },
  "kit-anti-acne-principia-gel-de-limpeza-gl-01-serum-mix-01-protetor-fps-60-23194482426": {
    hook: "Rotina de skincare completa em 3 passos ✨",
    body: "Gel de limpeza, sérum e protetor FPS 60 da Principia num kit só. Mais de 30 mil vendidos na Shopee.",
    tags: "#skincare #principia",
  },
  "mini-power-bank-10000mah-com-cabo-tipo-c-lightning-22499247158": {
    hook: "Nunca mais fique sem bateria na rua 🔋",
    body: "Mini power bank com cabo embutido que vira alça: nada de caçar cabo na bolsa. Tem versão Tipo-C e Lightning, e o modelo YC-01 é o de 10000mAh. Mais de 10 mil vendidos.",
    tags: "#powerbank #tecnologia",
  },
  "espelho-de-maquiagem-com-luz-led-dobravel-18699185302": {
    hook: "Make perfeita em qualquer luz 💡",
    body: "Espelho com LED em 3 tons, toque e ângulo ajustável. Dobra e vai para qualquer lugar. Mais de 10 mil vendidos.",
    tags: "#maquiagem #make",
  },
  "kit-utensilios-de-silicone-para-cozinha-com-suporte-22894944958": {
    hook: "Chega de panela riscada 🍳",
    body: "Kit de utensílios de silicone com cabo de madeira e pote organizador. Fica lindo na bancada e é fácil de lavar. Mais de 3 mil vendidos.",
    tags: "#cozinha #casa",
  },
  "kit-3-cropped-canelado-de-algodao-manga-curta-22898300477": {
    hook: "Kit com 3 cropped canelados 😍",
    body: "Algodão, manga curta e cores que combinam com tudo: um look para cada dia. Mais de 2 mil vendidos.",
    tags: "#moda #lookdodia",
  },
  "bolinha-antiestresse-pao-de-ouro-squishy-5-5cm-48264636685": {
    hook: "Aperta que relaxa 😮‍💨",
    body: "Bolinha squishy de pão de ouro, fofa e colorida. Diversão para crianças e adultos. Mais de mil vendidas.",
    tags: "#squishy #fofura",
  },
  "protetor-solar-facial-fps-60-principia-ps-01-22097296846": {
    hook: "Protetor facial com mais de 119 mil avaliações ☀️",
    body: "Principia PS-01 FPS 60: toque seco, sem brilho e fica ótimo por baixo da maquiagem.",
    tags: "#skincare #protetorsolar",
  },
  "chinelo-slide-nuvem-22297575383": {
    hook: "Pisar em nuvem existe ☁️",
    body: "Chinelo slide Nuvem, macio e leve para usar o dia todo. Mais de 100 mil avaliações na Shopee.",
    tags: "#chinelonuvem #conforto",
  },
  "mascara-de-cilios-a-prova-d-agua-4d-tango-22198362654": {
    hook: "Cílios de extensão sem extensão 👀",
    body: "Máscara 4D à prova d'água, 2 em 1: alonga e dá volume sem borrar. Mais de 80 mil avaliações.",
    tags: "#maquiagem #cilios",
  },
  "escova-secadora-alisadora-3-em-1-110v-21877015678": {
    hook: "Seca e alisa ao mesmo tempo 💁‍♀️",
    body: "Escova secadora 3 em 1 para fazer escova de salão em casa. Mais de 75 mil avaliações. Atenção: modelo 110V.",
    tags: "#cabelo #escovasecadora",
  },
  "pistola-de-massagem-muscular-portatil-recarregavel-17460396643": {
    hook: "Massagem pós-treino em casa 💪",
    body: "Pistola de massagem portátil e recarregável, com várias ponteiras. Mais de 60 mil avaliações.",
    tags: "#treino #relax",
  },
  "picador-de-alimentos-eletrico-3l-23892669902": {
    hook: "Pica cebola, alho e carne em segundos 🧅",
    body: "Picador elétrico de 3 litros que acaba com o choro na cozinha. Mais de 60 mil avaliações.",
    tags: "#cozinha #praticidade",
  },
  "lupa-amplificadora-de-tela-de-celular-3d-23091546001": {
    hook: "Transforme o celular numa telinha de cinema 🎬",
    body: "Lupa 3D que amplia a tela para ver séries e vídeos com mais conforto. Mais de 58 mil avaliações.",
    tags: "#celular #series",
  },
  "tapete-higienico-espaco-de-bicho-50-unidades-17692293121": {
    hook: "Pacotão para quem tem pet 🐶",
    body: "Tapete higiênico Espaço de Bicho com 50 unidades, para a rotina do seu pet ficar mais prática. Mais de 35 mil avaliações.",
    tags: "#pet #cachorro",
  },
  "espelho-organico-grande-lapidado-com-opcao-led-touch-22898373049": {
    hook: "O espelho que aparece em todo vídeo de decor ✨",
    body: "Espelho orgânico grande e lapidado, com opção de LED touch. Mais de 10 mil vendidos.",
    tags: "#decoracao #casa",
  },
  "espelho-flame-com-moldura-de-couro-46416304631": {
    hook: "Decor de revista gastando pouco 🪞",
    body: "Espelho Flame com moldura de couro, em vários tamanhos para hall, sala ou closet. Mais de 5 mil vendidos.",
    tags: "#decoracao #casa",
  },
  "macaquinho-feminino-ana-com-ziper-22693482981": {
    hook: "Look pronto em uma peça só 🖤",
    body: "Macaquinho feminino com zíper, sem transparência e caimento de blogueira. Mais de mil vendidos.",
    tags: "#moda #lookdodia",
  },
  "auxiliar-partida-compressor": {
    hook: "Carro não pegou? Resolve em segundos 🚗",
    body: "Auxiliar de partida com compressor de ar: dá partida na bateria e enche o pneu. Para deixar no porta-malas.",
    tags: "#carro #emergencia",
  },
  "capa-de-chuva-moto-motoqueiro-impermeavel-reforcada-41619217982": {
    hook: "Chuva não é desculpa para chegar molhado 🌧️",
    body: "Capa de chuva para moto, impermeável e reforçada, com faixa refletiva. Mais de 99 mil vendas na Shopee.",
    tags: "#moto #motoboy",
  },
};

/** Texto pronto para colar no WhatsApp, Instagram ou TikTok, já com o link de quem copiou. */
export function buildAffiliateCaption(product: CaptionProduct, link: string): string {
  const curated = CURATED[product.id];
  const hook = curated?.hook ?? product.name;
  const body = curated?.body ?? product.angle;
  const tags = ["#achadinhosshopee", "#shopee", curated?.tags ?? `#${product.category}`].join(" ");
  return [hook, "", body, "", `💰 ${product.priceLabel} na Shopee`, `👉 ${link}`, "", tags].join(
    "\n",
  );
}

export function hasCuratedCaption(productId: string): boolean {
  return productId in CURATED;
}
