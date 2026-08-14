# Veronica Studio — Arquitetura de Produção
## De simulado a real: usuários pagantes gerando vídeo, imagem e voz dentro do VeronicaHub

Data: 05/08/2026 · Atualizado: 14/08/2026 · Base analisada: `src/routes/video-ia.tsx`, `src/lib/*-server.ts`, `src/lib/schema.ts`

> **Atualização 14/08/2026:** boa parte da Fase 1 deste documento já foi construída — banco, auth real,
> carteira com ledger e webhook do Mercado Pago estão em produção. O que ainda falta está marcado
> `[ ]` ao longo do documento; o que já existe está marcado `[x]` com o arquivo correspondente.
> Detalhes na seção 4 e no checklist da seção 6.

---

## 1. Visão geral

O front do Studio já estava pronto desde o início. A camada de servidor **já existe**, mas cobre hoje só
um provedor de geração:

```
Usuário (video-ia.tsx)
   │  server function (RPC, cookie de sessão selado)
   ▼
Backend VeronicaHub (TanStack Start server functions, Worker Cloudflare — src/server.ts)
   │  1. valida sessão                         [x] session.ts
   │  2. modera o prompt                       [ ] não implementado
   │  3. verifica e debita saldo (ledger)       [x] wallet-server.ts
   │  4. cria job no provedor                   [x] só Nano Banana Pro — higgsfield.ts
   ▼
Higgsfield API — hoje só Nano Banana Pro (text2image/soul) está integrada.
Seedance, Veo, Kling, Sora, Midjourney, FLUX e voz continuam simulados no cliente.
   │  job síncrono com poll interno (a chamada ao servidor só retorna quando termina)
   ▼
Backend recebe o resultado
   │  5. baixa o arquivo → salva no R2 (storage próprio)   [ ] não implementado
   │  6. marca o job como concluído no banco               [ ] não há tabela `generations` ainda
   ▼
Usuário recebe a imageUrl direto da Higgsfield na resposta do RPC — sem galeria "Minhas gerações"
```

Princípio central: **o arquivo gerado é SEU, servido do SEU storage**. Nunca entregue a URL do provedor direto ao usuário (expira, vaza infra, sem controle).
**Esse princípio ainda não está implementado** — a única geração real hoje devolve a URL da Higgsfield direto ao cliente. Fica como o item mais importante em aberto da Fase 1 (ver 4.5).

---

## 2. Provedores por formato

| Formato no Studio | Motor anunciado | Provedor real recomendado |
|---|---|---|
| Vídeo | Seedance 2.0 | Higgsfield API ✅ |
| Vídeo | Veo 3.1 | Higgsfield API ✅ |
| Vídeo | Kling 2.5/3.0 | Higgsfield API ✅ |
| Vídeo | Sora 2 | OpenAI API (separado) — ou remover na fase 1 |
| Imagem | Nano Banana Pro | Higgsfield API ✅ |
| Imagem | FLUX | Higgsfield API ✅ |
| Imagem | Midjourney v7 | ⚠️ Sem API oficial — substituir (ex.: Seedream 4.5 via Higgsfield) ou remover |
| Voz | ElevenLabs v3 | ElevenLabs API (direta, referência do mercado) |
| Voz | OpenAI Voice | OpenAI API ou voz da Higgsfield |
| Avatar | HeyGen | HeyGen API (separada) — fase 2 |
| Avatar | Synthesia | Synthesia API (separada) — fase 2 |

**Recomendação fase 1:** lançar só com Higgsfield (vídeo: Seedance/Veo/Kling; imagem: Nano Banana Pro/FLUX) + ElevenLabs (voz). Cobre ~90% do valor com 2 integrações. Sora, Midjourney e avatares entram na fase 2.

---

## 3. O plano ideal (custos do lado Higgsfield)

Dois contextos diferentes — não confundir:

**(a) Sua conta pessoal (MCP/site)** — para VOCÊ criar conteúdo do ecossistema.
Recomendado: **ULTRA anual (~US$ 63/mês, 51% off)** — 3.000 créditos/mês, menor custo por crédito, unlimited de 365 dias em modelos de imagem. Se preferir validar antes: PLUS mensal US$ 49.

**(b) A API do Studio (produção)** — chave de desenvolvedor com billing próprio, criada no painel de developer da Higgsfield. É ela que atende seus usuários. O custo é por consumo (créditos de API comprados à parte; referência de mercado: ~US$ 5 por 100 créditos em top-ups). **Confirme os valores no painel da API antes do lançamento** — o preço por geração define sua margem.

### Margem estimada por geração (referências)

