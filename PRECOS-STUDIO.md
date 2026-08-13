# Recálculo de Preços — Veronica Studio
Data: 05/08/2026 · Câmbio usado: US$ 1 = R$ 5,13

## Custos reais de API por geração (pesquisa de mercado)

| Modelo | Custo API (US$/segundo) | Custo 5s | Custo 10s | Custo 15s |
|---|---|---|---|---|
| Seedance 2.0 | ~0,022–0,09 | R$ 0,55–2,30 | R$ 1,15–4,60 | R$ 1,70–6,90 |
| Kling 3.0 | ~0,029–0,17 | R$ 0,75–4,30 | R$ 1,50–8,60 | R$ 2,25–12,90 |
| Veo 3.1 fast/lite | ~0,03–0,15 | R$ 0,80–3,85 | R$ 1,55–7,70 | (máx. 8s no modelo) |
| Veo 3.1 preview c/ áudio | ~0,50–0,75 | R$ 12,80–19,20 | ❌ inviável no preço atual | (máx. 8s) |
| Sora 2 / Pro | ~0,10 / 0,30–0,50 | R$ 2,55 / 7,70–12,80 | R$ 5,15 / 15,40–25,60 | — |
| Imagem Nano Banana Pro | ~US$ 0,08–0,15/img | R$ 0,40–0,77 por imagem | | |
| Voz ElevenLabs | ~US$ 0,27/minuto | R$ 1,40/min | | |

## Veredito sobre a tabela atual do site

**Os preços-base estão BONS** — margens de 70–95% na maioria. Mas há **3 correções necessárias**:

### Correção 1 — CRÍTICA: preço fixo ignorando duração
Hoje o site cobra o mesmo preço para 5s, 10s ou 15s, mas o custo de API é **por segundo**.
Um vídeo de 15s custa ~3× o de 5s — a margem despenca se todo mundo gerar 15s.

**Solução**: preço-base vale para 5s; aplicar multiplicador por duração:

| Duração | Multiplicador | Ex.: Seedance 1080p |
|---|---|---|
| 5s | ×1,0 | R$ 29,90 |
| 10s | ×1,8 | R$ 53,90 |
| 15s | ×2,5 | R$ 74,90 |

(O ×1,8/×2,5 em vez de ×2/×3 embute desconto progressivo — incentiva durações maiores sem quebrar margem.)

### Correção 2 — Crédito grátis limitado a 5s
O vídeo grátis do cadastro (1080p) deve valer **só para 5s**. Senão o usuário novo gera 15s de graça e o custo de aquisição triplica.

### Correção 3 — Veo 3.1: usar variante "fast" e limitar duração
- O Veo 3.1 primeira linha (preview, com áudio) custa US$ 0,75/s — um vídeo de 10s custaria R$ 38,50, **acima** do preço de venda atual (R$ 34,90). Prejuízo.
- **Solução**: nos tiers "Simples" e "1080p", rotear para **veo-3.1-fast/lite** (custo R$ 1,55–7,70 → margem saudável). Reservar a variante preview/ultra só para o tier "4K Pro" (R$ 79,90 base 5-8s → margem ~60-75%).
- Detalhe técnico: Veo 3.1 gera em durações de 4/6/8s (não 5/10/15). O backend mapeia: 5s→4s, 10s→8s; 15s indisponível para Veo (esconder a pill ou avisar).

### Ajustes menores
- **Kling**: o site anuncia "Kling 2.5", mas o modelo atual do mercado é o **3.0** — atualizar o label.
- **Midjourney v7**: não tem API oficial. Substituir por Seedream 4.5 (via Higgsfield, qualidade equivalente, custo ~R$ 0,50/img) ou remover.
- **Voz**: definir limite de caracteres por geração (ex.: até 1.000 caracteres ≈ 1 min) — o custo da ElevenLabs é por caractere.

## Tabela corrigida sugerida (preço-base = 5s)

