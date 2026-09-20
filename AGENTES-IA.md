# Agentes de IA — rota `/agentes`

Agentes guiados pela Veronica, desenvolvidos pela **Yo Lab & co.**

Levantado em 20/09/2026. Este arquivo diz **o que já funciona**, **o que só
está desenhado** e **o que depende de decisão sua** — separados, porque
misturar os três é como se vende software que não existe.

---

## O que a rota é

Uma vitrine de agentes onde o usuário escolhe a solução, prova antes de pagar
e depois compra: avulso (uma solução), mensal ou anual.

Dois agentes hoje:

| Agente                  | O que faz                                       | Teste grátis |
| ----------------------- | ----------------------------------------------- | ------------ |
| **WhatsApp Empresarial** | Atende cliente com os preços e o jeito do dono  | 6 horas      |
| **Veronica Analytics**   | Escolhe a oferta e escreve o criativo do afiliado | —          |

---

## A ideia que organiza o agente de WhatsApp

**O onboarding não tem formulário.** O caminho padrão do mercado pede trinta
campos antes de mostrar qualquer coisa, e é por isso que quase ninguém termina.
Aqui o dono tem três caminhos, e escolhe o que for mais rápido para ele:

1. **Falar.** A Veronica faz seis perguntas em vídeo, ele responde gravando.
   O áudio é transcrito e vira o material.
2. **Colar a conversa.** Ele exporta o `.txt` do WhatsApp — ou cola um trecho
   de um dia movimentado — e o modelo extrai preço, cidade e jeito de falar.
3. **Escrever.** Do jeito dele, desorganizado. A agente organiza.

**A prova vem antes do pagamento.** Depois de alimentada, a Veronica **vira
cliente** e conversa com a agente na frente do dono: pergunta preço antes de
dizer o que precisa, pede desconto, cita cidade que talvez ele não atenda.

**E a guarda roda na simulação igual roda em produção.** Todo valor citado
pela agente é conferido contra o briefing; valor que não está lá é descartado
e vira encaminhamento para humano, com o motivo à vista para o dono. Uma
demonstração que alucina preço é pior que nenhuma demonstração — ela ensina o
cliente a confiar no que não dá para confiar. A conferência reaproveita
`valoresCitados` de `whatsapp-agent.ts`; não há um segundo regex de moeda.

---

## O que FUNCIONA de verdade hoje

| Peça                                 | Onde                                    |
| ------------------------------------ | --------------------------------------- |
| Teste de 6h, idempotente             | `iniciarTeste` (índice único impede o segundo teste) |
| Transcrição de áudio                 | `transcreverBriefing` — Groq `whisper-large-v3-turbo` |
| Extração de preços/cidades/tom       | `enviarBriefing` — cadeia Anthropic → Groq |
| Simulação Veronica-como-lead         | `simularLead` — dois modelos, um de cada lado |
| Guarda de preço na simulação         | `simularLead`, via `valoresCitados`     |
| Entrevista e recomendação de oferta  | `recomendarOferta` — só ids do catálogo real |
| Kit criativo (gancho/roteiro/legenda/hashtags) | `gerarKitCriativo`            |
| Débito avulso e contratação de plano | `debitarAvulso`, `contratarPlano`       |
| Recarga de saldo                     | reaproveita `createDeposit` (Mercado Pago) |

A cadeia de provedores é a **mesma do agente de produção**
(`whatsapp-provedores.ts`): Anthropic principal, Groq de reserva. A
demonstração falha do mesmo jeito que o produto falha — é isso que faz o que
o cliente vê na simulação ser o que ele leva depois.

---

## O que está desenhado, mas ainda não existe

- **Os vídeos da Veronica perguntando.** A rota espera
  `/videos/agente-p1.mp4` … `agente-p6.mp4`. Enquanto os arquivos não
  existirem, a página mostra a pergunta escrita e **continua funcionando** —
  mesma estratégia do `StepVideo` em `VeronicaDrawer.tsx`, que nunca deixa um
  `<video>` quebrado na tela. Para produzir: Vidu S1, Higgsfield ou
  ElevenLabs (voz) + lipsync. Nenhum crédito foi gasto sem sua ordem.
