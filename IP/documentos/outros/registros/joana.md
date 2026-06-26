#### Registros diários da sprint 2 - Joana Auriemo Racy

### Data: 06/05/2026

### Objetivo do Dia: Estruturar e pesquisar template do wireframe do aluno.


### Alterações Realizadas: Terminei a estrutura e pesquisa do template do wireframe do aluno.


## Link para onde estão as estruturas do Wireframe
- Link do Figma - utilizado para fazer o Wireframe do aluno:
https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/Sem-t%C3%ADtulo?node-id=0-1&t=RCH7vGXuLSJq8vto-1


### -----------------------Outro Dia----------------------


### Data: 07/05/2026

### Objetivo do Dia: Começar a fazer o wireframe do aluno.


### Alterações Realizadas: Fiz quatro telas do aluno.


## Link para onde estão as estruturas do Wireframe
- Link do Figma - utilizado para fazer o Wireframe do aluno:
https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/Sem-t%C3%ADtulo?node-id=0-1&t=RCH7vGXuLSJq8vto-1


## ---------------------Outro Dia-----------------------


### Data: 11/05/2026

### Objetivo do Dia: Continuar fazendo as telas do wireframe do aluno.


### Alterações Realizadas: Fiz mais telas do Wireframe do aluno.


## Link para onde estão as estruturas do Wireframe
- Link do Figma - utilizado para fazer o Wireframe do aluno:
https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/Sem-t%C3%ADtulo?node-id=0-1&t=RCH7vGXuLSJq8vto-1


## ---------------------------Outro Dia-------------------------


### Data: 12/05/2026


### Objetivo do Dia: Continuar fazendo as telas do wireframe do aluno.


### Alterações Realizadas: Organizei os frames em ordem cronológica de acesso, e padronizei os títulos.


## Link para onde estão as estruturas do Wireframe
- Link do Figma: https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=0-1&p=f&t=yiozHSv70VPvzseF-0


## ---------------------------Outro Dia-------------------------


### Data: 13/05/2026


### Objetivo do Dia: Começar os slides.


### Alterações Realizadas: Criei a apresentação e meu slide (de Modelo Relacional, o que é e para que serve).


## Link para onde estão os slides
- Link do Canva: https://canva.link/tjnuod1kpcpcl1v

## ---------------------------Outro Dia-------------------------


### Data: 14/05/2026


### Objetivo do Dia: Acabar os slides e roteiro.


### Alterações Realizadas: Recriei a apresentação, adaptei slides pro modelo certo e escrevi roteiro.


## Link para onde estão os slides
- Link do Canva: https://canva.link/i69yzyj7b9aq5sp

## Link do roteiro:
- Link do Docs: https://docs.google.com/document/d/1eAJFZrq3S6L6vTaXLxWV6Vx3hl1YGZHJZ2noENsnfGM/edit?usp=sharing

## ---------------------------Outro Dia-------------------------


### Data: 14/05/2026


### Objetivo do Dia: Iniciar o artefato 6


### Alterações Realizadas: Estudei o artefato 6 para compreender o que precisava ser feito e criei exemplos de expressões SQL.

## ---------------------------Outro Dia-------------------------


### Data: 25/05/2026


### Objetivo do Dia: Desenvolver artefato 6


### Alterações Realizadas: Criei e ajustei 3 tabelas verdade
| #1 | --- |
| --- | --- |
| **Expressão SQL** | `SELECT * FROM prova WHERE status = 'publicada' AND (turma = '2A' OR semestre = '2026.1');` |
| **Proposições lógicas** | $A$: A prova está publicada (`status = 'publicada'`) <br> $B$: A prova é da turma 2A (`turma = '2A'`) <br> $C$: A prova é do semestre 2026.1 (`semestre = '2026.1'`) |
| **Expressão lógica proposicional** | $A \land (B \lor C)$ |
| **Tabela Verdade** | <table><thead><tr><th>$A$</th><th>$B$</th><th>$C$</th><th>$B \lor C$</th><th>$A \land (B \lor C)$</th></tr></thead><tbody><tr><td>F</td><td>F</td><td>F</td><td>F</td><td>F</td></tr><tr><td>F</td><td>F</td><td>V</td><td>V</td><td>F</td></tr><tr><td>F</td><td>V</td><td>F</td><td>V</td><td>F</td></tr><tr><td>F</td><td>V</td><td>V</td><td>V</td><td>F</td></tr><tr><td>V</td><td>F</td><td>F</td><td>F</td><td>F</td></tr><tr><td>V</td><td>F</td><td>V</td><td>V</td><td>V</td></tr><tr><td>V</td><td>V</td><td>F</td><td>V</td><td>V</td></tr><tr><td>V</td><td>V</td><td>V</td><td>V</td><td>V</td></tr></tbody></table> |

