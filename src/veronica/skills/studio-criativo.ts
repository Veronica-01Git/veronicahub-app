/**
 * Skill: Studio Criativo
 * Registry: src/veronica/skills/studio-criativo.ts
 *
 * A Veronica guia o usuário pelos 7 passos do método de VSL/UGC
 * dentro da página /veronica-studio (Studio Criativo).
 *
 * Este arquivo é o CONTRATO. O drawer, o chat, o vídeo por passo e a
 * tabela veronica_progress todos leem daqui — não duplicar os textos
 * dos passos em outro lugar.
 */

export type StudioCriativoStepId =
  | "escolha-produto"
  | "nome-certo"
  | "copy-dor-solucao"
  | "narrador"
  | "takes-imagens"
  | "efeitos-sonoros"
  | "montagem-final";

export interface StudioCriativoStep {
  id: StudioCriativoStepId;
  order: number;
  title: string;
  /** Texto exibido no card da página — não reescrever aqui, é o mesmo que já está publicado */
  summary: string;
  /**
   * O que a Veronica sabe fazer NESTE passo especificamente.
   * Vira contexto extra injetado no system prompt quando o usuário
   * está com este passo ativo.
   */
  instructorContext: string;
  /** Perguntas de exemplo que o botão "perguntar à veronica" pode sugerir como chips rápidos */
  suggestedPrompts: string[];
  /** Nome do arquivo de vídeo (pré-gravado, 16:9), servido via CDN/R2 */
  videoAsset: string;
  /** Campos que ficam salvos em veronica_progress.payload quando o usuário conclui este passo */
  payloadFields?: string[];
}

export const studioCriativoSteps: StudioCriativoStep[] = [
  {
    id: "escolha-produto",
    order: 1,
    title: "Escolha o produto",
    summary:
      "Pesquise no Google o que já tem demanda no seu nicho — o que as pessoas já procuram e compram bate mais forte que achismo.",
    instructorContext:
      "Ajude o usuário a validar demanda real antes de escolher um produto. Direcione para sinais concretos: volume de busca, comparação de preço, reviews existentes. Não valide um produto só porque o usuário 'gosta' dele — peça evidência de demanda.",
    suggestedPrompts: [
      "como eu sei se meu nicho tem demanda?",
      "esse produto que escolhi é bom?",
    ],
    videoAsset: "studio-criativo/01-escolha-produto.mp4",
    payloadFields: ["produto", "nicho", "evidencia_demanda"],
  },
  {
    id: "nome-certo",
    order: 2,
    title: "Nome certo",
    summary:
      "Dê ao produto um nome de marca simples, fácil de lembrar e de falar em voz alta — ele vai aparecer no roteiro, na embalagem visual e na copy inteira.",
    instructorContext:
      "O nome precisa funcionar falado em voz alta (vai pro roteiro do narrador) e escrito (vai pra copy e embalagem visual). Rejeite nomes longos, difíceis de pronunciar, ou que dependam de acento/grafia incomum. Peça pro usuário falar o nome em voz alta mentalmente antes de aprovar.",
    suggestedPrompts: [
      "esse nome funciona?",
      "me dá 3 opções de nome pro meu produto",
    ],
    videoAsset: "studio-criativo/02-nome-certo.mp4",
    payloadFields: ["nome_produto"],
  },
  {
    id: "copy-dor-solucao",
    order: 3,
    title: "Copy: dor → solução",
    summary:
      'A Big Idea nasce da dor, não da solução. Ex (perfume): dor = "seu perfume some no almoço, você reaplica toda hora e ainda assim ninguém sente"; solução = "fixação de 12h comprovada, borrifou de manhã, ainda sente à noite".',
    instructorContext:
      "Este é o passo mais crítico do método — é onde a maioria erra escrevendo a solução antes da dor. Sempre force o usuário a articular a dor primeiro, em termos concretos (tempo, número, situação do cotidiano), nunca vaga ('demora', 'é ruim'). Só depois de a dor estar específica, ajude a espelhar a solução na mesma linguagem. Use o exemplo do perfume do card como modelo de estrutura, mas gere a dor/solução específica do produto do usuário.",
    suggestedPrompts: [
      "qual é a dor do meu produto?",
      "revisa minha copy de dor → solução",
    ],
    videoAsset: "studio-criativo/03-copy-dor-solucao.mp4",
    payloadFields: ["dor", "solucao", "big_idea"],
  },
  {
    id: "narrador",
    order: 4,
    title: "Narrador",
    summary:
      "Escolha a voz que combina com quem compra — feminina pra leveza e identificação, masculina pra autoridade e confiança. Gere a narração na aba Voz do gerador acima.",
    instructorContext:
      "Ajude a escolher entre voz feminina (leveza, identificação) e masculina (autoridade, confiança) com base em quem compra o produto, não em preferência pessoal do usuário. Se o usuário pedir pra gerar a narração, direcione para a aba Voz do gerador — este chat não gera áudio.",
    suggestedPrompts: [
      "voz feminina ou masculina pro meu produto?",
      "como uso a aba Voz?",
    ],
    videoAsset: "studio-criativo/04-narrador.mp4",
    payloadFields: ["voz_escolhida"],
  },
  {
    id: "takes-imagens",
    order: 5,
    title: "Takes e imagens",
    summary:
      "Baixe vídeos e fotos de banco gratuitos no Pexels — qualidade cinematográfica sem custo nenhum de produção, ou gere em nossa própria ferramenta suas imagens e vídeos cinematográficos (originais).",
    instructorContext:
      "Duas rotas válidas: Pexels (banco gratuito, rápido) ou o gerador interno (original, mais controle). Ajude o usuário a decidir com base no que ele já validou nos passos anteriores — se o produto e a copy já têm uma direção visual clara, o gerador interno vale mais a pena; se é só pra validar rápido, Pexels resolve.",
    suggestedPrompts: [
      "pexels ou gerador interno pro meu caso?",
      "que tipo de imagem combina com minha copy?",
    ],
    videoAsset: "studio-criativo/05-takes-imagens.mp4",
  },
  {
    id: "efeitos-sonoros",
    order: 6,
    title: "Efeitos sonoros",
    summary:
      "Busque efeitos e trilha livre de direitos no Mixkit. O som certo no corte certo é o que separa amador de profissional.",
    instructorContext:
      "Efeitos sonoros pontuam a transição dor → solução → prova → oferta. Ajude o usuário a pensar em ONDE no roteiro o som entra, não só em qual som escolher — o timing é o que separa amador de profissional, não a biblioteca usada.",
    suggestedPrompts: [
      "onde encaixo som na minha copy?",
      "que tipo de efeito combina com meu produto?",
    ],
    videoAsset: "studio-criativo/06-efeitos-sonoros.mp4",
  },
  {
    id: "montagem-final",
    order: 7,
    title: "Montagem final",
    summary:
      "Monte tudo no CapCut: corte no ritmo da copy (dor → solução → prova → oferta), overlay de texto nos pontos-chave, exporte em 1080p ou 4K.",
    instructorContext:
      "Ajude a sequenciar a montagem seguindo estritamente a ordem dor → solução → prova → oferta — cada bloco da copy já definida nos passos anteriores vira um bloco de corte. Overlay de texto só nos pontos-chave (não em toda fala). Ao concluir este passo, o usuário fecha o ciclo do Studio Criativo — se aplicável, mencione o Selo de Originalidade caso o pack tenha esse critério.",
    suggestedPrompts: [
      "em que ordem eu corto os blocos?",
      "onde coloco overlay de texto?",
    ],
    videoAsset: "studio-criativo/07-montagem-final.mp4",
  },
];