- **Conferência humana do briefing.** A coluna `AgenteBriefing.conferido`
  existe e nasce `false`. Enquanto for `false`, aquele material é palpite de
  modelo: serve para a simulação, **não para cliente real**. Falta a tela
  onde alguém marca como conferido.
- **Ligar a agente do usuário a um número real.** Hoje a simulação prova a
  ideia; pôr no WhatsApp de verdade ainda passa por número dedicado e
  verificação de negócio na Meta (ver `AGENTS.md` e `PENDENCIAS-CLIENTE.md`).
- **Cobrança recorrente.** Não existe, de propósito — ver abaixo.

---

## Três decisões que tomei, e por quê

### 1. Preço com procedência, não preço inventado

`whatsapp-rules.ts` diz que nada entra sem fonte, e dezesseis preços foram
removidos em 19/09 por não terem. Uma rota comercial que exibe valores não
podia contrariar isso.

Então todo preço em `src/lib/agentes.ts` carrega um campo `procedencia`, e
enquanto `confirmadoPor`/`confirmadoEm` forem `null`, **a tela mostra o valor
marcado como "a confirmar"**. Os valores atuais são proposta minha, calculada
sobre custo real de API por conversa:

| Agente    | Avulso  | Mensal    | Anual       |
| --------- | ------- | --------- | ----------- |
| WhatsApp  | R$ 2,90 | R$ 497,00 | R$ 4.970,00 |
| Analytics | R$ 9,90 | R$ 97,00  | R$ 970,00   |

**Para confirmar, troque só `confirmadoPor` e `confirmadoEm`** no
`PROPOSTA_CLAUDE` de `src/lib/agentes.ts`. A marcação some sozinha da tela.
Para trocar o valor, mude `precoCents` e a `fonte` junto. Um teste
(`tests/agentes.test.mjs`) recusa confirmação pela metade.

### 2. Crédito é saldo em reais, não uma segunda moeda

Você pediu "tokens". Implementei como **crédito na carteira que já existe**
(`User.balanceCents`), não como uma moeda paralela com câmbio próprio. Duas
moedas seriam dois saldos para conciliar, e o `LedgerEntry` deixaria de fechar
com o extrato do Mercado Pago. Na tela, continua se chamando crédito.

Os pacotes de recarga **não têm bônus** ("pague 100, leve 120"). Bônus é
decisão comercial sua e mexe no webhook (creditar mais do que entrou) — então
não entrou por conta própria. Se você quiser, é uma mudança pequena e
localizada.

### 3. Plano com prazo fixo, não assinatura recorrente

Mensal e anual são **debitados do saldo** e vencem em `expiraEm`. Não há
cobrança automática no cartão.

Por quê: recorrência de verdade exige webhook de ciclo, tratamento de falha de
cobrança e fluxo de cancelamento — infraestrutura que este projeto ainda não
tem. Debitar da carteira usa o caminho de pagamento que **já funciona em
produção**. É menos cômodo e muito mais honesto do que anunciar uma
recorrência que não existe.

---

## O que só você pode responder

1. **Os preços da tabela acima.** Enquanto não confirmar, a página os exibe
   marcados. Isso é proposital, não é bug.
2. **Bônus nos pacotes de recarga?** Se sim, quanto — e eu mexo no webhook.
3. **Os vídeos da Veronica.** Quer que eu gere com Vidu S1 / Higgsfield?
   Consome crédito da sua conta, por isso não fiz sem ordem.

---

## Arquivos

```
src/lib/agentes.ts           catálogo, preços e procedência (fonte única)
src/lib/agentes-server.ts    teste, briefing, transcrição, simulação, cobrança
src/routes/agentes.tsx       a rota
src/lib/schema.ts            AgenteAssinatura, AgenteBriefing (ao final)
drizzle/0011_agentes_ia.sql  migração
tests/agentes.test.mjs       trava a regra de procedência e a rota
```

Banco: rodar `drizzle-kit migrate` antes do deploy — a rota depende das duas
tabelas novas.