| #2 | --- |
| --- | --- |
| **Expressão SQL** | `SELECT * FROM questao WHERE tipo IN ('multipla_escolha', 'verdadeiro_falso') AND ativa = true;` |
| **Proposições lógicas** | $A$: A questão é de múltipla escolha (`tipo = 'multipla_escolha'`) <br> $B$: A questão é de verdadeiro ou falso (`tipo = 'verdadeiro_falso'`) <br> $C$: A questão está ativa (`ativa = true`) |
| **Expressão lógica proposicional** | $(A \lor B) \land C$ |
| **Tabela Verdade** | <table><thead><tr><th>$A$</th><th>$B$</th><th>$C$</th><th>$A \lor B$</th><th>$(A \lor B) \land C$</th></tr></thead><tbody><tr><td>F</td><td>F</td><td>F</td><td>F</td><td>F</td></tr><tr><td>F</td><td>F</td><td>V</td><td>F</td><td>F</td></tr><tr><td>F</td><td>V</td><td>F</td><td>V</td><td>F</td></tr><tr><td>F</td><td>V</td><td>V</td><td>V</td><td>V</td></tr><tr><td>V</td><td>F</td><td>F</td><td>V</td><td>F</td></tr><tr><td>V</td><td>F</td><td>V</td><td>V</td><td>V</td></tr><tr><td>V</td><td>V</td><td>F</td><td>V</td><td>F</td></tr><tr><td>V</td><td>V</td><td>V</td><td>V</td><td>V</td></tr></tbody></table> |

| #3 | --- |
| --- | --- |
| **Expressão SQL** | `UPDATE resultado_aluno SET liberado = true, liberado_em = CURRENT_TIMESTAMP WHERE nota_total >= 6 AND liberado = false;` |
| **Proposições lógicas** | $A$: A nota total é maior ou igual a 6 (`nota_total >= 6`) <br> $B$: O resultado já está liberado (`liberado = true`) |
| **Expressão lógica proposicional** | $A \land \neg B$ |
| **Tabela Verdade** | <table><thead><tr><th>$A$</th><th>$B$</th><th>$\neg B$</th><th>$A \land \neg B$</th></tr></thead><tbody><tr><td>F</td><td>F</td><td>V</td><td>F</td></tr><tr><td>F</td><td>V</td><td>F</td><td>F</td></tr><tr><td>V</td><td>F</td><td>V</td><td>V</td></tr><tr><td>V</td><td>V</td><td>F</td><td>F</td></tr></tbody></table> |


## ---------------------------Outro Dia-------------------------


### Data: 26/05/2026


### Objetivo do Dia: Desenvolver artefato 6


### Alterações Realizadas: Criei a 4ª tabela verdade e ajustei as outras 3


## ---------------------------Outro Dia-------------------------


### Data: 27/05/2026


### Objetivo do Dia: Revisar feedback do Wesley


### Alterações Realizadas: Destaquei o que temos que alterar em nosso projeto, e o que precisamos pedir revisão.


## ---------------------------Outro Dia-------------------------


### Data: 28/05/2026


### Objetivo do Dia: Revisar Artefato 6


### Alterações Realizadas: Foi feita uma revisão final do Artefato 6, com mudança na tabela 2 e adição da tabela 5.


## ---------------------------Outro Dia-------------------------


### Data: 01/06/2026


### Objetivo do Dia: Atualizar a seção 3.9 do WAD - Matriz de Rastreabilidade


### Alterações Realizadas: Foi feita uma grande atualização na Matriz de Rastreabilidade.


## ---------------------------Outro Dia-------------------------


### Data: 02/06/2026


### Objetivo do Dia: Completar a seção 6.4 do WAD - Público-Alvo


### Alterações Realizadas: Completei a parte 'a' e 'b' da seção 6.4, com descrição da segmentação do mercado e público-alvo


## ---------------------------Outro Dia-------------------------


### Data: 15/06/2026


### Objetivo do Dia: Preencher a seção 7 do WAD


### Alterações Realizadas: 
Foi preenchida a seção 7 do WAD, documentando as conclusões do projeto, os resultados alcançados e as oportunidades de evolução da solução.
A atividade incluiu:

* análise dos objetivos atingidos pelo projeto;
* levantamento dos principais pontos fortes da solução desenvolvida;
* identificação de melhorias observadas durante os testes;
* definição de propostas para trabalhos futuros;
* elaboração e revisão do texto da seção de conclusões.

## ---------------------------Outro Dia-------------------------


### Data: 22/06/2026


### Objetivo do Dia: Preencher a tabela de testes de usabilidade


### Alterações Realizadas: 
Foi realizada a documentação dos testes de usabilidade conduzidos com usuários da aplicação, registrando os procedimentos executados, os resultados obtidos e os principais pontos de melhoria identificados.
A atividade incluiu:

* organização das evidências coletadas durante os testes;
* registro dos cenários e tarefas avaliadas;
* documentação das dificuldades e feedbacks observados;
* análise dos resultados obtidos;
* elaboração das descrições e conclusões do relatório de usabilidade.

Link do teste de usabilidade feito antes de ser adaptado pro wad: [spreadsheet](https://docs.google.com/spreadsheets/d/1hcpx_V0Jqp82GtsUZMK0_2v0GpTi7MbSE-bkbz0ZfPc/edit?gid=0#gid=0)