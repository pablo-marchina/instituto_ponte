/**
 * Perfis de acesso do sistema.
 *
 * Apenas professores e coordenadores possuem autenticação neste sistema.
 * Alunos **não** se autenticam — eles acessam as provas exclusivamente
 * pelo link público gerado na publicação (`urlAcesso` em Prova).
 *
 * - `professor`  → cria provas, questões, corrige respostas discursivas.
 * - `coordenador` → gerencia professores, visualiza resultados agregados.
 */
export type AuthRole = "professor" | "coordenador";

/**
 * Usuário autenticado anexado à requisição pelo middleware `requireAuth`.
 *
 * Fica disponível em `request.user` para as camadas seguintes (controllers,
 * services). O campo `perfil` determina o que o usuário pode ou não fazer
 * dentro do sistema (autorização por role).
 *
 * Relacionamentos:
 * - Se `perfil === "professor"`, o `id` referencia a tabela `professor`.
 * - Se `perfil === "coordenador"`, o `id` referencia a tabela `coordenador`
 *   (mantida em uma camada superior de autenticação/tenant).
 */
export type AuthUser = {
  id: string;
  nome: string;
  email: string;
  perfil: AuthRole;
};
