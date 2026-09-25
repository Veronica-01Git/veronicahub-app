# Handover técnico — Agente de WhatsApp, Express Entulho

Selo `VH-AUT-WA-2026-000001`. Escrito em **19/09/2026**. Nasceu descrevendo o
commit `da28803` e foi atualizado no mesmo dia para o `main` de 19/09 — as
diferenças estão na seção 0.

Este documento é para quem assume a codificação. Tudo aqui foi **lido do
código**, não de memória. Onde eu não sei, está escrito que não sei.

> [!CAUTION]
> **Leia a seção 0 antes de qualquer coisa.** O código andou entre 18 e 19/09
> — preços, modelos e um modo de respostas fixas. A seção 0 é a errata, e
> explica por que o modo de respostas fixas foi removido.

---

## 0.1 Estado em 24/09/2026 — checklist do número de teste da Meta, em andamento

Conferido lendo os secrets do Worker `veronicahub-app` no painel do
Cloudflare (nomes, não valores — os valores continuam ocultos).

**Já configurado (confirmado hoje):**

- `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY` — a cadeia de
  provedores tem credencial nos 3 primeiros elos. A Sala de Teste
  (`/clientes/express-entulho/operacoes/testar`) responde com IA real.
- `CRON_SECRET`, `DATABASE_URL`, `SESSION_SECRET` e os demais secrets do
  produto — presentes, sem relação com o WhatsApp.

**Faltando (é isto que falta pra ligar o número de TESTE da Meta — não o da
empresa, que é permanente pelo `AGENTS.md`):**

- `WHATSAPP_PHONE_NUMBER_ID` — vem do painel *Configuração da API* do app
  Meta for Developers, número de teste.
- `WHATSAPP_ACCESS_TOKEN` — mesmo painel. **Expira em 24h** se for o token
  temporário; para não vencer no meio de uma demonstração, gerar um token de
  **Usuário do Sistema** na Meta Business Suite (permanente).
- `WHATSAPP_APP_SECRET` — em *Configurações > Básico* do app.
- `WHATSAPP_VERIFY_TOKEN` — não vem de lugar nenhum, é inventado por quem
  configura e repetido no painel da Meta. Valor sugerido nesta sessão:
  `0778169ea7e6238676e34fbc0753887807213d6228ea4839` (gerado com
  `openssl rand -hex 24`, ainda não aplicado em nenhum lugar).
- `WHATSAPP_ENVIO_LIBERADO` — trava own do projeto, não da Meta. O código
  (`src/lib/whatsapp-cloud.ts:37`) exige exatamente o valor
  `sim-o-dono-aprovou`. Sem essa string exata, o envio fica bloqueado mesmo
  com as outras três credenciais presentes — é a trava de segurança
  funcionando, não um bug.

As três primeiras (`PHONE_NUMBER_ID`, `ACCESS_TOKEN`, `APP_SECRET`) só saem
de dentro da conta Meta for Developers de quem está configurando — nenhuma
ferramenta de automação tem como gerá-las ou buscá-las por fora. As duas
últimas (`VERIFY_TOKEN`, `ENVIO_LIBERADO`) já estão resolvidas acima.

### Progresso ao vivo, feito com o responsável (24/09, tarde)

Conduzido print a print, pelo celular e depois pelo PC.

- App Meta for Developers criado: **"Express Entulho Agente"**, ID
  `3981170865355653`. Conta Cloudflare: `ee5446d6140e2daaedb39c86a64d2a44`
  (`dash.cloudflare.com/ee5446d6140e2daaedb39c86a64d2a44/workers/services/view/veronicahub-app/production/settings`).
- Portfólio empresarial **"Express Entulho"** criado (verificação de negócio
  adiada de propósito — não é necessária pro número de teste).
- Caso de uso "Conectar-se com os clientes pelo WhatsApp" personalizado.
- Número de teste reivindicado: **+1 (555) 185-0555**.
- `WHATSAPP_PHONE_NUMBER_ID` = `1320896757776543` (confirmado na tela da
  Meta; a primeira tentativa de colar no Cloudflare errou o campo — colou no
  "Key" em vez do "Value". Conferir se ficou salvo certo antes de seguir).
- `WHATSAPP_BUSINESS_ACCOUNT_ID` = `1131873005941228` (não é uma das 5
  variáveis do projeto, mas fica registrado caso precise).
