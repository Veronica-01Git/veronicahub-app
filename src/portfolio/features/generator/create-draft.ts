import type { PortfolioDraft } from "../../types";

export function createPortfolioDraft(ownerName: string, profession: string): PortfolioDraft {
  const name = ownerName.trim() || "Alex Silva";
  const role = profession.trim() || "Especialista criativo";

  return {
    ownerName: name,
    profession: role,
    headline: `${role} que transforma complexidade em experiências claras e memoráveis.`,
    about: `Eu sou ${name}. Trabalho na interseção entre estratégia, execução e impacto mensurável, criando soluções que aproximam boas ideias de resultados reais.`,
    specialties: ["Direção de projeto", "Experiência digital", "Estratégia aplicada"],
    skills: ["Pesquisa", "Prototipagem", "Comunicação", "Sistemas", "IA aplicada", "Entrega"],
    projects: [
      {
        title: "Sistema Atlas",
        description: "Experiência digital reposicionada do diagnóstico à entrega.",
        result: "+38% de conversão",
      },
      {
        title: "Projeto Norte",
        description: "Operação reorganizada em uma jornada simples e mensurável.",
        result: "-42% de retrabalho",
      },
      {
        title: "Laboratório Um",
        description: "Protótipo validado com usuários antes do investimento principal.",
        result: "3× mais rápido",
      },
    ],
    experience: "Projetos independentes e multidisciplinares · 2022 — agora",
    education: "Formação contínua em estratégia, tecnologia e inteligência artificial.",
    proof:
      "“Clareza rara para transformar uma visão ambiciosa em algo que as pessoas realmente conseguem usar.”",
    contact: "contato@exemplo.com",
  };
}
