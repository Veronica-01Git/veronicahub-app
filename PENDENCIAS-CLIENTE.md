# O que só o cliente pode responder — Express Entulho

Cinco pendências que **não são de programação**. Nenhuma delas se resolve
escrevendo código: são informação comercial e decisão do dono da empresa. Estão
aqui separadas do resto porque o caminho crítico até **19/09/2026** passa por
elas, não pelo software.

Este arquivo é feito para ser lido junto com o cliente. Cada bloco diz **o que
eu preciso**, **por que**, e **o que a agente faz enquanto a resposta não vem** —
essa última parte importa: em nenhum caso a agente inventa. Onde ela não sabe,
ela encaminha para uma pessoa. O projeto não trava sem essas respostas; ele
entrega menos.

Levantado em 17/09/2026. Selo `VH-AUT-WA-2026-000001`.

**Atualizado em 21/09/2026.** Entraram os dois preços de Itapema que o dono
ditou ao cliente na conversa de 19/09. A matriz agora tem **seis** combinações
preenchidas, não quatro, e elas não são todas em Itajaí. As contagens deste
arquivo foram refeitas, e a pergunta (b) abaixo mudou de natureza: ela já tem
meia resposta, vinda do próprio dono.

---

## Resumo

| #   | Pendência                            | Quem resolve                 | Sem isso, a agente…                                                     |
| --- | ------------------------------------ | ---------------------------- | ----------------------------------------------------------------------- |
| 1   | Preços que faltam                    | Dono / setor comercial       | encaminha todo pedido de valor fora das seis combinações já confirmadas |
| 2   | Verificação de negócio na Meta       | Dono (documentos da empresa) | só funciona no número de teste da Meta, para números cadastrados à mão  |
| 3   | Divergência de endereço              | Dono (contador / Google)     | corre risco de reprovar a verificação do item 2 e ter de refazer        |
| 4   | API do MAIS Locações                 | Suporte do fornecedor        | nunca responde "tem caçamba livre hoje" — sempre encaminha              |
| 5   | Tambor R$ 180 × caçamba menor R$ 220 | Dono                         | cota os dois valores como estão; se um estiver errado, cota errado      |

Os itens **1 e 5 são os únicos que mudam o que a agente responde no dia 19**.
Os itens 2 e 3 decidem se ela atende cliente real ou só demonstração. O item 4
decide o teto do produto daqui para a frente.

---

## 1. Os preços que faltam

### O que já está confirmado

Seis preços, em duas cidades, e eles não têm o mesmo peso de fonte.

**Itajaí** — vieram do áudio do vendedor que está saindo (16/09). Ele mesmo
diz "não sou vendedor, vendedor não é eu" antes de não saber vários valores.
Valem como indício. **Reconfirmar com o dono.**

| Produto            | Prazo  | Demolição | Gesso     |
| ------------------ | ------ | --------- | --------- |
| Caçamba menor      | 3 dias | R$ 220    | R$ 280    |
| Tambor (só Itajaí) | 3 dias | R$ 180    | **falta** |
| Caçamba grande     | 7 dias | R$ 450    | **falta** |

**Itapema** — ditos pelo **próprio dono**, em conversa real com cliente
(19/09): "CACAMBA MENOR, 250 reais e fica 3 dias" e "Caçamba grande, 470 reais
e fica 7 dias". É a fonte mais forte que existe no projeto.

| Produto        | Prazo  | Demolição | Gesso  |
| -------------- | ------ | --------- | ------ |
| Caçamba menor  | 3 dias | **falta** | R$ 250 |
| Caçamba grande | 7 dias | **falta** | R$ 470 |

Repare no que essas duas tabelas dizem juntas: gesso na caçamba menor custa
**R$ 280 em Itajaí e R$ 250 em Itapema**. Cidade diferente, preço diferente —
e mais barato fora da sede. Isso não é detalhe de cadastro; é o que responde
metade da pergunta (b) mais abaixo.

### O tamanho real do buraco

Contando as oito cidades atendidas e os dois materiais que já conhecemos, a
matriz tem **34 combinações de produto × material × cidade. Seis estão
preenchidas. Vinte e oito estão vazias** — e isso ainda é o cenário otimista,
porque considera que só existem dois materiais.

Onde estão os vinte e oito buracos:

- **Duas em Itajaí:** tambor com gesso e caçamba grande com gesso.
- **Duas em Itapema:** demolição na menor e na grande. A cidade tem gesso
  cotado pelo dono, mas demolição não.
- **Vinte e quatro nas outras seis cidades:** Balneário Camboriú, Camboriú,
  Porto Belo, Ilhota, Navegantes e Penha — caçamba menor e caçamba grande,
  demolição e gesso, em cada uma. Nenhum preço, de nada, em nenhuma delas.

### As três perguntas que fecham isso

Em vez de pedir vinte e oito números, três perguntas resolvem quase tudo:

