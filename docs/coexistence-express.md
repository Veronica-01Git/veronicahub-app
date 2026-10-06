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

## Decisão pendente: qual parceiro faz a ligação

| Caminho                                                                     | Prazo                                     | Custo                        | Código                                           |
| --------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------- | ------------------------------------------------ |
| Veronica Hub vira **Tech Provider** (app Meta próprio + Embedded Signup v4) | dias a semanas (verificação + App Review) | sem mensalidade de terceiros | mantém a Graph API direta de hoje                |
| **BSP** com Coexistence (ex.: 360dialog)                                    | horas a dias                              | mensalidade do BSP           | troca host e autenticação em `whatsapp-cloud.ts` |

## Sequência

1. Cliente: backup confirmado (print "Último backup: hoje") e contatos na
   conta Google ou no iCloud.
2. Cliente: app atualizado, Meta Business com o dono como administrador e
   endereço único (Cartão CNPJ = nota fiscal = Google).
3. Nós: parceiro escolhido e campos do webhook assinados: `messages`,
   `smb_message_echoes`, `history`, `smb_app_state_sync`, `account_update`.
4. Cliente: **autorização assinada** (última página do PDF).
5. Juntos (30–40 min): Embedded Signup → "conectar app existente" →
   confirmação por QR code no celular → compartilhar histórico. Celular no
   Wi-Fi, no carregador e com o app aberto até a sincronização terminar.
6. Fase observação: trava fechada; conferir no painel o que chega e os
   rascunhos.
7. Fase acompanhada e depois normal: cada uma com um novo sim do dono.
