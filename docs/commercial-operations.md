# Operação comercial e supervisão — 08/10/2026

## Entrega funcional

`/implementar` é a entrada do diagnóstico. O visitante escolhe uma oferta, informa necessidade, objetivo, volume e sistemas e autoriza o processamento. O briefing só é salvo depois da autenticação existente. Há um novo pedido por conta e dia de Brasília, protegido por restrição única no banco; repetir o mesmo requestId reutiliza o pedido.

Uma análise de até 500 tokens organiza o briefing sem acesso a ferramentas. Usa a infraestrutura existente de geração de texto, com seus fallbacks; a saída passa por validação. Falha de modelo preserva análise por regras. Contato e identificador da conta não entram no prompt. A análise não define preço, prazo ou aprovação. Não há novas chamadas automáticas ao repetir o pedido.

`/admin/comercial` exige o administrador existente no servidor. Fluxo: recebido → revisado → proposta aprovada → contratação confirmada, com saída para encerrado. Aprovação exige escopo, valores válidos e justificativa. Atualização condicionada ao estado anterior e registro de decisão acontecem na mesma instrução SQL. Contratação confirmada é declaração do operador; não é pagamento conciliado. O titular vê somente seus pedidos, e valores/escopo só aparecem após aprovação.

Guardian consulta fontes reais: última publicação Wire (janela de 3 horas), estados dos executores Members e Analytics, briefings sem revisão há 48 horas e análises pendentes há 10 minutos. Fonte indisponível vira desconhecida. `/api/cron/guardian` exige POST e CRON_SECRET; registra no máximo um snapshot por hora. Workflow GitHub gera avisos, sem mensagens externas ou reparos automáticos. `/api/agents/commercial/status` publica apenas contagem agregada e estágio interno.

Comercial e Guardian constam do registro V-IVA. Estágio INTERNAL é deliberado: não são agentes certificados nem liberados para clientes por esse cadastro. Comercial ainda não tem custo medido por execução; Guardian não chama LLM, mas banco e infraestrutura têm custos. A avaliação de especificação existente reconhece ambos, sem fabricar resultados de avaliação do modelo.

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
