// Identidade visual fixa de toda imagem gerada por IA no Veronica Wire —
// tanto capa por matéria (articles-server.ts) quanto biblioteca por tópico
// (image-library-server.ts). Módulo neutro (sem depender de nenhum dos
// dois) pra evitar import circular entre eles. Gerada via
// generateNanoBananaImage (higgsfield.ts) — Nano Banana Pro, único motor
// de imagem integrado de verdade hoje.
//
// Deliberadamente SEM estilo cinematográfico/gráfico futurista e SEM "4K"
// no texto — pedido do usuário é foto real de notícia com gente de
// verdade em cena; a API da Higgsfield usada aqui só entrega até 1080p de
// verdade (ver higgsfield.ts), então pedir 4K no prompt prometeria
// nitidez que o motor não gera.
export const COVER_HOUSE_STYLE = `Real photojournalism — an authentic, unstaged press photograph exactly like a real AP/Reuters news wire image, not a stylized graphic or illustration. Real people genuinely present and active in the scene (workers, professionals, crowds, officials — always generic/anonymous, never a specific real person). Natural available light, true-to-life color and texture, candid documentary framing, sharp and highly detailed photographic quality. NO cinematic color grading, NO futuristic holograms or digital overlays, NO glowing HUD/broadcast-graphic elements, NO readable text, NO logos, NO national flags or emblems.`;

// Regra fixa repetida em todo prompt de sistema que escreve cena de
// imagem (capa por matéria e biblioteca por tópico) — nunca retratar
// pessoa real/nomeada, só figuras genéricas/ilustrativas.
export const NO_REAL_PERSON_RULE = `REGRA FIXA E INEGOCIÁVEL: toda pessoa descrita precisa ser genérica e não identificável — NUNCA descreva uma pessoa real, nomeada ou reconhecível (nenhum político, executivo ou figura pública específica).`;