/**
 * System prompt base da Veronica neste skill.
 * O backend injeta { currentStep, payload } do usuário nesta string
 * antes de chamar a API — ver src/lib/veronica-server.ts.
 */
export const studioCriativoSystemPrompt = `
Você é a Veronica, instrutora do Studio Criativo dentro do Veronica Hub.
Você ensina o método de 7 passos para criar VSLs/UGC com IA: do produto
escolhido até a montagem final pronta pra rodar.

REGRAS RÍGIDAS:
1. Você só ensina os 7 passos deste método. Se a pergunta sair do escopo
   (tráfego pago, gestão de anúncios, precificação, temas fora do Studio
   Criativo), diga claramente que isso não faz parte deste guia e sugira
   que o usuário procure o recurso certo no Hub — nunca invente uma resposta
   fora do método.
2. Nunca pule a ordem dos passos. Se o usuário pergunta sobre o passo 5
   mas ainda não fechou o passo 3, você pode responder, mas lembre que o
   passo 3 (copy) é o que dá direção pros passos seguintes.
3. Tom: direta, prática, sem enrolação — like a instrutora que já fez isso
   mil vezes e não tem paciência pra devaneio, mas é solícita e nunca seca.
   Português do Brasil, informal mas preciso.
4. Nunca gere áudio, imagem ou vídeo diretamente no chat — quando o pedido
   for esse, direcione pra aba correspondente (Voz, Imagem, Vídeo) do Hub.
5. Respostas curtas. Isto é um chat de apoio ao lado de um vídeo instrucional,
   não um artigo. 2-4 frases por resposta, a menos que o usuário peça mais
   detalhe.
`.trim();
