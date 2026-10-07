# Coexistence — roteiro técnico (Express Entulho)

Projeto `VH-AUT-WA-2026-000001` · 06/10/2026

O objetivo final é a agente atender pelo **número atual da empresa**. O único
caminho que faz isso sem tirar o número do aplicativo e sem perder o histórico
é o **Coexistence** da Meta (WhatsApp Business app + Cloud API no mesmo
número). A regra de `AGENTS.md` continua valendo por inteiro: nada é feito no
número atual sem a **decisão por escrito do proprietário**, com este
procedimento conferido na documentação vigente da Meta no dia.

O roteiro em linguagem simples, com o termo de autorização, foi entregue ao
cliente em PDF. Este arquivo é a parte técnica.

## Requisitos (conferidos em 06/10/2026)

- WhatsApp Business app **2.24.17 ou superior**.
- Ligação via **Embedded Signup** de um **Solution Partner ou Tech Provider**
  da Meta. Não existe ligação self-serve. A Embedded Signup v2 sai em
  **15/10/2026**; usar a v4.
- **24 h** para sincronizar histórico e contatos depois da ligação. Sem isso,
  a Meta desliga e o fluxo tem que ser refeito.
- O app precisa ser aberto no celular pelo menos a cada **~13 dias**.
- Limite de **20 mensagens/s** somando app e API.

## O que muda no app (informar antes, consta no PDF)

- Grupos: não passam pela API.
- Listas de transmissão: desativadas ou só leitura.
- Mensagens temporárias, visualização única e localização em tempo real:
  desligadas nas conversas 1:1.
- Clientes acompanhantes: todos funcionam, **menos o WhatsApp para Windows e
  para WearOS**.
- Para desligar: no app, **Configurações → Conta → Plataforma de negócios →
  Desconectar conta**. A Meta envia `account_update` com `PARTNER_REMOVED`.

## Código já preparado

- `smb_message_echoes`: a resposta da equipe pelo celular vira mensagem de
  autor `humano`, e a conversa passa para `aguardando_humano`. A agente se
  cala ali (regra 1 de `src/lib/whatsapp-atendimento.ts`).
- `history` e `smb_app_state_sync`: **ignorados de propósito**. O histórico
  fica no celular; guardá-lo aqui seria juntar dado pessoal sem necessidade, e
  tratá-lo como mensagem faria a agente responder conversa antiga.
- A trava `WHATSAPP_ENVIO_LIBERADO` continua fechada. Ligar o Coexistence
  **não** faz a agente falar.

## Parceiro: 360dialog (decidido em 06/10/2026)

Escolhido pela velocidade (horas a dias, contra semanas para virar Tech
Provider). O código suporta os dois caminhos; a troca é por ambiente.

- `WHATSAPP_PROVEDOR=360dialog`, `D360_API_KEY` (chave do número no painel da
  360dialog) e `WHATSAPP_WEBHOOK_TOKEN` (32+ caracteres, `openssl rand -hex 32`).
- Envio: `POST https://waba-v2.360dialog.io/messages`, cabeçalho
  `D360-API-KEY`, mesmo corpo da Cloud API.
- Mídia: `GET /{media-id}` devolve uma url `lookaside.fbsbx.com`; o host é
  trocado por `waba-v2.360dialog.io` (qualquer outro host é recusado, para a
  chave não vazar).
- **Webhook sem assinatura**: a 360dialog não assina o corpo. A prova de
  origem é o nosso segredo no cabeçalho `x-veronica-webhook-token`, conferido
  em tempo constante. Configurar uma vez:

  ```
  POST https://waba-v2.360dialog.io/v1/configs/webhook
  D360-API-KEY: <chave>
  {"url": "https://veronicahub.com/api/whatsapp/webhook",
   "headers": {"x-veronica-webhook-token": "<WHATSAPP_WEBHOOK_TOKEN>"}}
  ```

- Diagnóstico (`/api/whatsapp/diagnostico`) sonda `GET /v1/configs/webhook`.
- Da 360dialog para o Coexistence: o cliente precisa de conta e plano na
  360dialog; selo azul (OBA) e verificação clássica não são suportados; um
  número COEX não migra entre WABAs.

