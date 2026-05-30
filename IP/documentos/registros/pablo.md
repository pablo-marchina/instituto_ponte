# Registro Diário — Pablo Marchina

---

### Data: 06/05/2026 (Quarta-feira)

### Objetivo do Dia
Criar os diagramas UML de classes do módulo do professor, modelando todas as entidades envolvidas no fluxo do professor dentro da plataforma de avaliações.

### Alterações Realizadas

Realizei a modelagem completa do domínio do professor, contemplando 7 entidades principais: Professor, Matéria, Prova, Enunciado, além das tabelas associativas Matéria-Professor, Matéria-Prova e Prova-Enunciado. Estruturei os atributos em formato SQL simplificado com uso de UUID como chave primária em todas as entidades, garantindo consistência com o padrão definido pela equipe. Defini os relacionamentos entre as entidades utilizando setas de associação UML, conectando Professor às matérias que leciona, matérias às provas associadas, e provas aos enunciados que as compõem. Cada relacionamento teve sua multiplicidade especificada (1:N e N:N onde aplicável). O diagrama foi desenvolvido seguindo a notação de caixas estilo tabela para facilitar a visualização das colunas de cada entidade. Após a finalização, enviei para revisão do Álvaro validar a consistência com os demais módulos.

### Links:
https://drive.google.com/file/d/1ObtlEZbTAccfOR6JpRT5S028EKOYxSlw/view?usp=sharing

### Observações:
Foi necessário revisar as cardinalidades duas vezes para garantir que estavam corretas em relação às regras de negócio. O Álvaro sugeriu um ajuste na relação Matéria-Professor que foi prontamente corrigido.

---

### Data: 07/05/2026 (Quinta-feira)

### Objetivo do Dia
Realizar a modelagem completa do diagrama de classes do domínio da aplicação, contemplando todos os perfis de usuário e entidades do sistema.

### Alterações Realizadas

Modelei o diagrama de classes do domínio abrangendo 11 entidades fundamentais: Aluno, Professor, Coordenador, Prova, Questão, Alternativa, Resposta, Correção, Turma, Disciplina e Relatórios. Utilizei o DrawSQL para criar a estrutura relacional completa, definindo todas as chaves primárias e estrangeiras necessárias para garantir a integridade referencial do banco. Estabeleci os tipos de associação UML apropriados para cada relacionamento — associação simples entre entidades independentes, composição entre Prova e Questão (uma prova é composta por questões), e agregação entre Turma e Aluno. Criei também a estrutura SQL inicial com as migrations necessárias para materializar o modelo no banco de dados, incluindo constraints NOT NULL e relações de FK bem definidas.

### Links:
https://drawsql.app/teams/pablo-marchina/diagrams/diagrama-classe

### Observações:
A modelagem exigiu diversas iterações para alinhar as expectativas com os diagramas que estavam sendo feitos em paralelo pelos colegas (diagrama do coordenador pelo Rafael, diagrama da prova pela Heloísa). Foi positivo para garantir consistência entre os módulos.

---

### Data: 11/05/2026 (Segunda-feira)

### Objetivo do Dia
Consolidar e atualizar o diagrama de classes completo da plataforma, unificando os modelos dos módulos individuais em um único diagrama coeso.

### Alterações Realizadas

Realizei a consolidação de aproximadamente 20 entidades em um único modelo UML unificado, integrando os módulos de pessoas (Aluno, Professor, Coordenador), acadêmico (Turma, Disciplina, Matéria), provas (Prova, Questão, Alternativa, Enunciado), execução (Resposta, Correção) e relatórios. Modelei a hierarquia de herança entre os perfis de usuário, onde a superclasse Usuário contém os atributos comuns (nome, email, senha, tipo) e as subclasses Professor, Coordenador e Aluno herdam e especializam com atributos específicos. Adicionei relações de composição (Prova contém Questões) e agregação (Turma agrega Alunos) com as multiplicidades corretas. Organizei as classes em pacotes UML semânticos para facilitar a navegação e compreensão do diagrama. Finalizei o diagrama no Draw.io com a notação padronizada da equipe.

### Links:
https://app.diagrams.net/#G1YoZXiRZFruOZCbFYI4Gojcy--L2rUQ9U