| Item | Seu preço (site) | Custo estimado de API | Margem bruta |
|---|---|---|---|
| Vídeo Seedance 1080p ~5-10s | R$ 29,90 | ~US$ 0,25–0,75 (≈ R$ 1,40–4,20) | ~85–95% |
| Vídeo Veo 3.1 1080p | R$ 34,90 | ~US$ 0,50–1,50 | ~75–90% |
| Vídeo 4K premium | R$ 54,90–89,90 | 2–4× o 1080p | alta |
| Imagem Nano Banana Pro | R$ 4,90 | ~US$ 0,02–0,10 | ~90%+ |
| Voz ElevenLabs (30s) | R$ 7,90 | ~US$ 0,05–0,15 | ~90%+ |

Sua tabela de preços atual é viável com folga. Risco a controlar: usuário gerando 4K longo em loop — resolver com rate limit + débito antes da geração.

---

## 4. O que precisa ser construído (backend)

### 4.1 Banco de dados — [x] construído
Decisão tomada: **Neon Postgres + Drizzle** (não D1, não Prisma). Driver HTTP do Neon
(`drizzle-orm/neon-http`, ver `src/lib/db.ts`) — sem WebSocket/TCP, roda em Cloudflare Workers.
Prisma foi descartado porque o engine WASM não instancia no build real de Workers.

Tabelas reais hoje (`src/lib/schema.ts`), compartilhadas por Studio, Currículo-Certo e Currículo-Certo RH:

```
User          (id, email, role, balanceCents, freeVideoCredits, freeImageCredits, createdAt, updatedAt)
EmailOtp      (id, email, codeHash, expiresAt, consumedAt, attempts, createdAt)
WalletTopUp   (id, userId, amountCents, status[PENDENTE|PAGO|CANCELADO], gatewayPaymentId, createdAt, paidAt)
LedgerEntry   (id, userId, deltaCents, reason, createdAt)
```

Sem `generations` ainda — a geração de imagem não fica registrada no banco, só o débito no ledger.
Sem `otp_codes` genérico por telefone — só e-mail. Saldo é um campo (`balanceCents`) debitado com
`UPDATE … WHERE balanceCents >= preço` condicional, não `SUM(ledger)`; o ledger existe como auditoria
paralela, não como fonte da verdade do saldo — divergência entre os dois é o sinal de alerta a monitorar.

### 4.2 Auth real — [x] construído
Implementado em `src/lib/auth-server.ts` e `src/lib/session.ts`, só por e-mail (sem SMS):
- `requestEmailCode` → gera OTP de 6 dígitos, hash SHA-256, envia por **Resend**; cooldown de 60s entre
  pedidos, expira em 10min, máx. 5 tentativas erradas.
- `verifyEmailCode` → valida hash, cria o `User` se não existir, abre sessão via
  `@tanstack/react-start/server` `useSession` (cookie `httpOnly`/`secure`/`sameSite=lax`, selado com
  `SESSION_SECRET` — não é JWT nem session token em tabela própria).
- Créditos grátis (1 vídeo + 2 imagens) vêm do `default` da coluna em `User`, creditados na criação da
  conta — não passam pelo ledger nesse momento.

### 4.3 Pagamentos (depósito real) — [x] construído
Implementado em `src/lib/mercadopago.ts` e `src/lib/mercadopago-webhook.ts`, mesma conta de produção do
negocio-da-china-app:
- `createDeposit` cria a preferência (Checkout Pro, Pix + cartão) com `external_reference` = id do
  `WalletTopUp`.
- Webhook em rota fixa `/api/mercadopago-webhook`, interceptada em `src/server.ts` **antes** do handler
  SSR do TanStack (a URL com hash de RPC não serve para registrar no painel do MP). Aceita os dois
  formatos do MP (assinatura `x-signature` do painel novo e IPN legado por query string); quando não há
  assinatura, confia só porque rebusca o pagamento de verdade na API do MP antes de creditar.
- Credita o ledger **só** na transição `PENDENTE → PAGO` via `UPDATE … WHERE status = 'PENDENTE'`
  condicional — replay do mesmo evento vira no-op (idempotência pelo próprio WHERE, sem tabela de locks).
- Sem depósito mínimo de R$ 25 configurado no código — só um teto de R$ 2.000 por depósito
  (`MAX_DEPOSIT_CENTS`, anti-abuso).

### 4.4 Geração — [~] parcialmente construído
Real hoje só para **Nano Banana Pro** via `generateNanoBanana` (`src/lib/wallet-server.ts` +
`src/lib/higgsfield.ts`). O fluxo implementado:
1. [x] Sessão válida?
2. [~] **Moderação** — a Higgsfield já roda filtro de segurança em duas etapas (prompt e imagem
   gerada) e devolve status `nsfw`, que o código trata como falha com estorno automático (14/08/2026:
   agora com mensagem amigável ao usuário e `LedgerEntry` com motivo `refund:moderation_nsfw`,
   separado de `refund:generation_failed`, para dar rastro auditável de tentativas bloqueadas por
   usuário). Decisão do produto: só registrar, não bloquear a conta automaticamente — revisão de abuso
   fica manual. Continua faltando: uma checagem **antes** da chamada à Higgsfield, que evitaria gastar
   a chamada (e o tempo do usuário) num prompt que sabidamente vai ser recusado.
