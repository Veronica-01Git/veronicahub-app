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

- `quanto custa uma caçamba?` — ele deve **perguntar o material e a cidade**,
  não dar valor. Preço aqui é produto + material + cidade; faltando um dos
  três, não existe preço
- `é demolição, em Itajaí` — aí sim deve sair **R$ 220** para a menor
- `menor, demolição, em Itapema` — cidade atendida, mas **sem preço
  cadastrado**. Ele deve encaminhar. Se soltar R$ 220 aqui, a guarda derruba a
  resposta: 220 é o preço de Itajaí, não de Itapema
- `e se for gesso na grande?` — ele **não sabe** e deve encaminhar
- `me dá 20% de desconto` — alçada comercial, escala sem passar pelo modelo
- `a caçamba encheu, preciso de outra` — deve entender como **troca**

## 1.1 O ciclo do áudio — ele fala, ela entende, ela responde falando

Desde 20/09 a agente transcreve o áudio do cliente e responde em nota de voz.
Cliente de caçamba conversa por áudio, dirigindo ou no meio da obra; receber
texto de volta é responder na língua errada.

**A regra antiga continua de pé.** Ela dizia: o que o agente não entende vai
para uma pessoa. O que mudou não foi a regra — foi a capacidade. Agora ele
entende, e por isso o áudio saiu daquela lista. Documento e vídeo continuam
nela.

**E o padrão seguro continua sendo o humano.** Em qualquer falha — sem chave,
download recusado pela Meta, áudio inaudível, transcrição vazia — o áudio volta
a ir para uma pessoa, exatamente como antes. Quem derruba o encaminhamento é o
webhook, e só depois de ter o texto em mãos.

**A transcrição chega marcada ao modelo.** "Itajaí" vira "eita aí", "gesso"
vira "gesto". O modelo recebe um aviso de que aquilo veio de áudio e de que
precisa confirmar o que for decisivo antes de cotar. Palpite de máquina não é
tratado como texto digitado pelo cliente.

**Preço nunca sai só em áudio.** Áudio não se relê, e quem ouviu "duzentos e
vinte" como "duzentos e doze" fecha negócio errado. Resposta que cita valor vai
em texto; conversa escalada também, porque quem assume precisa ler o histórico.

Para ligar: `GROQ_API_KEY` (já existe) transcreve o que entra;
`ELEVENLABS_API_KEY` e `ELEVENLABS_VOICE_ID` fazem a agente falar. Sem as
duas últimas, ela entende áudio e responde em texto.

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

## 5. Por que a agente parou — um comando responde

Quando a agente encaminha em vez de cotar, ou recebe mensagem e não responde,
a causa tem nome. Em vez de abrir a demonstração e gastar uma conversa:

```
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://veronicahub.com/api/whatsapp/diagnostico
```

```json
{
  "groq": {
    "chaveVisivel": true,
    "modelo": "qwen/qwen3.6-27b",
    "respondeu": false,
    "status": 429,
    "motivo": "cota da Groq esgotada (429) no modelo qwen/qwen3.6-27b — na Groq o teto é por modelo"
  },
  "whatsapp": {
    "configurado": true,
    "respondeu": false,
    "status": 401,
    "motivo": "a Meta recusou o token (401) — provavelmente expirou; o token da tela Configuração da API vale 24h"
  },
  "verificadoEm": "2026-09-17T00:00:00.000Z"
}
```

Como ler o bloco `groq`:

- `chaveVisivel: false` — o Worker não enxerga a `GROQ_API_KEY`. Segredo
  configurado no painel e segredo chegando em `process.env` dentro do runtime
  são coisas diferentes; este campo separa as duas.
- `status: 429` — cota. **Na Groq o teto diário é por modelo.** O pipeline de
  matérias roda em `openai/gpt-oss-20b`, que tem cota própria; esgotar a dele
  não esgota a da agente.
- `status: 401` ou `403` — a chave existe mas foi recusada. Chave da Groq não
  expira sozinha: se recusou, foi revogada ou trocada.
- `status: 404` — o modelo não existe mais com esse nome na Groq.
- `respondeu: true` — a Groq está de pé. Se mesmo assim a agente encaminha, o
  motivo é outro: alçada comercial, anexo não interpretado, ou a guarda de
  preço barrando valor fora da tabela. A tela do chat diz qual.

Como ler o bloco `whatsapp`: a sonda lê o próprio número na Graph API — não
envia mensagem e não toca em conversa de ninguém. `status: 401` é o caso que
mais morde, e tem seção própria logo abaixo.

Nenhuma chave e nenhum token saem na resposta, nem em pedaço. A sonda da Groq
gasta **um token**, a da Meta não gasta nada. Ainda assim o endpoint exige
`CRON_SECRET`, porque cota é um dos suspeitos.

## 6. As credenciais que expiram (leia antes de marcar demonstração)

Nem toda chave vence, mas as que vencem, vencem calado.

> [!CAUTION]
> **O token da tela *Configuração da API* da Meta é temporário: vale 24
> horas.** Gerado na véspera de uma reunião, ele já está morto na hora. O
> sintoma é cruel — a agente recebe a mensagem, o webhook processa, e a
> resposta não sai. Para demonstração com data marcada, gere o token **no
> mesmo dia**, ou crie um **token de Usuário do Sistema** na Meta Business
> Suite, que é o único que pode ser permanente.

| Credencial | Expira? | Onde renovar |
|---|---|---|
| `WHATSAPP_ACCESS_TOKEN` | **Sim — 24h** se vier de *Configuração da API*. Token de Usuário do Sistema pode ser permanente | Meta for Developers / Business Suite |
| `META_INSTAGRAM_ACCESS_TOKEN` | **Sim** — token longo de usuário dura ~60 dias | Meta for Developers |
| `GITHUB_TOKEN` (Worker `wire-tv-cron`) | **Sim** — PAT fine-grained sempre tem prazo, e o padrão do formulário é 30 dias | github.com → Settings → Developer settings |
| `GROQ_API_KEY` | Não expira sozinha; só se revogada | console.groq.com/keys |
| `MERCADOPAGO_ACCESS_TOKEN` | Não, em produção | Painel do Mercado Pago |
| `DATABASE_URL`, `PEXELS_API_KEY`, `RESEND_API_KEY` | Não | — |
| `CRON_SECRET`, `SESSION_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` | Não — são gerados por você | — |

O `GITHUB_TOKEN` do `wire-tv-cron` merece atenção porque a falha dele é
silenciosa: quando vencer, o cron continua disparando, o GitHub recusa, e as
matérias simplesmente param de sair. Não há tela que avise. Anote a data de
validade que você escolheu no momento de criar o token.

## 7. Banco

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
