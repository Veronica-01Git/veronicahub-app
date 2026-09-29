# Veronica Portfolio

Vertical isolada e aditiva. O MVP público vive em `/portfolio`.

## Fronteiras

- não importa módulos de Mercado Pago, carteira ou checkout;
- não persiste gerações nem altera o schema compartilhado;
- briefing pessoal opcional em `localStorage`, chave versionada `veronica.portfolio.brief.v1`, somente após ação explícita; permite recuperar/remover a cópia;
- prévia pessoal determinística: usa apenas fatos preenchidos, omite seções vazias, não chama IA nem inventa resultados;
- exemplo fictício separado e identificado; revisão indica preenchimento, sem notas de qualidade;
- não contém secrets, prompts centrais ou código privado de segurança;
- providers de IA, imagem, vídeo, voz e pagamento entram apenas por contratos;
- versões comercializadas pela Architecture Store devem ser sanitizadas e licenciadas.

## Próximas rotas planejadas

`/portfolio/create`, `/portfolio/preview`, `/portfolio/editor`, `/portfolio/technology` e `/portfolio/store` serão abertas em marcos separados.