3. [ ] **Rate limit** — não implementado; sem Upstash Ratelimit nem equivalente.
4. [x] Preço fixo no servidor (`NANO_BANANA_PRICE_CENTS = 490`), nunca confia no preço do front.
5. [x] Débito condicional atômico (crédito grátis primeiro, senão saldo) + `INSERT LedgerEntry` —
   antes da chamada ao provedor, não depois.
6. [x] Chamada à Higgsfield com `HF_CREDENTIALS` (env var, nunca no client) — `fetch` cru em vez do SDK
   oficial (`@higgsfield/client` monta o body sem o wrapper `params` que a API exige e retorna 422).
7. [x] Se a Higgsfield falhar: **estorno automático** do que foi debitado + novo `LedgerEntry` de refund.

Vídeo (Seedance/Veo/Kling/Sora), Midjourney, FLUX além de Nano Banana, voz e avatar seguem simulados
no cliente — mesmo padrão de débito real que a imagem já usa pode ser reaproveitado quando cada um for
integrado.

Diferença do desenho original: não há `POST /api/studio/generate` assíncrono com `generation_id` —
é uma **server function síncrona** que já faz o poll internamente e só retorna quando a Higgsfield
termina (~alguns segundos, viável para imagem; não seria para vídeo).

### 4.5 Entrega — [ ] não construído
- Sem **Cloudflare R2**: a imagem gerada é entregue como a URL da própria Higgsfield, direto ao
  cliente. Viola o princípio da seção 1 ("o arquivo é seu, servido do seu storage") — ainda não é um
  problema prático porque só imagem está em produção, mas é o próximo item de dívida técnica antes de
  escalar.
- Sem galeria "Minhas gerações": nada persiste qual imagem cada usuário gerou, só o débito no ledger.

### 4.6 Segurança e operação
- [x] Chaves de API em env vars server-only (`HF_CREDENTIALS`, `MERCADOPAGO_ACCESS_TOKEN`,
  `MERCADOPAGO_WEBHOOK_SECRET`, `SESSION_SECRET`, `RESEND_API_KEY`) — nunca expostas ao client.
- [x] Assinatura do webhook do Mercado Pago validada (`WebhookSignatureValidator`).
- [ ] Logs de custo real vs. cobrado por job — não implementado; sem monitoramento de margem.
- [ ] Alerta de saldo baixo na conta Higgsfield — não implementado.
- [ ] Termos de uso do Studio (propriedade de conteúdo, conteúdo proibido, reembolso) — não verificado no repo.

---

## 5. Fases de implementação

**Fase 1 — MVP real:** ✅ concluída, exceto a galeria.
banco (Neon+Drizzle) + auth real (OTP por e-mail) + Mercado Pago (webhook assinado) + geração de imagem
(Nano Banana Pro via Higgsfield) já estão em produção. Falta só: galeria "Minhas gerações" + storage
próprio (R2) — o item que fecha o princípio "o arquivo é seu" da seção 1.

**Fase 2 — Vídeo:** não iniciada.
Seedance/Veo/Kling via Higgsfield, polling de jobs longos (a versão síncrona atual de `generateNanoBanana`
não escala para vídeo — precisa virar assíncrono com `generation_id` + polling/SSE), refund automático
(o padrão de estorno já existe e é reaproveitável).

**Fase 3 — Voz e avatar:** não iniciada.
ElevenLabs; depois HeyGen/Synthesia se a demanda justificar.

**Fase 4 — Crescimento:** não iniciada.
pacotes de créditos com desconto, assinatura mensal do Studio, histórico compartilhado com o resto do ecossistema Veronica.

---

## 6. Checklist

- [x] Criar chave de API no painel de developer da Higgsfield — `HF_CREDENTIALS` configurada, Nano Banana Pro em produção
- [ ] Confirmar termos da API para uso comercial/revenda
- [x] Decidir banco — Neon Postgres + Drizzle (não D1, não Prisma)
- [x] Conta Resend (e-mail OTP) — `RESEND_API_KEY`/`EMAIL_FROM` configuradas
- [x] Credenciais Mercado Pago de produção — mesma conta do negocio-da-china-app
- [ ] Bucket R2 criado no painel Cloudflare
- [ ] Rate limit por usuário nas rotas de geração/débito
- [x] Rastro auditável de bloqueios NSFW no ledger (`refund:moderation_nsfw`) — 14/08/2026
- [ ] Moderação de prompt *antes* da chamada ao provedor (hoje só reage ao `nsfw` que a Higgsfield já processou)
- [ ] Tabela `generations` + galeria "Minhas gerações"
- [ ] Logs de custo real vs. cobrado por job (monitorar margem)