### Observações:
A consolidação foi desafiadora pois precisei reconciliar diferenças entre os modelos individuais que cada membro criou. Alguns relacionamentos estavam inconsistentes entre os diagramas e precisei alinhar com a equipe para definir a versão final.

---

### Data: 12/05/2026 (Terça-feira)

### Objetivo do Dia
Implementar os diagramas de sequência UML das User Stories US01 e US02 utilizando PlantUML, representando os fluxos completos entre as camadas da aplicação.

### Alterações Realizadas

Criei dois diagramas de sequência detalhados em PlantUML:

**US01 — Autenticação via Google OAuth:**
Modelei o fluxo completo de autenticação de Professor/Coordenador, iniciando com o navegador do usuário solicitando login via Google, passando pelo Controller que recebe o token, o Service que valida o token e busca o usuário no banco através do Repository, e finalizando com o processamento assíncrono de auditoria. Diferenciei claramente mensagens síncronas (setas cheias) das assíncronas (setas abertas), utilizei ativações corretas ao longo das linhas de vida e retornos tracejados para indicar respostas.

**US02 — Criação e Publicação de Provas:**
Modelei o fluxo de criação de uma prova pelo professor, incluindo a persistência da prova no banco, a atualização das entidades relacionadas (enunciados e matérias associadas), e a publicação assíncrona que notifica os alunos. Utilizei métodos reais do domínio definidos no diagrama de classes para garantir consistência arquitetural.

Ambos os diagramas seguem o padrão arquitetural Controller → Service → Repository → Banco de Dados definido para o projeto.

### Links:
Os diagramas estão incluídos no WAD na seção 3.2.4.

### Observações:
A implementação em PlantUML exigiu atenção especial à sintaxe correta de ativações e à diferenciação entre chamadas síncronas e assíncronas. Revisei o diagrama da US02 após feedback do revisor para adicionar o retorno assíncrono da confirmação de publicação.

---

### Data: 13/05/2026 (Quarta-feira)

### Objetivo do Dia
Preparar a apresentação dos wireframes da aplicação, organizando o roteiro e os slides para demonstrar os principais fluxos e interações do usuário.

### Alterações Realizadas

Realizei um estudo aprofundado de todos os wireframes existentes no Figma, incluindo as telas dos perfis de aluno (criação pela Joana), professor (criação pelo Matheus) e coordenador (criação pelo Luiz). Estruturei o roteiro da apresentação definindo a ordem de apresentação dos fluxos: primeiro o login e autenticação, depois o painel principal de cada perfil, seguido pelas funcionalidades específicas (provas, correções, relatórios). Organizei os slides no Canva com uma sequência lógica de navegação, simulando a jornada do usuário desde o acesso até a conclusão das tarefas principais. Preparei a demonstração das interações entre telas para mostrar como o usuário navega e executa ações no sistema. Validei o roteiro com a equipe para garantir que todos os fluxos críticos estivessem cobertos.

### Links:
https://www.canva.com/design/DAHJkcZ-LqQ/2yyHFhyQc2jUgGkmRZ3hmQ/edit

### Observações:
A apresentação precisava ficar clara para a professora e para a turma, então foquei em criar uma narrativa fluida que mostrasse o valor de cada wireframe dentro do contexto do projeto. O Canva facilitou a organização visual dos slides.

---

### Data: 14/05/2026 (Quinta-feira)

### Objetivo do Dia
Finalizar a apresentação dos fluxos de telas e criar os wireframes do professor no Figma, fechando as pendências da Sprint 2.

### Alterações Realizadas

Finalizei a apresentação dos slides relacionados aos fluxos de telas dos perfis de professor e coordenador, aplicando os ajustes finais de layout e organização sugeridos pelo revisor. Além disso, desenvolvi duas novas telas de wireframe referentes ao fluxo do professor no Figma: a tela de Painel do Professor (com visão geral das provas, turmas e atividades recentes) e a tela de Criação de Prova (com formulário para definir título, matéria, questões e configurações). Ambas as telas seguiram rigorosamente os padrões de componentes definidos previamente no projeto (sidebar, cards, labels, botões), garantindo consistência visual com os wireframes dos demais perfis. Realizei uma revisão geral da apresentação completa com a equipe para alinhar os últimos detalhes antes da entrega.