**a) Os dois preços de gesso em Itajaí.** Tambor com gesso e caçamba grande com
gesso. São dois valores.

**b) Fora de Itajaí, o preço muda como? — meia resposta já veio, e ela fecha
uma porta.** A conversa do dono em 19/09 mostra gesso na caçamba menor a
**R$ 250 em Itapema** contra **R$ 280 em Itajaí**. Isso elimina as duas
hipóteses mais convenientes de uma vez: não é tabela única, e não é "preço de
Itajaí mais deslocamento" — fosse deslocamento, a cidade de fora sairia mais
cara, não mais barata.

O que sobra é tabela por cidade. Resta confirmar **o formato**, e é isso que
muda o trabalho:

- _Se cada uma das oito cidades tiver preço próprio_, são mesmo vinte e oito
  números, e cada material novo no futuro vira mais oito.
- _Se as cidades se agruparem_ (por exemplo, todo o litoral com o mesmo preço,
  ou Itajaí de um lado e o resto de outro), são poucos números e o resto se
  propaga sozinho.

A pergunta ao dono, então, não é mais "muda como?" e sim: **o preço de Itapema
vale para as outras seis cidades, ou cada uma tem o seu?**

**c) Quais materiais existem, além de demolição e gesso?** Terra, entulho
misto, madeira, poda, mudança, lixo de reforma — a lista real da empresa. Cada
material novo **multiplica** a matriz: com três materiais ela sai de 34 para 51
combinações. É por isso que vale saber a lista inteira antes de sair
preenchendo, e não descobrir um material por vez.

### Mais dois valores soltos

- **A diária extra** cobrada depois do prazo (3 dias na menor e no tambor, 7 na
  grande). Hoje a agente não sabe esse valor e encaminha toda pergunta de
  prorrogação. Um número resolve.
- **O R$ 240 da conversa de 14/09.** Uma conversa real cotou a caçamba menor
  por R$ 240 — que não bate com demolição (R$ 220) nem com gesso (R$ 280). Não
  entrou na tabela de propósito. Vale perguntar o que era: outro material? Outra
  cidade? Negociação pontual? A resposta provavelmente revela uma regra de
  preço que ninguém contou ainda.

### O que acontece sem essas respostas

A agente cota **seis combinações** e só elas: em Itajaí, demolição na menor,
no tambor e na grande, mais gesso na menor; em Itapema, gesso na menor e na
grande. Todo o resto vira "deixa eu confirmar com a equipe" — inclusive
demolição em Itapema, que é a mesma cidade onde ela acabou de cotar gesso.
Isso funciona e não constrange ninguém — mas é uma agente que encaminha a maior
parte das conversas em vez de resolver.

---

## 2. Verificação de negócio na Meta — ainda não iniciada

**CNPJ 48.091.178/0001-11.** O processo não foi aberto.

### Por que isto é o caminho crítico

O prazo da Meta não depende de nós. Ela analisa quando analisa, pode pedir
documento complementar, e pode reprovar por detalhe de cadastro. Enquanto a
verificação não sai, o agente opera no **número de teste da Meta**, que só
conversa com números cadastrados um a um no painel. Dá para demonstrar de ponta
a ponta na reunião; não dá para atender cliente de verdade.

Ou seja: **o software pode estar pronto no dia 19 e mesmo assim a agente não
atender ninguém**, porque a burocracia começou tarde. Abrir o processo hoje não
custa nada e é a única coisa que encurta esse prazo.

### O que o cliente precisa separar

Documento oficial que mostre **razão social e endereço**, batendo exatamente com
o que for digitado no cadastro da Meta. Cartão CNPJ da Receita Federal é o
caminho mais direto.

> Não confirmei a tela e a lista de documentos na documentação atual da Meta —
> o ambiente de desenvolvimento bloqueia o site deles. Antes de subir qualquer
> arquivo, conferir os requisitos vigentes no próprio painel. O que não muda é
> o princípio: **o que está no documento tem de bater com o que está digitado**.

### E o número

Vale repetir, porque é decisão já tomada e registrada em `AGENTS.md`: **o número
de WhatsApp que a Express Entulho usa hoje não entra nisso.** Não é migrado, não
é cadastrado, não tem conversa apagada. Ele continua no aplicativo, no aparelho
da empresa, atendendo. A agente vai para um número novo e dedicado.

Consequência prática para o cliente: **em algum momento vai ser preciso um chip
novo.** Não é urgente para a demonstração de 19/09 — o número de teste da Meta
cobre isso — mas é urgente para atender cliente real, e leva alguns dias entre
comprar, ativar e cadastrar.

---

## 3. A divergência de endereço

Dois documentos da mesma empresa dizem bairros diferentes:

- **NFS-e** → Vila Operária
- **Google Meu Negócio** → São João

