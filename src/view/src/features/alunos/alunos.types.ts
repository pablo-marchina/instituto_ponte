export type AlunoDto = {
  id: string;
  nome: string;
  email: string;
  cpf: string | null;
  turma: string | null;
  aceitouTermosEm: string | null;
  criadoEm: string;
  atualizadoEm: string;
};

export type UpdateAlunoPayload = {
  nome?: string;
  email?: string;
  cpf?: string | null;
  turma?: string | null;
};
