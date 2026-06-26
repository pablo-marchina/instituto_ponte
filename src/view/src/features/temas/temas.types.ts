export type TemaDto = {
  id: string;
  materiaId: string;
  nome: string;
  descricao: string | null;
  criadoEm: string;
  atualizadoEm: string;
};

export type CreateTemaPayload = {
  materiaId: string;
  nome: string;
  descricao?: string | null;
};

export type UpdateTemaPayload = {
  nome?: string;
  descricao?: string | null;
};
