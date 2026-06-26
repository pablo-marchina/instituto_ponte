/**
 * Ciclo de vida de uma prova no sistema.
 *
 * Fluxo esperado:
 *   rascunho → publicada → encerrada → antiga
 *
 * - `rascunho`: a prova está sendo editada pelo professor. Apenas o
 *   professor criador pode vê-la. Nenhum aluno tem acesso.
 * - `publicada`: a prova foi disponibilizada. Um link único (`urlAcesso`)
 *   é gerado, e os alunos podem acessá-la dentro da janela definida
 *   por `dataInicio` / `dataFim`.
 * - `encerrada`: o período de realização terminou. Alunos não podem mais
 *   responder. Correções manuais podem ser feitas.
 * - `antiga`: estado final arquivado. A prova ainda pode ser consultada
 *   para relatórios, mas não aceita mais alterações.
 */
export type ProvaStatus = "rascunho" | "publicada" | "encerrada" | "antiga";

/**
 * Prova (avaliação) criada por um professor.
 *
 * Representa uma avaliação completa: contém configurações de tempo,
 * exibição, janela de realização e referências ao professor responsável
 * e à matéria. As questões são associadas à prova através de uma tabela
 * intermediária (prova_questao), que também armazena a pontuação específica
 * e a ordem de exibição dentro da prova.
 *
 * Campos não óbvios:
 * - `modalidade`: classificação da prova definida pelo professor
 *   (ex.: "Bimestral", "Simulado", "Recuperação"). É um texto livre.
 * - `turma`: identificação da turma/grupo de alunos alvo (ex.: "3º Ano A").
 *   Usado para filtro e organização interna do professor.
 * - `semestre`: período letivo (ex.: "2025.1", "2025/2"). Texto livre.
 * - `instrucoes`: texto de instruções gerais exibido ao aluno antes de
 *   iniciar a prova (ex.: "Leia atentamente antes de responder").
 * - `urlAcesso`: URL única gerada automaticamente no momento da publicação.
 *   É o único meio de acesso do aluno (não há login). Contém um hash
 *   criptográfico para evitar acesso não autorizado.
 * - `qrCode`: imagem QR code gerada a partir da `urlAcesso`, facilitando
 *   o compartilhamento em sala de aula.
 *
 * Relacionamentos:
 * - `professorId` → FK para `Professor`. A prova pertence a um professor.
 * - `materiaId` → FK para `Materia`. A prova avalia uma disciplina.
 * - `prova_questao` → questões vinculadas a esta prova com pontuação e ordem.
 * - `prova_aluno` → registros de alunos que acessaram/responderam a prova.
 *
 * Campos populados em consultas com join:
 * - `materia`: objeto com `{ id, nome }` da matéria.
 * - `professor`: objeto com `{ id, nome }` do professor criador.
 */
export type Prova = {
  id: string;
  professorId: string;
  materiaId: string;
  titulo: string;
  modalidade: string;
  turma: string;
  semestre: string;
  instrucoes: string | null;
  /** Tempo limite em minutos para realização. `null` significa sem limite. */
  tempoLimiteMin: number | null;
  /** Início da janela de realização. Antes desta data o aluno não pode responder. */
  dataInicio: string | null;
  /** Fim da janela de realização. Após esta data a prova é bloqueada. */
  dataFim: string | null;
  embaralharQuestoes: boolean;
  embaralharAlternativas: boolean;
  status: ProvaStatus;
  /** URL única gerada na publicação para acesso do aluno. Contém hash de segurança. */
  urlAcesso: string | null;
  /** QR code (base64 ou URL) gerado a partir da urlAcesso. */
  qrCode: string | null;
  criadoEm: string;
  atualizadoEm: string;
  materia?: { id: string; nome: string };
  professor?: { id: string; nome: string };
  /** Número de alunos que já enviaram a prova (status enviada ou corrigida). */
  submissoes: number;
};

/**
 * Histórico de mudanças de status de uma prova.
 *
 * Cada vez que o status de uma prova é alterado, um registro é inserido
 * nesta tabela para auditoria. Permite rastrear todo o ciclo de vida
 * da prova e identificar, por exemplo, quanto tempo uma prova ficou
 * no estado "rascunho" antes de ser publicada.
 *
 * - `statusAnterior`: pode ser `null` para o primeiro registro (criação).
 * - `statusNovo`: o status para o qual a prova foi movida.
 */
export type ProvaHistorico = {
  id: string;
  statusAnterior: string | null;
  statusNovo: string;
  criadoEm: string;
};