- Token de acesso: o erro "An invalid Platform session was found" do popup
  OAuth (visto no Safari do celular e na primeira tentativa do Chrome)
  **se resolveu sozinho** numa tentativa seguinte no Chrome desktop — não
  precisou de aba anônima. Token gerado e coletado.
- **As 5 variáveis do WhatsApp estão salvas em produção no Cloudflare**:
  `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_APP_SECRET`,
  `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_ENVIO_LIBERADO` — confirmado pelo
  próprio responsável em 24/09, tipo Secret, ambiente Production.

- **Webhook configurado e verificado** na Meta: URL
  `https://veronicahub.com/api/whatsapp/webhook`, token de verificação
  batendo com `WHATSAPP_VERIFY_TOKEN`. A Meta confirmou a assinatura
  automática de vários campos, incluindo `messages` — o que importa pra
  receber mensagem de cliente.
- Destinatário de teste cadastrado (número pessoal do responsável,
  `+55 47 99605-7436`), dentro do limite de 5 da Meta.
- **Teste real de envio feito às 20:58 (24/09) — FALHOU com erro 130497:**
  `"Business account is restricted from messaging users in this country."`
  Confirmado lendo a carga completa do webhook de status. **Não é bug do
  código** — é a Meta bloqueando contas sem verificação de negócio de
  mandar mensagem pra números do Brasil. É a mesma pendência #2 de
  `PENDENCIAS-CLIENTE.md` (verificação de negócio, CNPJ), só que agora
  provada em teste real, não só documentada como risco.

### Verificação de negócio — iniciada, pausada esperando documento (24/09, 21:53)

- Portfólio empresarial preenchido com CNPJ, nome e nome fantasia.
- Telefone de contato usado: número pessoal do desenvolvedor (não o
  WhatsApp da empresa — esse campo é só confirmação de contato pra Meta,
  não vira remetente de nada; não fere a restrição do `AGENTS.md`).
- Site usado: `https://veronicahub.com/clientes/express-entulho/proposta`
  (o Instagram foi recusado pela Meta como "domínio de site comum").
- **A Meta não achou correspondência automática** e pediu upload de
  documento. Parado aqui de propósito — precisa do dono, amanhã.
- **Dado novo, útil pra reconciliar com a pendência #3** (divergência de
  endereço): a busca automática da Meta devolveu
  **razão social "INOVACAO SERVICOS ADMINISTRATIVOS E TRANSPORTE LTDA"**,
  endereço **"Rua Benjamin Franklin Pereira, 365, 88304-069, Itajaí"**.
  Esse é um TERCEIRO endereço, diferente dos dois que a pendência #3 já
  citava (Vila Operária / São João) — confirmar com o dono qual é o
  correto antes de enviar o documento.

**Atualização (24/09, 22:01) — documento enviado, verificação EM ANÁLISE.**
O responsável achou o Cadastro Nacional de Pessoa Jurídica e enviou pela
tela de upload. A Meta confirmou recebimento: **"A análise do seu envio
deverá levar aproximadamente 2 dias úteis."** Ela mesma avisa quando
terminar — não precisa ficar checando.

**Falta agora — em ordem de bloqueio:**

1. **Aguardar a Meta aprovar a verificação** (~2 dias úteis a partir de
   24/09, 22:01). Nada a fazer enquanto isso não sai.
2. Depois de aprovada: repetir o teste de envio pela mesma tela
   ("Etapa 1. Experimente" → "Enviar mensagem") pra confirmar que o erro
   130497 sumiu.
3. Rodar `curl -H "Authorization: Bearer $CRON_SECRET" https://veronicahub.com/api/whatsapp/diagnostico`
   pra confirmar que a Meta aceita o token do lado do nosso Worker também.

**Enquanto a verificação não sai**, o que já é demonstrável de verdade,
sem depender da Meta: a Sala de Teste
(`/clientes/express-entulho/operacoes/testar`) — mesmo agente, mesma IA,
mesma guarda de preço, só não passa pelo canal WhatsApp.

Guia completo, passo a passo, já existe em `AGENTE-WHATSAPP.md`, seção 2.

---

## 0. Erratas — leia antes de confiar no resto

