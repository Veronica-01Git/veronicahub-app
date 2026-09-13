# wire-tv-cron

Worker de agendamento da Wire TV. Não serve tráfego e não tem rota: a cada
hora ele dispara o workflow `generate-article.yml` no GitHub, que é quem
publica a matéria e busca a capa.

Existe porque o agendador do GitHub descarta disparo. Medido no repositório
com dois horários por hora — 48 disparos/dia esperados — rodaram 9 em 11/09,
15 em 12/09 e 6 em 13/09, nenhuma no minuto pedido, com buracos de até 5h15.
O Cron Trigger do Cloudflare dispara de verdade; o GitHub continua executando
o pipeline, porque é lá que estão a chave do Pexels e o passo que commita a
capa no repositório.

É um Worker separado de propósito: o Worker do site é construído pelo nitro
através do preset da Lovable, que gera a configuração de deploy sozinho — não
há arquivo do wrangler onde declarar `triggers`, e um erro no entry do site
derruba a aplicação inteira, que publica em produção a cada push.

## Como colocar no ar

São quatro passos, todos na sua máquina — este Worker não é publicado pela
integração Git do Cloudflare, é `wrangler deploy` manual.

1. **Crie o token do GitHub.** Em GitHub → Settings → Developer settings →
   Personal access tokens → Fine-grained tokens → Generate new token:
   - Repository access: apenas `Veronica-01Git/veronicahub-app`
   - Permissions → Repository permissions → **Actions: Read and write**
   - Nenhuma outra permissão. Copie o token.

2. **Publique o Worker:**

   ```sh
   cd workers/wire-cron
   npx wrangler login      # se ainda não estiver autenticado
   npx wrangler deploy
   ```

3. **Guarde o token como secret do Worker:**

   ```sh
   npx wrangler secret put GITHUB_TOKEN
   # cole o token quando pedir
   ```

4. **Confirme que disparou.** Na virada da hora seguinte deve aparecer uma
   rodada de `generate-article.yml` com evento `workflow_dispatch`:

   ```sh
   npx wrangler tail wire-tv-cron   # mostra o erro, se houver
   ```

   O disparo sem o secret configurado falha com `GITHUB_TOKEN não configurado`
   — por isso o passo 3 vem antes da primeira virada de hora.

## Depois que estiver funcionando

O `schedule` do `generate-article.yml` está em `*/15` — quatro janelas por
hora, redundância criada justamente para compensar o descarte do agendador do
GitHub. Com este Worker no ar essa redundância vira desperdício: numa hora em
que nada publicou ainda, cada tentativa gasta uma chamada de IA, e o teto
diário da Groq (200k tokens) dá para cerca de vinte chamadas por dia.

Depois de confirmar que o disparo do Cloudflare chega, reduza o `schedule` do
workflow a um único horário de recuperação (por exemplo `30 * * * *`), ou
remova o bloco `schedule` e deixe o Cloudflare como gatilho único.

Não faça isso antes: enquanto o Worker não estiver publicado e com o secret,
o `*/15` do GitHub é o único gatilho existente.
