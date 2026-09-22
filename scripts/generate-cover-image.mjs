// Gera a capa de uma matéria da Wire TV com a Nano Banana Pro (Higgsfield),
// quando o banco curado não tem fotografia que faça jus ao texto.
//
// ONDE ISTO ENTRA NA CASCATA (nível 2 de 3, novo em 20/09):
//   1. fetch-cover-photo.mjs — fotografia do banco curado (Pexels/Pixabay).
//   2. ESTE SCRIPT — ilustração gerada, cinematográfica e ultra-realista.
//   3. render-cover-art.mjs — arte tipográfica do slug, sem chave de API,
//      que é o piso e nunca falha.
//
// Foi pedido pelo editor-chefe em 20/09 ("gere se precisar com nano banana
// pro"). Entra DEPOIS do banco, nunca antes: fotografia real de uma cena real
// é sempre preferível a uma imagem inventada, e o banco é a fonte barata.
//
// REGRA EDITORIAL QUE NÃO SE NEGOCIA, e que está no prompt e no crédito:
//
//   - A imagem é creditada como `Ilustração gerada por IA (Nano Banana Pro)`.
//     Esse crédito atravessa o mesmo caminho do crédito do fotógrafo e
//     aparece no rodapé da capa e na legenda do Instagram. Uma ilustração
//     sintética publicada sem essa marca é a versão pior do erro de 13/09
//     (a enchente em Telangana com foto de uma rua americana): ali a foto era
//     de outro lugar real; aqui a cena não existiu em lugar nenhum.
//
//   - O prompt pede CENA GENÉRICA da editoria, nunca o fato da matéria.
//     Sem pessoas públicas reconhecíveis, sem logotipo, sem bandeira
//     identificável, sem texto na imagem, sem cara de foto de agência
//     documentando um evento. O que se quer é a mesma coisa que uma foto de
//     banco: ilustração honesta do assunto.
//
// Uso:
//   COVER_SLUG=foo COVER_BEAT=clima COVER_SCENE="flooded street after heavy rain" \
//     HF_CREDENTIALS=... node scripts/generate-cover-image.mjs
//
// Imprime uma linha de JSON: {} quando não gerou (o chamador deve cair para a
// arte tipográfica), ou {"path","photoCredit","source"}.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BEAT_LABELS, isBeat } from "../src/lib/beats.ts";
import { generateNanoBananaImage } from "../src/lib/higgsfield.ts";
import { COVER_SCENES } from "../src/lib/cover-scenes.ts";

export const CREDITO_IA = "Ilustração gerada por IA (Nano Banana Pro)";

// O prompt é montado da CENA do catálogo, não da manchete. É a mesma decisão
// do banco: a cena é curada à mão e genérica; a manchete é o fato específico,
// e pedir o fato a um gerador é fabricar registro de acontecimento.
export function montarPrompt(input) {
  const cena = input.scene;
  return [
    `Editorial news cover photograph: ${cena}.`,
    "Ultra-realistic, photorealistic, cinematic composition, shot on full-frame camera,",
    "85mm lens, shallow depth of field, natural volumetric lighting, muted editorial",
    "color grade, high dynamic range, sharp 4K detail, 16:9 widescreen framing.",
    // As proibições são metade do prompt de propósito: é o que separa uma
    // ilustração honesta de uma falsificação de cobertura.
    "No text, no watermark, no logos, no brand marks, no readable signage,",
    "no identifiable real people, no public figures, no national flags,",
    "no crowds facing camera, no collage, no illustration style, no 3D render look.",
    `Generic illustrative scene for the editorial desk "${input.beatLabel}" — it must not`,
    "depict any specific real-world event, place or person.",
  ].join(" ");
}

async function main() {
  const slug = process.env.COVER_SLUG;
  const beat = process.env.COVER_BEAT;
  if (!slug || !isBeat(beat)) {
    console.error("Faltam variáveis: COVER_SLUG e COVER_BEAT (editoria válida).");
    process.exit(1);
  }

  if (!process.env.HF_CREDENTIALS) {
    // Sem chave não é erro: é a cascata seguindo para a arte tipográfica, que
    // não depende de API nenhuma. Derrubar o passo aqui deixaria a matéria —
    // já publicada neste ponto do workflow — sem capa alguma.
    console.error("HF_CREDENTIALS ausente — caindo para a arte gerada do slug.");
    console.log("{}");
    return;
  }

  // A cena vem do servidor quando ele já sabe qual casa com a matéria. Sem
  // ela, usa-se a primeira cena da editoria: genérica e sempre válida.
  const scene = (process.env.COVER_SCENE ?? "").trim() || COVER_SCENES[beat][0].term;
  const prompt = montarPrompt({ scene, beatLabel: BEAT_LABELS[beat] });

  const resultado = await generateNanoBananaImage({ prompt });
  if (!resultado.ok) {
    console.error(`Nano Banana Pro falhou: ${resultado.error}`);
    console.log("{}");
    return;
  }

  const resposta = await fetch(resultado.imageUrl);
  if (!resposta.ok) {
    console.error(`Não deu para baixar a imagem gerada: HTTP ${resposta.status}`);
    console.log("{}");
    return;
  }
  const bytes = Buffer.from(await resposta.arrayBuffer());
  // Mesma checagem do resto do pipeline: tudo aqui é gravado com extensão
  // .jpg, e o que não for JPEG viraria arquivo mal rotulado servido ao
  // navegador. A Higgsfield costuma devolver PNG — quando devolver, cai para
  // a arte tipográfica em vez de gravar PNG com nome .jpg.
  if (!(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)) {
    console.error("a imagem gerada não veio em JPEG — caindo para a arte do slug.");
    console.log("{}");
    return;
  }

  const outDir =
    process.env.COVER_OUT_DIR ??
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "public",
      "images",
      "blog-covers",
    );
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `${slug}.jpg`);
  await writeFile(outPath, bytes);

  console.log(
    JSON.stringify({ path: outPath, photoCredit: CREDITO_IA, scene, source: "nano-banana-pro" }),
  );
}

// Só roda quando chamado direto: os testes importam montarPrompt sem gerar
// imagem nenhuma (e sem gastar crédito da conta).
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  await main();
}