Este documento nasceu em 19/09 descrevendo o commit `da28803`. Entre 18/09 e
19/09 o `main` andou bastante, e **partes deste handover ficaram velhas**. O
que mudou, e o que continua valendo:

| Assunto | Estava aqui | Está no `main` de 19/09 |
| --- | --- | --- |
| Modelo principal | `qwen/qwen3.6-27b` | `llama-3.1-8b-instant` |
| Modelo de reserva | `openai/gpt-oss-20b` | `llama-3.3-70b-versatile` |
| Preços | 4 combinações | **20 combinações** (commit `bd39fc5`, 18/09) |
| Modo demo blindado | não existia | existiu, e **foi removido em 19/09** — ver abaixo |

**Os preços novos são do responsável**, entregues em 18/09 e commitados pelo
próprio dono do projeto. Não são inferência de ninguém. O que entrou:

- Gesso em Itajaí no tambor (R$ 230) e na caçamba grande (R$ 550) — as duas
  caixas que antes eram "eu não sei te passar o valor".
- Demolição nas outras sete cidades, **com o mesmo preço de Itajaí**: menor
  R$ 220 e grande R$ 450 em todas. Era uma das duas hipóteses da pendência 1,
  e a resposta foi essa: não há acréscimo por deslocamento.

**O que ainda não existe, e não deve ser inventado:** gesso fora de Itajaí (em
nenhuma das sete), tambor fora de Itajaí (não é oferecido), a diária extra, a
capacidade em m³ dos três produtos, e qualquer material que não seja demolição
ou gesso.

### O modo demonstração blindado foi removido

Entre 18 e 19/09 entrou em `decidirResposta` um bloco de ~77 linhas de
`if (msg.includes(...))` que respondia **antes do modelo e antes da guarda de
preço**, com textos fixos. Servia para garantir estabilidade na apresentação
de 19/09. A apresentação aconteceu; o bloco saiu. Os motivos, porque eles
valem como regra para quem for reintroduzir algo parecido:

1. **Inventava estoque.** *"Tenho 2 caçambas menores disponíveis para entrega
   ainda hoje"* e *"a grande está com a agenda cheia hoje"*, ambos com
   `escalar: false`. A agente não consulta o MAIS Locações — não existe fonte
   para esses números, e ninguém revisaria a mensagem. Isso contradiz a
   proibição que o próprio prompt dela carrega: *"Nunca confirme agendamento:
   você ainda não consulta a agenda real."*
2. **Cotava sem cidade.** *"A caçamba menor para descarte de gesso sai por
   R$ 280,00. Em qual cidade será o serviço?"* — R$ 280 só vale em Itajaí, e
   a frase o diz antes de perguntar a cidade. É exatamente o erro que a guarda
   existe para impedir, escrito à mão e desviando dela.
3. **Passava por fora da guarda.** Estando no topo de `decidirResposta`, com
   `return` direto, nenhum desses textos passava por `motivoDaGuarda`.
4. **Casava por substring.** `msg.includes("oi")` dispara em "foi", "depois",
   "coisa", "oito". E as cidades eram testadas com acento (`"itajaí"`), então
   quem digita "itajai" caía fora de todas as regras.

Há um teste de regressão contra o item 1: *"nenhum atalho responde sobre
disponibilidade sem consultar agenda nenhuma"*.

## 1. Status geral do MVP

### Funciona hoje

- **Webhook da Cloud API** (`/api/whatsapp/webhook`), com validação de
  assinatura `X-Hub-Signature-256` sobre o **corpo cru** (reserializar o JSON
  invalida a assinatura — há teste para isso).
- **Persistência** em `WaConversation` e `WaMessage` (Drizzle, migração `0010`).
- **Núcleo conversacional** (`decidirResposta`) compartilhado por três
  superfícies: webhook do WhatsApp, simulador de terminal (`npm run agente`) e
  o chat da demonstração no navegador. **É o mesmo código nos três** — o que
  você vê na demo é o que o cliente receberia.
- **Guarda determinística de preço** (`motivoDaGuarda`): toda resposta do
  modelo é conferida antes de sair. Valor fora da matriz derruba a resposta e
  vira escalação.
- **Modelo de reserva** para 429/404/5xx.
- **Diagnóstico em um comando** (`GET /api/whatsapp/diagnostico`), que separa
  chave ausente, cota esgotada, chave recusada e token da Meta vencido.
