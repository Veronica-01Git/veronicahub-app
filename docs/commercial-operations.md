# Operação comercial e supervisão — 08/10/2026

## Entrega funcional

`/implementar` é a entrada do diagnóstico. O visitante escolhe uma oferta, informa necessidade, objetivo, volume e sistemas e autoriza o processamento. O briefing só é salvo depois da autenticação existente. Há um novo pedido por conta e dia de Brasília, protegido por restrição única no banco; repetir o mesmo requestId reutiliza o pedido.

Uma análise de até 1.000 tokens organiza o briefing sem acesso a ferramentas. Usa um único provedor por pedido, Gemini quando configurado ou Groq quando não há Gemini; não encadeia novas chamadas em falha; a saída passa por validação. Falha de modelo preserva análise por regras. Contato e identificador da conta não entram no prompt. A análise não define preço, prazo ou aprovação. Não há novas chamadas automáticas ao repetir o pedido.

`/admin/comercial` exige o administrador existente no servidor. Fluxo: recebido → revisado → proposta aprovada → contratação confirmada, com saída para encerrado. Aprovação exige escopo, valores válidos e justificativa. Atualização condicionada ao estado anterior e registro de decisão acontecem na mesma instrução SQL. Contratação confirmada é declaração do operador; não é pagamento conciliado. O titular vê somente seus pedidos, e valores/escopo só aparecem após aprovação.

Guardian consulta fontes reais: última publicação Wire (janela de 3 horas), estados dos executores Members e Analytics, briefings sem revisão há 48 horas e análises pendentes há 10 minutos. Fonte indisponível vira desconhecida. `/api/cron/guardian` exige POST e CRON_SECRET; registra no máximo um snapshot por hora. Workflow GitHub gera avisos, sem mensagens externas ou reparos automáticos. `/api/agents/commercial/status` publica apenas contagem agregada e estágio interno.

Comercial e Guardian constam do registro V-IVA. Estágio INTERNAL é deliberado: não são agentes certificados nem liberados para clientes por esse cadastro. Comercial registra duração, código de falha e estimativa prévia por análise (a fatura real permanece não conciliada); Guardian não chama LLM, mas banco e infraestrutura têm custos. A avaliação de especificação existente reconhece ambos, sem fabricar resultados de avaliação do modelo.

## Implantação

Aplicar `drizzle/0026_commercial_operations.sql` antes do deploy. Migração somente aditiva: CommercialBrief, CommercialDecision, GuardianSnapshot e um índice. Requer as tabelas User, Article e os executores Members/Analytics já existentes. Usar a CRON_SECRET existente no Worker e no GitHub. Nenhuma credencial fica no repositório. A migração foi validada numa branch Neon isolada, com verificações de quota, estados e atomicidade da decisão. Não há checkout ou assinatura nova; contratos e cobranças dependem do escopo aprovado.

## Critérios para transformar piloto em serviço

O primeiro cliente é a própria Hub. Medir quantidade real de diagnósticos, tempo até revisão, propostas aprovadas e contratações registradas. Receita só pode ser atribuída quando conciliada com pagamento. Medir tokens/custo, latência, alucinação de escopo, isolamento entre contas, falhas e necessidade de intervenção antes de promover o Comercial. Definir SLA somente depois dessa evidência.

Modelo de proposta: implantação conforme integrações e escopo, mensalidade conforme operação/suporte e franquia de uso, excedente explicitado no contrato. A análise não fixa essas tarifas. Antes de vender cada nova operação, testar com dados autorizados do cliente e aprovar permissões e canais.

## Continuidade das sugestões

