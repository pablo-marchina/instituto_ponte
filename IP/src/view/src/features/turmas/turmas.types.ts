export type TurmaDto = {
  id: string;
  nome: string;
  descricao: string | null;
  criadoEm: string;
  atualizadoEm: string;
};

export type TurmaPayload = {
  nome: string;
  descricao?: string | null;
};