- **81 testes passando**, `tsc --noEmit` limpo (rodei em `da28803`).

### Não funciona / não faz, por decisão

- Não consulta disponibilidade nem confirma agendamento (pendência 4).
- Não transcreve áudio nem confere comprovante — encaminha.
- Só cota as 4 combinações cadastradas. O resto encaminha.

### O que falta para a demonstração

Um bug que **derruba a cotação no meio da conversa**. Está na seção 5, item 1.
É a única coisa que eu trataria como bloqueante hoje.

---

## 2. Código crítico

### 2.1 A matriz de preços — `src/lib/whatsapp-rules.ts`

Fonte única de verdade comercial. O achado que organiza o arquivo: **não existe
tabela fixa**. O responsável foi explícito — *"o preço é referente ao material
de descarte"*. Logo, preço é `produto × material × cidade`, e sem o material
não existe preço.

```ts
export type Preco = {
  readonly produto: ProdutoId;
  readonly material: MaterialId;
  readonly cidade: CidadeId;
  readonly valorReais: number;
};

// Só o que o responsável afirmou. Nada aqui é inferido.
precos: [
  { produto: "cacamba-menor",  material: "demolicao", cidade: ITAJAI, valorReais: 220 },
  { produto: "tambor",         material: "demolicao", cidade: ITAJAI, valorReais: 180 },
  { produto: "cacamba-grande", material: "demolicao", cidade: ITAJAI, valorReais: 450 },
  { produto: "cacamba-menor",  material: "gesso",     cidade: ITAJAI, valorReais: 280 },
],
```

```ts
/** O preço exato, ou `null` quando essa combinação não foi cadastrada. */
export function buscarPreco(
  regras: RegrasNegocio,
  produto: ProdutoId,
  material: MaterialId,
  cidade: CidadeId,
): number | null {
  const achado = regras.precos.find(
    (p) => p.produto === produto && p.material === material && p.cidade === cidade,
  );
  return achado ? achado.valorReais : null;
}
```

`buscarPreco` devolve `null` em vez de estimar. **Não troque isso por um
fallback "preço mais próximo".** Há um caso real que prova o custo: uma
conversa de 14/09 cotou a caçamba menor por R$ 240, que não bate com demolição
(220) nem com gesso (280). Inferir por semelhança teria errado.

### 2.2 A guarda — `motivoDaGuarda()` em `src/lib/whatsapp-agent.ts`

Princípio do arquivo: **o modelo propõe, o código decide.** Prompt é instrução,
não garantia.

Até 17/09 a guarda conferia só o número, e deixava passar o erro mais caro:

```
Cliente: "caçamba menor, demolição, em Itapema"
Modelo:  "Sai por R$ 220."     ← 220 está na lista, mas é o preço de ITAJAÍ
```

Agora confere a combinação inteira:

```ts
export function motivoDaGuarda(
  texto: string,
  regras: RegrasNegocio = REGRAS_EXPRESS_ENTULHO,
  conversa = "",
): string | null {
  const citados = valoresCitados(texto);
  if (citados.length === 0) return null;
  if (!podeCotar(regras)) return "não há preço cadastrado e o modelo citou valor";

  const cidades = cidadesCitadas(`${conversa}\n${texto}`, regras);
  if (cidades.length === 0) return "o modelo cotou sem a cidade estar definida";
  if (cidades.length > 1) return "a conversa cita mais de uma cidade e o modelo cotou mesmo assim";

  const cidade = cidades[0];
  const daCidade = regras.precos.filter((p) => p.cidade === cidade);
  if (daCidade.length === 0) {
    const rotulo = regras.cidades.find((c) => c.id === cidade)?.rotulo ?? cidade;
    return `não há preço cadastrado para ${rotulo} e o modelo cotou`;
  }

  // Estreita só quando não há ambiguidade: resposta que compara dois produtos
  // fica na conferência por cidade em vez de recusar resposta legítima.
  const produtos = produtosCitados(texto, regras);
  const materiais = materiaisCitados(texto, regras);
  const candidatos = daCidade.filter(
    (p) =>
      (produtos.length === 1 ? p.produto === produtos[0] : true) &&
      (materiais.length === 1 ? p.material === materiais[0] : true),
  );

  const permitidos = candidatos.map((p) => p.valorReais);
  if (regras.diariaExtraReais != null) permitidos.push(regras.diariaExtraReais);

  const proibido = citados.find((v) => !permitidos.some((p) => Math.abs(p - v) < 0.005));
  if (proibido == null) return null;

  const rotulo = regras.cidades.find((c) => c.id === cidade)?.rotulo ?? cidade;
  return `R$ ${proibido} não é preço cadastrado para essa combinação em ${rotulo}`;
}
```

