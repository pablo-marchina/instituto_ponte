/**
 * Desempenho do aluno em uma questão específica.
 *
 * Usado dentro de `ResultadoAluno.questoes` para detalhar o resultado
 * por questão. Cada entrada representa uma questão da prova vinculada
 * ao aluno.
 *
 * - `nota`: pontuação obtida. Pode ser `null` se a questão ainda não
 *   foi corrigida (pendente de correção manual).
 * - `status`: `"corrigida"` quando a nota já foi atribuída, `"pendente"`
 *   quando aguarda correção (normalmente para questões discursivas).
 */
export type ResultadoQuestao = {
  questaoId: string;
  nota: number | null;
  status: "corrigida" | "pendente";
};

/**
 * Resultado consolidado de um aluno em uma prova.
 *
 * Reúne todas as informações de desempenho de um aluno em uma prova
 * específica. É a principal estrutura usada na tela de resultados para
 * professores e coordenadores.
 *
 * Campos não óbvios:
 * - `liberado`: controla se o aluno pode visualizar o resultado. Quando
 *   `false`, o resultado existe no sistema mas está oculto do aluno
 *   (útil para aguardar a correção de todos ou definir uma data de
 *   divulgação). Quando `true`, o aluno vê nota e feedback ao acessar
 *   o link da prova após a finalização.
 * - `pendenciasCorrecao`: quantidade de questões discursivas que ainda
 *   não receberam correção manual. Se for 0, o resultado é definitivo.
 * - `notaTotal`: soma das notas obtidas em todas as questões.
 * - `percentual`: `(notaTotal / pontuacaoMaxima) * 100`. Facilita a
 *   visualização rápida do aproveitamento.
 *
 * Relacionamentos:
 * - `provaAlunoId` → FK para `prova_aluno`. Vincula ao registro da
 *   relação entre o aluno e a prova.
 * - `aluno` → dados do aluno (id, nome, email).
 * - `questoes` → lista de `ResultadoQuestao` com o detalhamento por
 *   questão.
 */
export type ResultadoAluno = {
  provaAlunoId: string;
  aluno: {
    id: string;
    nome: string;
    email: string;
  };
  notaTotal: number;
  percentual: number;
  liberado: boolean;
  pendenciasCorrecao: number;
  questoes: ResultadoQuestao[];
};

/**
 * Registro de exportação de resultados.
 *
 * Criado quando o professor ou coordenador solicita a exportação dos
 * resultados de uma prova para um arquivo. O arquivo gerado contém
 * as notas de todos os alunos e pode ser aberto em planilhas eletrônicas.
 *
 * - `urlArquivo`: URL para download do arquivo exportado.
 * - `formato`: `"xlsx"` (Excel) ou `"csv"` (valores separados por vírgula).
 * - `pendenciasCorrecao`: número de questões com correção pendente no
 *   momento da exportação. Um valor > 0 indica que o arquivo pode estar
 *   incompleto.
 */
export type ExportacaoResultado = {
  id: string;
  urlArquivo: string;
  formato: "xlsx" | "csv";
  pendenciasCorrecao: number;
};
