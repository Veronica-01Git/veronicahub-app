## Objetivo
Modernizar a imagem cyborg da Veronica no background do Hero V1, deixando-a mais nítida, reconhecível e com estética atualizada (menos "antiga").

## Mudanças

1. **Gerar nova arte cyborg moderna** (`src/assets/veronica-cyborg-v2.jpg`)
   - Baseada na foto original enviada, porém com refresh visual: rosto feminino ciborgue, luz neon ciano/verde, circuitos holográficos sutis, estilo cinematográfico moderno (Blade Runner 2049 meets Ghost in the Shell), fundo escuro puro para blend perfeito.
   - Formato retrato otimizado para o Hero.

2. **Atualizar `src/routes/index.tsx`**
   - Trocar referência do asset antigo pelo novo `veronica-cyborg-v2`.
   - Atualizar o `<link rel="preload">` no `head()` para o novo URL (mantendo `fetchpriority="high"` para LCP).
   - Reposicionar: aumentar levemente a escala e mover o foco para o rosto (`object-position: center 30%`).

3. **Refinar tratamento holográfico em `src/styles.css`**
   - Aumentar opacidade base de 22% → 35% para dar mais presença.
   - Reduzir `hue-rotate` para preservar tons naturais da nova arte.
   - Manter scanlines e sweep animation.
   - Adicionar gradient mask lateral para fundir suavemente com o dark background.

4. **Cleanup**
   - Remover o asset antigo (`veronica-cyborg.jpeg.asset.json`) via `lovable-assets delete` após confirmar que não há outras referências.

## Resultado esperado
Ciborgue mais visível, moderna e integrada, sem perder a vibe hacker/holográfica atual.