Detalhe que já mordeu: `cidadesCitadas` testa os rótulos **mais longos
primeiro**, senão "Balneário Camboriú" seria reconhecido como "Camboriú".

### 2.3 Modelo de reserva

```ts
export const MODELO_AGENTE = "qwen/qwen3.6-27b";
export const MODELO_RESERVA = "openai/gpt-oss-20b";

/** Vale tentar a reserva? Só quando o problema é do modelo, não da conta. */
function vaiParaReserva(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status;
  if (status === 429 || status === 404) return true;
  return typeof status === "number" && status >= 500;
}
```

```ts
let bruto: string;
try {
  bruto = await pedir(MODELO_AGENTE);
} catch (error) {
  console.error(`Falha ao chamar a Groq em ${MODELO_AGENTE}:`, error);
  if (!vaiParaReserva(error)) {
    return decidirRespostaOffline({ ...params, motivo: resumirErro(error) });
  }
  try {
    bruto = await pedir(MODELO_RESERVA);
    console.warn(`Groq respondeu pela reserva ${MODELO_RESERVA} — primário: ${resumirErro(error)}`);
  } catch (erroReserva) {
    return decidirRespostaOffline({
      ...params,
      motivo: `${resumirErro(error)}; reserva também falhou (${resumirErro(erroReserva)})`,
    });
  }
}
```

**Por que famílias diferentes:** na Groq a cota diária é **por modelo**. Uma
reserva da mesma família não ajudaria. 401/403 não tenta reserva — chave
recusada seria recusada igual no segundo modelo.

A resposta da reserva passa pela mesma guarda. Reserva não é permissão para
inventar.

### 2.4 Ponte da demonstração — `src/features/express-ops-b/data/agente.ts`

`createServerFn` de propósito: a `GROQ_API_KEY` nunca desce para o navegador.
Limites: 500 caracteres por mensagem, 12 turnos de histórico.

---

## 3. Dados e regras de negócio

### 3.1 As 8 cidades

Ditas pelo responsável em 16/09/2026:

`itajai` (Itajaí, sede) · `balneario-camboriu` · `camboriu` · `itapema` ·
`porto-belo` · `ilhota` · `navegantes` · `penha`

> [!WARNING]
> **Não existe regra de deslocamento no código, nem preço para Itapema.**
> Se alguém te disser que existe, está enganado. Fora de Itajaí há **zero**
> preços cadastrados: a agente encaminha. *Como* o preço muda fora de Itajaí é
> exatamente a pergunta aberta da pendência 1 — o responsável ainda não
> respondeu se é "Itajaí + deslocamento por cidade" (7 números) ou tabela
> própria por cidade (28 números).

### 3.2 Produtos

| id | rótulo | dias | onde |
| --- | --- | --- | --- |
| `cacamba-menor` | Caçamba menor | 3 | todas as 8 |
| `cacamba-grande` | Caçamba grande | 7 | todas as 8 |
| `tambor` | Tambor | 3 | **só Itajaí** |

> [!IMPORTANT]
> **A capacidade em m³ não está definida em lugar nenhum.** Não invente. É a
> pergunta central da pendência 5, e a agente hoje não sabe responder "qual eu
> escolho?".

### 3.3 Materiais

Só dois: `demolicao` e `gesso`.

> [!WARNING]
> **"Entulho" não é material cadastrado.** `materiaisCitados("é entulho
> comum")` devolve `[]` — verifiquei rodando. O nome da empresa é Express
> Entulho, então é fácil supor que "entulho" seja uma categoria. Não é, ainda.
> A lista real de materiais é a pergunta (c) da pendência 1.

### 3.4 Preços reais

Estado em 19/09, depois dos dados que o responsável passou em 18/09.

**Itajaí — completa:**

