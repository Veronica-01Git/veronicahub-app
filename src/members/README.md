# Veronica Members

Routes: `/membros` and `/admin/membros`. Additive React/TanStack implementation using the existing Neon/Drizzle database, sealed session, email OTP and admin authorization. Every verified Hub account is a free member; no checkout or financial tables are used.

Before deployment, apply `drizzle/0012_member_community.sql` to the same database as the application. This migration creates only the new content and moderation tables/indexes and can be run again safely. No runtime DDL and no changes to existing tables. This repository also has standalone SQL migrations; this file is deliberately standalone, not a generated Drizzle snapshot.

Admin can create/edit drafts, publish, return content to draft and approve/reject pending comments. Members can read published posts, copy prompts and submit moderated comments. The first feed is honestly empty until an administrator publishes. No fabricated members, engagement or announcements.

Images/videos use direct URLs from existing generated assets or the Hub media library. This module does not generate new AI media or upload files. Asset URLs inherit their storage permissions: publication content is session-gated, but an already-public media URL is not a private download. Use private storage/signed delivery if confidential media is required.

Verification: unauthenticated feed returns no posts; non-admin cannot write; drafts are absent from member queries; comments are shown only after approval and only for published posts. All rendering uses escaped React text. CSS is scoped, responsive and honors reduced motion.

## Agente Members (03/10/2026)

`agent-runtime.server.ts` opera exclusivamente para `veronica-hub`, usando o
registro canônico, o ModelRouter e as skills de `agent-policy.ts`.

- Editorial: um exercício por dia UTC, em rodízio de sete temas, com prompt e
  rota oficial. Post, tarefa e execução confirmados na mesma transação.
- Comunidade: até duas respostas por rodada em comentários aprovados. Autoria
  `Agente Members · IA oficial`; sem conta fictícia. Comentários sensíveis vão
  para supervisão. Aprovar/rejeitar comentários continua sendo ação da equipe.
- Insights: contagens reais e últimas 12 tarefas no painel `/admin/membros`.
- Controle: pausa impede novos claims e novas publicações/respostas, inclusive
  quando uma chamada de IA está em andamento. Não cancela cobrança já iniciada.
- Segurança: CRON_SECRET na rota POST; sessão admin nas funções do painel;
  tenant fixo; limite atômico de 18 reservas/dia; 30 s e US$ 0,01 por tarefa;
  nenhum segredo, texto privado ou e-mail no endpoint público de status.
- Custo: reserva conservadora de 4.320 micros USD, baseada em até 48.000 bytes
  de entrada e 2.400 tokens de saída. `actualCostMicros` permanece null: uso de
  tokens ou estimativa não são fatura. Preço consultado em
  https://console.groq.com/docs/models em 03/10/2026.
- Falhas: tarefa não é repetida automaticamente. Inspecionar histórico e
  responder pela equipe quando necessário. Isso evita duplicação em falhas
  de rede depois da publicação. O próximo editorial usa outra chave diária.
- Agendamento: `.github/workflows/members-agent.yml`, a cada quatro horas;
  disponibilidade best-effort do GitHub Actions, sem promessa de horário exato.
- Prova: `/api/agents/members/status` e posts oficiais públicos em `/membros`.
  Conteúdo editorial antigo e comentários de membros preservam autenticação.
  Status pede supervisão se a última publicação tem mais de 36 horas ou se a
  última tarefa falhou. Não usa contadores simulados de engajamento.

Migração aditiva `drizzle/0020_members_agent.sql`, aplicada como as migrações
0012–0019 (fora do journal legado). Testar em branch Neon antes de produção.
Pré-requisitos: tabelas 0019, GROQ_API_KEY, CRON_SECRET e um User admin real.
Não depende do pipeline nem do número WhatsApp da Express.
