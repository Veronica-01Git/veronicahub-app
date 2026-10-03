# Agente exclusivo do Veronica Analytics

Missão: transformar o catálogo habilitado da Hub em sugestões de divulgação verificáveis. Operação interna com publicação de evidências públicas; não é operador financeiro.

## Execução real

- `.github/workflows/analytics-agent.yml`: a cada hora, com `CRON_SECRET` já utilizado pela Hub, em POST autenticado. O primeiro push aguarda o endpoint da versão antes de executar.
- `runtime.server.ts`: lê no Neon somente produtos habilitados e contagens de cliques com `affiliateHandle=veronica` nos últimos 30 dias. Nenhuma tabela de cliente, conversa, usuário ou ledger é consultada.
- Ranking: contagem de encaminhamentos da Hub; desempate pela completude e ID estável. Não calcula demanda, conversão, GMV ou probabilidade de lucro.
- Uma tentativa Groq por hora, com ModelRouter, timeout de 13 segundos, saída limitada a 900 tokens e teto estimado de US$ 0,005. O modelo recebe apenas uma instrução fixa, nenhum dado pessoal, financeiro ou instrução originada do catálogo. A cobrança real não é informada pelo provedor e não é declarada como zero.
- Saída validada em contrato fechado. Modelo ausente, indisponível ou inválido produz conteúdo por regras explicitamente identificado. Falha nas fontes não publica dados fictícios.
- Até três sugestões por rodada. Histórico persistente em tabelas exclusivas; chave por versão/hora, lease de dois minutos e reserva atômica de tentativa de modelo. Repetição da mesma hora não publica ou chama modelo novamente.

## Permissões e limites

O executor possui apenas leitura do catálogo/contagens e escrita de suas próprias sugestões e evidências. Não modifica produto, preço, comissão, pagamento, dados de clientes ou outras rotas. Não envia mensagens nem publica em redes. A publicação da sugestão é reversível pela pausa do agente, que oculta sugestões públicas. O link de compra passa pelo redirect existente com Sub_id veronica e origem analytics_agent.

Administrador pode executar uma rodada e pausar/retomar dentro do Analytics; as ações exigem a sessão administrativa verificada no servidor. Visitantes só acessam o DTO público em GET `/api/agents/analytics/status`, sem códigos de divulgador, receita ou pedidos. A conferência visual da sessão administrativa é uma etapa posterior, conforme pedido do proprietário.

## Evidência e métricas

Na própria rota: horário, modo de geração, sugestões, motivos, produtos conferidos, links recusados, imagens ausentes, duração e histórico. Na vitrine `/agentes#portfolio-analytics`: perfil, capacidades, estado observado e link para a operação. Publicação recente expira após duas horas; falha ou desatualização é exibida como supervisão necessária. A execução não cria comissão: compras elegíveis e importação do relatório da Shopee continuam necessárias.

## Validação

Testes exercitam o executor real com ferramentas controladas: leitura → ranking → validação → persistência; isolamento de tenant; erro de fonte; contrato/injeção do modelo; ausência de provedor; catálogo vazio; permissões HTTP. CI confere tipos, suíte completa e build. Após deploy, conferir a execução autenticada do workflow e a evidência pública no banco antes de declarar atividade.