| Produto | Prazo | Demolição | Gesso |
| --- | --- | --- | --- |
| Caçamba menor | 3 dias | R$ 220 | R$ 280 |
| Caçamba grande | 7 dias | R$ 450 | R$ 550 |
| Tambor | 3 dias | R$ 180 | R$ 230 |

**Outras sete cidades — só demolição**, no mesmo preço de Itajaí: menor
R$ 220, grande R$ 450. Sem acréscimo por deslocamento. Tambor não é oferecido
fora de Itajaí.

**Ainda vazio:** gesso em qualquer cidade que não seja Itajaí (14 caixas), a
diária extra (`diariaExtraReais: null`) e a capacidade em m³.

`descontoMaximoPct` está em **10**, alterado para a demonstração de 19/09.
Antes era 0. Confirme se 10% é a alçada real que o dono quer dar à agente —
`FORA_DA_ALCADA` intercepta "desconto" antes do modelo de qualquer forma, então
hoje o número quase não é exercido.

## 4. Pendências do cliente

Resumo de `PENDENCIAS-CLIENTE.md`. Nenhuma se resolve escrevendo código.

| # | Pendência | Sem isso, a agente… | Contorno na demo |
| --- | --- | --- | --- |
| 1 | **Preços que faltam** | encaminha tudo que não seja Itajaí com demolição, ou menor com gesso | Roteiro fica em Itajaí. A escalação é apresentada como recurso, não defeito |
| 2 | **Verificação de negócio na Meta** (CNPJ 48.091.178/0001-11, processo não aberto) | só fala com números cadastrados à mão | **Demo roda no navegador, não no WhatsApp** — não depende da Meta |
| 3 | **Divergência de endereço** (NFS-e diz Vila Operária, Google diz São João) | arrisca reprovar a verificação do item 2 | Não aparece na demo |
| 4 | **API do MAIS Locações** | nunca responde "tem caçamba hoje?" | Apresentar como roadmap |
| 5 | **Tambor R$ 180 < menor R$ 220 está certo?** | cota os dois como estão | Provavelmente certo, se o tambor for menor em volume. Pergunta que resolve: **capacidade em m³ dos três** |

**O contorno que vale para tudo:** a agente nunca inventa. Onde não sabe, diz
que vai confirmar com a equipe. Isso é demonstrável como qualidade — "ela
prefere encaminhar a errar um preço em nome da empresa" é argumento de venda,
não desculpa.

---

## 5. Próximos passos imediatos

### 1. BLOQUEANTE — a conversa trava a cotação depois que a agente lista as cidades

**Reproduzi rodando o código, não é teoria.** `motivoDaGuarda` recebe o
histórico inteiro — e `historico` inclui os turnos **da própria agente**
(`regras-do-agente.tsx:131` mapeia as falas dela para `role: "assistant"`).

Quando alguém pergunta *"quais cidades vocês atendem?"* — pergunta óbvia numa
reunião de vendas — a agente responde listando as oito. Essa resposta entra no
histórico. A partir daí, `cidadesCitadas` enxerga 8 cidades, cai em
`cidades.length > 1`, e **toda cotação seguinte é barrada**, para sempre
naquela conversa.

Medido:

```
A) histórico com a lista das 8 cidades, depois "menor, demolição, em Itajaí"
   → "a conversa cita mais de uma cidade e o modelo cotou mesmo assim"   ❌

B) mesma cotação, histórico só com Itajaí
   → null (passa)                                                        ✅
```

**Correção sugerida:** a cidade que vale é a **última mencionada**, não o
conjunto. Trocar a regra de "mais de uma cidade → barra" por "usar a cidade
mais recente da conversa". A ambiguidade real a proteger é *na mesma
mensagem* ("quanto custa em Itajaí e em Itapema?") — aí sim barrar.

Esboço:

```ts
// Em vez de barrar quando a conversa inteira cita várias cidades:
const naMensagem = cidadesCitadas(texto, regras);
if (naMensagem.length > 1) {
  return "a resposta cita mais de uma cidade e cotou mesmo assim";
}
const cidade = naMensagem[0] ?? ultimaCidadeDa(conversa, regras);
if (!cidade) return "o modelo cotou sem a cidade estar definida";
```

`ultimaCidadeDa` precisa varrer o histórico **de trás para frente** e devolver
a primeira que encontrar. Cubra com teste: o caso A acima vira teste de
regressão, e os testes existentes de Itapema e de Balneário × Camboriú
**precisam continuar passando** — eles protegem o erro caro de cotar preço de
Itajaí fora dela.

