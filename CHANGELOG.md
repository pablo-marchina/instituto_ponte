# Changelog

## Sprint 5 - versao final

- Corrigida a ordem das migrations para banco limpo: a migration base executavel ficou em `001_initial_schema.sql` e o arquivo duplicado `001_migration.sql` foi removido do runner. Contrato preservado: schema publico e migrations evolutivas continuam na mesma pasta numerada.
- Consolidada a protecao de CPF em repouso: `cpf` e cifrado com AES-256-GCM e `cpf_hash` usa HMAC-SHA256 para busca/uniqueness sem texto plano. Contrato preservado: API continua recebendo/devolvendo CPF normalizado quando autorizado.
- Fechado o bloqueio server-side de tempo de prova para respostas, finalizacao e anexos. O backend compara `data_fim` com `inicio_em + tempo_limite_min`, sem depender do timer do navegador.
- Implementadas estrategias de resiliencia em dependencias externas: `resilientFetch`, timeout por `AbortController`, retry com backoff para falhas transitorias e circuit breaker no envio de e-mail.
- Reforcadas regras de autorizacao: apenas professores criam provas; apenas coordenadores exportam resultados.
- Estabilizada a suite de testes de integracao em banco real: cleanups consideram dependencias por FK, `ensureSchema` deixou de executar DDL dentro de fluxo transacional e a resposta de `prova_questao` passou a cumprir o schema documentado.
- Ajustados gates de cobertura para valores reais e executaveis: backend minimo de 85% statements/lines/functions e 75% branches; frontend minimo de 90% statements/lines, 75% branches e 70% functions.
- Adicionado `docker-compose.yml` para PostgreSQL local e evidencias versionadas em `documentos/outros/evidencias/`.

### Evidencias finais

- `npm run migrate`: executado com sucesso no banco configurado; migrations 007 a 010 aplicadas.
- `npm test`: backend 54 suites/438 testes; frontend 31 arquivos/122 testes.
- `npm run coverage`: backend 88,90% statements e 89,87% linhas; frontend 90,85% statements e linhas.
- `npm run typecheck` e `npm run build`: executados com sucesso.
