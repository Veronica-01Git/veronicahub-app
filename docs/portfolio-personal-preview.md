# Portfolio: briefing e prévia pessoal

## Objetivo

Priorizar a apresentação do trabalho do visitante. O antigo modelo fictício continua disponível em uma ação explicitamente identificada, separado da prévia pessoal.

## Entrega

- Briefing com identidade, apresentação, competências, até três projetos, experiência, formação e e-mail opcional.
- Montagem determinística com os dados informados; campos vazios não ganham experiências, números, clientes ou depoimentos.
- Checklist mede preenchimento, não veracidade ou qualidade. Nenhuma nota artificial.
- Prévia responsiva por container, inclusive quando a opção celular é selecionada no desktop; links apenas para seções presentes.
- Armazenamento opcional, local e versionado, validado ao recuperar. Nenhum salvamento automático. Botões para guardar, retomar e remover a cópia; falhas de armazenamento não bloqueiam a montagem.
- Catálogo técnico preservado sob uma seção expansível. A jornada principal permanece dedicada ao portfólio.
- WebMCP continua restrito a descrição pública e proposta de nome/profissão. Não lê ou salva o briefing, não executa geração e não publica.

## Limites explícitos

Ainda não é geração por IA, hospedagem de portfólios, editor persistente de conta, cota gratuita por usuário ou checkout. Nenhuma alteração em banco, autenticação, carteira ou WhatsApp. A chave local pode ser lida por outros scripts da mesma origem; por isso o salvamento é opt-in e a interface recomenda evitar aparelhos compartilhados. Não é armazenamento privado de documentos.

## Verificação

`node --test tests/portfolio-personal-brief.test.mjs tests/portfolio-webmcp.test.mjs`

Verificar montagem com somente nome, projetos preenchidos, campos inválidos, revisão, alternância desktop/celular, salvamento/retomada/remoção, navegador com armazenamento bloqueado, exemplo fictício e ferramentas opcionais sem sobrescrever o briefing.

## Próxima etapa de IA

Implementar provider dedicado com autenticação, limite de uso independente da carteira, política de retenção e revisão humana do conteúdo gerado. O serviço compartilhado atual não foi reutilizado: seus limites de tamanho não substituem um limite de frequência por usuário. Nada dessa etapa foi anunciado como disponível.
