/**
 * Resumo de status de correção de uma questão dentro de uma prova.
 *
 * Usado na tela de acompanhamento de correção para mostrar ao professor
 * o andamento geral: quantas respostas já foram corrigidas (automática
 * ou manualmente) e quantas ainda faltam para cada questão.
 *
 * - `respostas.corrigidas`: inclui tanto as correções automáticas
 *   (objetivas) quanto as manuais (discursivas).
 */
export type CorrecaoQuestao = {
  questaoId: string;
  ordemOriginal: number;
  pontuacaoMax: number;
  tipo: string;
  enunciado: string | null;
  imagemUrl: string | null;
  respostas: {
    total: number;
    /** Quantidade já corrigida (manual ou automática). */
    corrigidas: number;
  };
};

/**
 * Informações mínimas do aluno para exibição na tela de correção.
 *
 * Mantido como um tipo separado para evitar carregar dados sensíveis
 * (como CPF) em contextos onde não são necessários.
 */
export type CorrecaoAluno = {
  id: string;
  nome: string;
};

/**
 * Anexo enviado pelo aluno junto com a resposta discursiva.
 *
 * Exibido na tela de correção manual para que o professor possa
 * visualizar arquivos complementares à resposta textual.
 *
 * - `urlArquivo`: URL para download/exibição do arquivo.
 * - `mimeType`: tipo MIME do arquivo (ex.: "image/png", "application/pdf").
 *   Usado pelo frontend para decidir como renderizar (visualização
 *   inline vs. link para download).
 */
export type AnexoCorrecao = {
  id: string;
  urlArquivo: string;
  mimeType: string;
};

/**
 * Correção já registrada para uma resposta de questão discursiva.
 *
 * Quando `null` (no contexto de `CorrecaoResposta.correcao`), significa
 * que a resposta ainda não foi corrigida (pendente).
 *
 * - `tipo`: distingue a origem — `"manual"` (professor corrigiu) ou
 *   `"automatica"` (sistema corrigiu, aplicável apenas a objetivas).
 *   Para discursivas, será sempre `"manual"`.
 * - `nota`: valor numérico atribuído à resposta.
 * - `corrigidaEm`: `null` se a correção foi registrada sem timestamp
 *   (caso raro de correção automática instantânea).
 */
export type CorrecaoRealizada = {
  id: string;
  nota: number;
  observacao: string | null;
  tipo: string;
  corrigidaEm: string | null;
};

export type AlternativaCorrecao = {
  id: string;
  ordemOriginal: number;
  conteudoLatex: string;
  urlImagem: string | null;
  correta: boolean;
};

/**
 * Resposta com dados do aluno e status da correção.
 *
 * Usada na tela de correção manual para exibir a resposta do aluno,
 * anexos e o estado atual da correção. Quando `correcao` é `null`,
 * a resposta ainda está pendente de correção.
 *
 * Relacionamentos:
 * - `aluno` → dados mínimos do aluno que respondeu.
 * - `anexos` → arquivos anexados à resposta (se houver).
 * - `correcao` → se já foi corrigida, contém nota e observação.
 */
export type CorrecaoResposta = {
  respostaId: string;
  questaoId: string;
  questaoTipo: string;
  questaoEnunciado: string | null;
  questaoImagemUrl: string | null;
  pontuacaoMax: number;
  aluno: CorrecaoAluno;
  respostaTexto: string | null;
  anexos: AnexoCorrecao[];
  alternativaSelecionada: AlternativaCorrecao | null;
  alternativaCorreta: AlternativaCorrecao | null;
  correcao: CorrecaoRealizada | null;
};

/**
 * Resultado do salvamento de uma correção manual pelo professor.
 *
 * Retornado pela API após o professor salvar a nota e observação de
 * uma resposta discursiva. O tipo é sempre `"manual"` e o timestamp
 * é gerado pelo servidor no momento do salvamento.
 */
export type CorrecaoSalva = {
  id: string;
  nota: number;
  tipo: "manual" | "automatica";
  corrigidaEm: string;
};

/**
 * Resultado da correção automática de questões objetivas.
 *
 * Disparada imediatamente após o aluno finalizar a prova. O sistema
 * percorre todas as respostas objetivas, compara a alternativa selecionada
 * com o gabarito e atribui a pontuação automaticamente.
 *
 * Campos não óbvios:
 * - `discursivasPendentes`: número de questões discursivas que não puderam
 *   ser corrigidas automaticamente e aguardam correção manual do professor.
 *   Se for 0, a prova está completamente corrigida.
 */
export type CorrecaoAutomatica = {
  provaId: string;
  respostasCorrigidas: number;
  /** Questões discursivas que ainda precisam de correção manual. */
  discursivasPendentes: number;
};
