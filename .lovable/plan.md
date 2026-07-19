# Próximo nível — Veronica Hub

Sugestões priorizadas para deixar a landing ainda mais impactante, moderna e conversora. Você pode escolher tudo, ou só os blocos que fizerem sentido.

## 1. Hero mais cinematográfico
- **Terminal boot sequence** logo abaixo do headline: linhas tipo `> initializing veronica.hub_ ✓` aparecendo com typewriter, reforçando o clima hacker.
- **Cursor piscando** no fim do "Prompt." e efeito de "text scramble" (letras trocando por glitch antes de fixar) no load.
- **Parallax leve** na imagem da ciborgue conforme o scroll (translateY sutil) para dar profundidade holográfica sem pesar.
- **Ruído/grain sutil** global (SVG noise) para textura de filme.

## 2. Prova social + autoridade (a peça que mais converte)
Hoje não existe prova social. Adicionar uma seção nova entre o marquee e o catálogo:
- Linha de logos/menções ("Como visto em…") ou números fortes ("+X alunos", "Y horas de conteúdo").
- 3 depoimentos em cards com foto, nome, curso feito e resultado concreto.
- Selo "★ 4.9 · N avaliações".

## 3. Catálogo mais rico
- **Filtro por tag** no topo do grid (Conteúdo, IA, Tráfego, Dev, Segurança) com pill toggles.
- Cada card ganha **duração / nº de aulas / nível** em micro-tipografia.
- **Hover state** com preview do que o aluno aprende (3 bullets aparecendo no fundo do card).
- Card em destaque ("Mais vendido") com borda neon animada.

## 4. Seção de preço/oferta explícita
Hoje só existe "a partir de R$ 19,90" no topo. Criar uma seção dedicada:
- 2–3 planos (curso avulso / hub completo / hub + mentoria) com destaque no plano recomendado.
- Bullets do que inclui, badge "Acesso vitalício", contador de vagas ou timer opcional.
- CTA sólido com preço final visível.

## 5. FAQ (reduz atrito de compra)
Accordion com 6–8 perguntas reais: "Como funciona o acesso?", "Tenho suporte?", "Serve pra iniciante?", "Emite nota?", "Posso pedir reembolso?", "Como recebo os cursos?".

## 6. Microinterações e polimento
- **Reveal on scroll** (fade + translateY) nas seções, usando IntersectionObserver ou Framer Motion — leve, não exagerado.
- **Contador animado** nos stats (0 → 11, 0 → 100%) quando entram no viewport.
- **Magnetic hover** nos CTAs primários (o botão puxa levemente o cursor).
- **Cursor customizado** só no hero (um retículo/crosshair neon) — opcional, é assinatura visual.

## 7. Barra de anúncio conversora
Trocar a top bar atual por uma **announcement bar** com CTA embutido:
`⚡ Acesso vitalício por R$ 19,90 · Últimas vagas → [Garantir]`
Mais direto e clicável do que a linha de status atual.

## 8. Footer expandido
Hoje o footer é minimalista demais para uma landing de venda. Adicionar:
- CNPJ, contato, links sociais visuais, e um mini-CTA final.
- Newsletter opcional ("Receba os drops da Veronica").

## 9. SEO + compartilhamento
- Gerar uma **OG image** dedicada (1200×630) com a ciborgue + logo + tagline para preview no WhatsApp/Twitter.
- Adicionar JSON-LD `Course` / `Organization` para rich results no Google.

## 10. Performance & acessibilidade
- Converter a imagem da ciborgue para **WebP/AVIF** e servir em resolução adequada (hoje é jpeg pesado).
- `prefers-reduced-motion`: desligar scanline sweep, glow-pulse e flicker para quem pede menos movimento.
- Auditar contraste dos textos `text-muted-foreground` sobre `bg-surface` (alguns podem estar abaixo de AA).

---

## Minha recomendação de sequência
Se quiser máximo impacto com pouco esforço, começar por:

1. **Prova social + FAQ + seção de preço** — o que mais move conversão.
2. **Terminal boot + reveal on scroll + contador nos stats** — assinatura visual sem quebrar nada.
3. **OG image + WebP + reduced-motion** — polimento técnico.

Me diga quais blocos quer que eu inclua e eu monto o plano detalhado de implementação.
