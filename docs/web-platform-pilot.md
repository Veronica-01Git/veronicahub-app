# Primeiro ciclo: Portfolio assistido e Studio interativo

## Entrega

- `/portfolio`: registra `veronica_portfolio_describe` e `veronica_portfolio_prepare_brief` quando `document.modelContext.registerTool` estiver disponível.
- A descrição retorna apenas capacidades públicas e profissões suportadas. O preparo aceita nome (1–80 caracteres) e uma profissão da lista existente.
- O preparo cria uma sugestão visível. O usuário usa ou descarta essa sugestão; depois aciona o botão normal para montar a prévia local com o briefing.
- As ferramentas não leem os campos atuais, não geram conteúdo, não persistem dados e não importam APIs de conta, pagamento ou providers. Não há cadastro de ferramenta para publicação.
- As ferramentas pertencem à rota e são removidas com AbortSignal ao sair dela. Registro rejeitado resulta no formulário normal, sem depender do experimento.
- `/studio-veronica`: referências existentes ganham filtros Todas/Imagens/Vídeo e contador anunciado. A seleção continua preenchendo o compositor.
- A galeria usa transição por elemento quando disponível; cliques rápidos invalidam callbacks antigos. Navegadores sem suporte e usuários com movimento reduzido recebem a atualização direta.
- O seletor usa CSS Anchor Positioning quando suportado; caso contrário, abre em fluxo normal. Escape, clique fora e seleção fecham o controle.

## Estado do WebMCP

É um protótipo para navegadores habilitados no experimento, não uma conexão automática com qualquer chat. Não foi instalado polyfill nem cadastrado token de origin trial para o domínio. No Chrome compatível, a documentação indica `chrome://flags/#enable-webmcp-testing` para testes locais. API conferida em 28/09/2026: `document.modelContext.registerTool(tool, { signal })`.

Referências oficiais:

- https://developer.chrome.com/docs/ai/webmcp
- https://developer.chrome.com/docs/ai/webmcp/imperative-api
- https://developer.chrome.com/docs/css-ui/view-transitions/element-scoped-view-transitions
- https://developer.mozilla.org/en-US/docs/Web/API/Element/startViewTransition

## Verificação manual

1. Abra `/portfolio` em navegador comum: preencher e montar a prévia deve continuar funcionando.
2. Em Chrome com o experimento habilitado, abra o Model Context Tool Inspector indicado na documentação. Confirme as duas ferramentas enquanto a rota está aberta.
3. Execute a descrição; depois prepare `{ "name": "Marina Costa", "profession": "Designer" }`. A proposta aparece, mas os campos e o preview não mudam automaticamente.
4. Teste Descartar e Usar sugestão; a geração exige o botão existente. Profissão inválida ou campos adicionais devem ser recusados.
5. Saia da rota: as ferramentas não devem mais aparecer.
6. No Studio, teste os filtros no desktop e em 390 px, Escape, clique fora, seleção de referência e navegação por teclado.
7. Repita com movimento reduzido e com as APIs experimentais indisponíveis. Os filtros e o compositor devem funcionar normalmente.

Testes automatizados de lógica: `node --test tests/portfolio-webmcp.test.mjs tests/scoped-view-transition.test.mjs`.

## Verificação executada em 29/09/2026

- 11 testes de lógica: validação, ciclo de registro, cancelamento, cliques rápidos e alternativas sem animação.
- TypeScript 5.8 e build Vite dos componentes em ambiente isolado.
- Chromium 153 em 1366 px e 390 px: filtros, posicionamento dentro da tela, preenchimento do compositor, Escape, foco, movimento reduzido e ausência de erros JavaScript. Cabeçalho/rodapé foram substituídos apenas no ambiente temporário de teste; não é uma auditoria de todas as rotas do site.
- WebMCP nativo no Chromium 153 com `--enable-blink-features=WebMCP`: descoberta das duas ferramentas, execução, revisão explícita e remoção ao desmontar a rota. Também testado o formulário normal sem a API.
- A transição usa a forma `element.startViewTransition(callback)`, conferida no navegador. Um exemplo da documentação Chrome usava uma chave `callback` em um objeto, ignorada pelo Chromium testado; a forma com função resolve essa diferença.

Escopo: este ciclo não implementa WebGPU, HTML-in-Canvas ou IA local; são etapas futuras independentes.
