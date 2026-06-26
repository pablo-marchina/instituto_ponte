/**
 * Professor vinculado a um coordenador.
 *
 * Professores são os usuários que criam e gerenciam provas, questões e
 * correções no sistema. Cada professor pertence a exatamente um coordenador
 * (seu superior hierárquico), que pode visualizar relatórios e gerenciar
 * múltiplos professores.
 *
 * Relacionamentos:
 * - `coordenadorId` → chave estrangeira para um usuário com perfil
 *   `"coordenador"`. Um coordenador pode ter vários professores.
 * - `materia_professor` → associação N:N com `Materia`. Um professor
 *   pode lecionar várias matérias, e uma matéria pode ter vários professores.
 * - `Prova.professorId` → provas criadas pelo professor.
 * - `Questao` → questões criadas pelo professor (via cascata de matéria).
 *
 * Regras de negócio:
 * - O email deve ser único entre todos os professores (validação na camada
 *   de serviço). É usado para login e recuperação de senha.
 */
export type Professor = {
  id: string;
  coordenadorId: string;
  nome: string;
  email: string;
  criadoEm: string;
  atualizadoEm: string;
};
