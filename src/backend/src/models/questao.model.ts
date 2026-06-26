/**
 * Categorias de questão suportadas pelo sistema.
 *
 * - `multipla_escolha`: o aluno seleciona uma alternativa entre várias.
 * - `verdadeiro_falso`: variação de múltipla escolha com duas alternativas (V/F).
 * - `discursiva`: o aluno escreve uma resposta em texto (pode ou não ter
 *   anexo). Exige correção manual do professor.
 */
export type QuestaoTipo = "multipla_escolha" | "verdadeiro_falso" | "discursiva";

/**
 * Enunciado de uma questão, podendo conter LaTeX e imagem opcional.
 *
 * O LaTeX é renderizado no frontend para exibir fórmulas matemáticas e
 * notação científica. A imagem (se presente) é exibida abaixo do texto
 * LaTeX como complemento visual (gráficos, figuras, diagramas).
 */
export type Enunciado = {
  conteudoLatex: string;
  urlImagem: string | null;
};

/**
 * Alternativa de resposta para questões objetivas.
 *
 * Usada pelos tipos `multipla_escolha` e `verdadeiro_falso`. Cada questão
 * objetiva possui de 2 a N alternativas, das quais exatamente uma deve
 * ser marcada como `correta` (gabarito).
 *
 * Campos não óbvios:
 * - `ordemOriginal`: posição original da alternativa no momento da criação.
 *   Preservada para que, mesmo quando `embaralharAlternativas` da prova
 *   estiver ativo, seja possível recuperar a ordenação original do professor.
 * - `correta`: indica se esta é a alternativa correta (gabarito). Usada na
 *   correção automática e na exibição do gabarito ao professor.
 *
 * Regras de negócio:
 * - Toda questão objetiva deve ter exatamente uma alternativa com
 *   `correta === true` (validação na camada de serviço).
 */
export type Alternativa = {
  id: string;
  ordemOriginal: number;
  conteudoLatex: string;
  urlImagem: string | null;
  /** Indica se esta é a alternativa correta (gabarito). */
  correta: boolean;
};

/**
 * Questão do banco de questões.
 *
 * Cada questão pertence a uma matéria e, opcionalmente, a um tema.
 * Questões são reutilizáveis: uma mesma questão pode ser vinculada a
 * múltiplas provas através da tabela associativa `prova_questao`, cada
 * uma com sua própria pontuação e ordem de exibição.
 *
 * Campos não óbvios:
 * - `temaId`: opcional. Quando `null`, a questão é genérica dentro da matéria.
 * - `limiteCaracteres`: aplicável apenas a questões discursivas. Limita o
 *   tamanho máximo do texto que o aluno pode digitar. `null` = sem limite.
 * - `limitePalavras`: alternativa ao limite de caracteres para discursivas.
 *   Normalmente usa-se um ou outro, não ambos.
 * - `permiteAnexo`: exclusivo para discursivas. Quando `true`, o aluno pode
 *   anexar arquivos (imagens, PDFs, etc.) junto com a resposta textual.
 * - `pontuacaoPadrao`: valor em pontos atribuído à questão quando adicionada
 *   a uma prova. Pode ser sobrescrito na tabela `prova_questao` para
 *   personalizar a pontuação por prova.
 * - `ativa`: soft-delete. Quando `false`, a questão não aparece no banco
 *   de questões para novas provas, mas continua existindo nas provas em
 *   que já foi vinculada (evita inconsistências). Equivalente a "arquivada".
 *
 * Relacionamentos:
 * - `materiaId` → FK para `Materia`. Toda questão pertence a uma matéria.
 * - `temaId` → FK opcional para `Tema`.
 * - `alternativas` → lista de alternativas (apenas para objetivas).
 * - `prova_questao` → associação N:N com `Prova`.
 */
export type Questao = {
  id: string;
  materiaId: string;
  temaId: string | null;
  tipo: QuestaoTipo;
  dificuldade: string;
  limiteCaracteres: number | null;
  limitePalavras: number | null;
  permiteAnexo: boolean;
  pontuacaoPadrao: number;
  ativa: boolean;
  criadoEm: string;
  atualizadoEm: string;
  enunciado: Enunciado;
  alternativas: Alternativa[];
  timesUsed: number;
  successRate: number;
};