| Item | Preço-base | 10s | 15s | Custo estimado (5s) | Margem (5s) |
|---|---|---|---|---|---|
| Seedance Baixo | R$ 14,90 | R$ 26,90 | R$ 37,90 | R$ 0,55–1,20 | ~92% |
| Seedance 1080p | R$ 29,90 | R$ 53,90 | R$ 74,90 | R$ 1,15–2,30 | ~93% |
| Seedance 4K | R$ 59,90 | R$ 107,90 | R$ 149,90 | R$ 3,50–9,20 | ~89% |
| Veo Simples (fast) | R$ 19,90 | R$ 35,90 | — | R$ 0,80–2,00 | ~93% |
| Veo 1080p (fast) | R$ 34,90 | R$ 62,90 | — | R$ 1,55–3,85 | ~92% |
| Veo 4K Pro (preview) | R$ 79,90 | R$ 143,90 | — | R$ 12,80–19,20 | ~80% |
| Kling Baixo | R$ 13,90 | R$ 24,90 | R$ 34,90 | R$ 0,75–2,15 | ~90% |
| Kling 1080p | R$ 27,90 | R$ 49,90 | R$ 69,90 | R$ 1,50–4,30 | ~90% |
| Kling 4K | R$ 54,90 | R$ 98,90 | R$ 136,90 | R$ 4,50–12,90 | ~84% |
| Sora Simples | R$ 21,90 | R$ 38,90 | — | R$ 2,55 | ~88% |
| Sora 1080p | R$ 39,90 | R$ 71,90 | — | R$ 5,15 (10s) | ~87% |
| Sora 4K Pro | R$ 89,90 | R$ 161,90 | — | R$ 7,70–12,80 | ~86% |
| Imagem NB Pro | R$ 4,90 | — | — | R$ 0,40–0,77 | ~88% |
| Imagem Seedream 4.5 | R$ 5,90 | — | — | ~R$ 0,50 | ~92% |
| Imagem FLUX | R$ 5,90 | — | — | ~R$ 0,25–0,50 | ~93% |
| Voz ElevenLabs (até 1 min) | R$ 7,90 | — | — | R$ 1,40 | ~82% |
| Voz OpenAI (até 1 min) | R$ 5,90 | — | — | ~R$ 0,80 | ~86% |

Sobre a margem, lembrar de descontar: taxa Mercado Pago (Pix ~0,99% / cartão ~4,98%) e impostos do seu regime tributário.

## Quanto custa pra operar (custo SEU, mensal)

| Item | Custo |
|---|---|
| Cloudflare Workers (plano pago, necessário p/ produção) | US$ 5/mês (~R$ 26) |
| Cloudflare R2 (storage dos arquivos gerados) | ~R$ 0–5/mês no início (10GB grátis) |
| Cloudflare D1 (banco) | grátis no início |
| Resend (e-mail OTP) | grátis até 3.000/mês |
| Upstash (rate limit) | grátis no início |
| Buffer inicial de créditos API Higgsfield | ~US$ 50 (R$ 255) pré-pago, dura ~100-500 gerações |
| ElevenLabs API | pay-as-you-go, ~R$ 1,40/min gerado |
| **Total fixo para lançar** | **~R$ 30/mês + R$ 255 de buffer inicial** |
| (Opcional, uso pessoal) Higgsfield ULTRA anual | US$ 63/mês |

Ou seja: com ~R$ 300 você lança a Fase 1. Depois disso o custo variável é coberto pelo que o usuário paga, com margem de ~80-93%.

## Implementação das correções (para aplicar no Claude Code)

No `src/routes/video-ia.tsx`:
1. Adicionar `DURATION_MULTIPLIER = { "5s": 1, "10s": 1.8, "15s": 2.5 }` e aplicar em `priceFor()` para vídeo e avatar (arredondando para final ,90).
2. Em `hasFreeFor()` e `freeLeft`: crédito grátis de vídeo só quando `duration === "5s"` (e adicionar `duration` nas deps do memo).
3. Pills de qualidade: exibir o preço já multiplicado pela duração selecionada.
4. Grade de preços da seção [02]: indicar "(5s)" ao lado do preço-base.
5. Label "Kling 2.5" → "Kling 3.0".
6. Trocar "Midjourney v7" por "Seedream 4.5" (R$ 5,90).
7. Voz: nota "até 1.000 caracteres (~1 min)".

Fontes: BuildMVPFast/CometAPI/AtlasCloud (custos por segundo de Veo/Kling/Seedance), Puter/Unifically (ElevenLabs), Investing.com (câmbio 05/08/2026).
