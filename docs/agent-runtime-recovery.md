# Recuperação Members e Analytics — 08/10/2026

## Causa observada e correção

Guardian apontou tarefas Members com PROVIDER_UNAVAILABLE e rodadas Analytics concluídas com modelIssue=true. Os adaptadores liam process.env.GROQ_API_KEY; o transporte corrigido do Wire já resolve a credencial nativa do Worker em cada requisição. Members e Analytics agora usam getRuntimeSecret para GROQ_API_KEY e CRON_SECRET, sem capturar valores no build.

O adaptador JSON compartilhado mantém o receptor nativo do fetch, exige JSON válido, recusa saída truncada e preserva cancelamento e orçamento do ModelRouter. Erros registram somente códigos fechados: credencial, limite do provedor, timeout, saída inválida ou truncada. Corpos de resposta, credenciais e prompts não são registrados. Validação editorial e comercial continua obrigatória.

Analytics 1.0.1 reserva uma tentativa por slot horário. O limite de saída passa de 900 a 1600 tokens; entrada incluindo sistema está limitada a 4000 caracteres, mantendo reserva conservadora de 2000 micros USD e teto de 5000. Guarda de tenant e links permanece intacta. Fallback por regras permanece explícito e registra modelFailure; isso não representa sucesso do modelo.

Members 1.0.1 pode retomar tarefa FAILED após 15 minutos, até três tentativas por tarefa, sob teto diário de 18 reservas. Novas tentativas recebem novo AgentExecution; as anteriores são preservadas. SUCCEEDED, REVIEW e RUNNING não são retomados automaticamente. Uma tarefa RUNNING interrompida requer supervisão. A publicação continua condicionada ao estado ativo, à tarefa vigente e às regras de conteúdo. O teto não é faturamento observado.

Aplicar drizzle/0027_member_task_recovery.sql antes do deploy. Migração aditiva, um contador na tabela existente. Validado em branch Neon isolada: lease inicial, recusa de duplicação, nova execução após falha, histórico preservado e teto de tentativas. Workflows esperam a versão 1.0.1 antes da primeira execução após deploy. Confirmar resultados reais em AgentExecution, MemberAgentTask e AnalyticsAgentRun; workflow verde sozinho não prova qualidade do modelo.

Referência de limites e estimativa do modelo: https://console.groq.com/docs/models e https://console.groq.com/docs/api-reference (conferidas em 08/10/2026). Estágio INTERNAL e critérios V-IVA não foram promovidos por essa recuperação.

## Resultado real da primeira correção e alternativa

O deploy 1.0.1 confirmou PROVIDER_AUTH nos dois agentes. A credencial vigente Groq é recusada pelo provedor; trocar somente o acesso à configuração não resolveu. A versão 1.0.2 prefere Gemini 3.5 Flash-Lite quando GEMINI_API_KEY está configurada, usando a mesma infraestrutura autenticada da Hub. Se Gemini não estiver configurado, escolhe Groq. Há um único provedor por tarefa, sem multiplicar tentativas de custo desconhecido. Guardas de tenant, conteúdo, quota e aprovação permanecem.

Reserva Gemini: um token por byte UTF-8 da entrada + margem de 1024 tokens, USD 0,30/M input e 2,50/M output, conferidos em https://ai.google.dev/gemini-api/docs/pricing. Members permite 2400 tokens dentro do teto de 10000 micros; entrada longa pode ser recusada antes de qualquer chamada. Analytics permite 1400 tokens dentro de 5000 micros. O custo gravado permanece estimativa, sem alegar cobrança observada. Execuções Members registram providerId e model do provedor realmente escolhido; Analytics persiste esses campos no resultado.

Uma falha de versão anterior pode ser retomada imediatamente depois da mudança de versão, sempre sob o mesmo limite de três tentativas e teto diário. Falhas da versão corrente continuam esperando 15 minutos. Histórico das versões anteriores preservado.