Isso não é detalhe. A verificação da Meta compara o que você digita com o que
está no documento, e um endereço que não bate é motivo clássico de reprovação —
e reprovar significa refazer e esperar de novo, o que é exatamente o que não
cabe no prazo.

**O que precisa ser decidido:** qual é o endereço oficial, o que consta no
Cartão CNPJ. Esse é o que vale. Depois, **corrigir o outro** — se o Cartão CNPJ
disser Vila Operária, o Google Meu Negócio está errado e deve ser corrigido; se
disser São João, é a configuração da NFS-e que precisa de ajuste com o contador.

A ordem importa: **ajustar primeiro, submeter à Meta depois.** Submeter com os
dois divergentes é gastar uma rodada de análise para receber "não".

Observação: o endereço que está registrado no sistema da agente é
`R. Benjamin Franklin Pereira, 365 — Itajaí/SC`, sem bairro. Quando o bairro
oficial for confirmado, ele entra lá também.

---

## 4. O MAIS Locações tem API?

O MAIS Locações (maislocacoes.com) é o sistema de gestão que a Express Entulho
**já paga hoje** — contratos, prazos, logística, entregas e retiradas do dia.

Procurei documentação de API, webhook ou área de desenvolvedor e **não encontrei
nada**, em três buscas distintas. Mas o site deles está bloqueado pelo proxy do
ambiente de desenvolvimento, então isso é **ausência de evidência, não evidência
de ausência**. A única forma honesta de saber é perguntar.

### Por que isso decide o teto do produto

Hoje, "tem caçamba livre para hoje?" e "consegue entregar amanhã de manhã?" vão
**sempre** para uma pessoa. A agente não consulta agenda nem frota, e por isso
não confirma agendamento — está escrito nas proibições dela.

- **Se houver API ou webhook**, a integração é barata e a agente passa a
  responder disponibilidade com dado real. É o salto que transforma "atendente
  que encaminha" em "atendente que resolve".
- **Se não houver**, a agente continua encaminhando disponibilidade — que é o
  comportamento correto, só menos impressionante.

Raspagem de tela não é alternativa: é frágil e normalmente fere os termos de uso
do fornecedor.

### Mensagem pronta para o suporte

O cliente é quem tem contrato com eles, então a pergunta parte dele. Texto para
copiar e colar:

> Olá! Somos clientes do MAIS Locações e estamos integrando um atendimento
> automatizado de WhatsApp ao nosso fluxo. Vocês oferecem **API pública ou
> webhooks** para consulta de disponibilidade de equipamentos e da agenda de
> entregas e retiradas do dia? Se sim, por favor nos enviem a documentação e
> como solicitar as credenciais. Se não houver hoje, existe previsão?

Duas coisas a observar na resposta: se a API é **leitura** (consultar
disponibilidade) ou também **escrita** (criar locação), e se há custo adicional.

---

## 5. O tambor sai mais barato que a caçamba menor. Está certo?

Na tabela, com demolição em Itajaí:

- **Tambor — R$ 180**
- **Caçamba menor — R$ 220**

Marquei isso como dado a conferir, mas é bem provável que **esteja certo e não
seja estranho**: se o tambor for menor em volume que a caçamba menor, custar
menos é exatamente o esperado. A estranheza vem de supor que "tambor" seja um
equipamento maior — suposição nossa, não informação da empresa.

**A pergunta que resolve de vez, e que rende mais do que a resposta:**

> Qual a **capacidade em metros cúbicos** de cada um dos três — tambor, caçamba
> menor e caçamba grande?

Três números que fazem duas coisas ao mesmo tempo:

1. **Confirmam a ordem de preço.** Se o volume crescer junto com o preço
   (tambor < menor < grande), o R$ 180 está certo e o assunto morre aqui.
2. **Dão à agente o que ela mais precisa para vender.** Hoje, quando alguém
   pergunta "qual eu escolho?", ela não tem o que dizer — não sabe o tamanho de
   nada. Com o volume, ela ajuda a escolher, que é metade do atendimento de
   locação de caçamba.

Se o volume _não_ explicar o preço, aí sim há um erro em algum lugar, e é melhor
descobrir antes de a agente repetir o número errado para cliente.

---

## Como usar este arquivo

Os itens **2 e 3 são os que precisam sair primeiro**, porque o relógio deles
corre por fora e não acelera com esforço nosso. Os itens **1 e 5 são uma
conversa de quinze minutos** com quem sabe o preço — e é a conversa que mais
muda o que o cliente vai ver funcionando. O item **4 é um e-mail** que pode ser
enviado hoje e respondido quando responderem.

Conforme as respostas chegarem, elas entram em `src/lib/whatsapp-rules.ts`, que
é a única fonte de verdade comercial da agente, e passam a valer no mesmo
instante para o WhatsApp, para o simulador de terminal e para a demonstração.
Nada aqui exige redesenho: a matriz já está pronta para receber.
