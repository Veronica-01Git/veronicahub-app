# Veronica Private Clients — área privada em /clientes

Nova área privada, 100% aditiva. Nada existente é removido, renomeado ou alterado: nenhuma mexida em checkout, pagamentos, Home, Wire, Analytics, Portfolio, Universe, selos públicos ou rotas Express atuais.

## Auditoria dos selos (feita)

Fonte canônica única: `src/lib/seals.ts` (`sealRecords`, `findSeal`), consumida por `/selos` e `/selo/$serial`.

- **Express Entulho** — serial real encontrado: `VH-AUT-WA-2026-000001`, status "em desenvolvimento". Habilitado.
- **LZ Team** — nenhuma ocorrência no projeto. Nenhum serial. Fica "aguardando selo", acesso bloqueado.
- **Cliente têxtil (Veronica Fashion Operator)** — os únicos registros têxteis são conceitos demonstrativos (`VH-AUT-TX-DEMO-0001/0002`, marcas fictícias). Não servem como credencial de cliente real. Fica "aguardando selo", acesso bloqueado.

Nenhum serial será inventado. Cadastrar um serial real depois é uma linha no registry.

## Como funciona o acesso

Portal em `/clientes`: campo "Número de série do selo" + botão "Acessar ambiente". Estados: validando, acesso concedido, serial inválido, selo aguardando ativação. Sem cadastro, sem preços, sem lista de clientes antes de entrar.

A validação acontece no servidor (server function). O navegador nunca recebe a lista de seriais válidos, nem o serial vai por URL. Após validar, grava-se sessão curta em cookie httpOnly/SameSite usando o mesmo mecanismo selado já existente no projeto (`@tanstack/react-start/server`, padrão de `src/lib/session.ts`), com cookie próprio e TTL de 8 horas. O workspace carrega os dados via server function que lê essa sessão — um cliente só enxerga o próprio ambiente; qualquer outro slug devolve acesso negado.

O serial é identificador, não segredo: a área não guarda dado sensível e o registry já tem campo opcional de PIN por cliente, para plugar depois sem quebrar o fluxo.

## Workspaces

Shell comum em `/clientes/$clientSlug`: identidade, serial mascarado (`VH-AUT-…-0001`), status da operação, missão atual, próximas ações, módulos, atividade recente e botão "Falar com Veronica" (reutiliza o drawer conversacional já existente).

**Express Entulho** — somente acompanhamento. Zero ações de WhatsApp: nenhum envio, resposta ou disparo. Apenas status, marcos da implantação lidos do próprio registro de selo, e links para as telas Express que já existem (nada de lógica duplicada).

**LZ Team** — visão geral, objetivo, tarefas, ativos e próximos passos, com estados honestos ("aguardando selo", "não configurado"). Nada de métricas inventadas.

**Veronica Fashion Operator (têxtil)** — protótipo navegável para apresentação ao Edson, com badge DEMO visível em todo dado não real:
1. Veronica Live — painel de conversa + área do avatar; microfone/voz em modo demo rotulado; camada de adapters preparada para providers futuros, sem prometer recurso realtime de nenhum provider.
2. Mapa de Dinheiro — estoque parado, margem, giro, risco, ruptura.
3. Produção — sugestões de quantidade por peça/tamanho, interface demonstrativa.
4. Leads — funil B2B lojistas e B2C, base de ~1.000 leads rotulada como potencial informado.
5. Coleções — ideias, peças, variações, briefing, histórico.
6. Plano de Ação — prioridades por impacto, esforço e status.
7. Recorrência — valor mensal entregue em conceito, sem qualquer cobrança.

Conversa demo curta e interativa ("O que está travando meu caixa?" → resposta derivada dos próprios cards DEMO), respondida no frontend, sem se passar por integração. CTA "Conectar dados reais" desabilitado, marcado como roadmap.

## Detalhes técnicos

Arquivos novos, isolados:

```text
src/features/private-clients/
  registry.ts          tipos + registry (id, slug, displayName, sealSerial, accessState, modules)
  session.server.ts    sessão selada dedicada (cookie httpOnly/SameSite/8h)
  access.functions.ts  validateSeal / getWorkspace / signOut (server fns)
  components/          shell, header, cards, badge DEMO
  data/express.ts | lz-team.ts | fashion.ts   conteúdo por cliente (DEMO explícito no têxtil)
src/routes/clientes/index.tsx
src/routes/clientes/$clientSlug.tsx
```

Registry cruza cada cliente com `findSeal()` de `src/lib/seals.ts` — a fonte canônica continua sendo a existente. Sem dependências novas, TypeScript estrito, design system e tokens atuais, mobile first, foco visível, aria e reduced-motion.

Validação antes de entregar: `npm run typecheck`, `npm run build`, `node --test tests/*.test.mjs`, e checagem no navegador de `/clientes` em desktop e mobile — serial inválido não entra, cliente sem selo vê "aguardando ativação", Express sem nenhum botão de envio, têxtil com DEMO visível, rotas antigas intactas.