### Links:
https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=17-207&p=f&t=3NwO1uINOG72DZQe-0
https://www.canva.com/design/DAHJqZ6nGfM/g4QPY7wuvPSYB-7JGkWBpA/edit

### Observações:
O trabalho de wireframe exigiu atenção aos detalhes de espaçamento e alinhamento para manter a consistência com os componentes já criados pelo Matheus. A integração entre a apresentação e os wireframes ficou coesa, mostrando o fluxo completo do usuário professor na plataforma.

---

### Data: 20/05/2026 (Quarta-feira)

### Objetivo do Dia
Criar o Diagrama de Classes Arquitetural da aplicação na subseção 3.2.3.1 do WAD, modelando os componentes centrais das camadas Controller, Service, Repository e Model.

### Alterações Realizadas
Desenvolvi o Diagrama de Classes Arquitetural complementar ao diagrama de domínio já existente, adicionando a subseção 3.2.3.1 no WAD. Modelei as principais classes de cada camada arquitetural: os Controllers responsáveis pelas rotas da API, os Services com a lógica de negócio, os Repositories para abstração do banco de dados, e os Models representando as entidades do domínio. Utilizei estereótipos UML (&lt;&lt;controller&gt;&gt;, &lt;&lt;service&gt;&gt;, &lt;&lt;repository&gt;&gt;, &lt;&lt;model&gt;&gt;) para identificar cada camada e setas de dependência para mostrar as relações entre elas (Controller → Service → Repository → Model). Segui a mesma notação PlantUML e estilo visual do diagrama de domínio para manter consistência no documento. O diagrama foi inserido logo após a seção 3.2.3, mantendo a numeração sequencial das subseções.

### Links:
https://git.inteli.edu.br/graduacao/2026-1b/t24/g05/-/issues/112
documentos/wad.md (seção 3.2.3.1)

### Observações:
O diagrama arquitetural complementa a visão de domínio já documentada, mostrando como as entidades se organizam nas camadas do backend. A modelagem seguiu o padrão definido em conjunto com a equipe e foi revisada antes do fechamento do issue.

---

### Data: 25/05/2026 (Segunda-feira)

### Objetivo do Dia
Documentar os padrões de projeto aplicados no desenvolvimento do backend na nova subseção 3.2.7 do WAD.

### Alterações Realizadas
Criei a subseção 3.2.7 no WAD com a documentação completa dos padrões de projeto utilizados no backend do sistema. Descrevi e justifiquei tecnicamente cada padrão adotado:

**Repository Pattern:** Implementado na camada de dados para abstrair o acesso ao banco, desacoplando a lógica de negócio dos detalhes de persistência e facilitando a substituição do provedor de banco.

**Service Layer Pattern:** Centraliza as regras de negócio em services específicos, mantendo os controllers enxutos e permitindo reutilização da lógica entre diferentes partes do sistema.

**MVC no Backend:** Seguido na separação das camadas Controller (rotas), Model (entidades JPA) e View (retorno JSON), organizando o código de acordo com o padrão arquitetural definido para o projeto.

**Dependency Injection:** Utilizado para injetar dependências entre as camadas (Controller → Service → Repository), garantindo baixo acoplamento e facilitando testes unitários.

**Singleton:** Adotado para beans de configuração, conexões e providers que precisam de única instância durante todo o ciclo de vida da aplicação.

**DTO Pattern:** Implementado para transferir dados entre camadas sem expor as entidades JPA diretamente, controlando exatamente quais campos são trafegados em cada operação.

Relacionei cada padrão com componentes reais do código, incluindo nomes de classes e exemplos de uso, demonstrando a aplicação prática na arquitetura do sistema.

### Links:
https://git.inteli.edu.br/graduacao/2026-1b/t24/g05/-/issues/123
documentos/wad.md (seção 3.2.7)

### Observações:
A documentação dos padrões foi validada com a equipe para garantir que cada padrão descrito corresponde a uma implementação real no código do backend. A seção 3.2.7 ficou posicionada após os diagramas de implantação, seguindo a estrutura definida para o WAD.
