/**
 * Retorno do salvamento de rascunho de resposta.
 *
 * O sistema salva automaticamente o progresso do aluno durante a prova
 * (auto-save a cada intervalo). Este tipo é usado como resposta da API
 * para confirmar que o rascunho foi persistido.
 *
 * Campos não óbvios:
 * - `rascunho`: `true` enquanto o aluno ainda está respondendo (prova em
 *   andamento). Quando o aluno envia a prova, este campo passa a `false`,
 *   indicando que a resposta foi finalizada e não pode mais ser alterada.
 * - `sincronizadaEm`: timestamp da última sincronização com o servidor.
 *   Útil para detectar conflitos de edição concorrente.
 */
export type RespostaSalva = {
  id: string;
  sincronizadaEm: string;
  /** Verdadeiro enquanto o aluno ainda está respondendo. */
  rascunho: boolean;
};

/**
 * Resposta do aluno a uma questão da prova.
 *
 * Este tipo estende `RespostaSalva` com os identificadores necessários
 * para vincular a resposta ao aluno, à prova e à questão, além do
 * conteúdo efetivamente respondido (alternativa selecionada ou texto).
 *
 * Relacionamentos:
 * - `provaAlunoId` → FK para `prova_aluno`. Vincula a resposta ao registro
 *   de um aluno específico em uma prova específica.
 * - `questaoId` → FK para `Questao`. Identifica qual questão foi respondida.
 *
 * Regras de negócio:
 * - Para questões objetivas (`multipla_escolha`, `verdadeiro_falso`),
 *   o campo `alternativaId` deve ser preenchido e `respostaTexto` deve
 *   ser `null`.
 * - Para questões discursivas, `respostaTexto` deve ser preenchido e
 *   `alternativaId` deve ser `null`.
 * - Uma resposta só pode ser alterada enquanto `rascunho === true`.
 */
export type RespostaAluno = RespostaSalva & {
  provaAlunoId: string;
  questaoId: string;
  alternativaId: string | null;
  respostaTexto: string | null;
};

/**
 * Contexto da relação prova-aluno usado para validar permissão de resposta.
 *
 * Carregado antes de qualquer operação de resposta para verificar se o
 * aluno ainda pode responder à prova. Esta verificação considera o status
 * da prova (`provaStatus`), o status da relação aluno-prova (`status`)
 * e a janela de realização.
 *
 * Regras de negócio:
 * - O aluno só pode responder se `provaStatus === "publicada"` e
 *   `status !== "enviada"` e a data/hora atual estiver dentro do
 *   intervalo [`dataInicio`, `dataFim`].
 */
export type ProvaAlunoContext = {
  id: string;
  provaId: string;
  status: string;
  provaStatus: string;
  dataInicio: string | null;
  dataFim: string | null;
  inicioEm: string | null;
  tempoLimiteMin: number | null;
};

/**
 * Informações mínimas da questão para validação da resposta.
 *
 * Usado nos serviços de resposta para verificar regras específicas do
 * tipo de questão antes de persistir a resposta do aluno. Por exemplo:
 * validar que uma resposta de múltipla escolha não exceda caracteres.
 */
export type QuestaoResposta = {
  id: string;
  tipo: "multipla_escolha" | "verdadeiro_falso" | "discursiva";
  limiteCaracteres: number | null;
};

/**
 * Resultado do envio final de uma prova pelo aluno.
 *
 * Produzido quando o aluno clica em "Finalizar prova". A partir deste
 * momento o aluno não pode mais alterar suas respostas. O sistema então
 * dispara a correção automática para as questões objetivas e atualiza
 * o status da relação prova-aluno para `"enviada"`.
 *
 * Campos não óbvios:
 * - `questoesEmBranco`: lista dos IDs das questões que não foram
 *   respondidas pelo aluno. Útil para notificar o aluno antes da
 *   finalização e para o professor visualizar quais questões foram
 *   puladas.
 */
export type EnvioFinal = {
  provaAlunoId: string;
  status: "enviada";
  enviadaEm: string;
  /** IDs das questões que ficaram sem resposta. */
  questoesEmBranco: string[];
};
