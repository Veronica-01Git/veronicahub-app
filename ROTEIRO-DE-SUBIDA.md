# Roteiro de subida — agente de WhatsApp da Express Entulho

Este arquivo responde uma pergunta só: **o que precisa acontecer, e em que
ordem, para a agente sair do computador e começar a atender de verdade.**

Está escrito para ser lido por quem não programa. Onde aparecer algo técnico,
vem a tradução do lado.

Projeto `VH-AUT-WA-2026-000001`. Escrito em 21/09/2026.

---

## Antes de tudo: onde estamos hoje

A agente está **pronta e muda**.

Pronta: ela sabe o preço, sabe os prazos, sabe pedir os dados para agendar,
sabe recusar desconto com o motivo certo e sabe quando calar a boca e chamar
uma pessoa. Dá para conversar com ela agora mesmo, no computador.

Muda: ela **não manda mensagem para ninguém**. Não é que ainda não configuramos
— é que existe uma trava de propósito, e ela está ligada. Mesmo que tudo o
mais esteja pronto, nada sai até alguém desligar essa trava de forma
deliberada.

Isso é o item 7 deste roteiro, e é o **último** de todos.

---

## O mapa, em uma olhada

| #   | Passo                         | Quem faz                     | Quanto demora   |
| --- | ----------------------------- | ---------------------------- | --------------- |
| 1   | Conferir os preços com o dono | Você + dono                  | 15 minutos      |
| 2   | Dono testa a agente           | Dono                         | 20 minutos      |
| 3   | Chip novo                     | Dono                         | 1 a 3 dias      |
| 4   | Acertar o endereço da empresa | Dono + contador              | 1 a 5 dias      |
| 5   | Verificação na Meta           | Você, com documentos do dono | Depende da Meta |
| 6   | Ligar a agente no chip novo   | Você                         | 1 hora          |
| 7   | **Destravar o envio**         | Você, com o "sim" do dono    | 1 minuto        |

Os passos 3, 4 e 5 correm por fora e **não aceleram com esforço nosso**. São os
que devem começar primeiro, mesmo que os outros ainda não estejam prontos.

---

## 1. Conferir os preços com o dono

**Por quê:** a agente repete com confiança total o preço que está cadastrado.
Se um número estiver errado, ela erra para cliente real, com a voz da empresa.

Hoje ela conhece **sete combinações**. Quatro vieram de um vendedor que saiu da
empresa, e ele mesmo disse não ser vendedor antes de não saber vários valores.
Essas quatro precisam de um "confirmo" do dono.

O que perguntar, e está tudo detalhado em `PENDENCIAS-CLIENTE.md`:

- Os preços de Itajaí estão certos? (menor R$ 220, tambor R$ 180, grande
  R$ 450 para demolição; menor R$ 280 para gesso)
- Quanto custa gesso no tambor e na caçamba grande?
- O preço de Itapema vale para as outras seis cidades, ou cada uma tem o seu?
- Quanto custa a diária extra depois do prazo?
- O tambor custa R$ 180 tanto para demolição quanto para entulho. Tem preço
  único, independente do material?

**Enquanto não vier resposta:** a agente encaminha para uma pessoa em tudo que
não souber. Isso funciona e não constrange ninguém — ela só resolve menos
conversas sozinha.

---

## 2. O dono testa a agente

**Isso acontece no computador, sem WhatsApp nenhum.** Zero risco: não existe
número envolvido, não existe cliente do outro lado, não tem como escapar
mensagem.

Você abre o simulador e ele conversa como se fosse cliente. Digita "quanto
custa uma caçamba?", ela responde, ele vê se soou como ele falaria.

É aqui que ele aprova ou pede ajuste. Se ele disser "eu não falo assim", a
gente muda o texto e testa de novo na hora.

**O que ele deve testar de propósito:**

- Pedir preço sem dizer a cidade → ela tem que perguntar, não chutar
- Pedir desconto → ela tem que recusar e explicar o motivo do aterro
- Perguntar algo que ela não sabe → ela tem que encaminhar, não inventar
- Dizer que a caçamba encheu → ela tem que entender que é troca, não retirada

---

## 3. Chip novo

**Este é o que mais demora e o que mais gente esquece.**

A agente vai para um **número novo, dedicado**. O número atual da empresa
continua exatamente como está: no aparelho, com o histórico, atendendo.

**Por que não dá para usar o número atual:** ao ligar um número na ferramenta
da Meta, aquele número **sai do WhatsApp comum** e o histórico de conversas
não vai junto. O número atual é o canal que fatura a empresa. Não se arrisca
isso por conveniência técnica.

Isso está registrado como regra permanente do projeto em `AGENTS.md`, e vale
também para número pessoal de quem desenvolve.

**O que o dono precisa fazer:** comprar um chip, ativar, e mandar o número.
Entre comprar e estar pronto para usar costuma levar alguns dias.

---

## 4. Acertar o endereço da empresa

Dois documentos da mesma empresa dizem bairros diferentes:

