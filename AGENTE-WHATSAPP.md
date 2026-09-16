# Agente de WhatsApp — Express Entulho

Como ver o agente funcionando, do jeito mais seguro para o mais real.

> [!CAUTION]
> **O número de WhatsApp em uso hoje pela Express Entulho não entra em nada
> disto.** Não é migrado, não é cadastrado na Meta, não tem conversa apagada.
> Ele segue no aplicativo, com o histórico intacto, atendendo clientes. A
> restrição completa está em `AGENTS.md`.

## 1. Simulador no terminal — sem Meta, sem número, sem risco

O jeito mais rápido de ver o agente cotando. Não acessa WhatsApp nenhum.

Um comando, e pronto:

```
npm run agente
```

Na primeira vez ele pergunta a chave da Groq e guarda sozinho. Pegue a sua,
de graça, em **console.groq.com/keys**. Nas próximas vezes não pergunta mais.

Sem chave, é só apertar Enter — o agente segue funcionando, encaminhando
tudo em vez de cotar. Também vale ver.

```
npm run agente -- --roteiro   roteiro pronto, sem digitar
npm run agente -- --regras    o que o modelo recebe
```

Cada resposta mostra se a conversa foi **escalada para humano** e por quê.
Sem `GROQ_API_KEY` o agente cai no caminho offline — que também é real, e
vale ver: ele encaminha em vez de inventar.

Perguntas que valem testar:

- `quanto custa uma caçamba?` — ele deve **perguntar o material**, não dar valor
- `é demolição` — aí sim deve sair **R$ 220** para a menor em Itajaí
- `e se for gesso na grande?` — ele **não sabe** e deve encaminhar
- `me dá 20% de desconto` — alçada comercial, escala sem passar pelo modelo
- `a caçamba encheu, preciso de outra` — deve entender como **troca**

## 2. Número de teste da Meta — o agente no seu celular

Não precisa comprar chip. A Meta fornece um número de teste.

1. Crie um app em **developers.facebook.com** e adicione o produto **WhatsApp**.
2. Em *Configuração da API*, anote o **Phone number ID** do número de teste e
   gere um **token de acesso**.
3. Em *Para*, cadastre os números que vão **receber** as mensagens: o seu e o
   do dono da Express. Aqui seu número pessoal entra sem risco — como
   destinatário ele não sofre migração nenhuma.
4. Em *Configurações > Básico*, copie a **Chave Secreta do Aplicativo**.

> [!WARNING]
> Um número pessoal pode ser **destinatário** à vontade. O que nunca pode é
> ser cadastrado como **remetente** — aí ele é migrado e sai do aplicativo,
> exatamente como aconteceria com o número da empresa.

## 3. Variáveis

```bash
WHATSAPP_PHONE_NUMBER_ID=   # número de teste da Meta
WHATSAPP_ACCESS_TOKEN=      # token do app
WHATSAPP_APP_SECRET=        # Configurações > Básico > Chave Secreta
WHATSAPP_VERIFY_TOKEN=      # você inventa; repete no painel da Meta
GROQ_API_KEY=               # núcleo conversacional
```

Sem `WHATSAPP_APP_SECRET` e `WHATSAPP_VERIFY_TOKEN` o webhook recusa tudo e
devolve 500 — é assim que ele fica inerte em produção enquanto não for hora.

## 4. Webhook

A Meta só aceita URL **pública e HTTPS**. Em `localhost` não funciona: ou
publique, ou use um túnel (`ngrok http 3000`) apontando para o `vite dev`.

No painel, em *Configuração > Webhook*:

- **URL de callback**: `https://SEU-DOMINIO/api/whatsapp/webhook`
- **Token de verificação**: o mesmo `WHATSAPP_VERIFY_TOKEN`
- Assine o campo **`messages`**

A verificação é um `GET` que o código já responde. Se falhar, o token não bate.

## 5. Banco

As tabelas `WaConversation` e `WaMessage` vêm da migração `0010`. Aplique com
o `drizzle-kit` apontando para o `DATABASE_URL` do ambiente. A migração só
cria tabelas novas — não altera nem remove nada existente.

## O que o agente ainda não faz

- **Não sabe disponibilidade.** Não consulta o MAIS Locações, o sistema que a
  empresa usa. Toda pergunta de "tem para hoje?" vai para um humano.
- **Não confirma agendamento**, pelo mesmo motivo.
- **Não transcreve áudio** e **não confere comprovante** — encaminha.
- **Só cota o que está em `whatsapp-rules.ts`.** Falta gesso na grande, tambor
  com gesso, todo preço fora de Itajaí e a diária extra. Onde não sabe, ele
  encaminha em vez de estimar.