### 2. Confirmar que `GROQ_API_KEY` chega ao runtime e que o modelo responde

Um comando responde as duas coisas:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://veronicahub.com/api/whatsapp/diagnostico
```

`chaveVisivel: false` → o Worker não enxerga o segredo (configurado no painel e
chegando em `process.env` são coisas diferentes). `status: 404` → o nome
`qwen/qwen3.6-27b` mudou na Groq; a reserva cobre, mas é bom saber antes.

Sem `GROQ_API_KEY`, a demo inteira cai no caminho offline e a agente encaminha
tudo — funciona, mas não demonstra nada.

### 3. Ensaiar o roteiro uma vez, em Itajaí

Em `https://veronicahub.com/preview/express-operations-b/regras-do-agente`:

1. `quanto custa uma caçamba?` → deve **perguntar material e cidade**
2. `é demolição, em Itajaí` → deve sair **R$ 220**
3. `e se for gesso na grande?` → **não sabe**, encaminha
4. `menor, demolição, em Itapema` → encaminha (a guarda impede os R$ 220)
5. `a caçamba encheu, preciso de outra` → entende como **troca**
6. `me dá 20% de desconto` → escala sem passar pelo modelo

Enquanto o item 1 não estiver corrigido, **não pergunte as cidades antes de
cotar** — a cotação para de sair.

---

## Sobre trocar o provedor de LLM

Há uma tarefa circulando para adotar a API da Anthropic como provedor
principal, mantendo a Groq como reserva. Não executei — mas a ressalva que eu
tinha (de que ela partia de um diagnóstico errado) **caiu**: o `main` de fato
usa `llama-3.1-8b-instant`, e se ele estiver dando 404 o problema é real.

Antes de trocar de provedor, meça. O 404 pode ser só o identificador do modelo
ter mudado na Groq, e aí a correção é uma linha:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://veronicahub.com/api/whatsapp/diagnostico
```

Vale notar que 404 **já cai para a reserva** (`vaiParaReserva` trata 429, 404 e
5xx), então mesmo com o principal quebrado a agente responde — só gasta uma
chamada perdida antes. Não é incêndio.

Se for trocar: o `@anthropic-ai/sdk` já é dependência (`^0.116.0`). Confirme o
identificador exato do modelo e o preço por token na documentação vigente da
Anthropic — não copie de resumo nenhum, inclusive deste. O desenho a preservar
é o de hoje: **o provedor muda, a guarda de preço não**, e nada responde antes
dela.

## Comandos

```bash
npm install          # não há package-lock.json versionado; há bun.lock
npm run typecheck    # tsc --noEmit
npm test             # 81 testes
npm run agente       # simulador de terminal, pede a chave da Groq sozinho
npm run agente -- --roteiro   # roteiro pronto
npm run agente -- --regras    # o que o modelo recebe no prompt
```

## Arquivos que importam

| Arquivo | Papel |
| --- | --- |
| `src/lib/whatsapp-rules.ts` | **Fonte única de verdade comercial.** Preços novos entram aqui e valem em todas as superfícies no mesmo instante |
| `src/lib/whatsapp-agent.ts` | Núcleo conversacional, guarda de preço, fallback |
| `src/lib/whatsapp-webhook.ts` | Assinatura da Meta, janela de 24h |
| `src/lib/whatsapp-diagnostico.ts` | Sonda de Groq e Meta |
| `src/features/express-ops-b/data/agente.ts` | Ponte da demo (`createServerFn`) |
| `src/routes/preview/express-operations-b/regras-do-agente.tsx` | Tela da demo com o chat |
| `tests/whatsapp-webhook.test.mjs` | 30 testes, incluindo os da guarda |
| `PENDENCIAS-CLIENTE.md` | As 5 pendências, para ler junto com o cliente |
| `AGENTS.md` | **Restrição permanente do número de WhatsApp** |

> [!CAUTION]
> **O número que a Express Entulho usa hoje não é migrado, não é cadastrado na
> Meta e não tem conversa apagada.** A agente vai para um número novo e
> dedicado. Migrar desativaria a conta no aplicativo e o histórico não
> acompanha. A restrição completa está em `AGENTS.md` e não é decisão de quem
> desenvolve.