| Oferta/agente               | Próxima entrega verificável                            | Condição para vender                                                               |
| --------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Atendimento + Comercial     | Piloto Hub com acompanhamento e proposta               | Evidência de resposta/qualificação e custo; número dedicado se houver WhatsApp API |
| Redação + Creative Producer | Briefing → rascunho → revisão → peças versionadas      | Revisão editorial, direitos de mídia, entrega aprovada                             |
| Portfolio Site Architect    | Briefing de site → escopo técnico → proposta           | Complexidade e implantação precificadas, aceite e entrega verificável              |
| Members + Academy           | Triagem de dúvidas e aprendizagem com base autorizada  | Permissões por membro, qualidade pedagógica e escalonamento                        |
| Analytics Commerce          | Relatório com fontes, datas e atribuição identificadas | Nunca chamar estimativa de receita comprovada                                      |
| Social Publisher            | Fila de publicação com aprovação e deduplicação        | Conexões oficiais, canais autorizados e teste sem publicar                         |
| Knowledge                   | Ingestão de documentos com referências por tenant      | Isolamento e resposta sem fonte testados                                           |
| Customer Success            | Alertas de onboarding e risco com evidência            | Dados de uso e regra de contato autorizada                                         |
| Fashion Merchandiser        | Catálogo → seleção → aprovação comercial               | Inventário, direitos de imagem e dados de preço do cliente                         |
| Coach Ops                   | Agenda e acompanhamento administrativo                 | Dados autorizados, limites e encaminhamento ao profissional                        |
| Talent Assistant            | Organização de candidaturas e critérios explícitos     | Revisão humana e rastreabilidade da decisão                                        |
| Reconciliation              | Correspondência de registros sem movimentar fundos     | Extratos autorizados, tolerâncias e revisão de divergências                        |
| Consignação                 | Inventário, proposta e prestação de contas             | Regras de comissão e registros de origem                                           |
| Marina Desk                 | Triagem e agenda conforme disponibilidade real         | Integração de estoque/agenda e aprovação de reserva                                |
| Delivery Coordinator        | Fila de execução e acompanhamento por etapa            | Responsáveis, aceite, dependências e SLA medido                                    |

Essas condições são trabalho de implantação pendente, não funcionalidades concluídas. Não alterar o WhatsApp atual da Express Entulho nem o número pessoal do operador. A hero e o efeito de pupila não fazem parte desta mudança.

## Piloto comercial 1.1.0

`/implementar#demonstracao` contém três cenários interativos de roteiro: pedido fora do horário, agenda e exceção com encaminhamento humano. São exemplos explicitamente identificados, não uma conversa ao vivo com modelo. Não fazem chamadas de IA nem criam registros ou métricas comerciais. O CTA leva ao briefing do visitante sem copiar dados fictícios.

A qualificação exibe cobertura de quatro campos, não probabilidade de venda. O visitante vê perguntas pendentes e a estrutura da oferta (implantação, operação mensal, consumo discriminado). Login compartilhado disponível na conferência do briefing. Após salvar, os campos e o envio são bloqueados para evitar editar o mesmo requestId e apresentar um pedido antigo como novo. No servidor, reenvio idempotente devolve a análise persistida, não uma nova análise. Quota de um novo pedido por conta/dia e acesso do titular continuam no banco/servidor.

Comercial 1.1.0 utiliza o adaptador JSON testado de Members/Analytics. Estimativa conferida antes da chamada, teto de US$0,005 por tarefa, timeout de 12s e deadline de 13s para a rota do modelo. Sem credencial, com erro ou saída inválida: briefing por regras preservado, sem repetição automática. Campos pessoais da conta e empresa não entram no prompt; o visitante continua responsável por não incluir informações confidenciais no texto livre. Metadados de execução ficam no JSON de análise existente, compatível com registros antigos; nenhuma migração adicional.

`/admin/comercial` apresenta contagens de toda a fila, pedidos recebidos sem revisão há 48h, análises aceitas/fallback/pendentes e tempo médio da criação até a primeira decisão reviewed. Média considera apenas pedidos com revisão registrada e exibe tamanho da amostra. Estados mostram situação atual, não um funil de visitas ou eventos únicos: um pedido pode voltar de approved para reviewed. Histórico e fila detalhados limitados aos 100 mais recentes; totais consultam todo o banco. Estimativa por pedido não representa cobrança conciliada. Conteúdo da análise e checklist ficam disponíveis ao revisor.

Para o primeiro piloto externo, ainda falta selecionar empresa e responsável, base e integrações autorizadas, definir o contrato e aferir respostas com dados reais. Checkout e confirmação de pagamento não foram ativados; won permanece declaração manual. WhatsApp dos clientes permanece intocado.