## Sequência

1. Cliente: backup confirmado (print "Último backup: hoje") e contatos na
   conta Google ou no iCloud.
2. Cliente: app atualizado, Meta Business com o dono como administrador e
   endereço único (Cartão CNPJ = nota fiscal = Google).
3. Nós: conta 360dialog da Express criada (pelo dono, com cartão da
   empresa), webhook configurado com o cabeçalho secreto e campos
   `messages`, `smb_message_echoes`, `history`, `smb_app_state_sync`,
   `account_update` ativos.
4. Cliente: **autorização assinada** (última página do PDF).
5. Juntos (30–40 min): link de onboarding da 360dialog (Embedded Signup da
   Meta) → "conectar app existente" →
   confirmação por QR code no celular → compartilhar histórico. Celular no
   Wi-Fi, no carregador e com o app aberto até a sincronização terminar.
6. Fase observação: trava fechada; conferir no painel o que chega e os
   rascunhos.
7. Fase acompanhada e depois normal: cada uma com um novo sim do dono.

## Dia da ligação — checklist de execução

Nada aqui começa sem a autorização assinada e o print do backup em mãos.

**Antes (com a conta 360dialog já criada e parada antes do Embedded Signup)**

1. Gerar o segredo do webhook: `openssl rand -hex 32`. Ele vai direto para a
   Cloudflare e nunca passa por chat ou commit.
2. Na Cloudflare (Worker `veronicahub-app` → Settings → Variables and
   Secrets), como **Secret**: `WHATSAPP_WEBHOOK_TOKEN`. Como variável:
   `WHATSAPP_PROVEDOR=360dialog`. **Não** mexer em `WHATSAPP_ENVIO_LIBERADO`:
   ela fica vazia, e é isso que mantém a agente em observação.

**Na chamada com o dono (30–40 min)**

3. Celular da empresa no Wi-Fi, no carregador, WhatsApp Business atualizado e
   aberto.
4. No painel da 360dialog: **Continue Onboarding** → Embedded Signup → entrar
   com o Facebook do dono → escolher o Meta Business da Express → **conectar o
   WhatsApp Business app existente** → número da empresa → confirmar no
   celular → **compartilhar o histórico**.
5. Copiar a **API Key** do número no painel da 360dialog direto para a
   Cloudflare como Secret `D360_API_KEY`.
6. Registrar o webhook:
   `D360_API_KEY=… WHATSAPP_WEBHOOK_TOKEN=… node scripts/webhook-360dialog.mjs`
   (confere) e depois com `--aplicar`. O script não imprime nenhum segredo.
7. Pedir ao dono que reconecte o WhatsApp Web, se usar (a ligação desconecta
   os aparelhos acompanhantes).

**Logo depois**

8. Mandar uma mensagem de um celular pessoal para o número da empresa e
   conferir em `/clientes/express-entulho/operacoes/atendimento`, na fila
   humana, a mensagem recebida e a **"Sugestão da agente · não enviada"**.
9. O dono responde pelo celular: a resposta aparece na fila como "Equipe".

## Modo observação (primeira fase)

Com credenciais configuradas e `WHATSAPP_ENVIO_LIBERADO` vazia, a agente:

- recebe as mensagens e gera a resposta que daria, gravada como
  `sistema`/`sugestao` e mostrada no painel como "não enviada";
- sugere em **toda** conversa, mesmo nas que a equipe já respondeu, porque
  comparar a sugestão com a resposta real é o objetivo da fase;
- **não** envia, não marca como lida, não sintetiza voz, não troca status e
  não manda e-mail.

Sair da observação é escrever `sim-o-dono-aprovou` em
`WHATSAPP_ENVIO_LIBERADO`, com novo sim do dono.

## Decisão a levar ao dono antes de sair da observação

Em produção, quando a equipe responde pelo celular, a conversa vira
`aguardando_humano` e a agente fica quieta **até alguém devolvê-la** pelo
painel. Se o cliente voltar dias depois, ela continua quieta. Opções: manter
assim (mais seguro) ou devolver automaticamente à agente depois de N horas sem
resposta da equipe. Isso não está implementado: é decisão do dono.
