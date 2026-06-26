/**
 * Tópico ou assunto dentro de uma matéria.
 *
 * Os temas organizam o banco de questões em categorias hierárquicas
 * dentro de uma disciplina. Exemplo: dentro de "Matemática" podemos ter
 * os temas "Álgebra Linear", "Geometria", "Trigonometria".
 *
 * Relacionamentos:
 * - `materiaId` → chave estrangeira para `Materia`. Um tema pertence
 *   a exatamente uma matéria.
 * - `Questao.temaId` → um tema pode conter várias questões (opcional).
 *
 * Regras de negócio:
 * - Uma questão pode ou não estar associada a um tema (`temaId` nullable
 *   em Questao). Isso permite registrar questões genéricas que não se
 *   encaixam em um tópico específico.
 */
export type Tema = {
  id: string;
  materiaId: string;
  nome: string;
  descricao: string | null;
  criadoEm: string;
  atualizadoEm: string;
};