- A nota fiscal diz **Vila Operária**
- O Google Meu Negócio diz **São João**

**Por que isso importa:** no passo 5, a Meta compara o que a gente digita com
o que está no documento. Endereço que não bate é motivo clássico de recusa —
e recusa significa refazer e esperar de novo.

**O que o dono precisa decidir:** qual é o endereço oficial, o que está no
Cartão CNPJ. Esse é o que vale. Depois, corrigir o outro.

**A ordem importa: corrigir primeiro, mandar para a Meta depois.** Mandar com
os dois divergentes é gastar uma rodada de análise para receber "não".

---

## 5. Verificação na Meta

A Meta precisa confirmar que a empresa existe antes de deixar a agente
conversar com o público. **Esse processo ainda não foi aberto.**

**Por que é o passo mais crítico:** o prazo não depende de nós. A Meta analisa
quando analisa, pode pedir documento a mais, e pode recusar por detalhe de
cadastro. Abrir hoje não custa nada e é a única coisa que encurta esse prazo.

**O que separar:** documento oficial que mostre razão social e endereço,
batendo exatamente com o que for digitado. O Cartão CNPJ é o caminho mais
direto.

Pelos documentos que já vi, a razão social é **INOVAÇÃO SERVIÇOS
ADMINISTRATIVOS E TRANSPORTE LTDA**, CNPJ 48.091.178/0001-11 — "Express
Entulho" é o nome fantasia. Vale conferir com o dono antes de digitar.

**Enquanto a verificação não sai:** a agente funciona num número de teste que
a Meta fornece, que só conversa com números cadastrados um a um. Dá para
demonstrar de ponta a ponta numa reunião. Não dá para atender cliente de
verdade.

---

## 6. Ligar a agente no chip novo

Este é o passo técnico, e é meu. Em linguagem simples, são quatro coisas:

1. **Cadastrar o chip novo** no painel da Meta como o número da agente.
2. **Guardar as senhas** do painel no servidor. São quatro códigos que a Meta
   fornece; eles ficam guardados no servidor, nunca dentro do programa.
3. **Avisar a Meta para onde mandar as mensagens** — o endereço na internet
   onde a agente escuta.
4. **Rodar a checagem.** Existe um teste pronto que responde se cada peça está
   no lugar.

Ao fim deste passo, a agente **ainda não manda nada**. Tudo está ligado, mas
a trava do passo 7 continua fechada. É de propósito: quero conseguir conferir
que tudo funciona antes de qualquer mensagem sair.

---

## 7. Destravar o envio

**Um passo. Um minuto. E é o único que muda o mundo real.**

Até aqui, mesmo com absolutamente tudo pronto e configurado, a agente não
manda mensagem. Existe uma segunda chave, separada das senhas da Meta.

As senhas dizem **"consigo enviar"**. Esta chave diz **"posso enviar"**.

Ela vem desligada de fábrica. E não destrava por acidente: escrever "sim",
"true", "1", "yes" ou "on" **não funciona**. Só um texto específico e
propositalmente esquisito libera, justamente para ninguém ligar sem querer
nem copiando de tutorial.

**Quando virar esta chave:** depois que o dono testou, viu, e disse sim.

Esse "sim" é do dono da Express Entulho, não meu nem seu.

---

## Se der errado depois de no ar

**Para desligar tudo:** apaga-se a chave do passo 7. A agente para de
responder na mesma hora, sem apagar nada e sem perder configuração. Religar
depois é escrever a chave de novo.

Não é preciso desfazer nada, nem mexer no número, nem avisar a Meta.

---

## O que a agente NÃO faz, e é de propósito

Vale o dono saber disso **antes** de aprovar, para não descobrir depois e se
sentir enganado.

- **Não confirma agendamento.** Ela pede os dados e passa para uma pessoa. Ela
  não enxerga a agenda real nem sabe se tem caçamba livre.
- **Não manda chave Pix e não confere comprovante.** Dinheiro é de pessoa.
- **Não fala de multa, cancelamento, boleto ou nota fiscal.** Encaminha.
- **Não dá desconto.** Nenhum, em nenhuma situação. Recusa explicando o
  reajuste do aterro, como o dono faz.
- **Não inventa preço.** Se a combinação de produto, material e cidade não
  estiver cadastrada, ela não estima e não usa preço parecido — encaminha.
  Existe uma conferência automática que derruba a resposta e chama uma pessoa
  se o modelo tentar.
- **Não diz "já abri a ordem de serviço".** Ela não abre. Diz que vai passar
  para a equipe.

Essa última lista é o que separa uma agente que ajuda de uma que cria problema
— e é o que mais precisa sobreviver a pedidos de "deixa ela mais solta".

---

## Resumo em três linhas

Comece hoje pelos passos 3, 4 e 5 — são os que dependem de terceiros e não
aceleram. Os passos 1 e 2 são uma conversa de meia hora com o dono e é o que
mais muda o que ele vai ver funcionando. O passo 7 só acontece depois que ele
disser sim.
