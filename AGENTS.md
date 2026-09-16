<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Express Entulho — número de WhatsApp (restrição permanente)

> [!CAUTION]
> **O número de WhatsApp em uso hoje pela Express Entulho não é migrado, não é
> alterado e não tem conversas apagadas.** Ele segue no aplicativo, no aparelho
> da empresa, com o histórico intacto, atendendo clientes normalmente.

O agente de IA opera em **número dedicado e novo**, separado do número atual.
Isso vale para desenvolvimento, homologação e produção.

**Por quê.** Migrar um número para a WhatsApp Cloud API desativa a conta daquele
número no aplicativo, e o histórico de conversas não acompanha a migração. Para
a empresa, o número atual é o canal que fatura — o risco de perdê-lo não é
compensado por nenhuma conveniência técnica.

**O que isso proíbe, na prática:**

- Iniciar migração do número atual para a Cloud API, em qualquer ambiente.
- Cadastrar o número atual em conta Meta Business ligada a este projeto.
- Qualquer script, worker ou rota que envie, leia ou remova mensagens do
  número atual.

**Número pessoal de quem desenvolve.** A mesma regra vale. Um número pessoal
pode ser cadastrado como **destinatário** de teste — recebe as mensagens do
agente e a conta segue funcionando normalmente no aplicativo. O que não pode é
ser cadastrado como **remetente** (o número do agente na Cloud API): aí ele é
migrado e desativado no aplicativo, exatamente como aconteceria com o número da
empresa. Para remetente, use o número de teste fornecido pela Meta ou um chip
novo dedicado.

**Se alguém propuser migrar o número principal**, isso é decisão do proprietário
da Express Entulho, tomada por escrito e com o procedimento conferido na
documentação vigente da Meta antes de qualquer clique. Não é decisão de quem
desenvolve, e não se resolve em conversa de implantação.

Registrado em 16/09/2026. Projeto `VH-AUT-WA-2026-000001`.
