export type EmailLiberadoDto = {
  enviados: number;
  falhas: number;
  pendentes: number;
};

export type EmailEnvioDto = {
  id: string;
  provaAlunoId: string;
  destinatario: string;
  assunto: string;
  status: "pendente" | "enviado" | "erro";
  erro: string | null;
  enviadoEm: string | null;
  criadoEm: string;
  aluno?: {
    id: string;
    nome: string;
  };
};
