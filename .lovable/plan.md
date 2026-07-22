## Publicar em veronicahub.com

O domínio `veronicahub.com` já hospeda o site atual da Veronica (que você me passou como referência). Para publicar essa nova landing nele, precisamos de dois passos — o primeiro eu executo, o segundo é feito por você na UI do Lovable (não tenho acesso a DNS/registrar).

### Passo 1 — Publicar (eu faço)
- Rodar `security--get_scan_results` para checar findings críticos antes do deploy.
- Publicar o projeto via `preview_ui--publish`. Isso gera a URL `*.lovable.app` estável necessária para poder conectar o domínio custom.

### Passo 2 — Conectar `veronicahub.com` (você faz)
Após o deploy ficar pronto (~1min):
1. **Project Settings → Domains → Connect Domain** → digitar `veronicahub.com`.
2. Adicionar também `www.veronicahub.com` como entrada separada e escolher qual é a **Primary**.
3. No seu registrar/DNS atual (onde o domínio está hoje), **remover os registros antigos** que apontam pro site atual e adicionar:
   - `A @` → `185.158.133.1`
   - `A www` → `185.158.133.1`
   - `TXT _lovable` → valor que o Lovable mostrar na UI
   - Se usa Cloudflare com proxy, marcar "Domain uses Cloudflare or a similar proxy" no diálogo Advanced.
4. Aguardar propagação DNS (minutos até 72h) — o Lovable provisiona SSL automaticamente.

### Aviso importante
Trocar o DNS de `veronicahub.com` para o Lovable **derruba o site atual** que está no ar nesse domínio. Se ele tem checkout, área de membros ou tráfego pago rodando, planeje a janela de troca. Alternativa mais segura: publicar antes em um subdomínio tipo `novo.veronicahub.com` para validar, e só depois trocar a raiz.

Confirma que posso publicar agora?