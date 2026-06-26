/**
 * Aluno que realiza provas no sistema.
 *
 * Alunos **não** possuem login ou senha. Eles são cadastrados
 * automaticamente no momento em que acessam o link público de uma prova
 * e informam seus dados. Isso significa que um mesmo aluno pode ter
 * múltiplos registros se acessar provas diferentes com dados distintos.
 *
 * Relacionamentos:
 * - `ProvaAluno.alunoId` → um aluno pode estar vinculado a várias provas
 *   através da tabela associativa `prova_aluno`.
 * - `RespostaAluno` → as respostas do aluno são vinculadas via `provaAlunoId`.
 *
 * Regras de negócio:
 * - `cpf` é opcional, mas quando preenchido permite deduplicar registros
 *   do mesmo aluno entre diferentes acessos e associar resultados a ele.
 * - `aceitouTermosEm` registra o momento exato em que o aluno aceitou os
 *   termos de uso e a política de privacidade antes de iniciar a prova.
 *   Se for `null`, o aluno ainda não completou o fluxo de aceitação.
 */
export type Aluno = {
  id: string;
  nome: string;
  email: string;
  cpf: string | null;
  turma: string | null;
  aceitouTermosEm: string | null;
  criadoEm: string;
  atualizadoEm: string;
};
