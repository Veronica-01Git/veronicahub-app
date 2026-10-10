# Veronica · Agentes Humanos

A vitrine é `/agentes-humanos`. O LZ Training Club permanece a identidade de Lucas Tomaz em `/clientes/lz-team`; Lee Ricardo tem `/clientes/lee-ricardo`. Cada profissional tem home, membros e painel. O tema escuro é o padrão e a preferência é salva por identidade.

## Fluxo operacional

1. O visitante confirma a conta usando o login por código de e-mail já existente na Hub.
2. Informa objetivo, disponibilidade, experiência e cuidados; confirma ser maior de idade e autoriza o atendimento do profissional selecionado.
3. O servidor valida as respostas, prepara um guia educativo por regras e grava a jornada vinculada à conta e ao profissional.
4. O aluno lê seu guia, salva em PDF pelo diálogo de impressão e pode excluir sua avaliação.
5. A equipe autorizada lê avaliações somente do próprio ambiente e publica um plano estruturado, com autoria de revisão registrada no servidor.
6. O plano aparece na conta do aluno. Aulas, comunidade e alunos existentes do LZ continuam na operação original.

O guia gratuito não é uma prescrição. Dor, limitação ou pedido de avaliação recebem encaminhamento para revisão individual. O fluxo atual não envia a avaliação a modelos externos nem publica conteúdos ou mensagens automaticamente.

## Configuração

Reutiliza `DATABASE_URL`, `SESSION_SECRET`, `RESEND_API_KEY` e `EMAIL_FROM`. A autenticação continua por código de e-mail; não foi introduzida autenticação por senha.

- `LZ_TEAM_STAFF_EMAILS`: equipe de Lucas, existente.
- `LEE_RICARDO_STAFF_EMAILS`: equipe de Lee. Lista vazia fecha a gestão para todos.

A migração `drizzle/0024_wellness_journey.sql` é aditiva. O primeiro acesso autenticado aplica a mesma criação idempotente da tabela e índices. O usuário de banco precisa ter permissão para criar essa tabela, ou a migração deve ser aplicada antes da ativação. Erros mantêm o acesso fechado.

As informações públicas de Lee foram fornecidas pelo proprietário da Hub. Não foram inventadas fotografias, credenciais, depoimentos, resultados ou disponibilidade comercial.

## Validação

Testes de objetivos, personalização, limites, maioridade, autorização e encaminhamento por limitação. A suíte existente cobre navegação, acessos privados e demais operações da Hub. Validação de tipos e build Cloudflare também são necessárias. Autenticação com entrega real de e-mail, gravação no Neon e revisão por contas reais dependem das credenciais e listas do ambiente de produção.
