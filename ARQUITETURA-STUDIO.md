# Veronica Studio — Arquitetura de Produção
## De simulado a real: usuários pagantes gerando vídeo, imagem e voz dentro do VeronicaHub

Data: 05/08/2026 · Base analisada: `src/routes/video-ia.tsx`, `src/lib/account.ts`

---

## 1. Visão geral

O front do Studio já está pronto e bem estruturado. O que falta é a camada de servidor:

```
Usuário (video-ia.tsx)
   │  POST /api/studio/generate
   ▼
Backend VeronicaHub (TanStack Start server routes, Cloudflare Workers)
   │  1. valida sessão (auth real)
   │  2. modera o prompt
   │  3. verifica e debita saldo (ledger transacional)
   │  4. cria job no provedor
   ▼
Higgsfield API (agregador: Seedance, Veo, Kling, Nano Banana, FLUX, voz)
   │  job assíncrono (30s–5min)
   ▼
Backend recebe/consulta o resultado
   │  5. baixa o arquivo → salva no R2 (storage próprio)
   │  6. marca o job como concluído no banco
   ▼
Usuário vê o resultado na galeria "Minhas gerações" (polling ou SSE)
```

Princípio central: **o arquivo gerado é SEU, servido do SEU storage**. Nunca entregue a URL do provedor direto ao usuário (expira, vaza infra, sem controle).

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

### 4.1 Banco de dados
O veronicahub-app hoje não tem banco (a "sessão" vive no localStorage). Como o deploy é Cloudflare Workers (wrangler), as opções naturais:

- **Cloudflare D1** (SQLite gerenciado, nativo do Workers) — mais simples, zero infra nova; ou
- **Neon Postgres + Prisma** — mesmo stack do negocio-da-china-app, você já domina.

Tabelas mínimas:

```
users          (id, email/phone, created_at, free_video_credits, free_image_credits)
ledger         (id, user_id, type[deposit|debit|refund|bonus], amount_cents, ref, created_at)
generations    (id, user_id, format, engine, tier, prompt, status[queued|running|done|failed],
                provider_job_id, price_cents, r2_key, created_at, finished_at)
otp_codes      (id, identifier, code_hash, expires_at, used)
```

Saldo do usuário = SUM(ledger) — nunca um campo editável.

### 4.2 Auth real
O fluxo de código por e-mail/SMS que você desenhou é ótimo — só precisa sair do client:
- `POST /api/auth/request-code` → gera OTP, envia por e-mail (Resend, grátis até 3k/mês) ou SMS (Twilio); salva hash com expiração de 10min.
- `POST /api/auth/verify` → valida, cria sessão (cookie httpOnly assinado, JWT ou session token no banco).
- Créditos grátis (1 vídeo 1080p + 2 imagens NB Pro) creditados no ledger na criação da conta — exatamente como o site promete.

### 4.3 Pagamentos (depósito real)
- **Mercado Pago** (você já integra no negocio-da-china-app — reusar conhecimento e conta): Pix + cartão, ideal pra público BR.
- Fluxo: `POST /api/deposits` cria preferência → usuário paga → **webhook** do MP confirma → credita no ledger. Nunca creditar no retorno do navegador, só no webhook.
- Depósito mínimo R$ 25 (como no site).

### 4.4 Geração
`POST /api/studio/generate`:
1. Sessão válida? Prompt não vazio?
2. **Moderação**: bloquear conteúdo proibido (uma chamada barata a um modelo de moderação, ou as flags da própria Higgsfield).
3. **Rate limit** por usuário (Upstash Ratelimit — você já usa no outro projeto): ex. 5 jobs simultâneos, 60/dia.
4. Preço do servidor (NUNCA confiar no preço vindo do front).
5. Débito transacional no ledger + criação do registro em `generations`.
6. Chamada à Higgsfield API com a chave secreta (env var no Wrangler: `HIGGSFIELD_API_KEY` — jamais no client).
7. Retorna `generation_id` pro front.

`GET /api/studio/generations/:id` (polling do front a cada 3-5s) ou SSE:
- Consulta status no provedor; quando pronto, baixa o arquivo → `R2.put()` → atualiza registro.
- Se o job falhar: **refund automático** no ledger + status failed.

### 4.5 Entrega
- **Cloudflare R2** (sem custo de egress, nativo do Workers) com URLs assinadas ou rota `/api/media/:id` que valida dono.
- Galeria "Minhas gerações" no Studio: lista `generations` do usuário com preview, download e prompt usado.

### 4.6 Segurança e operação
- Chaves de API só em secrets do Wrangler (`wrangler secret put`).
- Logs de cada job (custo real vs. cobrado) — monitorar margem.
- Alerta de saldo baixo na conta Higgsfield (cron do Workers).
- Termos de uso do Studio: propriedade do conteúdo, conteúdo proibido, política de reembolso.

---

## 5. Fases de implementação

**Fase 1 — MVP real (1-2 semanas de trabalho):**
banco + auth real + Mercado Pago + geração de imagem (Nano Banana Pro via Higgsfield) + galeria. Imagem primeiro porque é barato, rápido (segundos) e valida o fluxo inteiro de ponta a ponta.

**Fase 2 — Vídeo:**
Seedance/Veo/Kling via Higgsfield, polling de jobs longos, refund automático.

**Fase 3 — Voz e avatar:**
ElevenLabs; depois HeyGen/Synthesia se a demanda justificar.

**Fase 4 — Crescimento:**
pacotes de créditos com desconto, assinatura mensal do Studio, histórico compartilhado com o resto do ecossistema Veronica.

---

## 6. Checklist antes de codar

- [ ] Criar chave de API no painel de developer da Higgsfield e confirmar preços por modelo
- [ ] Confirmar termos da API para uso comercial/revenda
- [ ] Decidir banco: D1 (nativo) ou Neon+Prisma (familiar)
- [ ] Conta Resend (e-mail OTP) — grátis pra começar
- [ ] Credenciais Mercado Pago de produção
- [ ] Bucket R2 criado no painel Cloudflare
