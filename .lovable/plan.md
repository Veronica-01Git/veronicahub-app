## Publicar no seu GitHub + ajustar cyborg no mobile/tablet

Divido em duas frentes: a integração com GitHub (que depende de um passo seu) e os ajustes visuais responsivos (que eu faço aqui).

---

### Parte 1 — Publicar direto no seu repositório GitHub

**Eu não consigo fazer push direto no `github.com/Veronica-01Git/veronicahub` a partir daqui.** O Lovable só sincroniza com um repositório GitHub depois que **você** conecta a conta na UI. O fluxo é:

1. No editor Lovable, clique no menu **+** (canto inferior esquerdo do chat) → **GitHub** → **Connect project**.
2. Autorize o Lovable GitHub App na conta/organização `Veronica-01Git`.
3. Aqui tem um detalhe importante: **o Lovable hoje não importa repositórios existentes**. Ele só cria um repo novo a partir deste projeto. Ou seja, temos dois caminhos:
   - **Caminho A (recomendado se o repo atual tem pouco código próprio):** deixar o Lovable criar um repo novo (ex: `veronicahub-lovable`) e você mescla manualmente com o antigo, ou passa a usar o novo como oficial.
   - **Caminho B (se você quer manter `veronicahub` como está):** baixar o código deste projeto (botão **Download codebase** no Code Editor, disponível em planos pagos) e você mesmo faz commit/push no seu repo existente pelo VSCode. A sincronização bidirecional automática **não** vai funcionar nesse caminho.

**Sobre "integrar com veronica-curriculo-certo e video ia":** eu não tenho acesso ao conteúdo do seu repositório atual — não sei o que existe nessas páginas (`/veronica-curriculo-certo`, `/video-ia`), qual stack usam, quais props/dados consomem. Preciso que você:
- Cole aqui o código dessas duas páginas (ou os componentes principais), **ou**
- Descreva o que cada uma faz (é uma página de vendas de curso? um player? um formulário?) para eu recriar com o mesmo visual dark cyber.

Sem isso, eu só consigo criar **rotas placeholder** com o layout novo aplicado (header, background cyborg, tipografia), esperando o conteúdo real vir depois.

---

### Parte 2 — Ajustar cyborg no mobile/tablet (isso eu faço agora)

**Problema atual:** o Hero usa `backgroundSize: cover` com `backgroundPosition: center 30%`. Em telas estreitas (mobile/tablet), o `cover` corta as laterais e o olhar da Veronica sai do enquadramento — aparece só parte do rosto ou o topo da cabeça.

**Solução:**

1. **Ajuste responsivo do `background-position`** no bloco do cyborg em `src/routes/index.tsx`:
   - **Mobile (`<768px`):** `background-position: 58% 22%` — puxa o rosto para mais próximo do centro-superior, garantindo que os olhos fiquem visíveis acima do texto do Hero.
   - **Tablet (`768–1024px`):** `background-position: 55% 25%`.
   - **Desktop (`≥1024px`):** manter `center 30%` (já está ótimo).
   - Implementar com classes utilitárias `bg-[position:58%_22%] md:bg-[position:55%_25%] lg:bg-[position:center_30%]`.

2. **Aumentar presença do cyborg no mobile:**
   - Subir opacidade do overlay da imagem de `38%` para `48%` em telas `<768px` (mais dramático em tela pequena onde o texto ocupa mais % do viewport).
   - Reduzir levemente o overlay escuro do gradiente inferior no mobile para não competir com o rosto.

3. **Ajuste de min-height do Hero** para garantir que a imagem tenha "espaço" para respirar em mobile: `min-h-[92vh]` no mobile vs. atual desktop.

4. **Preload já está com `fetchpriority=high`** — mantém o LCP rápido.

Nada disso mexe em lógica de negócio, apenas classes Tailwind no bloco do background e no container do Hero.

---

### O que preciso de você para seguir

- **Confirmar o caminho GitHub:** A (repo novo via Lovable) ou B (download + push manual no repo atual)?
- **Enviar código ou descrição** das páginas `veronica-curriculo-certo` e `video-ia` para eu integrar o visual — ou confirmar que por enquanto quer só **placeholders com o layout novo**.
- **Autorização para eu já aplicar os ajustes mobile/tablet do cyborg** enquanto você decide o resto.
