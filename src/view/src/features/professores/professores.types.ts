export type ProfessorDto = {
  id: string;
  coordenadorId: string;
  nome: string;
  email: string;
  criadoEm: string;
  atualizadoEm: string;
};

export type CreateProfessorPayload = {
  nome: string;
  email: string;
  coordenadorId: string;
};

export type UpdateProfessorPayload = {
  nome?: string;
  email?: string;
  coordenadorId?: string;
};

export type ProfessorMateriaVinculoDto = {
  professorId: string;
  materiaId: string;
};
