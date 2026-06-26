/**
 * Disciplina ou área de conhecimento do sistema.
 *
 * Representa uma matéria escolar (ex.: "Matemática", "Português", "Ciências").
 * Agrupa temas, questões e provas. É o principal eixo de organização do
 * conteúdo: questões são sempre associadas a uma matéria, provas são
 * sempre vinculadas a uma matéria, e professores podem ser vinculados
 * a múltiplas matérias através da tabela associativa `materia_professor`.
 *
 * Relacionamentos:
 * - `Tema.materiaId` → uma matéria contém vários temas.
 * - `Questao.materiaId` → uma matéria contém várias questões.
 * - `Prova.materiaId` → uma prova sempre pertence a uma matéria.
 * - `materia_professor` → associa professores a matérias (N:N).
 *
 * Regras de negócio:
 * - O campo `codigo` é opcional e serve para integração com sistemas
 *   externos (ex.: código INEP, sigla da disciplina).
 */
export type Materia = {
  id: string;
  nome: string;
  codigo: string | null;
  descricao: string | null;
  criadoEm: string;
  atualizadoEm: string;
};
