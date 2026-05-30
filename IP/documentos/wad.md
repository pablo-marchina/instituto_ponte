<img src="../assets/logointeli.png">

# WAD - Web Application Document - Módulo 2 - Inteli

<!-- **_Os trechos em itálico servem apenas como guia para o preenchimento da seção. Por esse motivo, não devem fazer parte da documentação final_** -->

## Nome do Grupo

#### Nomes dos integrantes do grupo

- Álvaro Leme de Toledo Almeida <br>
- Heloísa Noda Kadota <br>
- Joana Auriemo Racy <br>
- Luiz Gustavo Campos Cazelatto <br>
- Matheus Viana de Almeida <br>
- Pablo Marchina <br>
- Rafael Morgado Ferreira <br>



## Sumário

[1. Introdução](#c1)

[2. Visão Geral da Aplicação Web](#c2)

[3. Projeto Técnico da Aplicação Web](#c3)

[4. Desenvolvimento da Aplicação Web](#c4)

[5. Testes da Aplicação Web](#c5)

[6. Estudo de Mercado e Plano de Marketing](#c6)

[7. Conclusões e trabalhos futuros](#c7)

[8. Referências](#c8)

[Anexos](#c9)

<br>


# <a name="c1"></a>1. Introdução (sprints 1 a 5)

&emsp;O Instituto Ponte é uma Organização da Sociedade Civil de Interesse Público (OSCIP), fundada em setembro de 2014, com a missão de ser “a Ponte para a ascensão social em uma geração” por meio da educação de qualidade para jovens em situação de vulnerabilidade social. Atualmente, a organização atende 440 estudantes distribuídos em 18 estados do Brasil, em modelo híbrido de ensino (INSTITUTO PONTE, 2024). Nesse contexto, a equidade do processo avaliativo é central à missão institucional.

&emsp;Foi identificado que a realização e a correção de avaliações remotas ocorrem de forma descentralizada, com uso de WhatsApp, e-mail e outras ferramentas não estruturadas. Isso gera perda de arquivos, dificuldade de organização das submissões, sobrecarga para professores e ausência de mecanismos para correção isonômica por questão. A falta de critérios uniformes e transparentes compromete a justiça avaliativa para os alunos atendidos.

&emsp;Diante disso, propõe-se o desenvolvimento de uma aplicação web para criar, publicar, aplicar e corrigir avaliações remotas no Instituto Ponte. A solução centraliza o processo em uma única plataforma, promovendo três resultados principais: equidade para os alunos, com interface acessível em dispositivos limitados; eficiência para os professores, com correção padronizada por questão; e inteligência institucional para os coordenadores, com relatórios automáticos de desempenho. Com isso, espera-se reduzir falhas operacionais, fortalecer a integridade dos dados e ampliar a inclusão social por meio da tecnologia.

# <a name="c2"></a>2. Visão Geral da Aplicação Web

## 2.1. Escopo do Projeto (sprints 1 e 4)

### 2.1.1. Modelo de 5 Forças de Porter

<div align="center">
  <img src="../assets/cincoForcasDePorter.jpg" width="850">
</div>

<div align="center">
  <strong>Figura 1 — 5 Forças de Porter do instituto Ponte.</strong><br><em>Fonte: elaboração própria.</em>
</div>

#### Rivalidade entre Concorrentes
A rivalidade no setor de organizações sociais voltadas à educação é moderada. Observa-se a atuação de diversas ONGs em inclusão educacional, captação de bolsas e preparação de jovens, mas poucas combinam seleção rigorosa com acompanhamento contínuo como o Instituto Ponte. A competição por doadores, visibilidade e parcerias existe, mas a diferenciação tende a reduzir a pressão direta.  
Referências-base: IDIS (2020), Transparência Brasil (2022), OECD (2019).

---

#### Ameaça de Novos Entrantes
A ameaça de novos entrantes é moderada. A criação de uma ONG é simples, mas alcançar maturidade, credibilidade e captação consistente é difícil. Replicar redes de escolas parceiras e demonstrar impacto comprovado exige tempo e gestão qualificada, criando barreiras informais.  
Referências-base: ABONG (2021), Itaú Social (2020), McKinsey (2022).

---

#### Ameaça de Produtos Substitutos
A ameaça de substitutos é alta. Políticas públicas, bolsas privadas e iniciativas de fundações oferecem caminhos alternativos para jovens e competem pelo mesmo financiamento social. Embora não entreguem o mesmo pacote completo do Instituto Ponte, funcionam como opções substitutas na disputa por estudantes e recursos.  
Referências-base: MEC (2023), Fundação Estudar (2023), Fundação Lemann (2022), OECD (2023).

---

#### Poder de Barganha dos Fornecedores
No contexto de uma OSCIP, os fornecedores primários são os doadores institucionais e empresariais, cujo financiamento constitui o principal insumo operacional da organização. O poder de barganha desses fornecedores é alto. Esses agentes podem escolher entre muitas causas e exigem transparência, indicadores e governança sólida. Como as ONGs dependem de financiamento recorrente, os doadores influenciam fortemente prioridades e critérios de gestão.  
Referências-base: IDIS (2022), CAF (2022), GIFE (2021).

---

#### Poder de Barganha dos Clientes
O poder dos beneficiários é baixo. Jovens vulneráveis têm poucas alternativas gratuitas com suporte prolongado, mentoria e acompanhamento acadêmico. A demanda supera muito a oferta, reduzindo a capacidade de barganha das famílias atendidas.  
Referências-base: IPEA (2021), UNICEF (2022), Todos Pela Educação (2023).

### 2.1.2. Análise SWOT do Instituto Ponte

<div align="center">
  <img src="/assets/analiseSwot.png">
</div>

<div align="center">
  <strong>Figura 2 — Matriz SWOT do Instituto Ponte.</strong><br><em>Fonte: elaboração própria.</em>
</div>

&emsp;Identificou-se no Instituto Ponte posicionamento diferenciado no terceiro setor educacional: a taxa de aprovação de 92% nos vestibulares (INSTITUTO PONTE, 2024) — e o acompanhamento individualizado consolidam-se como diferenciais frente a organizações de maior escala, como Gerando Falcões e Parceiros da Educação. Os 2.375 inscritos anuais no processo seletivo, ante 440 alunos ativos, evidenciam alta demanda reprimida. Constatou-se vulnerabilidade financeira pela dependência de doações privadas e concentração no Espírito Santo. Verificaram-se oportunidades na expansão regional e na agenda ESG corporativa. Como ameaça central, reconheceu-se a disputa crescente por doadores institucionais em cenários de instabilidade econômica.

### 2.1.3. Solução (sprints 1 a 5)

&emsp;A solução é baseada no desenvolvimento de uma aplicação web para o Instituto Ponte, voltada à criação, aplicação e correção de avaliações remotas. Priorizam-se acessibilidade, organização e isonomia no processo avaliativo.

1. **Problema a ser resolvido**  
Verifica-se que o Instituto Ponte não possui uma plataforma centralizada para avaliações remotas. O processo atual, realizado por WhatsApp e e-mail, gera perda de arquivos, desorganização das submissões, correção pouco estruturada e inconsistências no acesso a feedbacks.

2. **Dados disponíveis**  
São atendidos 440 estudantes distribuídos em 18 estados do Brasil, em modelo híbrido (INSTITUTO PONTE, 2024). Esses dados ajudam a dimensionar o público atendido e reforçam a necessidade de uma solução simples e escalável.

3. **Solução proposta**  
Propõe-se uma plataforma web responsiva com interface simplificada, suporte a fórmulas matemáticas via LaTeX, upload estruturado por questão, salvamento automático e painel de correção por item. A solução também gera relatórios de desempenho e feedbacks individuais.

4. **Forma de utilização da solução**  
O acesso ocorre por link único. As questões são respondidas e os arquivos são enviados pelos alunos na própria plataforma. A correção é realizada por questão em um ambiente organizado. O histórico, os relatórios e as métricas são acompanhados pelos coordenadores para apoiar decisões pedagógicas.

5. **Benefícios esperados**  
Espera-se que a dificuldade de uso para alunos seja reduzida, que a perda de progresso seja evitada e que a segurança na navegação seja ampliada. Para docentes, a solução traz mais eficiência e padronização. Para a gestão, garantem-se dados centralizados e relatórios organizados.

6. **Critério de sucesso e avaliação**  
A solução será considerada bem-sucedida se: ≥ 90% dos alunos concluírem a prova sem suporte técnico; 100% das submissões forem persistidas sem perda; o coordenador acessar relatórios automatizados em todas as provas encerradas; e o tempo médio de correção por questão diminuir em relação ao processo manual.

### 2.1.4. Value Proposition Canvas

&emsp;Elaboraram-se três Value Proposition Canvas (VPC), um para cada perfil de usuário do sistema — Alunos, Professores e Coordenadores. Para cada segmento, analisaram-se as tarefas (Customer Jobs), dores (Pains) e ganhos (Gains) do cliente, e mapearam-se os produtos e serviços, aliviadores de dores (Pain Relievers) e criadores de ganhos (Gain Creators) da proposta de valor. O fit entre proposta e perfil é explicitado ao final de cada segmento.

---

#### VPC — Alunos

<div align="center">
  <img src="../assets/vpcalunos.png">
</div>

<div align="center">
  <strong>Figura 3 — Value Proposition Canvas (Alunos) do Instituto Ponte.</strong><br><em>Fonte: elaboração própria.</em>
</div>

##### A. Perfil do Cliente

###### Tarefas do cliente (Customer Jobs)

No contexto da plataforma de avaliação remota, os alunos assumem o papel de participantes ativos do processo avaliativo digital. Ao longo da experiência, as seguintes tarefas são realizadas:

- acessar provas em um ambiente centralizado;
- responder avaliações diretamente na plataforma;
- enviar respostas e arquivos de forma correta;
- acompanhar seu desempenho acadêmico;
- participar de avaliações organizadas e padronizadas.

Na prática, todas as etapas da avaliação são realizadas em um único ambiente, reduzindo a complexidade e facilitando o processo.

---

###### Dores (Pains)

Durante o uso de sistemas tradicionais, os alunos enfrentam dificuldades que impactam sua experiência. Entre as principais dores estão:

- dificuldade no envio de arquivos e respostas;
- insegurança quanto ao sucesso da submissão;
- uso de múltiplos canais desorganizados;
- risco de perda de informações;
- dificuldades tecnológicas;
- falta de clareza no processo avaliativo.

Essas dores são geradoras de ansiedade e prejudicam o desempenho, especialmente em ambientes digitais pouco estruturados.

---

###### Ganhos (Gains)

Com a plataforma, os alunos passam a ter uma experiência mais clara e segura. Entre os principais ganhos estão:

- maior segurança na realização de provas;
- facilidade no envio de respostas;
- acesso centralizado a conteúdos;
- melhor organização das avaliações;
- maior transparência no processo;
- inclusão digital.

Ao final, o aluno consegue focar no aprendizado, sem se preocupar com problemas técnicos ou organizacionais.

---

##### B. Mapa de Valor

###### Produtos e Serviços

A solução oferece:

- sistema de provas online;
- envio seguro de respostas e arquivos;
- interface simples e intuitiva;
- confirmação visual de submissão;
- acompanhamento de resultados e feedbacks.

---

###### Aliviadores de Dores (Pain Relievers)

Para reduzir as dificuldades, a plataforma:

- centraliza todas as atividades em um único ambiente;
- garante armazenamento seguro;
- reduz falhas no envio de arquivos;
- simplifica o uso com uma interface intuitiva.

---

###### Criadores de Ganhos (Gain Creators)

A solução gera valor ao:

- melhorar a experiência do aluno;
- aumentar a confiança no sistema;
- facilitar o acesso ao conteúdo;
- promover um ambiente mais organizado e justo.

&emsp;**Fit entre proposta e perfil:** A dor de insegurança quanto ao sucesso da submissão é diretamente aliviada pela confirmação visual de envio (US11) e pelo salvamento automático de progresso (US10). A dificuldade tecnológica é reduzida pela interface mobile-first (US09) e pelo acesso sem cadastro por link único (US08). O ganho de inclusão digital é criado pela renderização de fórmulas em qualquer dispositivo (RF011) e pelo suporte a uploads de resoluções manuscritas (RF006).

---

#### VPC — Professores

<div align="center">
  <img src="../assets/vpcprof.png">
</div>

<div align="center">
  <strong>Figura 4 — Value Proposition Canvas (Professores) do Instituto Ponte.</strong><br><em>Fonte: elaboração própria.</em>
</div>

##### A. Perfil do Cliente

###### Tarefas do cliente (Customer Jobs)

Os professores são responsáveis pela criação e gestão das avaliações. Durante o processo, as seguintes atividades são desempenhadas:

- criar provas e atividades avaliativas;
- organizar e publicar avaliações;
- corrigir respostas dos alunos;
- corrigir avaliações por questão, garantindo isonomia;
- acompanhar o desempenho das turmas.

Na prática, essas tarefas são centralizadas na plataforma, tornando o trabalho mais estruturado e eficiente.

---

###### Dores (Pains)

Sem uma plataforma adequada, os professores enfrentam diversos problemas, como:

- sobrecarga administrativa;
- uso de ferramentas dispersas;
- perda de arquivos;
- falta de padronização nas correções;
- dificuldade em organizar avaliações;
- retrabalho constante.

Essas dificuldades resultam em um processo mais lento e menos eficiente.

---

###### Ganhos (Gains)

Com a solução, os professores passam a ter:

- maior organização das avaliações;
- correção mais eficiente e padronizada;
- redução de erros operacionais;
- economia de tempo;
- melhor acompanhamento dos alunos.

Assim, o professor consegue focar mais no ensino e menos em tarefas operacionais.

---

##### B. Mapa de Valor

###### Produtos e Serviços

A plataforma oferece:

- criação e publicação de provas;
- sistema de correção estruturado por questão;
- armazenamento de avaliações;
- acompanhamento acadêmico.

---

###### Aliviadores de Dores (Pain Relievers)

A solução reduz problemas ao:

- automatizar processos;
- centralizar informações;
- evitar perda de arquivos;
- padronizar correções;
- diminuir a sobrecarga.

---

###### Criadores de Ganhos (Gain Creators)

A plataforma gera benefícios ao:

- aumentar a eficiência do trabalho;
- melhorar a organização;
- facilitar o acompanhamento pedagógico;
- reduzir o tempo gasto em tarefas repetitivas.

&emsp;**Fit entre proposta e perfil:** A dor de falta de padronização nas correções é aliviada pelo módulo de correção por questão (US12), que agrupa todas as respostas de uma mesma questão em sequência. A sobrecarga administrativa é reduzida pela correção automática de questões objetivas (US13) e pela geração de planilhas de resultados (US14). O ganho de eficiência é criado pelo banco de questões reutilizáveis (US05) e pelo editor com suporte a LaTeX (US04).

---

#### VPC — Coordenadores

<div align="center">
  <img src="/assets/vpccoord.png">
</div>

<div align="center">
  <strong>Figura 5 — Value Proposition Canvas (Coordenadores) do Instituto Ponte.</strong><br><em>Fonte: elaboração própria.</em>
</div>

##### A. Perfil do Cliente

###### Tarefas do cliente (Customer Jobs)

Aos coordenadores é atribuído um papel estratégico dentro da instituição. As seguintes responsabilidades são exercidas:

- organizar processos avaliativos;
- supervisionar avaliações;
- monitorar desempenho acadêmico;
- acessar relatórios institucionais;
- apoiar decisões pedagógicas;
- garantir segurança e padronização.

Na prática, uma visão ampla e centralizada de toda a operação é proporcionada pela plataforma.

---

###### Dores (Pains)

Entre os principais desafios enfrentados estão:

- falta de centralização de dados;
- dificuldade de monitoramento;
- processos manuais e descentralizados;
- risco de inconsistências;
- dificuldade na tomada de decisão;
- baixa visibilidade dos resultados.

Esses problemas resultam em dificuldades para a gestão eficiente da instituição.

---

###### Ganhos (Gains)

Com a plataforma, os coordenadores passam a ter:

- acesso a dados organizados;
- relatórios automáticos;
- maior controle dos processos;
- melhoria na tomada de decisão;
- aumento da eficiência institucional;
- maior segurança da informação.

Com isso, a gestão é fortalecida e a qualidade dos processos educacionais é melhorada.

---

##### B. Mapa de Valor

###### Produtos e Serviços

A solução inclui:

- painéis administrativos;
- relatórios automáticos;
- armazenamento de dados;
- monitoramento acadêmico;
- gestão centralizada.

---

###### Aliviadores de Dores (Pain Relievers)

A plataforma ajuda ao:

- centralizar informações;
- automatizar relatórios;
- reduzir falhas humanas;
- melhorar o controle dos processos.

---

###### Criadores de Ganhos (Gain Creators)

A solução agrega valor ao:

- melhorar a gestão institucional;
- aumentar a transparência;
- apoiar decisões estratégicas;
- modernizar processos educacionais.

&emsp;**Fit entre proposta e perfil:** A dor de falta de centralização de dados é aliviada pelo painel de visualização de todas as provas (RF018) e pelos relatórios automáticos de desempenho (RF019). A dificuldade de monitoramento é reduzida pelo módulo de logs e analytics (US16), que oferece métricas de participação e desempenho por questão. O ganho de eficiência institucional é criado pela exportação estruturada de resultados em Excel (US14) e pelo histórico de envios de e-mail com status (US15).

---

### 2.1.5. Matriz de Riscos do Projeto

A seção foi estruturada com base no contexto do Instituto Ponte, no escopo da solução e nas restrições formais do TAPI.

#### Critério de classificação

A classificação foi definida pela combinação entre probabilidade e impacto, priorizando os riscos mais prováveis e com maior efeito sobre o cumprimento do escopo, do prazo e da qualidade da solução. Foram considerados os tipos esperados para este projeto: tecnológicos, de usuário, de negócio, de conteúdo e ético/regulatórios. A resposta foi descrita em três frentes: mitigação, prevenção e plano contingencial.

#### Matriz de riscos

<div align="center">
  <img src="/assets/matrizRisco.jpg">
</div>

<div align="center">
  <strong>Figura 6 — Matriz de Risco do Instituto Ponte.</strong><br><em>Fonte: elaboração própria.</em>
</div>

| Risco | Tipo | Descrição | Probabilidade | Impacto | Classificação | Plano de resposta | Responsável |
|---|---|---|---|---|---|---|---|
| **A01 — Dificuldade de uso em cenários de acesso digital limitado** | Usuário / tecnológico | O público atendido pelo Instituto Ponte está distribuído em 18 estados e em contexto de vulnerabilidade social, o que pode gerar condições heterogêneas de uso e dificultar a realização da prova remota por parte de alguns alunos. | 70 | Muito Alto | Alta prioridade | **Mitigação:** interface simples, com fluxo curto e instruções claras; **Prevenção:** validação de usabilidade com foco no público-alvo; **Contingência:** orientação ao parceiro para disponibilizar janela de aplicação mais ampla quando necessário. | Equipe de UX e front-end |
| **A02 — Complexidade das funcionalidades de prova com equações e uploads** | Tecnológico / conteúdo | O escopo prevê suporte nativo a equações e envio de arquivos, o que amplia a complexidade da implementação e aumenta o risco de inconsistência entre o editor, a visualização e a submissão. | 70 | Alto | Alta prioridade | **Mitigação:** desenvolvimento incremental por entregas; **Prevenção:** priorização do fluxo mínimo de prova no MVP; **Contingência:** redução temporária de recursos secundários caso a integração comprometa a estabilidade. | Equipe de desenvolvimento |
| **A03 — Falhas no fluxo de submissão de respostas e anexos** | Tecnológico | Como a solução depende do envio de respostas e arquivos de resolução, qualquer falha nesse fluxo pode comprometer a integridade da prova e gerar retrabalho para o aluno e para o professor. | 50 | Muito Alto | Alta prioridade | **Mitigação:** validações de formulário e confirmação explícita de envio; **Prevenção:** testes do fluxo completo de submissão; **Contingência:** registro de falhas e reenvio orientado pelo sistema. | Equipe de back-end |
| **A04 — Dificuldade na correção por item** | Negócio / usuário | A proposta inclui organização da correção por itens da avaliação. Se a navegação entre questões não for clara, o ganho de padronização da correção pode ser reduzido. | 50 | Alto | Média-alta prioridade | **Mitigação:** arquitetura de navegação simples entre itens; **Prevenção:** revisão do fluxo com o parceiro antes da entrega final; **Contingência:** ajustes no agrupamento das respostas conforme o uso real. | Equipe de produto e validação com o parceiro |
| **A05 — Atraso na entrega das funcionalidades centrais** | Negócio / tecnológico | O projeto reúne criação de prova, submissão do aluno e painel de correção em um único produto, o que pode pressionar o cronograma e afetar a conclusão das entregas prioritárias. | 50 | Moderado | Média prioridade | **Mitigação:** divisão do escopo em incrementos; **Prevenção:** priorização do MVP e controle das sprints; **Contingência:** corte controlado de funcionalidades não essenciais. | Gestão do grupo |
| **A06 — Identificação não autenticada no fluxo do aluno** | Ético/regulatório / negócio | O acesso dos alunos ocorre por identificação simples (nome, CPF e e-mail), sem autenticação forte. Embora professores e coordenadores utilizem OAuth2 Google, o fluxo do aluno permanece sem verificação de identidade robusta, o que pode permitir submissões com dados falsos ou acesso não autorizado a provas por link. | 50 | Alto | Média-alta prioridade | **Mitigação:** registrar o acesso de forma transparente dentro do fluxo definido; **Prevenção:** documentar claramente o procedimento de uso; **Contingência:** adotar conferência manual quando o parceiro julgar necessário. | Equipe de produto e parceiro |
| **A07 — Limitação de expansão por ausência de APIs externas** | Negócio | Como o projeto não contempla integração com WebAPIs externas, a evolução futura da solução pode ficar limitada a funcionalidades internas da própria aplicação. | 50 | Moderado | Média prioridade | **Mitigação:** organizar a arquitetura com contratos internos bem definidos; **Prevenção:** documentar pontos de extensão; **Contingência:** tratar integrações futuras como evolução fora do escopo atual. | Equipe de back-end |
| **A08 — Ausência de mecanismos de proctoring** | Ético/regulatório | O TAPI exclui bloqueio de navegador e monitoramento por câmera. A solução, portanto, prioriza acessibilidade, mas não oferece meios de supervisão avançada durante a aplicação da prova. | 50 | Moderado | Média prioridade | **Mitigação:** reforçar a clareza das regras de aplicação com o parceiro; **Prevenção:** manter o escopo aderente ao TAPI; **Contingência:** eventual adoção de procedimentos manuais de supervisão pela instituição. | Parceiro e equipe de alinhamento |
| **O01 — Ampliação do alcance da solução para contextos semelhantes** | Negócio | A estrutura do Instituto Ponte e o problema enfrentado pelo parceiro indicam uma demanda que pode ser compartilhada por outras organizações com realidade educacional parecida. | 50 | Alto | Alta oportunidade | **Aproveitamento:** manter a solução simples, adaptável e documentada para facilitar futuras adaptações. | Equipe de produto |
| **O02 — Fortalecimento da padronização da correção** | Negócio / usuário | A organização da correção por item pode aumentar a consistência do processo avaliativo e reduzir dispersões entre professores. | 70 | Moderado | Alta oportunidade | **Aproveitamento:** destacar o painel de correção por questão como fluxo principal da experiência do professor. | Equipe de UX e back-end |
| **O03 — Melhoria da experiência avaliativa com suporte a equações e uploads** | Tecnológico / conteúdo | O suporte a equações e anexos permite uma prova mais próxima das necessidades reais de avaliação do parceiro e amplia a utilidade pedagógica da solução. | 50 | Moderado | Média oportunidade | **Aproveitamento:** integrar os recursos de forma estável e com linguagem visual consistente. | Equipe de front-end |
| **O04 — Ganho reputacional pela entrega de uma solução aderente ao contexto social do parceiro** | Negócio / ético | Uma solução coerente com acessibilidade, simplicidade e equidade pode reforçar o valor institucional do projeto junto ao parceiro. | 50 | Moderado | Média oportunidade | **Aproveitamento:** registrar as decisões de projeto e os resultados obtidos para uso em documentação e apresentação final. | Gestão do grupo |

## 2.2. Personas

&emsp;Foram elaboradas três proto-personas representando os perfis de usuários do sistema: Edgar Romeo (aluno), estudante com baixo letramento digital que necessita de interface simples e intuitiva; Ronaldo Silva (professor), docente experiente que busca eficiência e organização no processo de correção; e Valéria dos Santos (coordenadora), profissional com alto domínio digital que depende de dados estruturados para apoiar decisões pedagógicas. As personas são hipotéticas e foram construídas a partir do contexto institucional do Instituto Ponte e dos dados do TAPI (INSTITUTO PONTE, 2024).


<div align="center">
  <img src="../assets/personaAluno.png">
</div>

<div align="center">
  <strong>Figura 7 — Persona do Aluno.</strong><br><em>Foto de <a href="https://unsplash.com/pt-br/@sooprun?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Alex Suprun</a> na <a href="https://unsplash.com/pt-br/fotografias/man-in-black-button-up-shirt-ZHvM3XIOHoE?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
      </em>
</div>


<div align="center">
  <img src="../assets/personaProfessor.png">
</div>

<div align="center">
  <strong>Figura 8 — Persona do Professor.</strong><br><em>Foto de <a href="https://unsplash.com/pt-br/@lancereis?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Lance Reis</a> na <a href="https://unsplash.com/pt-br/fotografias/um-homem-com-barba-pp76Y6Fq6xw?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
      </em>
</div>


<div align="center">
  <img src="../assets/personaCoordenadora.png">
</div>

<div align="center">
  <strong>Figura 9 — Persona da Coordenadora.</strong><br><em>Fonte: Foto de <a href="https://unsplash.com/pt-br/@ageing_better?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Centre for Ageing Better</a> na <a href="https://unsplash.com/pt-br/fotografias/uma-mulher-sentada-em-uma-cadeira-segurando-uma-xicara-de-cafe--UPMX2uynvA?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
      </em>
</div>

### 2.2.1 Mapa de Empatia de uma persona

#### Mapa de Empatia — Professor do Ensino Médio (Ronaldo Silva)

<div align="center">
  <img src="/assets/mapaDeEmpatia.png">
</div>

<div align="center">
  <strong>Figura 10 — Mapa de sentimento de persona.</strong><br><em>Fonte: elaboração própria.</em>
</div>

#### Visão Geral
Este mapa de empatia representa o perfil de Ronaldo Silva, professor do Ensino Médio, e tem como objetivo compreender suas necessidades, dores e comportamentos no processo de correção de provas. A análise auxilia na definição de soluções mais eficientes para plataformas de avaliação.

---

#### Dados Demográficos
- Idade: 40 anos  
- Renda: R$ 5.000/mês  
- Escolaridade: Ensino Superior Completo  
- Localização: Espírito Santo  
- Nível de letramento digital: Alto  

---

#### O que pensa?
Ronaldo frequentemente reflete sobre a eficiência e segurança do processo de correção:
- Dúvidas sobre a organização das respostas  
- Preocupação com perda de progresso  
- Busca por métodos mais rápidos e práticos  
- Questionamentos sobre justiça na avaliação dos alunos  

---

#### O que sente?
Durante o processo atual, ele experimenta:
- Frustração com ferramentas pouco eficientes  
- Insegurança ao corrigir sem organização clara  
- Ansiedade devido a prazos e volume de provas  
- Sobrecarga por tarefas repetitivas  

---

#### O que diz?
Algumas falas comuns que refletem sua experiência:
> "O método atual de correção é muito ruim."  
> "Não tenho acesso às respostas de forma organizada."  
> "Quando a página atualiza, eu perco meu progresso."  
> "Corrigir prova assim dá muito trabalho."

---

#### O que faz?
No cenário atual, Ronaldo:
- Corrige provas manualmente ou em arquivos digitais  
- Utiliza planilhas para organizar notas  
- Revisa respostas múltiplas vezes  
- Salva frequentemente para evitar perdas  
- Usa ferramentas externas como WhatsApp e e-mail  

---

#### Objetivos
Ronaldo busca:
- Organizar e facilitar a correção das provas  
- Reduzir o tempo gasto com correções  
- Ter clareza e estrutura nas respostas dos alunos  
- Garantir avaliações justas e consistentes  
- Acessar relatórios detalhados de desempenho  

---

#### Dores
Os principais problemas enfrentados incluem:
- Processo de correção pouco prático  
- Falta de organização das respostas  
- Risco de perda de progresso  
- Grande volume de provas para corrigir  
- Dificuldade em comparar respostas  
- Uso de múltiplas ferramentas desconectadas  

---

#### Necessidades
Com base nas dores e objetivos, surgem oportunidades claras:
- Sistema de correção por questão (visão agrupada)  
- Salvamento automático de progresso  
- Interface simples e intuitiva  
- Centralização de informações em um único sistema  
- Geração automática de relatórios

---

#### Conclusão
O mapa de empatia evidencia que o professor precisa de uma solução que reduza a complexidade operacional, aumente a confiabilidade do sistema e melhore a organização das informações.  
Esses pontos são essenciais para orientar o desenvolvimento de uma plataforma de avaliação mais eficiente.

## 2.3. User Stories (sprints 1 a 5)

<table>
  <tr><td><strong>Número</strong></td><td>US01</td></tr>
  <tr><td><strong>Título</strong></td><td>Autenticação de professores e coordenadores.</td></tr>
  <tr><td><strong>Persona</strong></td><td>Coordenador ou Professor.</td></tr>
  <tr><td><strong>Nota técnica</strong></td><td>O TAPI estabelece ausência de login/senha para acesso à plataforma. Essa restrição aplica-se ao fluxo do <strong>aluno</strong>, que acessa via link único sem credenciais. Para <strong>Professor e Coordenador</strong> — usuários internos com acesso a dados avaliativos sensíveis — optou-se pela autenticação OAuth2 via Google, que não constitui sistema de login/senha tradicional e atende à restrição de acessibilidade do TAPI ao eliminar o gerenciamento de senhas.</td></tr>
  <tr><td><strong>História</strong></td><td>Eu, enquanto <strong>Coordenador ou Professor</strong>, quero utilizar minha conta Google para realizar o Login na plataforma.</td></tr>
  <tr>
    <td><strong>Critérios de Aceitação</strong></td>
    <td>
      <strong>CR-01</strong> - somente usuários internos autorizados podem acessar o sistema.<br>
      <strong>Validação:</strong> o e-mail autenticado deve pertencer à lista de usuários autorizados.<br><br>
      <strong>CR-02</strong> - o sistema deve direcionar o usuário para o painel correspondente ao seu perfil.<br>
      Perfis possíveis: { "Coordenador", "Professor" }.<br><br>
      <strong>CR-03</strong> - usuários com sessão encerrada não podem acessar páginas protegidas sem novo login.
    </td>
  </tr>
  <tr>
    <td><strong>Testes de Aceitação</strong></td>
    <td>
      <strong>Critério de aceitação: CR-01</strong><br>
      a. Professor autorizado faz login com Google.<br>
      – Acessou o sistema = correto.<br>
      – Teve acesso negado = errado, deve ser corrigido.<br><br>
      b. Usuário não autorizado tenta fazer login com Google.<br>
      – Acessou o sistema = errado, deve ser corrigido.<br>
      – Teve acesso negado = correto.<br><br>
      <strong>Critério de aceitação: CR-02</strong><br>
      a. Coordenador autorizado realiza login.<br>
      – Foi direcionado para o painel do coordenador = correto.<br>
      – Foi direcionado para painel incorreto = errado, deve ser corrigido.<br><br>
      b. Professor autorizado realiza login.<br>
      – Foi direcionado para o painel do professor = correto.<br>
      – Foi direcionado para painel incorreto = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-03</strong><br>
      a. Usuário autenticado encerra a sessão e tenta acessar página protegida.<br>
      – Foi redirecionado para login = correto.<br>
      – Acessou a página protegida = errado, deve ser corrigido.
    </td>
  </tr>
  <tr>
    <td><strong>Critérios INVEST</strong></td>
    <td>
      <strong>Independente:</strong> Pode ser desenvolvida e entregue sem depender de nenhuma outra história; o mecanismo de autenticação OAuth com Google é autocontido.<br><br>
      <strong>Negociável:</strong> O provedor de autenticação (Google) e o mecanismo de lista de usuários autorizados podem ser renegociados com o time sem alterar o objetivo da história.<br><br>
      <strong>Valorosa:</strong> Garante que apenas pessoas autorizadas acessem o sistema, protegendo dados sensíveis de avaliação e direcionando cada usuário ao seu contexto correto.<br><br>
      <strong>Estimável:</strong> O escopo é claro — OAuth2 com Google, validação de e-mail e roteamento por perfil — permitindo estimativa objetiva pelo time.<br><br>
      <strong>Pequena:</strong> Cobre apenas o fluxo de login e redirecionamento, sem incluir gestão de usuários ou permissões granulares, cabendo em uma sprint.<br><br>
      <strong>Testável:</strong> Os critérios de aceitação definem cenários objetivos com resultado esperado claro (acesso permitido/negado, painel correto, bloqueio de sessão encerrada).
    </td>
  </tr>
</table>

---

<table>
  <tr><td><strong>Número</strong></td><td>US02</td></tr>
  <tr><td><strong>Título</strong></td><td>Gestão de provas por status e filtros.</td></tr>
  <tr><td><strong>Persona</strong></td><td>Professor.</td></tr>
  <tr><td><strong>História</strong></td><td>Eu, enquanto <strong>Professor</strong>, quero visualizar provas antigas, rascunhos e encerradas com filtros, para encontrar rapidamente avaliações do processo seletivo.</td></tr>
  <tr>
    <td><strong>Critérios de Aceitação</strong></td>
    <td>
      <strong>CR-01</strong> - as provas devem ser exibidas separadas por status.<br>
      Status possíveis: { "Rascunho", "Publicada", "Encerrada", "Antiga" }.<br><br>
      <strong>CR-02</strong> - o professor deve conseguir filtrar provas por turma, semestre, disciplina ou professor.<br><br>
      <strong>CR-03</strong> - quando nenhum resultado for encontrado, o sistema deve exibir uma mensagem de estado vazio.
    </td>
  </tr>
  <tr>
    <td><strong>Testes de Aceitação</strong></td>
    <td>
      <strong>Critério de aceitação: CR-01</strong><br>
      a. Professor acessa a home com provas em diferentes status.<br>
      – Provas aparecem separadas por status = correto.<br>
      – Provas aparecem misturadas sem identificação = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-02</strong><br>
      a. Professor aplica filtro por disciplina "Matemática".<br>
      – Sistema exibe apenas provas de Matemática = correto.<br>
      – Sistema exibe provas de outras disciplinas = errado, deve ser corrigido.<br><br>
      b. Professor aplica filtro por semestre "2026.1".<br>
      – Sistema exibe apenas provas do semestre selecionado = correto.<br>
      – Sistema exibe provas de outros semestres = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-03</strong><br>
      a. Professor aplica filtros sem resultados compatíveis.<br>
      – Sistema exibe mensagem de estado vazio = correto.<br>
      – Sistema exibe lista vazia sem explicação = errado, deve ser corrigido.
    </td>
  </tr>
  <tr>
    <td><strong>Critérios INVEST</strong></td>
    <td>
      <strong>Independente:</strong> A listagem e filtragem de provas não depende de outras histórias; pode ser desenvolvida com dados mockados mesmo antes do editor de provas estar pronto.<br><br>
      <strong>Negociável:</strong> Os filtros disponíveis (turma, semestre, disciplina, professor) e a forma de exibição por status podem ser ajustados conforme feedback do professor sem alterar o valor central.<br><br>
      <strong>Valorosa:</strong> Permite ao professor localizar rapidamente qualquer avaliação, reduzindo tempo gasto em navegação e aumentando a produtividade no gerenciamento do processo seletivo.<br><br>
      <strong>Estimável:</strong> Listagem com agrupamento por status e filtros client/server-side têm complexidade conhecida, possibilitando estimativa pelo time de desenvolvimento.<br><br>
      <strong>Pequena:</strong> Limita-se à visualização e filtragem, sem edição ou criação de provas, sendo entregável de forma isolada em uma sprint.<br><br>
      <strong>Testável:</strong> Cada critério possui cenários com entrada e saída definidas, como filtro por disciplina exibindo apenas provas correspondentes ou mensagem de estado vazio.
    </td>
  </tr>
</table>

---

<table>
  <tr><td><strong>Número</strong></td><td>US03</td></tr>
  <tr><td><strong>Título</strong></td><td>Criação rápida de prova pela home.</td></tr>
  <tr><td><strong>Persona</strong></td><td>Professor.</td></tr>
  <tr><td><strong>História</strong></td><td>Eu, enquanto <strong>Professor</strong>, quero criar uma nova prova diretamente da home, para iniciar rapidamente uma avaliação do processo seletivo.</td></tr>
  <tr>
    <td><strong>Critérios de Aceitação</strong></td>
    <td>
      <strong>CR-01</strong> - a home deve possuir uma ação visível para criação de nova prova.<br><br>
      <strong>CR-02</strong> - o professor deve preencher os dados iniciais obrigatórios da prova.<br>
      Campos obrigatórios: { "Nome", "Modalidade", "Disciplina", "Turma", "Semestre" }.<br><br>
      <strong>CR-03</strong> - toda prova criada inicialmente deve ser salva como rascunho.
    </td>
  </tr>
  <tr>
    <td><strong>Testes de Aceitação</strong></td>
    <td>
      <strong>Critério de aceitação: CR-01</strong><br>
      a. Professor acessa a home e clica em "Criar prova".<br>
      – Foi levado ao formulário de criação = correto.<br>
      – Permaneceu na home sem resposta = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-02</strong><br>
      a. Professor preenche todos os campos obrigatórios e salva.<br>
      – Sistema permite salvar = correto.<br>
      – Sistema bloqueia sem motivo = errado, deve ser corrigido.<br><br>
      b. Professor tenta salvar sem preencher disciplina.<br>
      – Sistema bloqueia e indica campo obrigatório = correto.<br>
      – Sistema salva a prova incompleta = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-03</strong><br>
      a. Professor cria uma prova e sai antes de publicar.<br>
      – Prova permanece disponível como rascunho = correto.<br>
      – Prova desaparece do sistema = errado, deve ser corrigido.
    </td>
  </tr>
  <tr>
    <td><strong>Critérios INVEST</strong></td>
    <td>
      <strong>Independente:</strong> O formulário de criação inicial pode ser desenvolvido antes do editor completo de questões; a prova é salva como rascunho e o editor pode ser implementado em outra história.<br><br>
      <strong>Negociável:</strong> Os campos obrigatórios e o ponto de entrada (botão na home) podem ser ajustados sem comprometer o objetivo de iniciar a criação de forma rápida.<br><br>
      <strong>Valorosa:</strong> Reduz o atrito para iniciar uma nova avaliação, permitindo que o professor comece o trabalho sem precisar navegar por menus complexos.<br><br>
      <strong>Estimável:</strong> Formulário com validação de campos obrigatórios e persistência como rascunho é bem delimitado e estimável pelo time.<br><br>
      <strong>Pequena:</strong> Cobre apenas a criação dos metadados iniciais da prova (sem editor de questões), entregável em uma única sprint.<br><br>
      <strong>Testável:</strong> Os cenários validam ausência de campos obrigatórios, fluxo de navegação e persistência como rascunho com resultados binários claros.
    </td>
  </tr>
</table>

---

<table>
  <tr><td><strong>Número</strong></td><td>US04</td></tr>
  <tr><td><strong>Título</strong></td><td>Editor de questões com fórmulas e tipos variados.</td></tr>
  <tr><td><strong>Persona</strong></td><td>Professor.</td></tr>
  <tr><td><strong>História</strong></td><td>Eu, enquanto <strong>Professor</strong>, quero criar questões com enunciados, fórmulas e diferentes tipos de resposta, para montar provas adequadas a disciplinas como Matemática e Português.</td></tr>
  <tr>
    <td><strong>Critérios de Aceitação</strong></td>
    <td>
      <strong>CR-01</strong> - o professor deve poder criar questões dos tipos múltipla escolha, verdadeiro/falso e discursiva.<br><br>
      <strong>CR-02</strong> - enunciados com LaTeX devem ser renderizados corretamente na pré-visualização.<br><br>
      <strong>CR-03</strong> - questões discursivas devem permitir configuração de limite de palavras ou caracteres.<br><br>
      <strong>CR-04</strong> - o sistema deve impedir a publicação de provas com questões incompletas.
    </td>
  </tr>
  <tr>
    <td><strong>Testes de Aceitação</strong></td>
    <td>
      <strong>Critério de aceitação: CR-01</strong><br>
      a. Professor cria questão de múltipla escolha.<br>
      – Questão foi criada = correto.<br>
      – Sistema recusou o tipo válido = errado, deve ser corrigido.<br><br>
      b. Professor cria questão discursiva.<br>
      – Questão foi criada = correto.<br>
      – Sistema recusou o tipo válido = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-02</strong><br>
      a. Professor insere fórmula em LaTeX no enunciado.<br>
      – Fórmula foi renderizada corretamente = correto.<br>
      – Fórmula apareceu quebrada ou como texto bruto = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-03</strong><br>
      a. Professor define limite de 500 caracteres em questão discursiva.<br>
      – Interface do aluno respeita o limite = correto.<br>
      – Aluno consegue ultrapassar o limite sem aviso = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-04</strong><br>
      a. Professor tenta publicar prova com questão sem enunciado.<br>
      – Sistema impede publicação e indica o erro = correto.<br>
      – Sistema publica a prova incompleta = errado, deve ser corrigido.
    </td>
  </tr>
  <tr>
    <td><strong>Critérios INVEST</strong></td>
    <td>
      <strong>Independente:</strong> O editor de questões pode ser construído de forma isolada, sem depender da publicação ou da distribuição da prova, que são histórias separadas.<br><br>
      <strong>Negociável:</strong> A quantidade de tipos de questão, bibliotecas de renderização LaTeX e regras de limite de caracteres são decisões negociáveis conforme viabilidade técnica.<br><br>
      <strong>Valorosa:</strong> Permite criar avaliações ricas e adequadas a disciplinas exatas e humanas, sendo o núcleo funcional da plataforma para o professor.<br><br>
      <strong>Estimável:</strong> Apesar da complexidade do LaTeX, as bibliotecas existentes (ex.: MathJax/KaTeX) têm comportamento previsível, tornando a história estimável.<br><br>
      <strong>Pequena:</strong> Esta história pode ser dividida caso necessário (ex.: tipos de questão em uma sprint, renderização LaTeX em outra), mas como definida cobre escopo coeso.<br><br>
      <strong>Testável:</strong> Cada critério tem cenário claro: renderização de fórmula, bloqueio de publicação incompleta e respeito ao limite de caracteres são verificáveis objetivamente.
    </td>
  </tr>
</table>

---

<table>
  <tr><td><strong>Número</strong></td><td>US05</td></tr>
  <tr><td><strong>Título</strong></td><td>Banco de questões.</td></tr>
  <tr><td><strong>Persona</strong></td><td>Professor.</td></tr>
  <tr><td><strong>História</strong></td><td>Eu, enquanto <strong>Professor</strong>, quero reutilizar questões de um banco, para montar provas com mais rapidez e consistência.</td></tr>
  <tr>
    <td><strong>Critérios de Aceitação</strong></td>
    <td>
      <strong>CR-01</strong> - o professor deve conseguir buscar questões por disciplina, tema ou tipo.<br><br>
      <strong>CR-02</strong> - questões selecionadas do banco devem ser adicionadas ao editor da prova.
    </td>
  </tr>
  <tr>
    <td><strong>Testes de Aceitação</strong></td>
    <td>
      <strong>Critério de aceitação: CR-01</strong><br>
      a. Professor filtra questões por disciplina "Matemática".<br>
      – Sistema exibe questões de Matemática = correto.<br>
      – Sistema exibe questões de outras disciplinas sem relação = errado, deve ser corrigido.<br><br>
      b. Professor filtra questões por tipo "Discursiva".<br>
      – Sistema exibe apenas questões discursivas = correto.<br>
      – Sistema exibe múltipla escolha ou verdadeiro/falso = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-02</strong><br>
      a. Professor seleciona questão do banco e adiciona à prova.<br>
      – Questão aparece no editor da avaliação = correto.<br>
      – Questão não aparece na prova = errado, deve ser corrigido.
    </td>
  </tr>
  <tr>
    <td><strong>Critérios INVEST</strong></td>
    <td>
      <strong>Independente:</strong> O banco de questões é um módulo separado do editor; pode ser desenvolvido e populado independentemente, com integração ao editor feita por API.<br><br>
      <strong>Negociável:</strong> Os filtros de busca (disciplina, tema, tipo) e a forma de exibição das questões são aspectos negociáveis sem perda do valor da história.<br><br>
      <strong>Valorosa:</strong> Economiza tempo do professor ao permitir reaproveitamento de questões já validadas, aumentando a consistência e agilidade na montagem de provas.<br><br>
      <strong>Estimável:</strong> Busca com filtros é padrão e com complexidade bem conhecida, tornando a estimativa viável pelo time.<br><br>
      <strong>Pequena:</strong> Cobre apenas busca e adição de questões ao editor, sem incluir criação ou edição de questões no banco, mantendo o escopo controlado.<br><br>
      <strong>Testável:</strong> Os cenários de busca por filtro e adição ao editor têm resultados verificáveis objetivamente.
    </td>
  </tr>
</table>

---

<table>
  <tr><td><strong>Número</strong></td><td>US06</td></tr>
  <tr><td><strong>Título</strong></td><td>Configuração de tempo, datas e embaralhamento.</td></tr>
  <tr><td><strong>Persona</strong></td><td>Professor.</td></tr>
  <tr><td><strong>História</strong></td><td>Eu, enquanto <strong>Professor</strong>, quero configurar tempo, datas limite e embaralhamento, para controlar a aplicação da prova de forma justa.</td></tr>
  <tr>
    <td><strong>Critérios de Aceitação</strong></td>
    <td>
      <strong>CR-01</strong> - o professor deve definir data e horário de início e término da prova, seguindo obrigatoriamente o Horário de Brasília (GMT-3).<br><br>
      <strong>CR-02</strong> - o sistema deve respeitar o limite de tempo definido para cada aluno.<br><br>
      <strong>CR-03</strong> - o sistema deve permitir embaralhamento de questões ou alternativas.<br><br>
      <strong>CR-04</strong> - provas encerradas não devem aceitar novas submissões.
    </td>
  </tr>
  <tr>
    <td><strong>Testes de Aceitação</strong></td>
    <td>
      <strong>Critério de aceitação: CR-01</strong><br>
      a. Aluno tenta acessar a prova antes da data de início.<br>
      – Sistema bloqueia o acesso ou informa indisponibilidade = correto.<br>
      – Sistema permite iniciar a prova = errado, deve ser corrigido.<br><br>
      b. Aluno acessa a prova dentro do período permitido.<br>
      – Sistema permite iniciar a prova = correto.<br>
      – Sistema bloqueia o acesso = errado, deve ser corrigido.<br><br>
      c. Aluno em fuso horário diferente tenta acessar a prova.<br>
      – Sistema valida o acesso com base no Horário de Brasília configurado no servidor = correto.<br>
      – Sistema permite acesso antecipado ou tardio baseado no relógio local do dispositivo do aluno = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-02</strong><br>
      a. Professor define limite de 60 minutos e aluno inicia a prova.<br>
      – Contador inicia em 60 minutos = correto.<br>
      – Prova inicia sem contador = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-03</strong><br>
      a. Dois alunos acessam prova com embaralhamento ativado.<br>
      – Ordem das questões ou alternativas pode aparecer diferente = correto.<br>
      – Ordem permanece fixa mesmo com embaralhamento ativo = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-04</strong><br>
      a. Aluno tenta enviar respostas após encerramento da prova.<br>
      – Sistema impede nova submissão = correto.<br>
      – Sistema aceita a submissão atrasada = errado, deve ser corrigido.
    </td>
  </tr>
  <tr>
    <td><strong>Critérios INVEST</strong></td>
    <td>
      <strong>Independente:</strong> As configurações de tempo e embaralhamento são atributos da prova, independentes do editor de questões e do fluxo do aluno, podendo ser desenvolvidas separadamente.<br><br>
      <strong>Negociável:</strong> A granularidade do timer, a opção de embaralhar apenas alternativas ou também questões, e o comportamento ao encerrar o tempo são decisões negociáveis.<br><br>
      <strong>Valorosa:</strong> Garante isonomia na aplicação da prova, impedindo acesso fora do prazo e variando a ordem das questões para reduzir cola entre candidatos.<br><br>
      <strong>Estimável:</strong> Controle de datas com fuso horário fixo (GMT-3), timer regressivo e lógica de embaralhamento são funcionalidades com complexidade conhecida e estimável.<br><br>
      <strong>Pequena:</strong> Restringe-se às configurações da prova sem alterar o editor ou o portal do aluno, sendo entregável de forma coesa em uma sprint.<br><br>
      <strong>Testável:</strong> Todos os cenários têm condições objetivas: bloqueio por data/hora, contagem regressiva iniciada corretamente e ordem variável entre alunos são verificáveis.
    </td>
  </tr>
</table>

---

<table>
  <tr><td><strong>Número</strong></td><td>US07</td></tr>
  <tr><td><strong>Título</strong></td><td>Publicação por URL e QR Code.</td></tr>
  <tr><td><strong>Persona</strong></td><td>Professor.</td></tr>
  <tr><td><strong>História</strong></td><td>Eu, enquanto <strong>Professor</strong>, quero gerar uma URL e um QR Code da prova, para distribuir o acesso aos candidatos sem uso de senha.</td></tr>
  <tr>
    <td><strong>Critérios de Aceitação</strong></td>
    <td>
      <strong>CR-01</strong> - ao publicar uma prova válida, o sistema deve gerar um link único de acesso.<br><br>
      <strong>CR-02</strong> - o sistema deve gerar QR Code correspondente ao link da prova.<br><br>
      <strong>CR-03</strong> - provas em rascunho não devem permitir submissão por link.
    </td>
  </tr>
  <tr>
    <td><strong>Testes de Aceitação</strong></td>
    <td>
      <strong>Critério de aceitação: CR-01</strong><br>
      a. Professor publica uma prova válida.<br>
      – Sistema gera link único de acesso = correto.<br>
      – Sistema publica sem gerar link = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-02</strong><br>
      a. Professor solicita QR Code da prova publicada.<br>
      – Sistema exibe QR Code correspondente ao link = correto.<br>
      – Sistema não gera QR Code = errado, deve ser corrigido.<br><br>
      b. Professor copia ou baixa o QR Code.<br>
      – Sistema permite copiar ou baixar = correto.<br>
      – Sistema apenas exibe sem opção de uso = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-03</strong><br>
      a. Aluno acessa link de prova ainda em rascunho.<br>
      – Sistema bloqueia submissão = correto.<br>
      – Sistema permite responder e enviar = errado, deve ser corrigido.
    </td>
  </tr>
  <tr>
    <td><strong>Critérios INVEST</strong></td>
    <td>
      <strong>Independente:</strong> A geração de URL e QR Code é um passo pós-publicação que pode ser implementado de forma isolada, sem alterar o editor ou o fluxo do aluno.<br><br>
      <strong>Negociável:</strong> O formato do link, o padrão do QR Code e as opções de download (PNG, SVG, copiar) são detalhes negociáveis que não afetam o objetivo central.<br><br>
      <strong>Valorosa:</strong> Simplifica a distribuição da prova, eliminando necessidade de senhas e permitindo que o professor compartilhe o acesso de forma rápida e prática.<br><br>
      <strong>Estimável:</strong> Geração de UUID para URL e bibliotecas de QR Code são soluções bem estabelecidas, com esforço previsível e estimável pelo time.<br><br>
      <strong>Pequena:</strong> Cobre apenas a geração e disponibilização do link e QR Code, sem incluir controle de acesso avançado ou analytics de cliques, mantendo o escopo pequeno.<br><br>
      <strong>Testável:</strong> É possível verificar objetivamente se o link foi gerado, se o QR Code corresponde ao link e se rascunhos bloqueiam submissão ao acessar pelo link.
    </td>
  </tr>
</table>

---

<table>
  <tr><td><strong>Número</strong></td><td>US08</td></tr>
  <tr><td><strong>Título</strong></td><td>Portal de entrada do aluno.</td></tr>
  <tr><td><strong>Persona</strong></td><td>Aluno.</td></tr>
  <tr><td><strong>História</strong></td><td>Eu, enquanto <strong>Aluno</strong>, quero acessar a prova por link e preencher meus dados, para iniciar a avaliação sem precisar criar conta.</td></tr>
  <tr>
    <td><strong>Critérios de Aceitação</strong></td>
    <td>
      <strong>CR-01</strong> - ao acessar uma prova disponível, o aluno deve visualizar título, orientações, duração e regras.<br><br>
      <strong>CR-02</strong> - o aluno deve preencher nome, e-mail e CPF antes de iniciar a prova.<br><br>
      <em>(Nota: o TAPI menciona "nome e e-mail" como identificação mínima. O CPF foi adicionado para garantir unicidade de identificação — impedindo múltiplas submissões — e para conformidade com a LGPD, cujo tratamento é explicitado no CR-04 por meio do checkbox de consentimento.)</em><br><br>
      <strong>CR-03</strong> - provas fora do período permitido devem exibir mensagem de indisponibilidade.<br><br>
      <strong>CR-04</strong> - o aluno deve marcar um checkbox obrigatório de aceite dos Termos de Uso e Política de Privacidade antes do botão "Iniciar Prova" ser habilitado.
    </td>
  </tr>
  <tr>
    <td><strong>Testes de Aceitação</strong></td>
    <td>
      <strong>Critério de aceitação: CR-01</strong><br>
      a. Aluno acessa link de prova disponível.<br>
      – Sistema exibe título, orientações, duração e regras = correto.<br>
      – Sistema inicia a prova sem mostrar informações = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-02</strong><br>
      a. Aluno preenche nome, e-mail e CPF válidos.<br>
      – Sistema permite iniciar a prova = correto.<br>
      – Sistema bloqueia sem justificativa = errado, deve ser corrigido.<br><br>
      b. Aluno tenta iniciar sem CPF.<br>
      – Sistema bloqueia e indica campo obrigatório = correto.<br>
      – Sistema permite iniciar = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-03</strong><br>
      a. Aluno acessa prova fora do período permitido.<br>
      – Sistema exibe mensagem de indisponibilidade = correto.<br>
      – Sistema permite iniciar a prova = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-04</strong><br>
      a. Aluno preenche dados mas não marca o aceite da LGPD.<br>
      – Botão "Iniciar Prova" permanece desabilitado e um aviso solicita o aceite = correto.<br>
      – Sistema permite iniciar a prova sem o registro do consentimento = errado, deve ser corrigido.
    </td>
  </tr>
  <tr>
    <td><strong>Critérios INVEST</strong></td>
    <td>
      <strong>Independente:</strong> O portal de entrada do aluno pode ser desenvolvido com dados mockados da prova, independentemente do editor de questões ou da interface de correção.<br><br>
      <strong>Negociável:</strong> Os campos de identificação (nome, e-mail, CPF), o texto dos termos e o layout da tela de entrada são aspectos negociáveis sem comprometer a segurança e rastreabilidade.<br><br>
      <strong>Valorosa:</strong> Elimina a necessidade de cadastro prévio para o aluno, reduzindo fricção no acesso à prova e garantindo coleta de dados mínimos para identificação e conformidade com a LGPD.<br><br>
      <strong>Estimável:</strong> Formulário de identificação com validação de CPF, verificação de janela de tempo e checkbox de consentimento têm complexidade conhecida e estimável.<br><br>
      <strong>Pequena:</strong> Cobre apenas a tela de entrada e identificação do aluno, sem incluir a interface de resposta das questões, que é uma história separada.<br><br>
      <strong>Testável:</strong> Os cenários validam campos obrigatórios, bloqueio fora do período, exibição das informações da prova e obrigatoriedade do aceite dos termos de forma objetiva.
    </td>
  </tr>
</table>

---

<table>
  <tr><td><strong>Número</strong></td><td>US09</td></tr>
  <tr><td><strong>Título</strong></td><td>Interface de resposta mobile-first com anexos manuscritos.</td></tr>
  <tr><td><strong>Persona</strong></td><td>Aluno.</td></tr>
  <tr><td><strong>História</strong></td><td>Eu, enquanto <strong>Aluno</strong>, quero responder questões e enviar imagens de cálculos manuscritos pelo celular, para realizar a prova mesmo sem computador.</td></tr>
  <tr>
    <td><strong>Critérios de Aceitação</strong></td>
    <td>
      <strong>CR-01</strong> - o aluno deve conseguir anexar uma ou mais imagens em questões discursivas ou com cálculo.<br><br>
      <strong>CR-02</strong> - o sistema deve aceitar apenas arquivos JPG, PNG ou PDF com tamanho máximo de 5MB por arquivo.<br><br>
      <strong>CR-03</strong> - fórmulas devem ser renderizadas corretamente no mobile.
    </td>
  </tr>
  <tr>
    <td><strong>Testes de Aceitação</strong></td>
    <td>
      <strong>Critério de aceitação: CR-01</strong><br>
      a. Aluno anexa imagem em uma questão discursiva.<br>
      – Imagem é salva vinculada à questão correta = correto.<br>
      – Imagem é perdida ou vinculada à questão errada = errado, deve ser corrigido.<br><br>
      b. Aluno anexa mais de uma imagem na mesma questão.<br>
      – Todas as imagens são salvas corretamente = correto.<br>
      – Apenas uma imagem é salva sem aviso = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-02</strong><br>
      a. Aluno tenta subir uma foto de alta resolução de 15MB.<br>
      – Sistema exibe erro: "Arquivo muito grande. Limite máximo de 5MB" = correto.<br>
      – Sistema tenta fazer o upload, trava a interface ou consome todos os dados do aluno = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-03</strong><br>
      a. Aluno visualiza questão com fórmula no celular.<br>
      – Fórmula aparece corretamente renderizada = correto.<br>
      – Fórmula aparece quebrada ou cortada = errado, deve ser corrigido.
    </td>
  </tr>
  <tr>
    <td><strong>Critérios INVEST</strong></td>
    <td>
      <strong>Independente:</strong> A interface de resposta mobile pode ser desenvolvida de forma isolada, com upload de imagens testado por mocks, sem depender do módulo de correção ou exportação.<br><br>
      <strong>Negociável:</strong> Os tipos de arquivo aceitos, o limite de tamanho e a quantidade máxima de anexos por questão são parâmetros negociáveis conforme restrições de infraestrutura.<br><br>
      <strong>Valorosa:</strong> Permite que alunos realizem a prova pelo celular e enviem respostas manuscritas, democratizando o acesso à avaliação sem exigir computador.<br><br>
      <strong>Estimável:</strong> Upload com validação de tipo e tamanho e renderização LaTeX em mobile têm soluções conhecidas, com esforço estimável, embora o mobile-first exija atenção a testes em dispositivos.<br><br>
      <strong>Pequena:</strong> Foca na experiência de resposta e envio de anexos no mobile, sem incluir salvamento automático (US10) ou revisão final (US11), que são histórias separadas.<br><br>
      <strong>Testável:</strong> É possível verificar objetivamente se imagens são salvas corretamente, se arquivos grandes são rejeitados com mensagem adequada e se fórmulas renderizam no mobile.
    </td>
  </tr>
</table>

---

<table>
  <tr><td><strong>Número</strong></td><td>US10</td></tr>
  <tr><td><strong>Título</strong></td><td>Rascunho e salvamento durante a prova.</td></tr>
  <tr><td><strong>Persona</strong></td><td>Aluno.</td></tr>
  <tr><td><strong>História</strong></td><td>Eu, enquanto <strong>Aluno</strong>, quero ter minhas respostas salvas durante o preenchimento, para evitar perda de progresso por instabilidade, recarregamento ou queda de conexão.</td></tr>
  <tr>
    <td><strong>Critérios de Aceitação</strong></td>
    <td>
      <strong>CR-01</strong> - respostas digitadas devem ser salvas automaticamente quando houver conexão.<br><br>
      <strong>CR-02</strong> - respostas salvas devem ser restauradas após recarregamento da página.<br><br>
      <strong>CR-03</strong> - o sistema deve avisar quando houver alterações não sincronizadas antes de sair ou recarregar.<br><br>
      <strong>CR-04</strong> - ao final do tempo, o sistema deve preservar o último estado salvo.
    </td>
  </tr>
  <tr>
    <td><strong>Testes de Aceitação</strong></td>
    <td>
      <strong>Critério de aceitação: CR-01</strong><br>
      a. Aluno digita resposta com conexão ativa.<br>
      – Sistema salva automaticamente o progresso = correto.<br>
      – Sistema não salva até envio final = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-02</strong><br>
      a. Aluno recarrega a página dentro do tempo permitido.<br>
      – Respostas salvas são restauradas = correto.<br>
      – Respostas desaparecem = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-03</strong><br>
      a. Aluno tenta sair da página com alterações não sincronizadas.<br>
      – Sistema exibe aviso antes da saída = correto.<br>
      – Sistema permite sair sem aviso = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-04</strong><br>
      a. Tempo da prova termina com respostas parcialmente salvas.<br>
      – Sistema preserva o último estado salvo = correto.<br>
      – Sistema apaga respostas recentes = errado, deve ser corrigido.
    </td>
  </tr>
  <tr>
    <td><strong>Critérios INVEST</strong></td>
    <td>
      <strong>Independente:</strong> O salvamento automático é uma camada sobre a interface de resposta; pode ser desenvolvido e testado separadamente com mocks das respostas do aluno.<br><br>
      <strong>Negociável:</strong> A frequência do autosave, a estratégia de armazenamento local versus servidor e o comportamento offline são aspectos técnicos negociáveis sem alterar o valor da história.<br><br>
      <strong>Valorosa:</strong> Protege o progresso do aluno em situações de instabilidade de rede ou dispositivo, aumentando a confiabilidade da plataforma e reduzindo retrabalho em provas longas.<br><br>
      <strong>Estimável:</strong> Autosave com debounce, restore de estado por sessionStorage/servidor e interceptação de beforeunload são padrões conhecidos com esforço estimável.<br><br>
      <strong>Pequena:</strong> Cobre apenas salvamento e restauração de rascunho durante a prova, sem incluir a submissão final ou revisão, que são histórias distintas.<br><br>
      <strong>Testável:</strong> É possível verificar se respostas persistem após reload, se o aviso de saída aparece com alterações pendentes e se o estado é preservado ao fim do tempo.
    </td>
  </tr>
</table>

---

<table>
  <tr><td><strong>Número</strong></td><td>US11</td></tr>
  <tr><td><strong>Título</strong></td><td>Revisão e confirmação final de envio.</td></tr>
  <tr><td><strong>Persona</strong></td><td>Aluno.</td></tr>
  <tr><td><strong>História</strong></td><td>Eu, enquanto <strong>Aluno</strong>, quero revisar meu progresso antes do envio final, para evitar submissões incompletas ou acidentais.</td></tr>
  <tr>
    <td><strong>Critérios de Aceitação</strong></td>
    <td>
      <strong>CR-01</strong> - questões em branco devem ser destacadas na tela de revisão.<br><br>
      <strong>CR-02</strong> - o sistema deve pedir confirmação antes do envio final.<br><br>
      <strong>CR-03</strong> - após o envio, o sistema deve bloquear alterações nas respostas.<br><br>
      <strong>CR-04</strong> - após o envio, o aluno deve receber confirmação visual de submissão.
    </td>
  </tr>
  <tr>
    <td><strong>Testes de Aceitação</strong></td>
    <td>
      <strong>Critério de aceitação: CR-01</strong><br>
      a. Aluno abre revisão com questões em branco.<br>
      – Sistema destaca questões não respondidas = correto.<br>
      – Sistema não indica pendências = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-02</strong><br>
      a. Aluno clica em "Enviar prova".<br>
      – Sistema pede confirmação antes da submissão = correto.<br>
      – Sistema envia imediatamente sem confirmação = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-03</strong><br>
      a. Aluno tenta alterar resposta após envio final.<br>
      – Sistema bloqueia edição = correto.<br>
      – Sistema permite alteração = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-04</strong><br>
      a. Aluno finaliza a submissão.<br>
      – Sistema exibe confirmação visual de envio = correto.<br>
      – Sistema finaliza sem confirmação = errado, deve ser corrigido.
    </td>
  </tr>
  <tr>
    <td><strong>Critérios INVEST</strong></td>
    <td>
      <strong>Independente:</strong> A tela de revisão e confirmação é uma etapa final separada da interface de resposta (US09) e do salvamento (US10), podendo ser implementada de forma independente.<br><br>
      <strong>Negociável:</strong> O formato visual do destaque de questões em branco, o texto do modal de confirmação e o layout da tela de sucesso são detalhes negociáveis sem comprometer o objetivo.<br><br>
      <strong>Valorosa:</strong> Reduz submissões acidentais ou incompletas, aumentando a qualidade das respostas entregues e a confiança do aluno no processo avaliativo.<br><br>
      <strong>Estimável:</strong> Tela de revisão com mapeamento de questões respondidas/em branco, modal de confirmação e bloqueio pós-envio são funcionalidades de escopo claro e estimável.<br><br>
      <strong>Pequena:</strong> Cobre apenas o fluxo de revisão e envio final, sem incluir a interface de resposta ou o salvamento automático, mantendo o escopo coeso e entregável em uma sprint.<br><br>
      <strong>Testável:</strong> Todos os critérios têm comportamento binário verificável: destaque de questões em branco, exibição do modal, bloqueio de edição pós-envio e confirmação visual.
    </td>
  </tr>
</table>

---

<table>
  <tr><td><strong>Número</strong></td><td>US12</td></tr>
  <tr><td><strong>Título</strong></td><td>Correção por item.</td></tr>
  <tr><td><strong>Persona</strong></td><td>Professor.</td></tr>
  <tr><td><strong>História</strong></td><td>Eu, enquanto <strong>Professor</strong>, quero corrigir a mesma questão de todos os alunos em sequência, para aplicar critérios de avaliação com mais isonomia.</td></tr>
  <tr>
    <td><strong>Critérios de Aceitação</strong></td>
    <td>
      <strong>CR-01</strong> - o professor deve conseguir listar as respostas de uma mesma questão para todos os alunos.<br><br>
      <strong>CR-02</strong> - o professor deve atribuir nota e comentário para respostas abertas.<br><br>
      <strong>CR-03</strong> - o professor deve conseguir visualizar e ampliar anexos enviados pelo aluno.<br><br>
      <strong>CR-04</strong> - notas e comentários salvos devem permanecer disponíveis ao retornar para uma resposta.
    </td>
  </tr>
  <tr>
    <td><strong>Testes de Aceitação</strong></td>
    <td>
      <strong>Critério de aceitação: CR-01</strong><br>
      a. Professor seleciona a questão 3 de uma prova com submissões.<br>
      – Sistema lista respostas da questão 3 de todos os alunos = correto.<br>
      – Sistema mistura respostas de outras questões = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-02</strong><br>
      a. Professor atribui nota e comentário a uma resposta aberta.<br>
      – Sistema salva nota e comentário = correto.<br>
      – Sistema perde os dados após avançar = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-03</strong><br>
      a. Professor abre anexo enviado pelo aluno.<br>
      – Sistema permite ampliar a imagem = correto.<br>
      – Sistema exibe miniatura sem ampliação = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-04</strong><br>
      a. Professor avança para outra resposta e retorna à anterior.<br>
      – Nota e comentário permanecem salvos = correto.<br>
      – Nota ou comentário desaparece = errado, deve ser corrigido.
    </td>
  </tr>
  <tr>
    <td><strong>Critérios INVEST</strong></td>
    <td>
      <strong>Independente:</strong> O módulo de correção por item pode ser desenvolvido após a submissão dos alunos estar implementada, mas é independente do cálculo de notas finais (US14) e da exportação.<br><br>
      <strong>Negociável:</strong> A interface de navegação entre respostas, os campos do comentário e as opções de visualização de anexo são negociáveis sem afetar o objetivo de isonomia na correção.<br><br>
      <strong>Valorosa:</strong> Permite que o professor aplique critérios uniformes corrigindo a mesma questão de todos os alunos em sequência, aumentando a justiça e consistência da avaliação.<br><br>
      <strong>Estimável:</strong> Listagem paginada de respostas por questão, formulário de nota/comentário com persistência e visualizador de imagem são funcionalidades com complexidade estimável.<br><br>
      <strong>Pequena:</strong> Cobre apenas a correção manual de questões abertas por item, sem incluir correção automática (US13) ou exportação de resultados (US14), mantendo o escopo controlado.<br><br>
      <strong>Testável:</strong> É possível verificar se a listagem filtra corretamente por questão, se nota e comentário persistem após navegação e se anexos podem ser ampliados.
    </td>
  </tr>
</table>

---

<table>
  <tr><td><strong>Número</strong></td><td>US13</td></tr>
  <tr><td><strong>Título</strong></td><td>Correção automática de questões objetivas.</td></tr>
  <tr><td><strong>Persona</strong></td><td>Professor.</td></tr>
  <tr><td><strong>História</strong></td><td>Eu, enquanto <strong>Professor</strong>, quero ter questões objetivas corrigidas automaticamente, para reduzir esforço manual na apuração das notas.</td></tr>
  <tr>
    <td><strong>Critérios de Aceitação</strong></td>
    <td>
      <strong>CR-01</strong> - questões de múltipla escolha com gabarito devem ser corrigidas automaticamente.<br><br>
      <strong>CR-02</strong> - questões de verdadeiro/falso com gabarito devem receber pontuação automaticamente.<br><br>
      <strong>CR-03</strong> - alterações no gabarito antes da liberação das notas devem permitir recálculo dos resultados.<br><br>
      <strong>CR-04</strong> - questões discursivas devem permanecer pendentes de correção manual.
    </td>
  </tr>
  <tr>
    <td><strong>Testes de Aceitação</strong></td>
    <td>
      <strong>Critério de aceitação: CR-01</strong><br>
      a. Aluno responde corretamente uma questão de múltipla escolha.<br>
      – Sistema marca como correta e atribui pontuação = correto.<br>
      – Sistema deixa pendente de correção manual = errado, deve ser corrigido.<br><br>
      b. Aluno responde incorretamente uma questão de múltipla escolha.<br>
      – Sistema marca como incorreta = correto.<br>
      – Sistema atribui pontuação indevida = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-02</strong><br>
      a. Aluno responde corretamente uma questão verdadeiro/falso.<br>
      – Sistema atribui pontuação correspondente = correto.<br>
      – Sistema não calcula pontuação = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-03</strong><br>
      a. Professor altera o gabarito antes da liberação das notas e recalcula.<br>
      – Sistema atualiza as notas objetivas = correto.<br>
      – Sistema mantém notas antigas = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-04</strong><br>
      a. Aluno envia questão discursiva.<br>
      – Sistema mantém questão pendente de correção manual = correto.<br>
      – Sistema corrige automaticamente sem critério manual = errado, deve ser corrigido.
    </td>
  </tr>
  <tr>
    <td><strong>Critérios INVEST</strong></td>
    <td>
      <strong>Independente:</strong> A correção automática de objetivas pode ser implementada independentemente da correção manual (US12) e da exportação (US14), sendo acionada no momento da submissão.<br><br>
      <strong>Negociável:</strong> A política de pontuação parcial, o comportamento do recálculo por gabarito alterado e a forma de exibição do resultado ao professor são aspectos negociáveis.<br><br>
      <strong>Valorosa:</strong> Elimina o trabalho manual de correção de questões objetivas, acelerando a apuração de notas e permitindo ao professor focar nas questões discursivas.<br><br>
      <strong>Estimável:</strong> Comparação de resposta com gabarito e atribuição de pontuação são operações simples e bem delimitadas, com esforço facilmente estimável pelo time.<br><br>
      <strong>Pequena:</strong> Cobre apenas a correção automática de múltipla escolha e verdadeiro/falso, deixando discursivas para a história de correção manual (US12), mantendo o escopo pequeno.<br><br>
      <strong>Testável:</strong> É possível verificar objetivamente se respostas corretas recebem pontuação, incorretas não recebem, e se o recálculo após mudança de gabarito atualiza as notas.
    </td>
  </tr>
</table>

---

<table>
  <tr><td><strong>Número</strong></td><td>US14</td></tr>
  <tr><td><strong>Título</strong></td><td>Cálculo de notas e exportação de resultados.</td></tr>
  <tr><td><strong>Persona</strong></td><td>Coordenador.</td></tr>
  <tr><td><strong>História</strong></td><td>Eu, enquanto <strong>Coordenador</strong>, quero visualizar e exportar notas por aluno e por questão, para consolidar os resultados do processo seletivo.</td></tr>
  <tr>
    <td><strong>Critérios de Aceitação</strong></td>
    <td>
      <strong>CR-01</strong> - quando todas as questões estiverem corrigidas, o sistema deve exibir a nota total de cada aluno.<br><br>
      <strong>CR-02</strong> - a exportação para Excel deve conter alunos nas linhas e questões/notas nas colunas.<br><br>
      <strong>CR-03</strong> - anexos enviados devem poder ser exportados em pacote organizado por prova, aluno e questão.<br><br>
      <strong>CR-04</strong> - o sistema deve alertar sobre pendências antes da exportação do resultado final.
    </td>
  </tr>
  <tr>
    <td><strong>Testes de Aceitação</strong></td>
    <td>
      <strong>Critério de aceitação: CR-01</strong><br>
      a. Coordenador acessa resultados de prova totalmente corrigida.<br>
      – Sistema exibe nota total de cada aluno = correto.<br>
      – Sistema não calcula nota total = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-02</strong><br>
      a. Coordenador exporta resultados para Excel.<br>
      – Planilha contém alunos nas linhas e questões/notas nas colunas = correto.<br>
      – Planilha sai sem estrutura por aluno e questão = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-03</strong><br>
      a. Coordenador solicita exportação de anexos.<br>
      – Sistema gera pacote organizado por prova, aluno e questão = correto.<br>
      – Sistema exporta anexos sem organização = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-04</strong><br>
      a. Coordenador tenta exportar resultado final com questões pendentes.<br>
      – Sistema alerta sobre pendências = correto.<br>
      – Sistema exporta como se estivesse completo = errado, deve ser corrigido.
    </td>
  </tr>
  <tr>
    <td><strong>Critérios INVEST</strong></td>
    <td>
      <strong>Independente:</strong> O módulo de cálculo e exportação depende que as correções (US12 e US13) estejam concluídas, mas pode ser desenvolvido em paralelo usando dados mockados de notas.<br><br>
      <strong>Negociável:</strong> O formato da planilha Excel, a estrutura do pacote de anexos e o formato do alerta de pendências são detalhes negociáveis sem impactar o objetivo de consolidação dos resultados.<br><br>
      <strong>Valorosa:</strong> Entrega ao coordenador a visão consolidada dos resultados do processo seletivo em formato exportável, viabilizando a tomada de decisão com base em dados estruturados.<br><br>
      <strong>Estimável:</strong> Soma de notas por aluno, geração de planilha Excel e compactação de anexos em pacote organizado são operações com bibliotecas maduras e esforço estimável.<br><br>
      <strong>Pequena:</strong> Cobre visualização de nota total e exportação de resultados e anexos, sem incluir a liberação de resultados por e-mail (US15) ou analytics (US16), que são histórias separadas.<br><br>
      <strong>Testável:</strong> É possível verificar se a nota total é calculada corretamente, se a planilha segue a estrutura definida, se o pacote de anexos está organizado e se o alerta de pendências é exibido.
    </td>
  </tr>
</table>

---

<table>
  <tr><td><strong>Número</strong></td><td>US15</td></tr>
  <tr><td><strong>Título</strong></td><td>Liberação de resultados por e-mail.</td></tr>
  <tr><td><strong>Persona</strong></td><td>Professor ou Coordenador.</td></tr>
  <tr><td><strong>História</strong></td><td>Eu, enquanto <strong>Professor ou Coordenador</strong>, quero liberar individualmente os resultados por e-mail, para comunicar os candidatos somente quando as notas estiverem validadas.</td></tr>
  <tr>
    <td><strong>Critérios de Aceitação</strong></td>
    <td>
      <strong>CR-01</strong> - o sistema deve enviar e-mail individual para cada aluno ao liberar notas.<br><br>
      <strong>CR-02</strong> - o sistema deve bloquear ou pedir confirmação explícita quando houver notas pendentes.<br><br>
      <strong>CR-03</strong> - o sistema deve registrar data, horário e status de cada envio.<br><br>
      <strong>CR-04</strong> - o sistema deve permitir nova tentativa quando um envio falhar.
    </td>
  </tr>
  <tr>
    <td><strong>Testes de Aceitação</strong></td>
    <td>
      <strong>Critério de aceitação: CR-01</strong><br>
      a. Coordenador libera notas calculadas.<br>
      – Sistema envia e-mail individual para cada aluno = correto.<br>
      – Sistema não envia os e-mails = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-02</strong><br>
      a. Coordenador tenta liberar notas com correções pendentes.<br>
      – Sistema bloqueia ou pede confirmação explícita = correto.<br>
      – Sistema libera automaticamente sem aviso = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-03</strong><br>
      a. Coordenador acessa histórico após envio de e-mails.<br>
      – Sistema exibe data, horário e status do envio = correto.<br>
      – Sistema não registra histórico = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-04</strong><br>
      a. Um e-mail falha durante o envio.<br>
      – Sistema permite nova tentativa para aquele aluno = correto.<br>
      – Sistema não permite reenviar = errado, deve ser corrigido.
    </td>
  </tr>
  <tr>
    <td><strong>Critérios INVEST</strong></td>
    <td>
      <strong>Independente:</strong> O envio de e-mails pode ser desenvolvido com um serviço de e-mail transacional independente (ex.: SendGrid, SES), sem depender da interface de correção ou exportação.<br><br>
      <strong>Negociável:</strong> O template do e-mail, o conteúdo exibido ao aluno (nota total, detalhamento por questão) e o comportamento de retry são negociáveis conforme requisitos de comunicação.<br><br>
      <strong>Valorosa:</strong> Garante que os candidatos recebam seus resultados de forma controlada e individual, somente após validação, preservando a integridade do processo seletivo.<br><br>
      <strong>Estimável:</strong> Envio de e-mail transacional com log de status e mecanismo de reenvio são padrões com bibliotecas e serviços consolidados, tornando a história estimável.<br><br>
      <strong>Pequena:</strong> Cobre apenas o disparo dos e-mails de resultado e o registro de envios, sem incluir a geração dos resultados (US14) ou os analytics da prova (US16).<br><br>
      <strong>Testável:</strong> É possível verificar se e-mails individuais são enviados, se o bloqueio com pendências funciona, se o histórico registra data/horário/status e se o reenvio está disponível após falha.
    </td>
  </tr>
</table>

---

<table>
  <tr><td><strong>Número</strong></td><td>US16</td></tr>
  <tr><td><strong>Título</strong></td><td>Logs e analytics da avaliação.</td></tr>
  <tr><td><strong>Persona</strong></td><td>Coordenador.</td></tr>
  <tr><td><strong>História</strong></td><td>Eu, enquanto <strong>Coordenador</strong>, quero acompanhar logs e métricas da prova, para monitorar participação, desempenho e possíveis problemas operacionais.</td></tr>
  <tr>
    <td><strong>Critérios de Aceitação</strong></td>
    <td>
      <strong>CR-01</strong> - o painel deve exibir quantidade de acessos, inícios e envios por prova.<br><br>
      <strong>CR-02</strong> - o sistema deve registrar o tempo de resposta por questão.<br><br>
      <strong>CR-03</strong> - o sistema deve calcular porcentagem de acerto por questão do banco.<br><br>
      <strong>CR-04</strong> - erros de upload, submissão ou acesso devem gerar logs com data e contexto mínimo.
    </td>
  </tr>
  <tr>
    <td><strong>Testes de Aceitação</strong></td>
    <td>
      <strong>Critério de aceitação: CR-01</strong><br>
      a. Coordenador acessa painel de uma prova com alunos ativos.<br>
      – Sistema exibe acessos, inícios e envios = correto.<br>
      – Sistema não exibe métricas de participação = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-02</strong><br>
      a. Aluno responde uma questão durante a prova.<br>
      – Sistema registra tempo de resposta da questão = correto.<br>
      – Sistema não registra tempo = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-03</strong><br>
      a. Questão do banco é usada em uma prova com resultados.<br>
      – Sistema calcula porcentagem de acerto da questão = correto.<br>
      – Sistema não calcula desempenho por questão = errado, deve ser corrigido.<br><br>
      <strong>Critério de aceitação: CR-04</strong><br>
      a. Ocorre erro de upload durante a prova.<br>
      – Sistema registra log com data e contexto mínimo = correto.<br>
      – Sistema ignora o erro sem registro = errado, deve ser corrigido.
    </td>
  </tr>
  <tr>
    <td><strong>Critérios INVEST</strong></td>
    <td>
      <strong>Independente:</strong> O painel de logs e analytics pode ser desenvolvido após as histórias de participação do aluno estarem em produção, consumindo dados já registrados, sem bloquear outras entregas.<br><br>
      <strong>Negociável:</strong> As métricas exibidas, a granularidade dos logs de erro e o formato do painel (gráficos, tabelas) são negociáveis conforme prioridade do coordenador e capacidade do time.<br><br>
      <strong>Valorosa:</strong> Fornece ao coordenador visibilidade operacional e pedagógica da prova, permitindo identificar problemas técnicos e analisar o desempenho dos candidatos por questão.<br><br>
      <strong>Estimável:</strong> Contadores de acesso/início/envio, registro de tempo por questão e cálculo de porcentagem de acerto são operações analíticas com complexidade bem definida e estimável.<br><br>
      <strong>Pequena:</strong> Cobre métricas de participação, tempo de resposta, acerto por questão e logs de erro, sem incluir relatórios avançados ou exportação analítica, mantendo o escopo manejável.<br><br>
      <strong>Testável:</strong> É possível verificar se os contadores refletem eventos reais, se o tempo de resposta é registrado por questão, se a porcentagem de acerto é calculada corretamente e se erros geram logs com data e contexto.
    </td>
  </tr>
</table>

# <a name="c3"></a>3. Projeto da Aplicação Web (sprints 1 a 5)

## 3.1. Requisitos do Sistema (sprints 1 a 5)

#### Minimundo do Sistema

Identificou-se que o processo de correção de provas do Instituto Ponte é informal e descentralizado: as provas são enviadas por WhatsApp ou e-mail, as resoluções manuscritas são fotografadas pelos alunos e devolvidas pelos mesmos canais, e a correção é realizada prova a prova, sem isonomia entre questões. Isso resulta em perda de anexos, dificuldade de renderização de equações matemáticas, sobrecarga operacional dos professores e inconsistência nos critérios de correção aplicados aos alunos.

&emsp;Para resolver esse problema, desenvolveu-se uma aplicação web centralizada de gestão de avaliações remotas. A plataforma atende três perfis de usuário, com responsabilidades e permissões distintas.

&emsp;O **aluno** acessa a prova por link único, identificando-se por nome, CPF e e-mail, aceita os Termos de Uso e Política de Privacidade conforme a LGPD, responde questões objetivas e discursivas ou realiza upload de imagens de resoluções manuscritas, e consulta o feedback individual após a correção.

&emsp;O **professor** autentica-se via OAuth2 Google, cria provas com suporte a fórmulas matemáticas em LaTeX e timer opcional, reutiliza questões de um banco centralizado, gera links e QR Codes de acesso, corrige respostas agrupadas por questão para todos os alunos (correção isonômica), e acessa relatórios de desempenho e histórico de provas.

&emsp;O **coordenador**, também autenticado via OAuth2 Google, visualiza relatórios e histórico de provas de todos os professores, organizados por disciplina e período, monitora métricas de participação e desempenho, e exporta resultados em planilhas Excel — sem permissão para criar ou corrigir avaliações.

### 3.1.1. Requisitos Funcionais (sprint 1, refinar até sprint 5)

| ID | Descrição | Prioridade | Status |
|---|---|---|---|
| RF001 | O sistema deve permitir ao professor gerenciar provas em diferentes estados: rascunho, publicada, encerrada e antiga. | Alta | Planejado |
| RF002 | O sistema deve autenticar professores e coordenadores via OAuth2 Google, validando o e-mail na lista de usuários autorizados e redirecionando para o painel correspondente ao perfil. | Alta | Planejado |
| RF003 | O sistema deve manter um banco de questões pesquisável por disciplina, tema e tipo. | Alta | Planejado |
| RF004 | O sistema deve permitir a inserção de enunciados com suporte nativo a fórmulas matemáticas via LaTeX, renderizadas por KaTeX ou MathJax. | Alta | Planejado |
| RF005 | O sistema deve suportar questões de múltipla escolha, Verdadeiro/Falso (V/F) e questões discursivas. | Alta | Planejado |
| RF006 | O professor deve poder habilitar a opção para que o aluno envie fotos de resoluções manuscritas em questões específicas. | Alta | Planejado |
| RF007 | O sistema deve permitir a definição de limites de tempo (duração), datas e horários de início e término da prova. | Alta | Planejado |
| RF008 | O sistema deve gerar URLs únicas e QR Codes para o acesso dos alunos às provas. | Alta | Planejado |
| RF009 | O sistema deve realizar a identificação do aluno apenas por nome, e-mail e CPF, sem exigência de senhas complexas. | Alta | Planejado |
| RF010 | O sistema deve permitir que o aluno aplique zoom em imagens contidas nos enunciados para melhor visualização. | Alta | Planejado |
| RF011 | O ambiente do aluno deve renderizar fórmulas matemáticas de forma legível em qualquer dispositivo. | Alta | Planejado |
| RF012 | O aluno deve conseguir realizar o upload de múltiplas imagens ou arquivos por questão. | Alta | Planejado |
| RF013 | O sistema deve realizar a compressão de imagens no lado do cliente (client-side) antes do upload. | Alta | Planejado |
| RF014 | O sistema deve permitir a correção isonômica, corrigindo a mesma questão de todos os alunos em sequência. | Alta | Planejado |
| RF015 | O sistema deve disponibilizar campos para atribuição de notas e comentários diretamente na resposta. | Alta | Planejado |
| RF016 | O sistema deve oferecer uma galeria para ampliação instantânea das fotos enviadas durante a correção. | Alta | Planejado |
| RF017 | O sistema deve gerar planilhas em Excel com os resultados detalhados por aluno e por questão. | Alta | Planejado |
| RF018 | O coordenador deve ter acesso a um painel para visualizar todas as provas criadas por qualquer professor. | Alta | Planejado |
| RF019 | O coordenador deve ser capaz de gerar e visualizar relatórios de desempenho e estatísticas globais. | Alta | Planejado |
| RF020 | O coordenador deve conseguir monitorar e filtrar o status de todas as provas do instituto. | Alta | Planejado |
| RF021 | O sistema deve permitir ao professor as funções de criar, editar e excluir avaliações (CRUD completo). | Alta | Planejado |
| RF022 | O sistema deve permitir a filtragem de avaliações por turma, semestre, disciplina ou nome do professor. | Média | Planejado |
| RF023 | O sistema deve oferecer opções para embaralhar automaticamente a ordem das questões e das alternativas. | Média | Planejado |
| RF024 | O sistema deve exibir um portal de instruções com regras, duração e prazos antes do início da avaliação. | Média | Planejado |
| RF025 | O sistema deve permitir que o aluno escolha exibir ou ocultar o cronômetro (timer) de tempo restante. | Média | Planejado |
| RF026 | O sistema deve exibir avisos de questões em branco e um resumo de progresso antes do envio final. | Média | Planejado |
| RF027 | O sistema deve ser capaz de enviar o resultado individual e o feedback para o e-mail do aluno. | Média | Planejado |
| RF028 | O sistema deve permitir a exportação de todos os anexos enviados para armazenamento local ou em nuvem. | Baixa | Planejado |

### 3.1.2. Regras de Negócio (sprint 1, refinar até sprint 5)

| ID   | Descrição | RF associado |
|------|-----------|--------------|
| RN01 | O sistema deve gerenciar provas em estados válidos (rascunho, publicada, encerrada, antiga), impedindo edição quando encerradas ou antigas e permitindo filtragem por status. | RF001, RF020 |
| RN02 | O sistema deve permitir aplicação de filtros combinados (turma, semestre, disciplina, professor), retornando apenas resultados que atendam a todos os critérios. | RF022 |
| RN03 | O sistema deve garantir a correta criação de questões, incluindo tipo válido, validação de alternativas e renderização de fórmulas matemáticas. | RF004, RF005 |
| RN04 | O sistema deve controlar o envio de arquivos, permitindo upload apenas quando habilitado, aceitando formatos válidos, múltiplos arquivos por questão e mantendo vínculo correto. | RF006, RF012 |
| RN05 | O sistema deve controlar o tempo e acesso à prova, impedindo início fora do período, encerrando automaticamente ao término e respeitando configurações definidas. | RF007 |
| RN06 | O sistema deve aplicar corretamente o embaralhamento de questões e alternativas quando configurado. | RF023 |
| RN07 | Cada prova deve possuir acesso único por meio de URL e QR Code vinculados. | RF008 |
| RN08 | O sistema deve identificar o aluno por nome, e-mail e CPF, impedindo múltiplas submissões para a mesma prova. | RF009 |
| RN09 | O sistema deve exibir instruções obrigatórias antes do início e permitir controle de exibição do cronômetro durante a prova. | RF024, RF025 |
| RN10 | O sistema deve garantir a correta visualização de conteúdo, incluindo renderização de fórmulas e ampliação de imagens sem perda relevante de qualidade. | RF010, RF011 |
| RN11 | O sistema deve otimizar o envio de imagens, aplicando compressão sem comprometer a legibilidade. | RF013 |
| RN12 | O sistema deve validar a submissão da prova, alertando sobre questões em branco antes do envio final. | RF026 |
| RN13 | O sistema deve permitir correção por questão, com atribuição de notas e comentários e visualização adequada dos anexos. | RF014, RF015, RF016 |
| RN14 | O sistema deve processar e disponibilizar resultados, incluindo cálculo automático de notas e geração de relatórios estruturados. | RF017 |
| RN15 | O sistema deve controlar a divulgação de resultados e feedbacks aos alunos após finalização da correção. | RF027 |
| RN16 | O sistema deve garantir integridade na exportação de anexos, mantendo correspondência com aluno e questão. | RF028 |
| RN17 | O sistema deve permitir ao coordenador visualizar, filtrar e gerar relatórios sobre todas as provas do sistema. | RF018, RF019 |
| RN18 | Somente usuários com perfil Professor, autenticados via OAuth2, podem criar, editar e excluir avaliações. Coordenadores têm acesso somente de leitura a todas as provas e relatórios. Alunos não têm acesso a nenhum painel de gestão. A verificação de autorização deve ocorrer no backend em todas as rotas protegidas. | RF021, RF002 |
| RN19 | O sistema deve verificar se o e-mail retornado pelo Google OAuth2 consta na lista de usuários autorizados antes de criar a sessão. Caso o e-mail não esteja autorizado, o acesso deve ser negado com mensagem informativa. A sessão deve expirar após período de inatividade, bloqueando o acesso a páginas protegidas. | RF002 |
| RN20 | O sistema deve permitir ao professor buscar questões no banco por disciplina, tema e tipo, exibindo apenas questões compatíveis com os critérios informados. Questões selecionadas devem ser vinculadas ao editor da prova em edição sem duplicação no banco. | RF003 |

### 3.1.3. Requisitos Não Funcionais — 8 Eixos ISO/IEC 25010 (sprints 1 a 5)


| Eixo                     | Requisito | Métrica / Critério | Como atendido |
|--------------------------|-----------|--------------------|---------------|
| USAB — Usabilidade       | O sistema deve ser utilizável em dispositivos móveis e de fácil compreensão para alunos com baixo letramento digital, observando diretrizes de acessibilidade. | Interface funcional em telas ≥ 360px; ≥ 90% dos usuários conseguem iniciar a prova sem auxílio em testes com perfis de baixo letramento digital; conformidade parcial com WCAG 2.1 nível AA para elementos críticos do fluxo do aluno. | Design responsivo, interface simplificada com fluxo de no máximo 3 passos até iniciar a prova, e contraste de cores conforme WCAG 2.1. |
| CONF — Confiabilidade    | O sistema deve garantir a integridade das respostas e arquivos enviados. | 100% das submissões confirmadas armazenadas; taxa de falha < 2%. | Salvamento automático de progresso (US10), confirmação visual de envio (US11), persistência transacional em banco e validação de integridade na exportação de anexos (RN16). |
| DES — Desempenho         | O sistema deve responder de forma eficiente às ações principais do usuário, mesmo em conexões de baixa velocidade. | Endpoints de leitura (listagem de provas, questões) respondem em p95 < 500ms com até 200 registros; endpoints de escrita (submissão de prova) confirmam persistência em p95 < 1s; uploads de imagem processados com compressão client-side antes do envio. | Otimização de requisições, compressão de imagens client-side e cache de respostas frequentes. |
| SUP — Suportabilidade    | O sistema deve permitir manutenção e evolução contínua ao longo das sprints, com cobertura de testes que proteja funcionalidades existentes contra regressões. | Cobertura de testes automatizados ≥ 60% nas camadas de serviço ao final da Sprint 4; tempo de onboarding de novo desenvolvedor ≤ 2h seguindo o README; nenhuma alteração em sprint posterior deve quebrar testes existentes aprovados. | Arquitetura modular em camadas (Controller/Service/Repository), versionamento Git com branches por funcionalidade e suite de testes Jest. |
| SEG — Segurança          | O sistema deve restringir o acesso às provas, proteger dados pessoais dos alunos (CPF, e-mail) em conformidade com a LGPD, e validar todos os dados de entrada. | Acesso de alunos apenas via link UUID válido; 100% dos inputs validados no backend; tráfego obrigatoriamente via HTTPS; dados pessoais não armazenados em texto plano; consentimento LGPD registrado com timestamp por aluno. | URLs únicas por UUID, validação backend em todas as rotas, HTTPS obrigatório, hash de dados sensíveis e registro de consentimento explícito. |
| CAP — Capacidade         | O sistema deve suportar múltiplos usuários simultâneos sem falhas. | Suportar ≥ 50 usuários simultâneos em testes iniciais; taxa de erros 5xx < 1% e p95 < 1s sob essa carga. | Arquitetura Node.js com I/O não-bloqueante; uploads com compressão client-side reduzem carga no servidor; testável com k6 ou Artillery. |
| REST — Restrições Design | O sistema deve seguir as restrições definidas pelo projeto. | Ausência de sistema de login/senha para alunos; ausência de chamadas a WebAPIs externas não autorizadas; verificável por revisão de código. | Fluxo do aluno via link UUID sem senha; OAuth2 apenas para usuários internos; nenhuma dependência de API externa no package.json além das bibliotecas autorizadas (KaTeX, MathJax). |
| ORG — Organizacionais    | O sistema deve ser documentado e entregável de forma reproduzível, com README atualizado a cada sprint e instruções de instalação executáveis em ambiente limpo. | README com instruções de instalação executáveis em ambiente limpo Ubuntu/Node.js sem etapas adicionais; documentação sincronizada com o código a cada sprint; todas as variáveis de ambiente externalizadas em `.env.example`. | Documentação versionada junto ao código, variáveis de ambiente separadas e README com passo a passo de instalação verificado por membro externo ao time. |

---

#### Explicação dos Requisitos Não Funcionais

#### USAB — Usabilidade
&emsp;Este requisito foi derivado diretamente do perfil de Edgar Romeo (persona do aluno), que possui baixo letramento digital e utiliza dispositivos com telas pequenas. A conformidade parcial com WCAG 2.1 AA garante acessibilidade mínima para usuários com necessidades especiais, alinhando-se ao compromisso institucional do Instituto Ponte com a inclusão.  
Relaciona-se com RF008 (acesso via link único), RF024 (portal inicial de instruções) e RF011 (renderização de fórmulas em mobile).  
**Mensurabilidade:** testes de usabilidade com 5 usuários do perfil-alvo, registrando taxa de conclusão sem auxílio.  
**Conexão com contexto do parceiro:** alunos em 18 estados com condições heterogêneas de acesso exigem interface mínima e robusta.  
**Critério de aceite:** ≥ 90% dos participantes do teste iniciam a prova sem assistência técnica.

---

#### CONF — Confiabilidade
&emsp;Este requisito deriva diretamente do problema central do parceiro: no processo atual, respostas e arquivos são perdidos ao serem trocados por WhatsApp e e-mail — exatamente o problema que a solução se propõe a eliminar. A confiabilidade não é apenas um requisito técnico; é o compromisso mais fundamental da plataforma com os alunos e professores do Instituto Ponte.  
Relaciona-se com RF012 (upload de múltiplas imagens), RF013 (compressão client-side), RF017 (geração de planilhas de resultados) e com o critério de aceite CR-01 da US10 (salvamento automático).  
**Mensurabilidade:** log de submissões comparado ao banco de dados após testes de carga; taxa de falha calculada como (submissões perdidas / submissões confirmadas) × 100.  
**Conexão com contexto do parceiro:** perda de provas em processo seletivo tem impacto direto na vida dos estudantes atendidos — nenhuma submissão confirmada pode ser descartada.  
**Critério de aceite:** taxa de falha < 2% em testes com 50 submissões simultâneas; 100% das submissões com confirmação visual armazenadas no banco.

---

#### DES — Desempenho
&emsp;Este requisito deriva diretamente do contexto do parceiro: alunos em situação de vulnerabilidade social com frequência utilizam conexões instáveis ou de baixa largura de banda. A métrica de p95 < 500ms para leituras e < 1s para escritas é mensurável por ferramentas de teste de carga (ex.: k6, Artillery) e alinhada com padrões de qualidade de APIs REST.  
Relaciona-se com RF012 (upload de imagens) e RF013 (compressão client-side).  
**Mensurabilidade:** testável por ferramentas de carga com relatório de percentis.  
**Conexão com RF:** RF013 (compressão client-side) é o principal mecanismo de atendimento a este RNF.  
**Critério de aceite:** em teste com carga de 50 usuários simultâneos, 95% das requisições de leitura completam em < 500ms.

---

#### SUP — Suportabilidade
&emsp;Este requisito reflete a necessidade de evolução contínua do sistema ao longo de 5 sprints com times rotativos de desenvolvimento. A métrica de cobertura de testes ≥ 60% nas camadas de serviço garante proteção contra regressões, enquanto o critério de onboarding em ≤ 2h é verificável por qualquer membro novo do grupo.  
Relaciona-se com todos os RF, pois impacta a manutenibilidade geral da base de código.  
**Mensurabilidade:** relatório de cobertura Jest (comando `jest --coverage`) e registro de tempo de setup por novo colaborador.  
**Conexão com restrição organizacional:** o projeto será mantido por estudantes de semestres distintos — simplicidade de setup é essencial.  
**Critério de aceite:** `npm install && npm start` executa o projeto sem erros em ambiente limpo com Node.js LTS.

---

#### SEG — Segurança
&emsp;Este requisito foi derivado de duas fontes: (a) a restrição do TAPI quanto à ausência de login/senha para alunos, que exige controle de acesso alternativo via link UUID; e (b) a coleta de dados pessoais (CPF, e-mail) dos alunos, que impõe conformidade obrigatória com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018).  
Relaciona-se com RF008 (URL única), RF009 (identificação do aluno), RF002 (OAuth2 para usuários internos) e com o critério de aceite CR-04 da US08 (consentimento LGPD).  
**Mensurabilidade:** auditoria de código para verificação de HTTPS, ausência de dados em texto plano e presença de registro de consentimento.  
**Critério de aceite:** nenhum dado pessoal armazenado em texto plano; consentimento LGPD registrado com timestamp; acesso ao painel interno apenas via sessão autenticada por OAuth2.

---

#### CAP — Capacidade
&emsp;Este requisito foi derivado do contexto operacional do Instituto Ponte: 440 alunos distribuídos em 18 estados podem realizar provas em janelas de tempo sobrepostas, gerando acessos simultâneos ao sistema. A métrica de 50 usuários simultâneos representa o cenário realista de uma aplicação de prova de processo seletivo, testável por ferramentas como k6 ou Artillery.  
Relaciona-se com RF007 (controle de tempo de prova) e RF012 (uploads simultâneos de imagens).  
**Mensurabilidade:** teste de carga com 50 usuários virtuais simultâneos, verificando ausência de erros 5xx e tempo de resposta dentro dos limites do eixo DES.  
**Conexão com contexto do parceiro:** o sistema precisa suportar todos os candidatos de uma turma realizando o processo seletivo ao mesmo tempo.  
**Critério de aceite:** o sistema permanece funcional com taxa de erros < 1% e p95 < 1s sob carga de 50 usuários simultâneos.

---

#### REST — Restrições de Design
&emsp;Este requisito deriva diretamente das restrições impostas pelo TAPI: ausência de sistema de login/senha para alunos e ausência de integração com WebAPIs externas (como Canvas ou Google Drive). Essas restrições foram definidas pelo parceiro para garantir simplicidade de acesso e controle total do código pelo time de desenvolvimento, sem dependências externas que possam introduzir falhas ou custos adicionais.  
Relaciona-se com toda a arquitetura do sistema, especialmente com RF002 (OAuth2 apenas para usuários internos), RF008 (link único para alunos) e RF009 (identificação sem senha).  
**Mensurabilidade:** verificação binária — o sistema não pode conter chamadas a WebAPIs externas não autorizadas; o acesso do aluno não pode exigir senha.  
**Conexão com restrição do parceiro:** explicitado no TAPI como "Restrições / O Projeto Não Contempla" (INSTITUTO PONTE, 2024).  
**Critério de aceite:** revisão de código confirma ausência de dependências externas não autorizadas; fluxo do aluno não exige criação de conta ou senha.

---

#### ORG — Organizacionais
&emsp;Este requisito foi derivado da necessidade do parceiro de receber uma solução documentada, reproduzível e mantida mesmo após o encerramento do projeto acadêmico. Ao contrário dos demais RNFs, este foca na documentação e entregabilidade do sistema como artefato, não apenas no seu comportamento em execução.  
Conecta-se ao processo de desenvolvimento e à sustentabilidade do sistema como produto entregue ao Instituto Ponte.  
**Mensurabilidade:** verificação do README por membro externo ao time, lista de variáveis de ambiente documentadas e histórico de commits no repositório.  
**Restrição organizacional do parceiro:** o Instituto Ponte não possui equipe técnica interna — a documentação precisa ser suficiente para onboarding de um fornecedor externo futuro.  
**Critério de aceite:** README atualizado a cada sprint; instalação reproduzível em ambiente limpo; variáveis de ambiente separadas em `.env.example`.


### 3.1.4. Matriz RF → RN → Endpoint (sprints 3 a 5)

Esta matriz foi atualizada conforme o estado atual da implementação. O backend já possui servidor Fastify, Swagger UI em `/docs`, conexão PostgreSQL e migration com tabelas, enums, índices, triggers e políticas RLS.

| RF | RN associadas | Endpoint previsto | Método | Situação atual |
|----|---------------|-------------------|--------|----------------|
| RF001 | RN01 | `/provas` | GET | Não implementado; suporte parcial no banco por `prova.status` e `prova_status` |
| RF002 | RN18, RN19 | `/auth/google`, `/auth/callback`, `/auth/session` | GET, GET, GET | Não implementado; suporte parcial no banco por `auth_user_id`, funções `auth_*` e RLS |
| RF003 | RN20 | `/questoes` | GET | Não implementado; suporte no banco por `questao`, `tema`, `materia` e índices |
| RF004 | RN03 | `/questoes` | POST, PATCH | Não implementado; suporte no banco por `enunciado.conteudo_latex` |
| RF005 | RN03 | `/questoes` | POST, PATCH | Não implementado; suporte no banco por enum `questao_tipo` |
| RF006 | RN04 | `/questoes/{id}` | PATCH | Não implementado; suporte no banco por `questao.permite_anexo` |
| RF007 | RN05 | `/provas/{id}/configuracoes` | PATCH | Não implementado; suporte no banco por `tempo_limite_min`, `data_inicio` e `data_fim` |
| RF008 | RN07 | `/provas/{id}/publicar` | POST | Não implementado; suporte no banco por `url_acesso`, `qr_code` e trigger de QR Code |
| RF009 | RN08 | `/public/provas/{token}/identificacao` | POST | Não implementado; suporte no banco por `aluno` e `prova_aluno` |
| RF010 | RN10 | Sem endpoint próprio | N/A | Recurso de frontend; não implementado no código atual |
| RF011 | RN10 | Sem endpoint próprio | N/A | Recurso de frontend; não implementado no código atual |
| RF012 | RN04 | `/respostas/{id}/anexos` | POST, GET | Não implementado; suporte no banco por `resposta_anexo` |
| RF013 | RN11 | Sem endpoint próprio | N/A | Recurso client-side; não implementado no código atual |
| RF014 | RN13 | `/provas/{id}/correcao/questoes/{questaoId}` | GET | Não implementado; suporte parcial no banco por `resposta_aluno` e `correcao` |
| RF015 | RN13 | `/respostas/{id}/correcao` | POST, PATCH | Não implementado; suporte no banco por `correcao` e `feedback` |
| RF016 | RN13 | `/respostas/{id}/anexos` | GET | Não implementado; suporte no banco por `resposta_anexo` |
| RF017 | RN14 | `/provas/{id}/resultados/exportacao` | POST, GET | Não implementado; suporte no banco por `resultado_aluno`, `relatorio` e `exportacao_resultado` |
| RF018 | RN17 | `/coordenador/provas` | GET | Não implementado; suporte parcial via RLS para coordenador |
| RF019 | RN17 | `/coordenador/relatorios`, `/coordenador/analytics` | GET, GET | Não implementado; suporte no banco por `relatorio` e `avaliacao_log` |
| RF020 | RN01 | `/coordenador/provas?status=` | GET | Não implementado; suporte no banco por índice `prova_status_index` |
| RF021 | RN18 | `/provas`, `/provas/{id}` | POST, PATCH, DELETE | Não implementado; suporte no banco por tabela `prova`, FKs e RLS |
| RF022 | RN02 | `/provas?turma=&semestre=&materiaId=&professorId=` | GET | Não implementado; suporte no banco por índice `prova_filtros_index` |
| RF023 | RN06 | `/provas/{id}/configuracoes` | PATCH | Não implementado; suporte no banco por `embaralhar_questoes` e `embaralhar_alternativas` |
| RF024 | RN09 | `/public/provas/{token}` | GET | Não implementado; suporte parcial no banco por `prova.instrucoes` e políticas `anon` |
| RF025 | RN09 | Sem endpoint próprio | N/A | Recurso de frontend; não implementado no código atual |
| RF026 | RN12 | `/provas-aluno/{id}/revisao`, `/provas-aluno/{id}/envio-final` | GET, POST | Não implementado; suporte no banco por `prova_aluno` e `resposta_aluno` |
| RF027 | RN15 | `/provas/{id}/resultados/liberacao-email` | POST | Não implementado; suporte no banco por `email_envio` |
| RF028 | RN16 | `/provas/{id}/anexos/exportacao` | POST, GET | Não implementado; suporte no banco por `exportacao_resultado` e `resposta_anexo` |

## 3.2. Arquitetura (sprints 1 a 5)

### 3.2.1. Diagrama de Arquitetura (sprints 3 e 4)

O servidor do projeto adota uma Arquitetura em Camadas no estilo Controller-Service-Repository. Essa organização separa claramente as responsabilidades de entrada HTTP, lógica de negócio e acesso a dados, tornando o sistema mais modular, testável e fácil de manter.

#### a) Controllers (Ponto de entrada HTTP)

Os controllers recebem as requisições, validam parâmetros básicos, tratam exceções e retornam respostas HTTP.

- `src/backend/dist/routes/questoes.routes.js`
  - `questoesRoutes(app)` — registra a rota POST `/provas/:provaId/questoes` e encaminha a requisição ao controller.
- `src/backend/dist/controllers/questoes.controller.js`
  - `QuestoesController.criarQuestao(request, reply)` — valida campos obrigatórios (`tipo`, `enunciado`), chama o service responsável pela criação da questão e devolve o resultado ou erro apropriado.

#### b) Services (Lógica de negócio)

Os services contêm regras de negócio, validações de domínio e orquestram chamadas aos repositories.

- `src/backend/dist/services/questoes.service.js`
  - `QuestoesService.criarQuestao(input)` — valida o tipo da questão, o enunciado, a pontuação máxima e as alternativas; verifica se a prova existe e está em estado `rascunho`; transforma o tipo para uso no banco e delega a persistência ao repository.
  - `QuestoesService.validarAlternativas(tipo, alternativas)` — valida o conjunto de alternativas para questões objetivas, garantindo pelo menos duas opções e exatamente uma correta.
  - `AppError` — classe de exceção de domínio usada para propagar erros de validação com códigos HTTP específicos.

#### c) Repositories (Persistência de dados)

Os repositories encapsulam as consultas SQL e as transações no banco PostgreSQL.

- `src/backend/dist/repositories/questoes.repository.js`
  - `QuestoesRepository.findProvaById(provaId)` — busca a prova pelo ID.
  - `QuestoesRepository.criarQuestao(input)` — inicia uma transação, busca a prova com lock, insere a questão, o enunciado e as alternativas, associa a questão à prova e finaliza a transação.
  - `QuestoesRepository.findProvaByIdForUpdate(client, provaId)` — busca a prova com `FOR UPDATE` para evitar condições de concorrência.
  - `QuestoesRepository.nextOrdemOriginal(client, provaId)` — calcula a próxima ordem original da questão na prova.
  - `QuestoesRepository.insertAlternativas(client, questaoId, input)` — insere alternativas e ajusta o modo de replicação quando necessário.

#### d) Modelo de dados

A camada de dados é representada pelas tabelas consultadas no banco PostgreSQL. As principais entidades envolvidas são:

- `prova`
- `questao`
- `enunciado`
- `alternativa`
- `prova_questao`

> Observação: o backend não usa views server-side no padrão MVC tradicional. A interface do usuário é implementada no frontend separado, enquanto o servidor fornece APIs organizadas em camadas.

### 3.2.2. Diagrama de Casos de Uso

<div align="center">
  <img src="/assets/diagramaCasosDeUso.png">
</div>

<div align="center">
  <strong>Figura 11 — Diagrama Casos de Usos.</strong><br><em>Fonte: elaboração própria.</em>
</div>

&emsp;  O diagrama apresenta os três atores principais da plataforma — Professor, Coordenador e Aluno — e os dezesseis casos de uso organizados em três grupos funcionais: gestão de provas, aplicação pelo aluno e correção/resultados. Atores externos (Google Auth e Serviço de E-mail) aparecem apenas onde há integração real. A relação `<<include>>` entre UC09 e UC10 explicita que o salvamento automático é comportamento obrigatório embutido na experiência de resposta.

---

#### Lista Consolidada de Casos de Uso

| ID | Caso de Uso | Ator Primário | Atores Secundários | Requisitos |
|---|---|---|---|---|
| UC01 | Autenticar-se | Professor / Coordenador | Google Auth | US01 |
| UC02 | Listar e filtrar provas por status | Professor / Coordenador | — | US02, RF001, RF022, RF020 |
| UC03 | Criar prova a partir da home | Professor | — | US03, RF021 |
| UC04 | Criar e editar questões com fórmulas e tipos variados | Professor | — | US04, RF004, RF005 |
| UC05 | Reutilizar questões do banco | Professor | — | US05, RF003 |
| UC06 | Configurar tempo, datas e embaralhamento | Professor | — | US06, RF007, RF023 |
| UC07 | Publicar prova com URL única e QR Code | Professor | — | US07, RF008 |
| UC08 | Acessar prova pelo portal do aluno | Aluno | — | US08, RF009, RF024, RF025 |
| UC09 | Responder prova no mobile com anexos manuscritos | Aluno | — | US09, RF010, RF011, RF012, RF013 |
| UC10 | Salvar rascunho durante a prova *(included por UC09)* | — | — | US10 |
| UC11 | Revisar e confirmar envio final | Aluno | — | US11, RF026 |
| UC12 | Corrigir prova por item | Professor | — | US12, RF014, RF015, RF016 |
| UC13 | Corrigir questões objetivas automaticamente | Professor | Aluno | US13 |
| UC14 | Calcular notas e exportar resultados | Coordenador | — | US14, RF017, RF028 |
| UC15 | Liberar resultados por e-mail | Professor / Coordenador | Serviço de E-mail | US15, RF027 |
| UC16 | Consultar logs e analytics da avaliação | Coordenador | — | US16 |

---

#### Descrições Detalhadas dos Casos de Uso

---

#### UC01 — Autenticar-se

**Descrição:** Permite que usuários internos acessem a plataforma com conta Google, sendo direcionados automaticamente ao painel correspondente ao perfil autorizado.

**Atores:** Professor, Coordenador.
**Atores secundários:** Google Auth.

**Pré-requisitos:**
- Usuário possui e-mail cadastrado na lista de autorizados da plataforma.
- Serviço Google Auth disponível.

**Pós-requisitos:**
- Sessão autenticada criada.
- Usuário redirecionado para o painel do seu perfil.

**Fluxo principal:**
1. Usuário acessa a plataforma e seleciona "Entrar com Google".
2. Sistema redireciona para o fluxo OAuth 2.0 do Google Auth.
3. Google Auth retorna a identidade (e-mail) do usuário autenticado.
4. Sistema valida se o e-mail consta na lista de autorizados.
5. Sistema identifica o perfil e redireciona para o painel correspondente.

**Fluxos alternativos:**
- A1: e-mail não autorizado — acesso negado com mensagem de erro.
- A2: sessão expirada — usuário redirecionado para novo login ao tentar acessar página protegida.

**Relações:**
- `<<include>>` Validar e-mail autorizado.
- `<<include>>` Redirecionar por perfil.

**Fluxos de exceção:**

| Passo | Situação | Solução |
|-------|----------|---------|
| 3 | Google Auth retorna erro ou está indisponível. | Sistema exibe mensagem de indisponibilidade temporária e orienta o usuário a tentar novamente. |
| 4 | E-mail retornado não consta na lista de autorizados. | Sistema nega o acesso, exibe mensagem informativa e não cria sessão. |
| Todos | O ator deseja cancelar a operação. | Cancelar operação; retornar à tela inicial. |

---

#### UC02 — Listar e filtrar provas por status

**Descrição:** Exibe as provas agrupadas por status (Rascunho, Publicada, Encerrada, Antiga), com possibilidade opcional de aplicar filtros combinados por turma, semestre, disciplina e professor.

**Atores:** Professor, Coordenador.
**Atores secundários:** Nenhum.

**Pré-requisitos:**
- Usuário autenticado.

**Pós-requisitos:**
- Lista exibida conforme critérios aplicados.

**Fluxo principal:**
1. Usuário acessa a tela inicial de provas.
2. Sistema carrega e agrupa as provas por status.
3. Usuário visualiza a listagem completa sem filtros aplicados.

**Fluxos alternativos:**
- A1: usuário aplica filtros — sistema retorna apenas provas que atendem a todos os critérios combinados *(extend: Filtrar provas)*.
- A2: nenhum resultado encontrado — sistema exibe mensagem de estado vazio *(extend: Exibir estado vazio)*.
- A3: prova encerrada — sistema bloqueia a opção de edição para aquela prova.

**Relações:**
- `<<extend>>` Filtrar provas *(condição: usuário aplica ao menos um filtro)*.
- `<<extend>>` Exibir estado vazio *(condição: nenhuma prova atende aos critérios)*.

**Fluxos de exceção:**

| Passo | Situação | Solução |
|-------|----------|---------|
| 2 | Falha na comunicação com o banco de dados ao carregar provas. | Sistema exibe mensagem de erro genérica e orienta o usuário a recarregar a página. |
| Todos | O ator deseja cancelar a operação. | Cancelar operação; retornar à tela anterior. |

---

#### UC03 — Criar prova a partir da home

**Descrição:** Permite ao professor iniciar rapidamente a criação de uma nova prova pela tela inicial, preenchendo metadados obrigatórios e salvando o registro como rascunho.

**Atores:** Professor.
**Atores secundários:** Nenhum.

**Pré-requisitos:**
- Professor autenticado.

**Pós-requisitos:**
- Prova criada em estado Rascunho, disponível para edição posterior.

**Fluxo principal:**
1. Professor clica em "Criar prova".
2. Sistema exibe formulário com campos obrigatórios.
3. Professor preenche: Nome, Modalidade, Disciplina, Turma e Semestre.
4. Sistema valida os campos preenchidos.
5. Sistema salva a prova como Rascunho e redireciona para o editor.

**Fluxos alternativos:**
- A1: campo obrigatório ausente — sistema impede o salvamento e destaca o campo faltante.

**Relações:**
- `<<include>>` Salvar como rascunho.

**Fluxos de exceção:**

| Passo | Situação | Solução |
|-------|----------|---------|
| 4 | Campo obrigatório ausente ou inválido. | Sistema destaca o campo e bloqueia o salvamento até que seja preenchido corretamente. |
| 5 | Falha de persistência no banco de dados. | Sistema exibe mensagem de erro e mantém os dados no formulário para nova tentativa. |
| Todos | O ator deseja cancelar a operação. | Cancelar operação; retornar à tela inicial sem salvar. |

---

#### UC04 — Criar e editar questões com fórmulas e tipos variados

**Descrição:** Permite ao professor montar o conteúdo da prova com questões de múltipla escolha, verdadeiro/falso e discursivas. Enunciados com notação LaTeX são renderizados quando presentes.

**Atores:** Professor.
**Atores secundários:** Nenhum.

**Pré-requisitos:**
- Prova em estado Rascunho aberta no editor.

**Pós-requisitos:**
- Questões salvas e vinculadas à prova.
- Gabarito registrado para questões objetivas (usado em UC13).

**Fluxo principal:**
1. Professor abre o editor da prova.
2. Sistema exibe interface para adicionar questão e selecionar o tipo.
3. Professor informa enunciado e, conforme o tipo: alternativas com gabarito (objetivas) ou critérios e limite de caracteres (discursivas).
4. Sistema valida campos obrigatórios e consistência das alternativas.
5. Sistema salva a questão vinculada à prova.

**Fluxos alternativos:**
- A1: questão incompleta — sistema bloqueia o salvamento e indica os campos ausentes.
- A2: professor tenta publicar prova com questão sem enunciado — sistema bloqueia a publicação.

**Relações:**
- `<<include>>` Validar alternativas e campos obrigatórios.
- `<<extend>>` Renderizar fórmulas LaTeX *(condição: enunciado contém notação LaTeX)*.

**Fluxos de exceção:**

| Passo | Situação | Solução |
|-------|----------|---------|
| 4 | Alternativas de questão objetiva sem gabarito marcado. | Sistema bloqueia o salvamento e indica a ausência do gabarito. |
| 4 | Sintaxe LaTeX inválida no enunciado. | Sistema exibe aviso de renderização incorreta; o salvamento é permitido, mas o professor é alertado. |
| Todos | O ator deseja cancelar a operação. | Cancelar operação; retornar ao editor sem salvar a questão. |

---

#### UC05 — Reutilizar questões do banco

**Descrição:** Permite ao professor buscar questões já cadastradas e incorporá-las à prova.

**Atores:** Professor.
**Atores secundários:** Nenhum.

**Pré-requisitos:**
- Banco de questões populado.
- Prova em edição aberta no editor.

**Pós-requisitos:**
- Questões selecionadas adicionadas ao editor da prova.

**Fluxo principal:**
1. Professor acessa o banco de questões.
2. Sistema exibe filtros por disciplina, tema e tipo.
3. Professor aplica filtros e visualiza questões compatíveis.
4. Professor seleciona uma ou mais questões para a prova.
5. Sistema adiciona as questões ao editor.

**Fluxos alternativos:**
- Nenhum.

**Relações:**
- `<<include>>` Buscar por disciplina, tema ou tipo.

**Fluxos de exceção:**

| Passo | Situação | Solução |
|-------|----------|---------|
| 3 | Nenhuma questão encontrada com os filtros aplicados. | Sistema exibe mensagem de estado vazio e sugere ampliar os filtros. |
| Todos | O ator deseja cancelar a operação. | Cancelar operação; retornar ao editor da prova sem adicionar questões. |

---

#### UC06 — Configurar tempo, datas e embaralhamento

**Descrição:** Permite ao professor definir a janela de disponibilidade da prova, duração máxima e regras de embaralhamento de questões e alternativas.

**Atores:** Professor.
**Atores secundários:** Nenhum.

**Pré-requisitos:**
- Prova em edição existe.

**Pós-requisitos:**
- Configurações de execução persistidas, utilizadas pelo sistema no controle de acesso em UC08.

**Fluxo principal:**
1. Professor acessa as configurações da prova.
2. Define data e horário de início e término no Horário de Brasília (GMT-3).
3. Define duração máxima por aluno.
4. Escolhe embaralhamento de questões e/ou alternativas (opcional).
5. Sistema valida que o término é posterior ao início e persiste a configuração.

**Fluxos alternativos:**
- A1: término anterior ao início — sistema rejeita a configuração com mensagem de erro.

**Relações:**
- `<<include>>` Validar período da prova.

**Fluxos de exceção:**

| Passo | Situação | Solução |
|-------|----------|---------|
| 5 | Data/horário de término anterior ao de início. | Sistema rejeita a configuração, exibe mensagem de erro e mantém os campos para correção. |
| 5 | Duração máxima zerada ou negativa. | Sistema bloqueia o salvamento e indica o campo inválido. |
| Todos | O ator deseja cancelar a operação. | Cancelar operação; retornar ao editor da prova sem salvar configurações. |

---

#### UC07 — Publicar prova com URL única e QR Code

**Descrição:** Após validação da consistência, o sistema publica a prova e gera link exclusivo e QR Code para distribuição aos candidatos.

**Atores:** Professor.
**Atores secundários:** Nenhum.

**Pré-requisitos:**
- Prova em estado Rascunho com ao menos uma questão completa e período definido.

**Pós-requisitos:**
- Prova no estado Publicada.
- URL única e QR Code disponíveis para compartilhamento.

**Fluxo principal:**
1. Professor solicita a publicação da prova.
2. Sistema valida consistência (questões completas, período definido).
3. Sistema gera URL única para a prova.
4. Sistema gera QR Code correspondente ao link.
5. Sistema disponibiliza URL e QR Code para cópia ou download.

**Fluxos alternativos:**
- A1: prova com inconsistências — sistema bloqueia a publicação e exibe os problemas encontrados.

**Relações:**
- `<<include>>` Gerar URL única.
- `<<include>>` Gerar QR Code.

**Fluxos de exceção:**

| Passo | Situação | Solução |
|-------|----------|---------|
| 2 | Prova sem questões completas ou sem período definido. | Sistema bloqueia a publicação e lista as inconsistências encontradas para correção. |
| 3–4 | Falha na geração do UUID ou do QR Code. | Sistema exibe mensagem de erro e permite nova tentativa de publicação. |
| Todos | O ator deseja cancelar a operação. | Cancelar operação; prova permanece em estado Rascunho. |

---

#### UC08 — Acessar prova pelo portal do aluno

**Descrição:** Exibe a tela de entrada da prova com orientações e solicita identificação mínima do aluno. Valida período de disponibilidade, coleta consentimento LGPD e impede múltiplas submissões.

**Atores:** Aluno.
**Atores secundários:** Nenhum.

**Pré-requisitos:**
- Prova no estado Publicada e dentro do período de disponibilidade (Horário de Brasília).
- Aluno não realizou submissão anterior para esta prova.

**Pós-requisitos:**
- Aluno identificado por nome, e-mail e CPF.
- Consentimento LGPD registrado.
- Prova liberada para início.

**Fluxo principal:**
1. Aluno acessa o link ou QR Code da prova.
2. Sistema valida se a prova está dentro do período de disponibilidade.
3. Sistema exibe título, orientações, duração e regras.
4. Aluno preenche nome, e-mail e CPF.
5. Aluno marca o checkbox de aceite dos Termos de Uso e Política de Privacidade.
6. Sistema valida os campos e habilita o botão "Iniciar Prova".
7. Sistema registra o consentimento LGPD do aluno.

**Fluxos alternativos:**
- A1: prova fora do período — sistema exibe mensagem de indisponibilidade e bloqueia o acesso.
- A2: CPF ausente ou inválido — sistema mantém o botão desabilitado e destaca o campo.
- A3: checkbox LGPD não marcado — sistema mantém o botão desabilitado.
- A4: prova em estado Rascunho acessada pelo link — sistema bloqueia o acesso.
- A5: aluno já realizou submissão anterior — sistema informa que a prova já foi enviada.

**Relações:**
- `<<include>>` Validar período de disponibilidade.
- `<<include>>` Registrar consentimento LGPD.

**Fluxos de exceção:**

| Passo | Situação | Solução |
|-------|----------|---------|
| 4 | CPF informado em formato inválido. | Sistema destaca o campo e bloqueia o avanço até o CPF ser corrigido. |
| 4 | E-mail informado em formato inválido. | Sistema destaca o campo e bloqueia o avanço até o e-mail ser corrigido. |
| 6 | Checkbox LGPD não marcado. | Sistema mantém o botão "Iniciar Prova" desabilitado e exibe aviso de obrigatoriedade. |
| 7 | Falha ao registrar consentimento no banco. | Sistema exibe mensagem de erro e não permite o início da prova. |
| Todos | O ator deseja cancelar a operação. | Cancelar operação; retornar à tela de entrada sem iniciar a prova. |

---

#### UC09 — Responder prova no mobile com anexos manuscritos

**Descrição:** Permite ao aluno responder questões em dispositivos móveis com suporte a fórmulas e upload de imagens ou arquivos de resolução manuscrita. O progresso é salvo automaticamente via UC10.

**Atores:** Aluno.
**Atores secundários:** Nenhum.

**Pré-requisitos:**
- Aluno identificado e prova iniciada (UC08 concluído).

**Pós-requisitos:**
- Respostas e anexos vinculados corretamente ao aluno e à questão.
- Progresso salvo automaticamente.

**Fluxo principal:**
1. Aluno visualiza a questão no dispositivo móvel (layout responsivo ≥ 360 px).
2. Aluno fornece a resposta (objetiva ou discursiva).
3. Quando habilitado, aluno anexa imagens ou PDF da resolução manuscrita.
4. Sistema valida tipo (JPG, PNG, PDF) e tamanho (máximo 5 MB por arquivo).
5. Sistema comprime imagens no lado do cliente antes do upload.
6. Sistema salva o vínculo entre arquivo, aluno e questão.
7. Sistema salva automaticamente o progresso da prova *(include: UC10)*.

**Fluxos alternativos:**
- A1: arquivo acima de 5 MB — sistema rejeita com mensagem de erro e informa o limite.
- A2: formato inválido — sistema impede o upload e informa os formatos aceitos.

**Relações:**
- `<<include>>` Anexar arquivos por questão.
- `<<include>>` Comprimir imagens no cliente.
- `<<include>>` UC10 Salvar rascunho durante a prova.
- `<<extend>>` Renderizar fórmulas LaTeX *(condição: questão contém notação LaTeX)*.

**Fluxos de exceção:**

| Passo | Situação | Solução |
|-------|----------|---------|
| 4 | Arquivo com formato inválido (não JPG, PNG ou PDF). | Sistema rejeita o upload, exibe mensagem indicando os formatos aceitos. |
| 4 | Arquivo acima de 5 MB. | Sistema rejeita o upload antes do envio ao servidor, exibe mensagem com o limite. |
| 7 | Falha no salvamento automático por ausência de conexão. | Sistema exibe indicador de pendência de sincronização; progresso é preservado no armazenamento local. |
| Todos | O ator deseja cancelar a operação. | Cancelar operação; retornar à tela de provas; respostas salvas até o momento são preservadas. |

---

#### UC10 — Salvar rascunho durante a prova

**Descrição:** Garante o armazenamento automático e contínuo do progresso do aluno enquanto responde a prova, protegendo contra perda de dados por instabilidade de rede ou recarga de página.

**Atores:** *(nenhum — disparado pelo sistema durante UC09)*.
**Atores secundários:** Nenhum.

**Pré-requisitos:**
- Prova em andamento (UC09 ativo).

**Pós-requisitos:**
- Último estado salvo disponível para restauração.

**Fluxo principal:**
1. Sistema detecta alteração em resposta digitada ou anexo vinculado.
2. Sistema salva automaticamente o progresso quando há conexão ativa.
3. Ao recarregar a página dentro do período permitido, sistema restaura o conteúdo salvo.
4. Ao detectar tentativa de sair com alterações não sincronizadas, sistema exibe aviso.

**Fluxos alternativos:**
- A1: término do tempo com respostas parcialmente salvas — sistema preserva o último estado salvo.

**Relações:**
- É `<<include>>` de UC09.

**Fluxos de exceção:**

| Passo | Situação | Solução |
|-------|----------|---------|
| 2 | Falha na comunicação com o servidor ao tentar sincronizar. | Sistema preserva o estado localmente e exibe indicador de pendência; tenta sincronizar novamente quando a conexão for restaurada. |
| Todos | O ator deseja cancelar a operação. | Cancelar operação; último estado salvo é preservado. |

---

#### UC11 — Revisar e confirmar envio final

**Descrição:** Apresenta um resumo do progresso antes do envio definitivo, destaca questões em branco e exige confirmação explícita do aluno.

**Atores:** Aluno.
**Atores secundários:** Nenhum.

**Pré-requisitos:**
- Prova respondida parcial ou integralmente.
- Prova dentro do período de disponibilidade.

**Pós-requisitos:**
- Prova enviada e bloqueada para alterações, com confirmação visual exibida ao aluno. Ou aluno retorna à tela de respostas para continuar o preenchimento.

**Fluxo principal:**
1. Aluno solicita a revisão final.
2. Sistema exibe mapa de questões respondidas e em branco.
3. Sistema destaca questões em branco.
4. Aluno confirma o envio final.
5. Sistema registra a submissão, bloqueia alterações e exibe confirmação visual.

**Fluxos alternativos:**
- A1: aluno cancela a confirmação — sistema mantém a prova aberta.
- A2: tempo encerrado antes da confirmação — sistema submete automaticamente o último estado salvo.

**Relações:**
- `<<include>>` Destacar questões em branco.
- `<<include>>` Confirmar envio final.

**Fluxos de exceção:**

| Passo | Situação | Solução |
|-------|----------|---------|
| 5 | Falha na persistência da submissão final (erro de rede ou servidor). | Sistema exibe mensagem de erro, mantém a prova aberta e permite nova tentativa de envio. |
| Todos | O ator deseja cancelar a operação. | Cancelar operação; retornar à tela de respostas com o progresso preservado. |

---

#### UC12 — Corrigir prova por item

**Descrição:** Permite ao professor corrigir a mesma questão de todos os alunos em sequência, garantindo isonomia na aplicação dos critérios. Suporta visualização de anexos, atribuição de nota e comentário por resposta.

**Atores:** Professor.
**Atores secundários:** Nenhum.

**Pré-requisitos:**
- Existem submissões registradas para a prova.

**Pós-requisitos:**
- Notas e comentários salvos por resposta e por questão.

**Fluxo principal:**
1. Professor acessa o painel de correção e seleciona uma questão.
2. Sistema lista as respostas daquela questão de todos os alunos em sequência.
3. Professor visualiza a resposta e, quando houver, abre os anexos.
4. Professor amplia anexos quando necessário.
5. Professor atribui nota e, opcionalmente, insere comentário.
6. Sistema salva e disponibiliza navegação para a próxima resposta.

**Fluxos alternativos:**
- A1: anexo ilegível — professor registra observação no comentário.
- A2: retorno a resposta já corrigida — dados persistidos são exibidos e podem ser editados.

**Relações:**
- `<<include>>` Listar respostas por questão.
- `<<include>>` Visualizar e ampliar anexos.
- `<<include>>` Registrar nota e comentário.

**Fluxos de exceção:**

| Passo | Situação | Solução |
|-------|----------|---------|
| 5 | Nota informada fora do intervalo permitido (ex.: valor negativo ou acima do máximo). | Sistema bloqueia o salvamento e destaca o campo com o intervalo válido. |
| 6 | Falha ao salvar nota/comentário no banco de dados. | Sistema exibe mensagem de erro; nota e comentário permanecem no formulário para nova tentativa. |
| Todos | O ator deseja cancelar a operação. | Cancelar operação; retornar à listagem de questões. |

---

#### UC13 — Corrigir questões objetivas automaticamente

**Descrição:** Aplica o gabarito registrado às respostas objetivas dos alunos, atribuindo pontuação automaticamente. Permite recálculo caso o gabarito seja alterado antes da liberação das notas.

**Atores:** Professor.
**Atores secundários:** Aluno *(suas submissões alimentam o processo de correção)*.

**Pré-requisitos:**
- Questões objetivas com gabarito registrado (configurado em UC04).
- Alunos realizaram submissão da prova (UC11).

**Pós-requisitos:**
- Questões objetivas pontuadas automaticamente.
- Questões discursivas com status "pendente de correção manual".

**Fluxo principal:**
1. Professor acessa o painel de resultados e inicia a correção automática.
2. Sistema recupera as respostas objetivas de todos os alunos.
3. Sistema compara cada resposta com o gabarito registrado.
4. Sistema atribui pontuação correta; respostas erradas recebem zero.
5. Questões discursivas permanecem com status "pendente", aguardando UC12.

**Fluxos alternativos:**
- A1: gabarito alterado antes da liberação — sistema recalcula todas as pontuações objetivas afetadas *(extend: Recalcular resultados)*.

**Relações:**
- `<<include>>` Aplicar gabarito.
- `<<extend>>` Recalcular resultados *(condição: gabarito alterado antes da liberação das notas)*.

**Fluxos de exceção:**

| Passo | Situação | Solução |
|-------|----------|---------|
| 3–4 | Gabarito não registrado para questão objetiva. | Sistema ignora a questão no cálculo automático e a mantém com status "pendente de correção manual". |
| Todos | O ator deseja cancelar a operação. | Cancelar operação; pontuações automáticas calculadas até o momento são preservadas. |

---

#### UC14 — Calcular notas e exportar resultados

**Descrição:** Consolida correções manuais e automáticas, calcula a nota final de cada aluno e exporta os resultados em planilha Excel, com opção de exportar os anexos organizados por prova, aluno e questão.

**Atores:** Coordenador.
**Atores secundários:** Nenhum.

**Pré-requisitos:**
- Todas as questões corrigidas, ou coordenador ciente das pendências e confirmando prosseguimento.

**Pós-requisitos:**
- Nota total calculada por aluno.
- Resultados exportados em formato estruturado.

**Fluxo principal:**
1. Coordenador acessa a tela de resultados da prova.
2. Sistema calcula a nota total de cada aluno.
3. Sistema exibe a nota total por aluno.
4. Coordenador solicita exportação para Excel.
5. Sistema gera planilha com alunos nas linhas e questões/notas nas colunas.
6. Coordenador solicita exportação de anexos.
7. Sistema gera pacote organizado por prova, aluno e questão.

**Fluxos alternativos:**
- A1: questões pendentes de correção — sistema alerta o coordenador antes da exportação final *(extend: Alertar pendências de correção)*; coordenador decide prosseguir ou aguardar.

**Relações:**
- `<<include>>` Consolidar notas.
- `<<include>>` Exportar planilha Excel.
- `<<include>>` Exportar anexos organizados.
- `<<extend>>` Alertar pendências de correção *(condição: há questões com status "pendente")*.

**Fluxos de exceção:**

| Passo | Situação | Solução |
|-------|----------|---------|
| 5 | Falha na geração da planilha Excel. | Sistema exibe mensagem de erro e permite nova tentativa de exportação. |
| 7 | Falha na geração do pacote de anexos. | Sistema exibe mensagem de erro parcial; exportação da planilha permanece disponível. |
| Todos | O ator deseja cancelar a operação. | Cancelar operação; retornar à tela de resultados. |

---

#### UC15 — Liberar resultados por e-mail

**Descrição:** Envia o resultado individual de cada aluno por e-mail quando as notas estiverem validadas. Registra histórico de envios e permite reenvio em caso de falha.

**Atores:** Professor, Coordenador.
**Atores secundários:** Serviço de E-mail.

**Pré-requisitos:**
- Notas consolidadas (UC14 concluído).
- Pendências resolvidas ou confirmação explícita realizada.

**Pós-requisitos:**
- E-mails enviados individualmente.
- Envio registrado com data, horário e status.

**Fluxo principal:**
1. Professor ou coordenador solicita a liberação dos resultados.
2. Sistema verifica se há questões pendentes de correção.
3. Sistema envia e-mail individual para cada aluno com seu resultado.
4. Sistema registra data, horário e status de cada envio.

**Fluxos alternativos:**
- A1: notas ainda pendentes — sistema bloqueia o envio ou exige confirmação explícita.
- A2: falha no envio — sistema sinaliza os envios falhos e permite nova tentativa *(extend: Reenviar e-mail falho)*.

**Relações:**
- `<<include>>` Enviar e-mail individual.
- `<<include>>` Registrar histórico de envio.
- `<<extend>>` Reenviar e-mail falho *(condição: envio falhou para ao menos um aluno)*.

**Fluxos de exceção:**

| Passo | Situação | Solução |
|-------|----------|---------|
| 3 | Serviço de e-mail transacional indisponível. | Sistema marca todos os envios como falhos e notifica o usuário; permite nova tentativa individual ou em lote. |
| 3 | E-mail do aluno inválido ou inexistente. | Sistema marca o envio específico como falho e registra o erro no histórico. |
| Todos | O ator deseja cancelar a operação. | Cancelar operação; e-mails já enviados permanecem registrados. |

---

#### UC16 — Consultar logs e analytics da avaliação

**Descrição:** Permite ao coordenador acessar o painel analítico para monitorar participação, desempenho por questão e identificar problemas operacionais. O registro de eventos ocorre automaticamente pelo sistema em segundo plano durante toda a execução das provas.

**Atores:** Coordenador.
**Atores secundários:** Nenhum.

**Pré-requisitos:**
- Sistema em operação com ao menos uma prova em andamento ou encerrada.
- Coordenador autenticado.

**Pós-requisitos:**
- Painel analítico exibido com dados atualizados.

**Fluxo principal:**
1. Coordenador acessa o painel de analytics.
2. Sistema exibe métricas de participação: acessos, inícios e envios por prova.
3. Sistema exibe tempo médio de resposta por questão.
4. Sistema exibe porcentagem de acerto por questão do banco.
5. Coordenador filtra por prova ou período para análise específica.
6. Sistema atualiza o painel conforme filtro aplicado.

**Fluxos alternativos:**
- A1: nenhuma prova no filtro aplicado — sistema exibe estado vazio.

> **Comportamento de infraestrutura:** o sistema registra automaticamente acessos, inícios, submissões e erros operacionais com data e contexto mínimo durante toda a execução das provas. Esses dados alimentam o painel consultado neste caso de uso.

**Relações:**
- `<<include>>` Exibir métricas de participação.
- `<<include>>` Exibir desempenho por questão.

**Fluxos de exceção:**

| Passo | Situação | Solução |
|-------|----------|---------|
| 2–4 | Nenhum dado disponível para as métricas solicitadas. | Sistema exibe mensagem de estado vazio e indica que os dados serão gerados à medida que as provas forem realizadas. |
| Todos | O ator deseja cancelar a operação. | Cancelar operação; retornar ao painel do coordenador. |

---

### 3.2.3. Diagrama de Classes do Domínio (sprint 2)

O diagrama de classes a seguir representa a modelagem completa do domínio da plataforma de avaliações, contemplando aproximadamente 20 entidades distribuídas nos módulos de pessoas (Pessoa, Aluno, Professor, Coordenador), provas (Prova, Enunciado, Alternativa, Matéria), realização (ProvaAluno, RespostaAluno) e correção (Correcao, Feedback, Relatorio). Foram modeladas relações de herança (generalização via triângulo vazio), associação simples (linha contínua), agregação (losango vazio) e composição (losango cheio), todas com multiplicidades explícitas. O diagrama foi desenvolvido em PlantUML e segue as notações UML padrão.

```plantuml
@startuml DiagramaDeClasses
skinparam classAttributeIconSize 0
skinparam classFontSize 11
skinparam classBackgroundColor #F0F4FF
skinparam classBorderColor #3A6BC7
skinparam arrowColor #333333

package "Pessoas" #EAF0FB {

  abstract class Pessoa {
    - id : UUID
    - nome : VARCHAR(150)
    - email : VARCHAR(255)
    - ativo : BOOLEAN
    - criado_em : TIMESTAMPTZ
    + autenticar() : void
    + validarEmail() : boolean
  }

  class Aluno {
    - cpf : VARCHAR(14)
    + acessarProva(link : UUID) : void
    + enviarResposta() : void
  }

  class Professor {
    + criarProva() : Prova
    + publicarProva(prova : Prova) : void
    + corrigirResposta(resp : RespostaAluno) : Correcao
  }

  class Coordenador {
    + gerarRelatorio(prova : Prova) : Relatorio
    + exportarResultados(prova : Prova) : File
    + visualizarAnalytics() : void
  }

  Pessoa <|-- Aluno
  Pessoa <|-- Professor
  Pessoa <|-- Coordenador
}

package "Provas" #EBF5EB {

  class Materia {
    - id : UUID
    - nome : VARCHAR(120)
    - codigo : VARCHAR(30)
    - criado_em : TIMESTAMPTZ
  }

  class Prova {
    - id : UUID
    - titulo : VARCHAR(180)
    - descricao : TEXT
    - modalidade : VARCHAR(60)
    - turma : VARCHAR(80)
    - semestre : VARCHAR(20)
    - status : VARCHAR(20)
    - duracao_minutos : INTEGER
    - inicio_agendado : TIMESTAMPTZ
    - fim_agendado : TIMESTAMPTZ
    - embaralhar_questoes : BOOLEAN
    - link_publicacao : UUID
    - qr_code_url : TEXT
    - criado_em : TIMESTAMPTZ
    + publicar() : void
    + encerrar() : void
    + gerarLink() : UUID
  }

  class Enunciado {
    - id : UUID
    - tipo : VARCHAR(30)
    - texto : TEXT
    - pontos : DECIMAL(6,2)
    - limite_caracteres : INTEGER
    - permite_upload : BOOLEAN
    - ativo : BOOLEAN
    - criado_em : TIMESTAMPTZ
    + renderizarLatex() : String
  }

  class Alternativa {
    - id : UUID
    - texto : TEXT
    - correta : BOOLEAN
    - ordem : INTEGER
    - criado_em : TIMESTAMPTZ
  }

  Enunciado "1" *-- "0..*" Alternativa : possui >
}

package "Realização" #FFF8EC {

  class ProvaAluno {
    - id : UUID
    - status : VARCHAR(20)
    - iniciado_em : TIMESTAMPTZ
    - enviado_em : TIMESTAMPTZ
    - nota_total : DECIMAL(6,2)
    - criado_em : TIMESTAMPTZ
    + calcularNota() : DECIMAL
  }

  class RespostaAluno {
    - id : UUID
    - texto_resposta : TEXT
    - rascunho : BOOLEAN
    - criado_em : TIMESTAMPTZ
    - atualizado_em : TIMESTAMPTZ
    + salvarRascunho() : void
    + enviarFinal() : void
  }

  class ArquivoResposta {
    - id : UUID
    - url : TEXT
    - nome_original : VARCHAR(255)
    - tipo_mime : VARCHAR(50)
    - tamanho_bytes : INTEGER
    - ordem : INTEGER
    - criado_em : TIMESTAMPTZ
    + validarTamanho() : boolean
    + validarTipoMime() : boolean
  }

  ProvaAluno "1" *-- "0..*" RespostaAluno : gera >
  RespostaAluno "1" *-- "0..*" ArquivoResposta : anexa >
}

package "Correção" #FFF0F0 {

  class Correcao {
    - id : UUID
    - nota : DECIMAL(6,2)
    - observacao : TEXT
    - status : VARCHAR(20)
    - corrigida_em : TIMESTAMPTZ
    - criado_em : TIMESTAMPTZ
    + aplicarNota(valor : DECIMAL) : void
    + recalcular() : void
  }

  class Feedback {
    - id : UUID
    - mensagem : TEXT
    - criado_em : TIMESTAMPTZ
  }

  class Relatorio {
    - id : UUID
    - titulo : VARCHAR(180)
    - conteudo : TEXT
    - arquivo_url : TEXT
    - gerado_em : TIMESTAMPTZ
    + exportarExcel() : File
  }

  Correcao "1" *-- "0..*" Feedback : possui >
}

' RELACIONAMENTOS ENTRE PACKAGES

Professor "1" --> "0..*" Prova : elabora
Professor "0..*" -- "0..*" Materia : leciona
Prova "0..*" -- "0..*" Materia : aborda
Prova "0..*" o-- "0..*" Enunciado : contém (via ProvaEnunciado)
Aluno "1" --> "0..*" ProvaAluno : realiza
Prova "1" --> "0..*" ProvaAluno : é aplicada a
Enunciado "1" --> "0..*" RespostaAluno : é respondido em
Alternativa "0..1" --> "0..*" RespostaAluno : é marcada em
RespostaAluno "1" *-- "0..1" Correcao : recebe >
Correcao "0..*" --> "1" Enunciado : referencia >
Professor "1" --> "0..*" Correcao : realiza
Professor "1" --> "0..*" Feedback : escreve
Coordenador "1" --> "0..*" Relatorio : gera
Prova "1" --> "0..*" Relatorio : baseia
@enduml
```

#### 3.2.3.1 Diagrama de Classes Arquitetural

```plantuml
@startuml ArquiteturaGeral
skinparam linetype ortho
skinparam classAttributeIconSize 0

package "Controller" #D6EAF8 {
  class AuthController
  class ProfessorController
  class CoordenadorController
  class MateriaController
  class TemaController
  class AlunoController
  class QuestaoController
  class ProvaController
  class ProvaAlunoController
  class CorrecaoController
  class ResultadoController
  class RelatorioController
  class EmailController
  class AnalyticsController
}

package "Service" #FEF9E7 {
  class AuthService
  class ProfessorService
  class CoordenadorService
  class MateriaService
  class TemaService
  class AlunoService
  class QuestaoService
  class ProvaService
  class ProvaAlunoService
  class CorrecaoService
  class ResultadoService
  class RelatorioService
  class EmailService
  class AnalyticsService
}

package "Repository" #E8F8E8 {
  class AuthRepository
  class ProfessorRepository
  class CoordenadorRepository
  class MateriaRepository
  class TemaRepository
  class AlunoRepository
  class QuestaoRepository
  class ProvaRepository
  class ProvaAlunoRepository
  class CorrecaoRepository
  class ResultadoRepository
  class RelatorioRepository
  class EmailRepository
  class LogRepository
}

package "Model" #FDEDEC {
  class Coordenador
  class Professor
  class Materia
  class Tema
  class Aluno
  class Questao
  class Enunciado
  class Alternativa
  class Prova
  class ProvaAluno
  class RespostaAluno
  class Correcao
  class ResultadoAluno
  class Feedback
  class Relatorio
}

Controller ..> Service
Service ..> Repository
Repository ..> Model

@enduml
```

```plantuml
@startuml Controllers
class ProvaAlunoController {
  + iniciar()
  + salvarRascunho()
  + enviarResposta()
  + submeterProva()
  + uploadAnexo()
}

class CorrecaoController {
  + listarRespostasPorQuestao()
  + corrigirManual()
  + corrigirAutomatico()
  + adicionarFeedback()
}

class ResultadoController {
  + calcular()
  + listar()
  + liberar()
  + exportarExcel()
}

class RelatorioController {
  + listar()
  + gerar()
}

class EmailController {
  + enviar()
  + reenviar()
}

class AnalyticsController {
  + metricas()
  + participacao()
  + desempenhoPorQuestao()
}

package "Services" {
  class AuthService
  class ProfessorService
  class CoordenadorService
  class MateriaService
  class TemaService
  class QuestaoService
  class ProvaService
  class ProvaAlunoService
  class CorrecaoService
  class ResultadoService
  class RelatorioService
  class EmailService
  class AnalyticsService
}

AuthController ..> AuthService
ProfessorController ..> ProfessorService
CoordenadorController ..> CoordenadorService
MateriaController ..> MateriaService
TemaController ..> TemaService
QuestaoController ..> QuestaoService
ProvaController ..> ProvaService
ProvaAlunoController ..> ProvaAlunoService
CorrecaoController ..> CorrecaoService
ResultadoController ..> ResultadoService
RelatorioController ..> RelatorioService
EmailController ..> EmailService
AnalyticsController ..> AnalyticsService

@enduml
```

```plantuml
@startuml Services

class ResultadoService {
  + calcularNotaTotal()
  + liberarResultados()
  + exportarExcel()
}

class RelatorioService {
  + gerar()
  + gerarConteudo()
}

class EmailService {
  + enviarResultados()
  + reenviar()
}

class AnalyticsService {
  + metricas()
  + participacao()
}

package "Repositories" {
  class ProfessorRepository
  class MateriaRepository
  class TemaRepository
  class QuestaoRepository
  class ProvaRepository
  class ProvaAlunoRepository
  class CorrecaoRepository
  class ResultadoRepository
  class RelatorioRepository
  class EmailRepository
  class LogRepository
}

QuestaoService ..> QuestaoRepository
QuestaoService ..> MateriaRepository
QuestaoService ..> TemaRepository

ProvaService ..> ProvaRepository
ProvaService ..> QuestaoRepository

ProvaAlunoService ..> ProvaAlunoRepository
ProvaAlunoService ..> ProvaRepository

CorrecaoService ..> CorrecaoRepository
CorrecaoService ..> ProvaAlunoRepository

ResultadoService ..> ResultadoRepository
ResultadoService ..> CorrecaoRepository

RelatorioService ..> RelatorioRepository
EmailService ..> EmailRepository
AnalyticsService ..> LogRepository

ProvaService ..> QuestaoService
CorrecaoService ..> ProvaAlunoService
ResultadoService ..> CorrecaoService
RelatorioService ..> ResultadoService

@enduml
```

```plantuml
@startuml Repositories

scale 0.55
left to right direction

skinparam dpi 120
skinparam shadowing false
skinparam linetype ortho
skinparam classAttributeIconSize 0
skinparam classFontSize 8
skinparam packageStyle rectangle

package "Repositories" {

class AuthRepository {
  + buscarProfessorPorAuthId()
  + buscarCoordenadorPorAuthId()
  + buscarProfessorPorEmail()
  + buscarCoordenadorPorEmail()
}

class ProfessorRepository {
  + findById()
  + findAll()
  + findByEmail()
  + save()
  + update()
  + delete()
}

class CoordenadorRepository {
  + findById()
  + findAll()
  + findByEmail()
  + save()
  + update()
}

class MateriaRepository {
  + findById()
  + findAll()
  + findByProfessor()
  + save()
  + update()
  + delete()
  + associarProfessor()
}

class TemaRepository {
  + findById()
  + findByMateria()
  + save()
  + update()
  + delete()
}

class AlunoRepository {
  + findById()
  + findByCpf()
  + findByEmail()
  + save()
  + update()
}

class QuestaoRepository {
  + findById()
  + findAll()
  + save()
  + update()
  + delete()
  + saveEnunciado()
  + saveAlternativa()
}

class ProvaRepository {
  + findById()
  + findAll()
  + save()
  + update()
  + delete()
  + updateStatus()
}

class ProvaAlunoRepository {
  + findById()
  + save()
  + update()
  + saveResposta()
  + saveAnexo()
}

class CorrecaoRepository {
  + findById()
  + save()
  + update()
  + upsert()
  + saveFeedback()
}

class ResultadoRepository {
  + findByProvaAluno()
  + findByProva()
  + save()
  + update()
  + upsert()
  + saveExportacao()
}

class RelatorioRepository {
  + findById()
  + save()
  + update()
}

class EmailRepository {
  + findById()
  + save()
  + update()
}

class LogRepository {
  + save()
  + findByProva()
  + findByAcao()
}

}

package "Models" {

class Professor
class Coordenador
class Materia
class Tema
class Aluno
class Questao
class Enunciado
class Alternativa
class Prova
class ProvaAluno
class RespostaAluno
class RespostaAnexo
class Correcao
class Feedback
class ResultadoAluno
class ExportacaoResultado
class Relatorio
class EmailEnvio
class AvaliacaoLog

}

AuthRepository ..> Professor
AuthRepository ..> Coordenador

ProfessorRepository ..> Professor
CoordenadorRepository ..> Coordenador

MateriaRepository ..> Materia
TemaRepository ..> Tema
AlunoRepository ..> Aluno

QuestaoRepository ..> Questao
QuestaoRepository ..> Enunciado
QuestaoRepository ..> Alternativa

ProvaRepository ..> Prova

ProvaAlunoRepository ..> ProvaAluno
ProvaAlunoRepository ..> RespostaAluno
ProvaAlunoRepository ..> RespostaAnexo

CorrecaoRepository ..> Correcao
CorrecaoRepository ..> Feedback

ResultadoRepository ..> ResultadoAluno
ResultadoRepository ..> ExportacaoResultado

RelatorioRepository ..> Relatorio

EmailRepository ..> EmailEnvio

LogRepository ..> AvaliacaoLog

@enduml
```

```plantuml
@startuml Dominio
skinparam classAttributeIconSize 0

class Coordenador
class Professor
class Materia
class Tema
class Questao
class Enunciado
class Alternativa
class Prova
class ProvaQuestao
class ProvaAluno
class RespostaAluno
class RespostaAnexo
class Correcao
class Feedback
class ResultadoAluno
class Relatorio
class ExportacaoResultado
class EmailEnvio
class AvaliacaoLog
class Aluno

Coordenador ||--o{ Professor
Materia ||--o{ Tema
Materia ||--o{ Questao
Tema ||--o{ Questao

Questao ||--|| Enunciado
Questao ||--o{ Alternativa

Professor ||--o{ Prova
Materia ||--o{ Prova

Prova ||--o{ ProvaQuestao
Questao ||--o{ ProvaQuestao

Aluno ||--o{ ProvaAluno
Prova ||--o{ ProvaAluno

ProvaAluno ||--o{ RespostaAluno
Questao ||--o{ RespostaAluno

RespostaAluno ||--o{ RespostaAnexo
RespostaAluno ||--|| Correcao

Correcao ||--o{ Feedback

ProvaAluno ||--|| ResultadoAluno

Prova ||--o{ Relatorio
Prova ||--o{ ExportacaoResultado
ProvaAluno ||--o{ EmailEnvio
Prova ||--o{ AvaliacaoLog

@enduml
```

```plantuml
@startuml FluxoCorrecao

left to right direction
scale 0.8

skinparam shadowing false
skinparam linetype ortho

class Professor
class Prova
class ProvaAluno
class RespostaAluno
class Correcao
class Feedback
class ResultadoAluno

Professor --> Correcao : corrige
Prova --> ProvaAluno
ProvaAluno --> RespostaAluno
RespostaAluno --> Correcao
Correcao --> Feedback
Correcao --> ResultadoAluno

@enduml
```

```plantuml
@startuml FluxoAplicacaoProva

left to right direction
scale 0.8

skinparam shadowing false
skinparam linetype ortho

class Aluno
class Prova
class ProvaAluno
class Questao
class RespostaAluno
class RespostaAnexo

Aluno --> ProvaAluno
Prova --> ProvaAluno
Prova --> Questao

ProvaAluno --> RespostaAluno
Questao --> RespostaAluno

RespostaAluno --> RespostaAnexo

@enduml
```

### 3.2.4. Diagrama de Sequência UML (sprint 3)

Os diagramas de sequência a seguir detalham os fluxos das UC01, UC02 e UC03. A modelagem mantém a separação em camadas usada no projeto: o ator interage com a interface, a requisição é tratada por um controller, as regras de negócio ficam no service, a persistência é isolada no repository e o banco armazena as entidades do domínio.

# Diagramas de Sequência UML — UC01, UC02, UC03

---

## UC01 — Autenticar-se

```plantuml
@startuml DiagramaSequenciaUC01
title UC01 — Autenticar-se

autonumber
skinparam sequenceArrowThickness 2
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true
skinparam ParticipantPadding 25
skinparam BoxPadding 10

actor "Professor / Coordenador" as Usuario
boundary "Tela de Login" as Tela
boundary "AuthController" as Controller
control "AuthService" as Service
participant "Supabase Auth\n(Google OAuth)" as Supabase
database "UsuarioRepository" as UsuarioRepository
database "Banco de Dados" as Banco

== Iniciar autenticação ==

Usuario -> Tela: selecionar "Entrar com Google"
activate Tela

Tela -> Controller: GET /auth/google
activate Controller

Controller -> Supabase: redirecionarOAuth()
deactivate Controller

Supabase --> Usuario: exibir consentimento Google
deactivate Tela

== Validar retorno OAuth ==

Usuario -> Supabase: autenticar conta Google
activate Supabase

Supabase -> Controller: callbackOAuth(accessToken, authUserId)
deactivate Supabase
activate Controller

Controller -> Service: resolverPerfil(authUserId)
activate Service

Service -> UsuarioRepository: buscarPorAuthUserId(authUserId)
activate UsuarioRepository

UsuarioRepository -> Banco: SELECT 'professor' AS perfil, id\n  FROM professor\n  WHERE auth_user_id = $1\nUNION ALL\nSELECT 'coordenador', id\n  FROM coordenador\n  WHERE auth_user_id = $1
activate Banco
Banco --> UsuarioRepository: perfilEncontrado | null
deactivate Banco

UsuarioRepository --> Service: PerfilDTO | null
deactivate UsuarioRepository

alt perfil = "professor"
    Service --> Controller: PerfilDTO(perfil = "professor", usuarioId)
    deactivate Service

    Controller --> Usuario: redirecionar para /painel/professor
    deactivate Controller

else perfil = "coordenador"
    Service --> Controller: PerfilDTO(perfil = "coordenador", usuarioId)
    deactivate Service

    Controller --> Usuario: redirecionar para /painel/coordenador
    deactivate Controller

else auth_user_id não encontrado nas tabelas internas
    Service --> Controller: acessoNegado
    deactivate Service

    Controller --> Usuario: exibir mensagem de erro\n"Usuário não autorizado"
    deactivate Controller
end

note right of Supabase
  O JWT de sessão é emitido
  pelo Supabase Auth e gerenciado
  no cliente — não é criado
  pelo domínio da aplicação.
end note

@enduml
```

<div align="center">
  <strong>Figura X — Diagrama de Sequência — UC01.</strong><br><em>Fonte: elaboração própria.</em>
</div>

---

## UC02 — Listar e filtrar provas por status

```plantuml
@startuml DiagramaSequenciaUC02
title UC02 — Listar e filtrar provas por status

autonumber
skinparam sequenceArrowThickness 2
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true
skinparam ParticipantPadding 25
skinparam BoxPadding 10

actor "Professor / Coordenador" as Usuario
boundary "Home de Provas" as Tela
boundary "ProvaController" as Controller
control "ProvaService" as Service
database "ProvaRepository" as ProvaRepository
entity "Prova" as Prova
database "Banco de Dados" as Banco

== Carregar listagem inicial ==

Usuario -> Tela: acessar tela inicial de provas
activate Tela

Tela -> Controller: GET /provas
activate Controller

Controller -> Service: listarProvas(usuarioId)
activate Service

Service -> ProvaRepository: buscarPorUsuario(usuarioId)
activate ProvaRepository

note right of ProvaRepository
  A RLS do banco filtra automaticamente
  os resultados pelo perfil do usuário
  autenticado (professor vê apenas
  suas provas; coordenador vê todas).
end note

ProvaRepository -> Banco: SELECT * FROM prova\n(filtrado via RLS por auth_user_id)
activate Banco
Banco --> ProvaRepository: provasEncontradas
deactivate Banco

ProvaRepository --> Service: List<Prova>
deactivate ProvaRepository

Service -> Prova: agruparPorStatus()
activate Prova
Prova --> Service: provasAgrupadas\n{rascunho, publicada, encerrada, antiga}
deactivate Prova

Service --> Controller: ListaProvasDTO
deactivate Service

Controller --> Tela: 200 OK\nListaProvasDTO
deactivate Controller

Tela --> Usuario: exibir Rascunho,\nPublicada, Encerrada e Antiga
deactivate Tela

== Aplicar filtros opcionais ==

opt usuário aplica filtros
    Usuario -> Tela: informar turma, semestre,\nmateriaId ou professorId
    activate Tela

    Tela -> Controller: GET /provas?turma=&semestre=&materiaId=&professorId=
    activate Controller

    Controller -> Service: filtrarProvas(usuarioId, filtros)
    activate Service

    Service -> ProvaRepository: buscarComFiltros(usuarioId, filtros)
    activate ProvaRepository

    ProvaRepository -> Banco: SELECT * FROM prova\nWHERE status IN (...)\n  AND turma = $turma\n  AND semestre = $semestre\n  AND materia_id = $materiaId\n  AND professor_id = $professorId\n(filtros opcionais, via RLS)
    activate Banco
    Banco --> ProvaRepository: provasFiltradas
    deactivate Banco

    ProvaRepository --> Service: List<Prova>
    deactivate ProvaRepository

    alt há provas compatíveis
        Service -> Prova: agruparPorStatus()
        activate Prova
        Prova --> Service: provasAgrupadas
        deactivate Prova

        Service --> Controller: ListaProvasDTO
        deactivate Service

        Controller --> Tela: 200 OK\nListaProvasDTO
        deactivate Controller

        Tela --> Usuario: atualizar listagem filtrada
        deactivate Tela
    else nenhum resultado encontrado
        Service --> Controller: ListaProvasDTO(vazia)
        deactivate Service

        Controller --> Tela: 200 OK\nestadoVazio
        deactivate Controller

        Tela --> Usuario: exibir mensagem de estado vazio
        deactivate Tela
    end
end

@enduml
```

<div align="center">
  <strong>Figura X+1 — Diagrama de Sequência — UC02.</strong><br><em>Fonte: elaboração própria.</em>
</div>

---

## UC03 — Criar prova a partir da home

```plantuml
@startuml DiagramaSequenciaUC03
title UC03 — Criar prova a partir da home

autonumber
skinparam sequenceArrowThickness 2
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true
skinparam ParticipantPadding 25
skinparam BoxPadding 10

actor "Professor" as Professor
boundary "Home / Nova Prova" as Tela
boundary "ProvaController" as Controller
control "ProvaService" as Service
database "ProvaRepository" as ProvaRepository
database "MateriaRepository" as MateriaRepository
entity "Prova" as Prova
database "Banco de Dados" as Banco

== Abrir formulário de criação ==

Professor -> Tela: clicar em "Criar prova"
activate Tela

Tela -> Controller: GET /provas/nova
activate Controller

Controller -> Service: buscarDadosFormulario(professorId)
activate Service

Service -> MateriaRepository: listarPorProfessor(professorId)
activate MateriaRepository

MateriaRepository -> Banco: SELECT m.*\nFROM materia m\nJOIN materia_professor mp\n  ON mp.materia_id = m.id\nWHERE mp.professor_id = $1
activate Banco
Banco --> MateriaRepository: materiasVinculadas
deactivate Banco

MateriaRepository --> Service: List<Materia>
deactivate MateriaRepository

Service --> Controller: FormularioProvaDTO
deactivate Service

Controller --> Tela: 200 OK\nFormularioProvaDTO
deactivate Controller

Tela --> Professor: exibir campos obrigatórios\n(titulo, modalidade, materia, turma, semestre)
deactivate Tela

== Criar prova como rascunho ==

Professor -> Tela: preencher titulo, modalidade,\nmateriaId, turma e semestre
activate Tela

Tela -> Controller: POST /provas\nCriarProvaDTO\n{titulo, modalidade, materiaId, turma, semestre}
activate Controller

Controller -> Service: criarRascunho(professorId, dto)
activate Service

Service -> Service: validarCamposObrigatorios(dto)

alt campos válidos
    Service -> Prova: criarRascunho(dto, professorId)
    activate Prova
    Prova --> Service: Prova(status = "rascunho")
    deactivate Prova

    Service -> ProvaRepository: salvar(Prova)
    activate ProvaRepository

    note right of ProvaRepository
      O banco executa automaticamente
      o trigger validar_professor_materia_prova,
      garantindo que o professor está
      vinculado à matéria informada.
    end note

    ProvaRepository -> Banco: INSERT INTO prova\n(professor_id, materia_id, titulo,\n modalidade, turma, semestre,\n status = 'rascunho')
    activate Banco
    Banco --> ProvaRepository: provaPersistida
    deactivate Banco

    ProvaRepository --> Service: Prova
    deactivate ProvaRepository

    Service --> Controller: ProvaDTO
    deactivate Service

    Controller --> Tela: 201 Created\nProvaDTO
    deactivate Controller

    Tela --> Professor: redirecionar para editor da prova
    deactivate Tela

else campo obrigatório ausente
    Service --> Controller: erroValidacao
    deactivate Service

    Controller --> Tela: 400 Bad Request\nmensagensDeErro
    deactivate Controller

    Tela --> Professor: destacar campos inválidos
    deactivate Tela

else professor não vinculado à matéria (erro de trigger)
    Service -> ProvaRepository: salvar(Prova)
    activate ProvaRepository

    ProvaRepository -> Banco: INSERT INTO prova (...)
    activate Banco
    Banco --> ProvaRepository: EXCEPTION — professor não\nvinculado à matéria
    deactivate Banco

    ProvaRepository --> Service: erroVinculo
    deactivate ProvaRepository

    Service --> Controller: erroVinculo
    deactivate Service

    Controller --> Tela: 422 Unprocessable Entity\n"Professor não vinculado à matéria"
    deactivate Controller

    Tela --> Professor: exibir mensagem de erro
    deactivate Tela
end

@enduml
```

<div align="center">
  <strong>Figura X+2 — Diagrama de Sequência — UC03.</strong><br><em>Fonte: elaboração própria.</em>
</div>


### 3.2.5. Diagrama de Atividades ou Estados (sprint 3)

*Ao menos um fluxo relevante em UML ou BPMN. Use a notação da ferramenta escolhida de forma consistente (sem misturar convenções).*

### 3.2.6. Diagrama de Implantação (sprints 4 e 5)

*Diagrama UML de deployment mostrando nós físicos, artefatos e canais de comunicação. Representa a visão Engineering + Technology do RM-ODP.*

### 3.2.7. Padrões de Projeto Aplicados (sprints 3 a 5)

Esta seção documenta os padrões de projeto adotados no backend da plataforma do Instituto Ponte, justificando cada decisão com base em uma necessidade real identificada durante o desenvolvimento. Para cada padrão, são indicados os princípios SOLID que o sustentam, os requisitos funcionais e regras de negócio relacionados, e o impacto concreto sobre a qualidade e a manutenibilidade do sistema.

---

### 1. Repository Pattern

**Descrição**

O padrão Repository isola toda a lógica de acesso ao banco de dados em classes dedicadas — `ProfessorRepository`, `ProvaRepository`, `ProvaAlunoRepository`, `CorrecaoRepository`, entre outros — de modo que nenhuma outra camada da aplicação escreve SQL diretamente. O restante do sistema interage com essas classes por meio de métodos com nomes expressivos de domínio, como `findByLink`, `findRespostasPorQuestao` e `upsert`.

**Necessidade real**

O banco de dados do projeto utiliza PostgreSQL com Supabase, com múltiplas tabelas interligadas por chaves estrangeiras e triggers de validação (`validar_professor_materia_prova`, `validar_transicao_e_publicacao_prova`, entre outros). Sem um repositório intermediário, os serviços precisariam conhecer a estrutura física do banco — nomes de colunas, JOINs, condições de unicidade —, criando um acoplamento que tornaria qualquer alteração de schema (como a remoção da tabela `aluno` documentada em 20/05/2026 nos registros do projeto) um trabalho de refatoração amplo e arriscado.

**Requisitos relacionados**: RF001, RF002, RF003, RF009, RF014, RF017, RF019 — todos os requisitos que envolvem persistência de dados.

**Regras relacionadas**: RN01, RN07, RN08, RN14, RN16, RN18.

**Princípios SOLID aplicados**

- **S — Responsabilidade Única**: cada repositório é responsável exclusivamente pelo acesso a dados de uma entidade ou agregado específico.
- **D — Inversão de Dependência**: os serviços dependem de abstrações (`IProvaRepository`) em vez de implementações concretas baseadas em `pg.Pool`, facilitando a troca de banco de dados em testes ou em migrações futuras.

---

### 2. Service Layer (Camada de Serviço)

**Descrição**

Toda regra de negócio da aplicação reside em classes de serviço — `ProvaService`, `CorrecaoService`, `ProvaAlunoService`, `ResultadoService` etc. — que orquestram chamadas a repositórios, aplicam validações de domínio e retornam resultados enriquecidos para os controladores. Os controladores apenas traduzem requisições HTTP em chamadas de serviço e devolvem as respostas ao cliente.

**Necessidade real**

A plataforma possui regras de negócio complexas: uma prova só pode ser publicada se tiver questões completas com enunciados, alternativas corretamente configuradas, período definido e professor vinculado à matéria (RN01, RN03, RN18). Sem uma camada de serviço, essas validações seriam duplicadas em diferentes controladores (o da prova, o do professor, o do coordenador), violando o princípio DRY e gerando inconsistências. O `ProvaService.publicar()` centraliza toda essa lógica em um único ponto auditável.

**Requisitos relacionados**: RF001, RF002, RF005, RF007, RF008, RF014 e todos os demais que envolvem regras de fluxo.

**Regras relacionadas**: RN01, RN03, RN04, RN05, RN06, RN07, RN08, RN09, RN12, RN13, RN14, RN17, RN18, RN19, RN20.

**Princípios SOLID aplicados**

- **S — Responsabilidade Única**: o controlador cuida do protocolo HTTP; o serviço cuida da lógica de negócio; o repositório cuida da persistência.
- **O — Aberto/Fechado**: um novo fluxo de validação (ex.: limite de questões por prova) pode ser adicionado ao serviço sem modificar controladores ou repositórios.

---

### 3. DTO com Validação por Schema (Zod)

**Descrição**

Todos os dados de entrada da API são validados por schemas Zod antes de chegarem ao serviço. O `fastify-type-provider-zod` integra os schemas diretamente ao roteamento do Fastify, garantindo que uma requisição malformada seja rejeitada na borda da aplicação, com mensagem de erro padronizada, sem nunca alcançar a camada de serviço.

**Necessidade real**

A plataforma coleta dados pessoais de alunos (nome, CPF, e-mail) em conformidade com a LGPD (RF009, US08 CR-02), além de receber uploads de arquivos, LaTeX e configurações de tempo de prova. Sem validação centralizada, cada serviço precisaria tratar entradas inválidas individualmente, aumentando o risco de injeção de dados maliciosos no banco, violando o RNF de Segurança e quebrando constraints do PostgreSQL em runtime com mensagens de erro opacas para o cliente.

**Requisitos relacionados**: RF004, RF005, RF006, RF007, RF009, RF012 e todos os endpoints de criação e atualização.

**Regras relacionadas**: RN03, RN04, RN05, RN08.

**Princípios SOLID aplicados**

- **S — Responsabilidade Única**: a validação de entrada é responsabilidade do schema, não do serviço nem do repositório.
- **I — Segregação de Interfaces**: schemas distintos para criação (`ProvaCreateSchema`), atualização (`ProvaUpdateSchema`) e resposta (`ProvaResponseSchema`) evitam que clientes recebam campos internos do banco (como `auth_user_id`).

---

### 4. Strategy Pattern — Estratégia de Correção

**Descrição**

O `CorrecaoService` encapsula duas estratégias distintas de correção acessíveis pelo mesmo contrato de interface: `corrigirManual()` e `corrigirAutomatico()`. A primeira atribui nota e observação inseridas pelo professor; a segunda compara a alternativa marcada pelo aluno com o gabarito armazenado em `alternativa.correta` e calcula a nota proporcionalmente à `pontuacao_max` da `prova_questao`. A função `corrigir_objetivas_automaticamente` no banco de dados implementa a mesma lógica na camada SQL para operações em lote.

**Necessidade real**

As US12 e US13 definem explicitamente dois comportamentos de correção que devem coexistir na mesma prova: questões discursivas exigem correção manual com nota atribuída pelo professor; questões de múltipla escolha e verdadeiro/falso são corrigidas automaticamente ao final do envio. Se a lógica de cada estratégia estivesse espalhada por condicionais `if/else` no controlador ou repositório, adicionar um terceiro tipo (ex.: correção semiautomática com sugestão por IA) exigiria modificações em múltiplos pontos, violando o princípio Aberto/Fechado.

**Requisitos relacionados**: RF005, RF014, RF015 (US12, US13).

**Regras relacionadas**: RN13.

**Princípios SOLID aplicados**

- **O — Aberto/Fechado**: novas estratégias de correção podem ser adicionadas sem alterar o `CorrecaoController`.
- **D — Inversão de Dependência**: o controlador depende da abstração `CorrecaoService`, não da implementação específica de cada algoritmo de correção.

---

### 5. State Pattern — Máquina de Estados da Prova

**Descrição**

A entidade `Prova` percorre um ciclo de vida bem definido com transições válidas unidirecionais: `rascunho → publicada → encerrada → antiga`. A entidade `ProvaAluno` segue ciclo próprio: `nao_iniciada → em_andamento → enviada → corrigida`. O `ProvaService` e o `ProvaAlunoService` centralizam a lógica de transição de estado, rejeitando transições inválidas antes que cheguem ao banco. O trigger `validar_transicao_e_publicacao_prova` no PostgreSQL aplica a mesma restrição como segunda linha de defesa.

**Necessidade real**

A RN01 proíbe edição de provas encerradas ou antigas; a RN05 impede que alunos iniciem uma prova fora do período ou cujo status não seja `publicada`; a US11 bloqueia alterações de respostas após o status `enviada`. Sem um controle de estado explícito, essas regras seriam implementadas como condicionais avulsas em diferentes controladores, levando a inconsistências. O histórico de transições é registrado em `prova_status_historico` (RF001, RF020), o que tornaria um controle distribuído ainda mais difícil de auditar.

**Requisitos relacionados**: RF001, RF007, RF020 (UC02, UC06, UC07, UC11).

**Regras relacionadas**: RN01, RN05.

**Princípios SOLID aplicados**

- **S — Responsabilidade Única**: `ProvaService.publicar()`, `ProvaService.encerrar()` e `ProvaService.arquivar()` são métodos distintos, cada um responsável por uma transição específica.
- **O — Aberto/Fechado**: um novo estado (ex.: `suspensa`) pode ser adicionado sem reescrever os métodos das transições existentes.

---

### 6. Chain of Responsibility — Middleware de Autenticação e Autorização

**Descrição**

As requisições ao backend percorrem uma cadeia de hooks do Fastify antes de atingir o handler de rota: (1) verificação de token de sessão OAuth2 (`AuthService.verificarSessao`); (2) identificação do perfil do usuário (Professor, Coordenador ou acesso anônimo para o portal do aluno); (3) verificação de permissão por perfil (ex.: apenas professores podem publicar provas; apenas coordenadores podem gerar relatórios). Cada elo da cadeia interrompe o fluxo e retorna HTTP 401 ou 403 se a condição não for satisfeita.

**Necessidade real**

A RN18 especifica que a verificação de autorização deve ocorrer no backend em todas as rotas protegidas, independentemente do frontend. O projeto possui três perfis com permissões assimétricas: o aluno acessa apenas por link UUID sem sessão (RN08); o professor cria, edita e corrige (RN18); o coordenador tem acesso de leitura e geração de relatórios (RF018, RF019). Centralizar essas verificações em middlewares garante que nenhum controlador esqueça de validar a autorização e facilita a adição de logs de auditoria (`AvaliacaoLog`) em um único ponto da cadeia.

**Requisitos relacionados**: RF002, RF018, RF019, RF021 (US01, RNF Segurança).

**Regras relacionadas**: RN18, RN19.

**Princípios SOLID aplicados**

- **S — Responsabilidade Única**: autenticação (validar quem é o usuário) e autorização (validar o que pode fazer) são elos separados da cadeia.
- **O — Aberto/Fechado**: um novo perfil (ex.: `monitor`) pode ser inserido na cadeia sem modificar os handlers existentes.

---

### 7. Singleton — Pool de Conexões com o Banco de Dados

**Descrição**

O arquivo `src/database/pool.ts` exporta uma única instância de `pg.Pool` configurada via variável de ambiente `DATABASE_URL`. Todos os repositórios importam e reutilizam esse mesmo pool, sem criar conexões independentes. A configuração detecta automaticamente se o banco é local (sem SSL) ou remoto via Supabase (com SSL), garantindo compatibilidade nos dois ambientes.

**Necessidade real**

O PostgreSQL impõe limites ao número de conexões simultâneas. O RNF de Capacidade exige suporte a 50 usuários simultâneos (sprints de carga); sem um pool centralizado, cada requisição abriria e fecharia sua própria conexão, esgotando rapidamente os recursos do banco Supabase no plano gratuito. O Singleton garante que o pool seja inicializado uma única vez na subida do servidor e compartilhado entre todas as requisições concorrentes.

**Requisitos relacionados**: RNF Capacidade (suporte a ≥ 50 usuários simultâneos), RNF Desempenho (p95 < 500 ms).

**Princípios SOLID aplicados**

- **D — Inversão de Dependência**: os repositórios recebem o pool como dependência injetada ou o importam de um módulo centralizado — nunca criam conexões próprias.

---

### 8. Observer Pattern — Triggers de Auditoria e Atualização Automática

**Descrição**

O banco de dados implementa múltiplos triggers que reagem a eventos de escrita nas tabelas principais: `set_atualizado_em` atualiza automaticamente o campo `atualizado_em` em todas as entidades mutáveis; `registrar_status_prova` insere um registro em `prova_status_historico` sempre que o status de uma prova muda; `gerar_qr_code_prova` atualiza o campo `qr_code` toda vez que `url_acesso` é definida. No nível da aplicação, o `AnalyticsService.registrarLog()` funciona como um observador que persiste eventos relevantes em `avaliacao_log` após cada ação do usuário.

**Necessidade real**

A US16 exige que logs com data e contexto mínimo sejam gerados para erros de upload, submissões e acessos (RF016). A RF008 exige que URL e QR Code sejam gerados conjuntamente ao publicar a prova. Implementar essas responsabilidades dentro dos métodos principais dos serviços aumentaria a complexidade ciclomática e acoplaria o fluxo de negócio com preocupações transversais (auditoria, notificação). O padrão Observer — especialmente via triggers no banco — garante que essas ações ocorram de forma confiável mesmo que a aplicação falhe após a escrita principal.

**Requisitos relacionados**: RF008, RF017, RF020 (US07, US16).

**Regras relacionadas**: RN07.

**Princípios SOLID aplicados**

- **S — Responsabilidade Única**: o serviço principal não precisa saber como o log é gravado; o observador (`AnalyticsService` ou trigger SQL) cuida disso.
- **O — Aberto/Fechado**: novos observadores (ex.: envio de notificação push) podem ser adicionados sem modificar os serviços que disparam os eventos.

---

### 9. Facade Pattern — Serviço como Fachada de Múltiplos Repositórios

**Descrição**

Operações complexas que envolvem múltiplas entidades são expostas como um único método de serviço. Por exemplo, `ResultadoService.exportarExcel()` coordena internamente chamadas a `ProvaAlunoRepository`, `CorrecaoRepository` e `ResultadoRepository`, consolida os dados e devolve um `Buffer` pronto para download — tudo isso invisível ao `ResultadoController`, que apenas chama `exportarExcel(provaId)` e repassa o buffer na resposta HTTP.

**Necessidade real**

A US14 exige que a exportação de resultados contenha alunos nas linhas e questões/notas nas colunas, alertando sobre pendências antes de exportar. Expor essa complexidade diretamente no controlador forçaria o controlador a orquestrar múltiplos repositórios e aplicar regras de negócio, violando o princípio de Responsabilidade Única e duplicando lógica em outros endpoints que precisam dos mesmos dados (ex.: liberação de resultados por e-mail).

**Requisitos relacionados**: RF017, RF027, RF028 (US14, US15).

**Regras relacionadas**: RN14, RN15, RN16.

**Princípios SOLID aplicados**

- **S — Responsabilidade Única**: o controlador só faz HTTP; o serviço faz a orquestração; cada repositório faz seu acesso a dados.
- **I — Segregação de Interfaces**: o controlador não precisa conhecer nenhum repositório individualmente.

---

### 10. Factory Method — Geração de Relatórios e Exportações

**Descrição**

O `RelatorioService.gerar()` recebe um parâmetro `tipo` (`desempenho_geral`, `por_aluno`, `por_questao`, `por_materia`) e delega a construção do conteúdo para métodos internos especializados, sem que o chamador precise conhecer como cada tipo de relatório é montado. O mesmo princípio se aplica à geração de arquivos Excel no `ResultadoService`, onde a estrutura de linhas e colunas é construída internamente conforme o contexto da prova.

**Necessidade real**

O coordenador precisa acessar relatórios de diferentes granularidades (RF019, US16). Se a lógica de construção de cada tipo estivesse no controlador ou em um único método monolítico, adicionar um novo tipo de relatório exigiria modificar código existente — violando o princípio Aberto/Fechado. O Factory Method permite que cada variante seja adicionada como um novo método interno sem tocar no contrato público do serviço.

**Requisitos relacionados**: RF017, RF019 (US14, US16).

**Regras relacionadas**: RN17.

**Princípios SOLID aplicados**

- **O — Aberto/Fechado**: novos tipos de relatório são adicionados sem modificar `RelatorioController` nem a assinatura pública de `RelatorioService.gerar()`.
- **D — Inversão de Dependência**: o controlador não sabe como cada relatório é construído, apenas que o serviço sabe fazê-lo.

---

### Resumo: Matriz Padrão × Princípio SOLID × Requisito

| Padrão de Projeto              | S | O | L | I | D | Requisitos Centrais               | Regras Centrais        |
|-------------------------------|---|---|---|---|---|-----------------------------------|------------------------|
| Repository Pattern            | ✓ | · | ✓ | · | ✓ | RF001, RF002, RF009, RF017        | RN01, RN08, RN14       |
| Service Layer                 | ✓ | ✓ | · | · | · | RF001, RF002, RF005, RF007, RF014 | RN01–RN20 (geral)      |
| DTO / Zod Schema              | ✓ | · | · | ✓ | · | RF004, RF005, RF009, RF012        | RN03, RN04, RN08       |
| Strategy (Correção)           | · | ✓ | · | · | ✓ | RF005, RF014, RF015               | RN13                   |
| State (Status da Prova)       | ✓ | ✓ | · | · | · | RF001, RF007, RF020               | RN01, RN05             |
| Chain of Responsibility       | ✓ | ✓ | · | · | · | RF002, RF018, RF021               | RN18, RN19             |
| Singleton (Pool)              | · | · | · | · | ✓ | RNF Capacidade, RNF Desempenho    | —                      |
| Observer (Triggers / Log)     | ✓ | ✓ | · | · | · | RF008, RF020                      | RN07                   |
| Facade (Service → Repos)      | ✓ | · | · | ✓ | · | RF017, RF027, RF028               | RN14, RN15, RN16       |
| Factory Method (Relatórios)   | · | ✓ | · | · | ✓ | RF017, RF019                      | RN17                   |

**Legenda SOLID**: S = Single Responsibility · O = Open/Closed · L = Liskov Substitution · I = Interface Segregation · D = Dependency Inversion

## 3.3. Wireframes (sprint 2)

### Visualização das telas do **aluno** a partir das USER STORIES: US-06, US-08, US-09, US-10, US-11

<div align="center">
  <img src="../assets/tela_de_instrucao.jpg">
</div>

<div align="center">
  <strong>Figura # — Tela de instrucao.</strong><br> <em>
    Fonte: elaboração própria, feita usando a ferramenta do figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/tela_de_prova.jpg">
</div>

<div align="center">
  <strong>Figura # — Tela de prova.</strong><br> <em>
    Fonte: elaboração própria, feita usando a ferramenta do figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/tela_de_revisao.jpg">
</div>

<div align="center">
  <strong>Figura # — Tela de revisao.</strong><br> <em>
    Fonte: elaboração própria, feita usando a ferramenta do figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/tela_de_aviso.jpg">
</div>

<div align="center">
  <strong>Figura # — Tela de aviso.</strong><br> <em>
    Fonte: elaboração própria, feita usando a ferramenta do figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/tela_de_pre_entrega.jpg">
</div>

<div align="center">
  <strong>Figura # — Tela de revisão pré-entrega.</strong><br> <em>
    Fonte: elaboração própria, feita usando a ferramenta do figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/tela_de_entrega.jpg">
</div>

<div align="center">
  <strong>Figura # — Tela de entrega.</strong><br> <em>
    Fonte: elaboração própria, feita usando a ferramenta do figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/tela_de_conclusao.jpg">
</div>

<div align="center">
  <strong>Figura # — Tela de conclusão.</strong><br> <em>
    Fonte: elaboração própria, feita usando a ferramenta do figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

### Visualização de telas do **coordenador** A partir das USER STORIES: US-01, US-14, US-15, US-16 

<div align="center">
  <img src="../assets/wireframes_coordenador/tela_de_acesso_login.jpg" width="850">
</div>

<div align="center">
  <strong>Figura 1 — Tela de Login.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_coordenador/tela_de_acesso_cadastro.jpg" width="850">
</div>

<div align="center">
  <strong>Figura 2 — Tela de Cadastro.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_coordenador/tela_do_painel_do_coordenador.jpg" width="850">
</div>

<div align="center">
  <strong>Figura 3 — Painel do Coordenador.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_coordenador/tela_gestao_alunos.jpg" width="850">
</div>

<div align="center">
  <strong>Figura 4 — Gestão de Alunos.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_coordenador/tela_novo_aluno.jpg" width="850">
</div>

<div align="center">
  <strong>Figura 5 — Cadastro de Novo Aluno.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_coordenador/tela_edicao_aluno.jpg" width="850">
</div>

<div align="center">
  <strong>Figura 6 — Edição de Aluno.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_coordenador/tela_perfil_aluno.jpg" width="850">
</div>

<div align="center">
  <strong>Figura 7 — Perfil do Aluno.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_coordenador/tela_gestao_professores.jpg" width="850">
</div>

<div align="center">
  <strong>Figura 8 — Gestão de Professores.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_coordenador/tela_novo_professor.jpg" width="850">
</div>

<div align="center">
  <strong>Figura 9 — Cadastro de Novo Professor.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_coordenador/tela_edicao_professor.jpg" width="850">
</div>

<div align="center">
  <strong>Figura 10 — Edição de Professor.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_coordenador/tela_perfil_professor.jpg" width="850">
</div>

<div align="center">
  <strong>Figura 11 — Perfil do Professor.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_coordenador/tela_de_provas.jpg" width="850">
</div>

<div align="center">
  <strong>Figura 12 — Gestão de Provas.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_coordenador/tela_nova_prova.jpg" width="850">
</div>

<div align="center">
  <strong>Figura 13 — Criação de Nova Prova.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_coordenador/tela_criacao_prova.jpg" width="850">
</div>

<div align="center">
  <strong>Figura 14 — Estruturação da Prova.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_coordenador/tela_nova_questao.jpg" width="850">
</div>

<div align="center">
  <strong>Figura 15 — Criação de Nova Questão.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_coordenador/tela_banco_questoes.jpg" width="850">
</div>

<div align="center">
  <strong>Figura 16 — Banco de Questões.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_coordenador/tela_compartilhar_prova.jpg" width="850">
</div>

<div align="center">
  <strong>Figura 17 — Compartilhamento de Prova.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_coordenador/tela_correcao_prova.jpg" width="850">
</div>

<div align="center">
  <strong>Figura 18 — Correção de Prova.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_coordenador/tela_correcao_por_item.jpg" width="850">
</div>

<div align="center">
  <strong>Figura 19 — Correção por Item.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_coordenador/tela_liberacao_das_notas.jpg" width="850">
</div>

<div align="center">
  <strong>Figura 20 — Liberação das Notas.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_coordenador/tela_logout.jpg" width="850">
</div>

<div align="center">
  <strong>Figura 21 — Tela de Logout.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

### Visualização de telas do **professor** A partir das USER STORIES: US-01, US-02, US-03, US-04, US-05, US-07, US-12, US-13, US-15

<div align="center">
  <img src="../assets/wireframes_professor/Painel.png" width="850">
</div>

<div align="center">
  <strong>Figura 22 — Painel do Professor.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_professor/Provas.png" width="850">
</div>

<div align="center">
  <strong>Figura 23 — Provas.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_professor/Banco de Questões.png" width="850">
</div>

<div align="center">
  <strong>Figura 24 — Banco de Questões.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_professor/Correção.png" width="850">
</div>

<div align="center">
  <strong>Figura 25 — Correção das Provas.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_professor/Liberação de Nota.png" width="850">
</div>

<div align="center">
  <strong>Figura 26 — Liberação de Nota.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_professor/Nova Prova.png" width="850">
</div>

<div align="center">
  <strong>Figura 27 — Nova Prova.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_professor/Prova.png" width="850">
</div>

<div align="center">
  <strong>Figura 28 — Prova com suas questões.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_professor/Compartilhar prova.png" width="850">
</div>

<div align="center">
  <strong>Figura 29 — Compartilhar Prova.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_professor/Nova Questao.png" width="850">
</div>

<div align="center">
  <strong>Figura 30 — Nova Questão.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/wireframes_professor/Questao.png" width="850">
</div>

<div align="center">
  <strong>Figura 31 — Correção de questão.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o 
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=14-210&p=f&t=ueNC5oJRQc9NjNEb-0">
      Link
    </a>.
  </em>
</div>


## 3.4. Guia de estilos (sprint 3)

O Style Guide da plataforma **Corrije Aí** foi desenvolvido para garantir consistência visual, acessibilidade e uma experiência intuitiva para todos os usuários (alunos, professores e coordenadores). O sistema de design segue princípios de design SaaS educacional com foco em simplicidade, confiança e organização.

### Princípios de Design

- **Visual minimalista:** uso generoso de espaço em branco para evitar sobrecarga cognitiva.
- **Hierarquia clara:** tipografia responsiva em 7 níveis distintos.
- **Bordas arredondadas:** radius entre 8px e 16px para suavidade visual.
- **Acessibilidade:** contraste mínimo AA (WCAG 2.1) em todas as combinações de cores.
- **Componentes modulares:** botões, inputs e cards reutilizáveis com estados bem definidos.
- **Grid responsivo:** sistema adaptativo de 4, 8 ou 12 colunas conforme breakpoint.
- **Espaçamento consistente:** escala baseada em múltiplos de 4px (4, 8, 16, 24, 32, 48, 64).

### Breakpoints Responsivos

| Dispositivo | Largura | Grid |
|---|---:|---:|
| Mobile | < 768px | 4 colunas |
| Tablet | 768px – 1023px | 8 colunas |
| Desktop | ≥ 1024px | 12 colunas |

### 3.4.1 Cores

A paleta de cores da Corrije Aí transmite confiança (azul escuro), energia positiva (amarelo), clareza (ciano) e simplicidade (tons neutros). Todas as combinações foram testadas para conformidade **WCAG AA**.

#### Cores Principais

| Nome | Função | Código HEX | Uso Principal | Contraste de Texto |
|---|---|---|---|---|
| Amarelo | Primária | `#FFDE59` | CTAs principais, destaques, badges | Texto escuro (`#05245F`) |
| Ciano | Secundária | `#009799` | Links, elementos interativos, acentos | Texto branco (`#FFFFFF`) |
| Azul Escuro | Estrutural | `#05245F` | Cabeçalhos, textos principais, bordas | Texto branco (`#FFFFFF`) |
| Branco Suave | Background | `#F2F2F2` | Fundos de página, áreas de conteúdo | Texto escuro (`#000000`) |
| Preto | Texto | `#000000` | Texto principal, ícones | Texto branco (`#FFFFFF`) |

#### Cores de Feedback

| Estado | Código HEX | Aplicação |
|---|---|---|
| Sucesso | `#22C55E` | Confirmações, aprovações, resultados positivos |
| Erro | `#EF4444` | Validações falhadas, avisos críticos, exclusões |
| Aviso | `#F59E0B` | Alertas moderados, campos obrigatórios |
| Informação | `#3B82F6` | Tooltips, mensagens neutras, ajuda contextual |

#### Exemplos de Uso

```css
/* Botão primário */
background: #FFDE59;
color: #05245F;

/* Input com foco */
border: 1.5px solid #009799;
background: #F2F2F2;

/* Input com erro */
border: 1.5px solid #EF4444;
background: #FEF2F2;
```

### 3.4.2 Tipografia

A tipografia utiliza três famílias de fontes com funções específicas para garantir legibilidade e hierarquia visual em todos os dispositivos.

#### Famílias de Fonte

| Família | Pesos Usados | Função | Aplicação |
|---|---|---|---|
| Poppins | 300 (Light), 500 (Medium) | Títulos e subtítulos | H1, H2, H3, labels de botões |
| Inter | 400 (Regular) | Corpo de texto | Parágrafos, inputs, descrições |
| JetBrains Mono | 400 (Regular) | Código e dados técnicos | Badges, códigos hexadecimais, endpoints |

#### Escala Tipográfica (Desktop)

| Nível | Tag | Tamanho | Peso | Família | Uso |
|---:|---|---:|---:|---|---|
| 1 | H1 | 48px | 500 | Poppins | Títulos de página principal |
| 2 | H2 | 32px | 500 | Poppins | Seções principais |
| 3 | H3 | 24px | 500 | Poppins | Subsecções e cards |
| 4 | Subtítulo | 20px | 300 | Poppins | Descrições de seção |
| 5 | Padrão | 16px | 400 | Inter | Corpo de texto |
| 6 | Secundário | 14px | 400 | Inter | Metadados, timestamps |
| 7 | Pequeno | 12px | 400 | Inter | Labels, ajuda |

#### Tipografia Responsiva

| Elemento | Mobile (< 768px) | Tablet (768–1023px) | Desktop (≥ 1024px) |
|---|---:|---:|---:|
| H1 | 32px | 40px | 48px |
| H2 | 24px | 28px | 32px |
| H3 | 20px | 22px | 24px |
| Subtítulo | 18px | 18px | 20px |
| Texto padrão | 16px | 16px | 16px |
| Texto secundário | 14px | 14px | 14px |
| Texto pequeno | 12px | 12px | 12px |

**Nota:** Títulos (H1–H3) aumentam progressivamente para aproveitar espaço em telas maiores, enquanto textos de corpo permanecem consistentes para manter legibilidade.

#### Line-height (altura de linha)

- **Títulos (Poppins):** 1.1 – 1.2 (compacto para impacto visual).
- **Corpo de texto (Inter):** 1.6 – 1.7 (confortável para leitura prolongada).
- **Código (JetBrains Mono):** 1.4 (otimizado para dados técnicos).

### 3.4.3 Iconografia e imagens 

#### Sistema de Ícones

A plataforma utiliza ícones lineares da biblioteca **Lucide React** (variante moderna do Heroicons), com estilo minimalista e *stroke* consistente.

**Especificações técnicas:**

- **Stroke width:** 1.5px
- **Tamanhos padrão:** 14px (inline), 16px (texto), 20px (botões), 24px (cards)
- **Cor primária:** `#05245F` (azul escuro)
- **Cor secundária:** `#6B7280` (cinza neutro para metadados)

**Ícones utilizados:**

| Ícone | Componente Lucide | Contexto de Uso |
|---|---|---|
| 📄 | `FileText` | Provas, documentos, arquivos |
| 👥 | `Users` | Submissões, alunos, turmas |

#### Diretrizes de Uso

- **Alinhamento:** ícones devem estar verticalmente centralizados com o texto adjacente.
- **Espaçamento:** margem de 6–8px entre ícone e texto.
- **Estados interativos:** reduzir opacidade para 70% em estado *disabled*.
- **Containers de ícones:** background `#F2F2F2`, dimensões 44×44px, border-radius 12px.

#### Imagens e Assets

**Logotipo:**

- **Formato:** PNG com fundo transparente.
- **Dimensões máximas:** 340px (largura) × 100px (altura).
- **Container:** fundo branco (`#FFFFFF`), padding 32px, border-radius 16px.
- **Sombra:** `0 4px 16px rgba(0,0,0,0.1)`.

<div align="center">
  <strong>Figura 32 — Style guide.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue o
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=418-10782&t=6EwlpwAERlPfGWIS-0">
      Link
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/style_Guide.png" width="850">
</div>

**Componente `ImageWithFallback`:** todas as imagens devem usar o componente `ImageWithFallback` para garantir tratamento de erros e carregamento progressivo:

```tsx
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";

<ImageWithFallback
  src={imageSrc}
  alt="Descrição acessível"
  className="w-full object-contain"
/>
```

**Diretrizes para imagens:**

- **Aspect ratio:** preservar proporção original.
- **object-fit:** `contain` para logos/ícones; `cover` para backgrounds.
- **Lazy loading:** nativo via `loading=\"lazy\"` quando apropriado.
- **Alt text:** sempre descritivo e contextual para acessibilidade.

#### Recursos Adicionais

- Fonte Poppins: Google Fonts
- Fonte Inter: Google Fonts
- Fonte JetBrains Mono: Google Fonts
- Ícones Lucide: https://lucide.dev

## 3.5 Protótipo de alta fidelidade (sprint 3)

As telas a seguir apresentam recortes do protótipo de alta fidelidade do Corrije Aí. O protótipo completo pode ser visualizado no link público do Figma:

<div align="center">
  <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=372-2092&p=f&t=KHZxl8QX36lqNdaW-0">
    telas do protótipo
  </a>
  •
  <a href="https://spool-cobalt-21834134.figma.site">
    fluxo (coordenador/professor)
  </a>
  •
  <a href="https://gravy-craft-64395734.figma.site">
    fluxo (aluno)
  </a>.
</div>

<div align="center">
  <strong>Figura 33 — Tela de login do professor.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue as
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=372-2092&p=f&t=KHZxl8QX36lqNdaW-0">
      telas do protótipo
    </a>
    e o
    <a href="https://spool-cobalt-21834134.figma.site">
      fluxo (coordenador/professor)
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/Prototipo_imagens/Tela_de_login_do_professor.png" width="850">
</div>

<div align="center">
  <strong>Figura 34 — Tela de home do professor.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue as
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=372-2092&p=f&t=KHZxl8QX36lqNdaW-0">
      telas do protótipo
    </a>
    e o
    <a href="https://spool-cobalt-21834134.figma.site">
      fluxo (coordenador/professor)
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/Prototipo_imagens/Tela_de_Home_do_coordenador.png" width="850">
</div>

<div align="center">
  <strong>Figura 35 — Tela de nova prova.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue as
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=372-2092&p=f&t=KHZxl8QX36lqNdaW-0">
      telas do protótipo
    </a>
    e o
    <a href="https://spool-cobalt-21834134.figma.site">
      fluxo (coordenador/professor)
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/Prototipo_imagens/Tela_de_nova_prova.png" width="850">
</div>

<div align="center">
  <strong>Figura 36 — Tela de instrução de prova.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue as
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=372-2092&p=f&t=KHZxl8QX36lqNdaW-0">
      telas do protótipo
    </a>
    e o
    <a href="https://gravy-craft-64395734.figma.site">
      fluxo (aluno)
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/Prototipo_imagens/Tela_de_instrução.png" width="850">
</div>

<div align="center">
  <strong>Figura 37 — Tela de início de prova.</strong><br><em>
    Fonte: elaboração própria, feita usando a ferramenta do Figma, segue as
    <a href="https://www.figma.com/design/hT0ZlGn9DAz64Y1gIwFVrM/corrije-ai?node-id=372-2092&p=f&t=KHZxl8QX36lqNdaW-0">
      telas do protótipo
    </a>
    e o
    <a href="https://gravy-craft-64395734.figma.site">
      fluxo (aluno)
    </a>.
  </em>
</div>

<div align="center">
  <img src="../assets/Prototipo_imagens/Tela _Início_de_Prova.png" width="850">
</div>

## 3.6. Modelagem do banco de dados (sprints 2 e 4)

### 3.6.1. Modelo Entidade-Relacionamento (ER) (sprint 2)


Antes da implementação física do banco de dados, foi realizada a modelagem das informações do sistema por meio do Modelo Entidade-Relacionamento (MER) e do Diagrama Entidade-Relacionamento (DER). Esses diagramas têm como objetivo representar, em diferentes níveis de detalhamento, as principais entidades do projeto, seus atributos e os relacionamentos existentes entre elas.

O Modelo Entidade-Relacionamento (MER) apresenta uma visão conceitual do banco de dados, focando nas entidades principais do domínio, como Pessoa, Aluno, Professor, Coordenador, Matéria, Prova, Enunciado, Alternativa, Resposta do Aluno, Correção, Feedback e Relatório. Nesse modelo, são demonstradas as relações gerais entre os elementos do sistema, como a associação entre professores e matérias, provas e enunciados, alunos e provas, além da especialização da entidade Pessoa em diferentes perfis de usuário.

```plantuml
@startuml
title Modelo Entidade-Relacionamento Conceitual - MER 

hide circle
skinparam linetype ortho
skinparam classAttributeIconSize 0

' =========================
' Usuários internos
' =========================

entity "Professor" as professor {
  * id
  --
  nome
  email
  ativo
}

entity "Coordenador" as coordenador {
  * id
  --
  nome
  email
  ativo
}

' =========================
' Organização pedagógica
' =========================

entity "Matéria" as materia {
  * id
  --
  nome
  codigo
}

entity "Tema" as tema {
  * id
  --
  nome
  descrição
}

' =========================
' Prova
' =========================

entity "Prova" as prova {
  * id
  --
  titulo
  descrição
  modalidade
  turma
  semestre
  status
  duração
  início_agendado
  fim_agendado
  link_publicação
  qr_code
}

entity "Enunciado" as enunciado {
  * id
  --
  tipo
  texto
  pontos
  limite_caracteres
  limite_palavras
  ativo
}

entity "Alternativa" as alternativa {
  * id
  --
  texto
  correta
  ordem
}

entity "Questão da Prova" as questao_prova {
  * id
  --
  ordem
  pontos
}

' =========================
' Submissão do aluno
' =========================

entity "Submissão da Prova" as submissao {
  * id
  --
  nome_aluno_informado
  email_aluno_informado
  cpf_aluno_informado
  aceite_lgpd
  status
  iniciado_em
  enviado_em
  nota_total
}

entity "Resposta da Submissão" as resposta {
  * id
  --
  texto_resposta
  rascunho
}

entity "Arquivo da Resposta" as arquivo_resposta {
  * id
  --
  arquivo_url
  nome_original
  tipo_arquivo
  tamanho
}

' =========================
' Correção
' =========================

entity "Correção" as correcao {
  * id
  --
  nota
  observação
  status
  corrigida_em
}

entity "Feedback" as feedback {
  * id
  --
  mensagem
}

' =========================
' Relatório
' =========================

entity "Relatório" as relatorio {
  * id
  --
  título
  conteúdo
  arquivo
  gerado_em
}

' =========================
' Relacionamentos conceituais
' =========================

professor }o--o{ materia : "0..N Professores lecionam 0..N Matérias"

professor ||--o{ prova : "1 Professor elabora 0..N Provas"

prova }o--o{ materia : "0..N Provas abordam 0..N Matérias"

materia ||--o{ tema : "1 Matéria possui 0..N Temas"

materia ||--o{ enunciado : "1 Matéria possui 0..N Enunciados"

tema |o--o{ enunciado : "0..1 Tema classifica 0..N Enunciados"

professor ||--o{ enunciado : "1 Professor cria 0..N Enunciados"

prova ||--o{ questao_prova : "1 Prova contém 0..N Questões"

enunciado ||--o{ questao_prova : "1 Enunciado pode ser usado em 0..N Provas"

enunciado ||--o{ alternativa : "1 Enunciado possui 0..N Alternativas"

prova ||--o{ submissao : "1 Prova recebe 0..N Submissões"

submissao ||--o{ resposta : "1 Submissão contém 0..N Respostas"

questao_prova ||--o{ resposta : "1 Questão da Prova recebe 0..N Respostas"

alternativa |o--o{ resposta : "0..1 Alternativa pode aparecer em 0..N Respostas"

resposta ||--o{ arquivo_resposta : "1 Resposta possui 0..N Arquivos"

resposta ||--o| correcao : "1 Resposta recebe 0..1 Correção"

professor ||--o{ correcao : "1 Professor realiza 0..N Correções"

correcao ||--o{ feedback : "1 Correção possui 0..N Feedbacks"

professor ||--o{ feedback : "1 Professor escreve 0..N Feedbacks"

coordenador ||--o{ relatorio : "1 Coordenador gera 0..N Relatórios"

prova ||--o{ relatorio : "1 Prova baseia 0..N Relatórios"

' =========================
' Observações conceituais
' =========================

note right of submissao
O aluno não é uma entidade do modelo.

Os dados nome, e-mail e CPF são apenas
informações digitadas no momento da submissão.

Eles não são chave primária nem únicos,
pois o aluno pode errar esses dados
e ainda assim enviar a prova.
end note

note right of professor
Professor é uma entidade independente.
Não herda de Pessoa.
end note

note right of coordenador
Coordenador é uma entidade independente.
Não herda de Pessoa.
end note

note right of questao_prova
Representa a associação entre
Prova e Enunciado.

Permite controlar ordem e pontuação
da questão dentro de uma prova específica.
end note

@enduml
```

### 3.6.2. Diagrama Entidade-Relacionamento (DER) (sprint 2)

Já o Diagrama Entidade-Relacionamento (DER) detalha essa estrutura em uma visão mais próxima da implementação no banco de dados. Nele, as entidades são representadas como tabelas, contendo seus principais atributos, tipos de dados, chaves primárias, chaves estrangeiras e restrições, como `UNIQUE` e relacionamentos obrigatórios ou opcionais. Além disso, o DER explicita tabelas associativas, como `Professor_Materia`, `Prova_Materia`, `Prova_Enunciado` e `Prova_Aluno`, utilizadas para representar relacionamentos muitos-para-muitos de forma adequada no modelo relacional.

Dessa forma, o MER contribui para a compreensão conceitual do domínio do sistema, enquanto o DER serve como base para a construção do modelo relacional e físico do banco de dados no PostgreSQL/Supabase. A partir desses diagramas, torna-se possível implementar as migrations DDL de maneira mais organizada, garantindo integridade referencial, clareza nas relações entre tabelas e consistência na estrutura dos dados.

```plantuml
@startuml
title Diagrama Entidade-Relacionamento - DER 

hide circle
skinparam linetype ortho
skinparam classAttributeIconSize 0

' =========================
' Usuários internos
' =========================

entity "Professor" as professor {
  * id : BIGSERIAL <<PK>>
  --
  nome : VARCHAR(150)
  email : VARCHAR(255) <<UNIQUE>>
  google_sub : VARCHAR(255) <<UNIQUE>>
  ativo : BOOLEAN
  criado_em : TIMESTAMPTZ
  atualizado_em : TIMESTAMPTZ
}

entity "Coordenador" as coordenador {
  * id : BIGSERIAL <<PK>>
  --
  nome : VARCHAR(150)
  email : VARCHAR(255) <<UNIQUE>>
  google_sub : VARCHAR(255) <<UNIQUE>>
  ativo : BOOLEAN
  criado_em : TIMESTAMPTZ
  atualizado_em : TIMESTAMPTZ
}

' =========================
' Organização pedagógica
' =========================

entity "Materia" as materia {
  * id : BIGSERIAL <<PK>>
  --
  nome : VARCHAR(120) <<UNIQUE>>
  codigo : VARCHAR(30) <<UNIQUE>>
  criado_em : TIMESTAMPTZ
  atualizado_em : TIMESTAMPTZ
}

entity "Tema" as tema {
  * id : BIGSERIAL <<PK>>
  --
  materia_id : BIGINT <<FK>>
  nome : VARCHAR(120)
  descricao : TEXT
  criado_em : TIMESTAMPTZ
  atualizado_em : TIMESTAMPTZ
}

entity "Professor_Materia" as professor_materia {
  * professor_id : BIGINT <<PK, FK>>
  * materia_id : BIGINT <<PK, FK>>
  --
  criado_em : TIMESTAMPTZ
}

' =========================
' Provas
' =========================

entity "Prova" as prova {
  * id : BIGSERIAL <<PK>>
  --
  professor_id : BIGINT <<FK>>
  titulo : VARCHAR(180)
  descricao : TEXT
  modalidade : VARCHAR(60)
  turma : VARCHAR(80)
  semestre : VARCHAR(20)
  status : status_prova_enum
  duracao_minutos : INTEGER
  inicio_agendado : TIMESTAMPTZ
  fim_agendado : TIMESTAMPTZ
  embaralhar_questoes : BOOLEAN
  embaralhar_alternativas : BOOLEAN
  link_publicacao : UUID <<UNIQUE>>
  qr_code_url : TEXT
  publicada_em : TIMESTAMPTZ
  encerrada_em : TIMESTAMPTZ
  criado_em : TIMESTAMPTZ
  atualizado_em : TIMESTAMPTZ
}

entity "Prova_Materia" as prova_materia {
  * prova_id : BIGINT <<PK, FK>>
  * materia_id : BIGINT <<PK, FK>>
  --
  criado_em : TIMESTAMPTZ
}

' =========================
' Banco de questões
' =========================

entity "Enunciado" as enunciado {
  * id : BIGSERIAL <<PK>>
  --
  materia_id : BIGINT <<FK>>
  tema_id : BIGINT <<FK, NULL>>
  criado_por_professor_id : BIGINT <<FK>>
  tipo : tipo_questao_enum
  texto : TEXT
  pontos_padrao : DECIMAL(6,2)
  ordem_banco : INTEGER
  limite_caracteres : INTEGER
  limite_palavras : INTEGER
  ativo : BOOLEAN
  criado_em : TIMESTAMPTZ
  atualizado_em : TIMESTAMPTZ
}

entity "Alternativa" as alternativa {
  * id : BIGSERIAL <<PK>>
  --
  enunciado_id : BIGINT <<FK>>
  texto : TEXT
  correta : BOOLEAN
  ordem : INTEGER
  criado_em : TIMESTAMPTZ
  atualizado_em : TIMESTAMPTZ
}

entity "Prova_Enunciado" as prova_enunciado {
  * id : BIGSERIAL <<PK>>
  --
  prova_id : BIGINT <<FK>>
  enunciado_id : BIGINT <<FK>>
  ordem : INTEGER
  pontos : DECIMAL(6,2)
  criado_em : TIMESTAMPTZ
}

' =========================
' Submissão do aluno
' =========================

entity "Submissao_Prova" as submissao_prova {
  * id : BIGSERIAL <<PK>>
  --
  prova_id : BIGINT <<FK>>

  nome_aluno_informado : VARCHAR(150)
  email_aluno_informado : VARCHAR(255)
  cpf_aluno_informado : VARCHAR(14)

  aceite_lgpd : BOOLEAN
  aceite_lgpd_em : TIMESTAMPTZ

  token_tentativa : UUID <<UNIQUE>>
  status : status_submissao_enum
  iniciado_em : TIMESTAMPTZ
  enviado_em : TIMESTAMPTZ
  nota_total : DECIMAL(6,2)
  criado_em : TIMESTAMPTZ
  atualizado_em : TIMESTAMPTZ
}

entity "Resposta_Submissao" as resposta_submissao {
  * id : BIGSERIAL <<PK>>
  --
  submissao_prova_id : BIGINT <<FK>>
  prova_enunciado_id : BIGINT <<FK>>
  alternativa_id : BIGINT <<FK, NULL>>
  texto_resposta : TEXT
  rascunho : BOOLEAN
  criado_em : TIMESTAMPTZ
  atualizado_em : TIMESTAMPTZ
}

entity "Arquivo_Resposta" as arquivo_resposta {
  * id : BIGSERIAL <<PK>>
  --
  resposta_submissao_id : BIGINT <<FK>>
  arquivo_url : TEXT
  nome_original : VARCHAR(255)
  tipo_mime : VARCHAR(100)
  tamanho_bytes : BIGINT
  criado_em : TIMESTAMPTZ
}

' =========================
' Correção e feedback
' =========================

entity "Correcao" as correcao {
  * id : BIGSERIAL <<PK>>
  --
  resposta_submissao_id : BIGINT <<FK, UNIQUE>>
  professor_id : BIGINT <<FK>>
  nota : DECIMAL(6,2)
  observacao : TEXT
  status : status_correcao_enum
  corrigida_em : TIMESTAMPTZ
  criado_em : TIMESTAMPTZ
  atualizado_em : TIMESTAMPTZ
}

entity "Feedback" as feedback {
  * id : BIGSERIAL <<PK>>
  --
  correcao_id : BIGINT <<FK>>
  professor_id : BIGINT <<FK>>
  mensagem : TEXT
  criado_em : TIMESTAMPTZ
  atualizado_em : TIMESTAMPTZ
}

' =========================
' Relatórios
' =========================

entity "Relatorio" as relatorio {
  * id : BIGSERIAL <<PK>>
  --
  coordenador_id : BIGINT <<FK>>
  prova_id : BIGINT <<FK>>
  titulo : VARCHAR(180)
  conteudo : TEXT
  arquivo_url : TEXT
  gerado_em : TIMESTAMPTZ
  criado_em : TIMESTAMPTZ
  atualizado_em : TIMESTAMPTZ
}

' =========================
' Observações importantes
' =========================

note right of professor
Professor é uma entidade independente.
Não existe herança com Pessoa.
end note

note right of coordenador
Coordenador é uma entidade independente.
Não existe herança com Pessoa.
end note

note right of submissao_prova
Aluno não é entidade cadastral.

Nome, e-mail e CPF são dados informados
no momento da submissão.

Esses campos não são PK nem UNIQUE,
pois podem ser digitados com erro.

Para iniciar a prova:
- aceite_lgpd deve ser true;
- aceite_lgpd_em deve estar preenchido;
- token_tentativa identifica a tentativa.
end note

note right of prova_materia
A matéria associada à prova deve estar
entre as matérias lecionadas pelo professor
que elaborou a prova.

Regra recomendada:
EXISTS Professor_Materia
(professor_id = prova.professor_id
AND materia_id = prova_materia.materia_id)
end note

note right of enunciado
Se tema_id estiver preenchido,
o tema deve pertencer à mesma matéria
do enunciado.

Regra recomendada:
tema.materia_id = enunciado.materia_id
end note

note right of prova_enunciado
Recomenda-se:

UNIQUE(prova_id, enunciado_id)
UNIQUE(prova_id, ordem)

O enunciado só pode ser associado
à prova se sua matéria estiver entre
as matérias da prova.
end note

note right of resposta_submissao
Recomenda-se:

UNIQUE(submissao_prova_id, prova_enunciado_id)

A resposta deve pertencer à mesma prova
da submissão.

A alternativa marcada deve pertencer
ao mesmo enunciado da questão respondida.

alternativa_id é NULL em questões discursivas.
end note

note right of alternativa
Para questões objetivas, recomenda-se validar:
- mínimo de alternativas;
- apenas uma correta, se for múltipla escolha simples;
- alternativas compatíveis com o tipo da questão;
- UNIQUE(enunciado_id, ordem).
end note

note right of prova
Recomenda-se validar:
- inicio_agendado < fim_agendado;
- status seguindo transições permitidas;
- prova publicada deve possuir ao menos uma questão;
- prova publicada deve possuir ao menos uma matéria;
- link_publicacao e qr_code_url obrigatórios
  quando status = publicada.
end note

note right of correcao
Cada resposta pode receber no máximo
uma correção.

Por isso, resposta_submissao_id
deve ser UNIQUE.
end note

' =========================
' Relacionamentos
' =========================

professor ||--o{ prova : "elabora"

professor ||--o{ professor_materia : "leciona"
materia ||--o{ professor_materia : "é lecionada por"

materia ||--o{ tema : "possui"
materia ||--o{ enunciado : "possui"
tema |o--o{ enunciado : "classifica"

professor ||--o{ enunciado : "cria"

prova ||--o{ prova_materia : "aborda"
materia ||--o{ prova_materia : "aparece em"

enunciado ||--o{ alternativa : "possui"

prova ||--o{ prova_enunciado : "contém"
enunciado ||--o{ prova_enunciado : "é usado em"

prova ||--o{ submissao_prova : "recebe"
submissao_prova ||--o{ resposta_submissao : "contém"

prova_enunciado ||--o{ resposta_submissao : "é respondido em"
alternativa |o--o{ resposta_submissao : "é marcada em"

resposta_submissao ||--o{ arquivo_resposta : "possui anexos"

resposta_submissao ||--o| correcao : "recebe"
professor ||--o{ correcao : "realiza"

correcao ||--o{ feedback : "possui"
professor ||--o{ feedback : "escreve"

coordenador ||--o{ relatorio : "gera"
prova ||--o{ relatorio : "baseia"

@enduml
```

### 3.6.3. Modelo Relacional e Modelo Físico

Esta seção apresenta a modelagem física do banco de dados do projeto. O modelo foi estruturado para utilização com PostgreSQL/Supabase, contemplando as tabelas principais do sistema, seus atributos, tipos de dados, chaves primárias, chaves estrangeiras, restrições e índices.


#### Modelo Físico

O modelo físico descreve como o banco será implementado no PostgreSQL/Supabase, incluindo tipos de dados, constraints e relacionamentos.

As principais decisões adotadas foram:

- Utilização de `UUID` como chave primária nas tabelas principais;
- Uso de `gen_random_uuid()` para geração automática dos identificadores;
- Definição de campos obrigatórios com `NOT NULL`;
- Uso de `FOREIGN KEY` para garantir integridade entre tabelas relacionadas;
- Uso de `UNIQUE` para impedir duplicidade em campos como e-mail;
- Uso de `TIMESTAMPTZ` para armazenar datas e horários com fuso;
- Uso de tabelas associativas para representar relacionamentos muitos-para-muitos.

#### Principais Tabelas

##### Tabela `coordenador`

A tabela `coordenador` armazena os coordenadores do sistema, responsáveis por gerenciar professores e configurar o ambiente.

Principais atributos:

- `id`: identificador único do coordenador (UUID, PK);
- `auth_user_id`: referência ao Supabase Auth (`auth.users`);
- `nome`: nome completo;
- `email`: e-mail único;
- `criado_em`: data de criação do registro;
- `atualizado_em`: data da última atualização.

##### Tabela `professor`

A tabela `professor` representa os professores cadastrados no sistema, vinculados a um coordenador.

Principais atributos:

- `id`: identificador único do professor (UUID, PK);
- `auth_user_id`: referência ao Supabase Auth;
- `coordenador_id`: referência à tabela `coordenador` (FK);
- `nome`: nome completo;
- `email`: e-mail único;
- `criado_em`: data de criação do registro;
- `atualizado_em`: data da última atualização.

##### Tabela `aluno`

A tabela `aluno` representa os estudantes cadastrados no sistema, com dados próprios e independentes.

Principais atributos:

- `id`: identificador único do aluno (UUID, PK);
- `auth_user_id`: referência ao Supabase Auth;
- `nome`: nome completo;
- `email`: e-mail único;
- `cpf`: CPF do aluno (único, opcional);
- `aceitou_termos_em`: data de aceite dos termos;
- `criado_em`: data de criação do registro;
- `atualizado_em`: data da última atualização.

##### Tabela `materia`

A tabela `materia` armazena as disciplinas disponíveis no sistema.

Principais atributos:

- `id`: identificador único da matéria;
- `nome`: nome da matéria;
- demais campos relacionados à disciplina.

##### Tabela `materia_professor`

A tabela `materia_professor` representa o relacionamento muitos-para-muitos entre matérias e professores.

Principais atributos:

- `materia_id`: referência à matéria;
- `professor_id`: referência ao professor.

A chave primária composta é formada por `materia_id` e `professor_id`, evitando que o mesmo professor seja associado à mesma matéria mais de uma vez.

#### Migrations DDL

As migrations DDL são os arquivos SQL responsáveis por criar a estrutura do banco de dados de forma reproduzível.

A migration principal do projeto está localizada em:

```text
src\backend\src\database\migrations\migration.sql
```

### 3.6.4. Consultas SQL e lógica proposicional (sprint 2)

As tabelas verdade abaixo mapeiam cada condição das consultas SQL para proposições lógicas (A, B, C, D), combinadas por conectivos ($\land$ = AND, $\lor$ = OR, $\neg$ = NOT). Cada linha da tabela representa uma combinação possível de valores verdade (V = verdadeiro, F = falso) e o resultado final da expressão.

| #1 | --- |
| --- | --- |
| **Expressão SQL** | `SELECT COUNT(*) FROM "prova_questao" pq JOIN "questao" q ON q."id" = pq."questao_id" WHERE pq."prova_id" = $1 AND q."tipo" = 'multipla_escolha' AND ((SELECT COUNT(*) FROM "alternativa" a WHERE a."questao_id" = q."id") < 2 OR (SELECT COUNT(*) FROM "alternativa" a WHERE a."questao_id" = q."id" AND a."correta" = TRUE) <> 1);` |
| **Proposições lógicas** | $A$: A questão pertence à prova informada (`pq."prova_id" = $1`) <br> $B$: A questão é de múltipla escolha (`q."tipo" = 'multipla_escolha'`) <br> $C$: A questão tem menos de 2 alternativas (`COUNT < 2`) <br> $D$: A questão não tem exatamente uma alternativa correta (`COUNT <> 1`) |
| **Expressão lógica proposicional** | $A \land B \land (C \lor D)$ |
| **Tabela Verdade** | <table><thead><tr><th>$A$</th><th>$B$</th><th>$C$</th><th>$D$</th><th>$C \lor D$</th><th>$A \land B \land (C \lor D)$</th></tr></thead><tbody><tr><td>F</td><td>F</td><td>F</td><td>F</td><td>F</td><td>F</td></tr><tr><td>F</td><td>F</td><td>F</td><td>V</td><td>V</td><td>F</td></tr><tr><td>F</td><td>F</td><td>V</td><td>F</td><td>V</td><td>F</td></tr><tr><td>F</td><td>F</td><td>V</td><td>V</td><td>V</td><td>F</td></tr><tr><td>F</td><td>V</td><td>F</td><td>F</td><td>F</td><td>F</td></tr><tr><td>F</td><td>V</td><td>F</td><td>V</td><td>V</td><td>F</td></tr><tr><td>F</td><td>V</td><td>V</td><td>F</td><td>V</td><td>F</td></tr><tr><td>F</td><td>V</td><td>V</td><td>V</td><td>V</td><td>F</td></tr><tr><td>V</td><td>F</td><td>F</td><td>F</td><td>F</td><td>F</td></tr><tr><td>V</td><td>F</td><td>F</td><td>V</td><td>V</td><td>F</td></tr><tr><td>V</td><td>F</td><td>V</td><td>F</td><td>V</td><td>F</td></tr><tr><td>V</td><td>F</td><td>V</td><td>V</td><td>V</td><td>F</td></tr><tr><td>V</td><td>V</td><td>F</td><td>F</td><td>F</td><td>F</td></tr><tr><td>V</td><td>V</td><td>F</td><td>V</td><td>V</td><td>V</td></tr><tr><td>V</td><td>V</td><td>V</td><td>F</td><td>V</td><td>V</td></tr><tr><td>V</td><td>V</td><td>V</td><td>V</td><td>V</td><td>V</td></tr></tbody></table> |

**Descrição:**
Essa consulta, utilizada no trigger `validar_transicao_e_publicacao_prova` do migration.sql, conta quantas questões de múltipla escolha em uma prova estão inválidas — seja por terem menos de 2 alternativas cadastradas, seja por não possuírem exatamente uma alternativa correta. A validação impede a publicação da prova enquanto houver questões nessa condição.

---


| #2 | --- |
| --- | --- |
| **Expressão SQL** | `SELECT e."conteudo_latex", q."tipo", q."ativa" FROM "questao" q JOIN "enunciado" e ON e."questao_id" = q."id" WHERE q."materia_id" IN (SELECT "materia_id" FROM "materia_professor" WHERE "professor_id" = $1) AND e."conteudo_latex" ILIKE '%geometria%';` |
| **Proposições lógicas** | $A$: A questão pertence a uma matéria do professor (`q."materia_id" IN (subquery)`) <br> $B$: O enunciado contém o termo "geometria" (`e."conteudo_latex" ILIKE '%geometria%'`) |
| **Expressão lógica proposicional** | $A \land B$ |
| **Tabela Verdade** | <table><thead><tr><th>$A$</th><th>$B$</th><th>$A \land B$</th></tr></thead><tbody><tr><td>F</td><td>F</td><td>F</td></tr><tr><td>F</td><td>V</td><td>F</td></tr><tr><td>V</td><td>F</td><td>F</td></tr><tr><td>V</td><td>V</td><td>V</td></tr></tbody></table> |

**Descrição:**
Essa consulta, baseada no `questao.repository.ts`, retorna questões cuja matéria esteja vinculada ao professor logado (usando IN com subquery) e cujo enunciado contenha o termo "geometria" (usando ILIKE, que é a versão case-insensitive do LIKE). Esta consulta demonstra dois operadores adicionais exigidos pelo Art. 6: `IN` (subconsulta) e `ILIKE` (busca textual).

---


| #3 | --- |
| --- | --- |
| **Expressão SQL** | `INSERT INTO "correcao" ("resposta_id", "professor_id", "nota", "tipo", "corrigida_em") SELECT ra."id", $1, pq."pontuacao_max", 'automatica', CURRENT_TIMESTAMP FROM "resposta_aluno" ra JOIN "prova_aluno" pa ON pa."id" = ra."prova_aluno_id" JOIN "prova_questao" pq ON pq."prova_id" = pa."prova_id" AND pq."questao_id" = ra."questao_id" JOIN "questao" q ON q."id" = ra."questao_id" JOIN "alternativa" a ON a."id" = ra."alternativa_id" WHERE pa."prova_id" = $1 AND pa."status" IN ('enviada', 'corrigida') AND q."tipo" IN ('multipla_escolha', 'verdadeiro_falso') AND ra."alternativa_id" IS NOT NULL ON CONFLICT ("resposta_id") DO UPDATE SET "nota" = EXCLUDED."nota", "tipo" = 'automatica', "corrigida_em" = CURRENT_TIMESTAMP;` |
| **Proposições lógicas** | $A$: A resposta pertence à prova informada (`pa."prova_id" = $1`) <br> $B$: O aluno já enviou a prova (`pa."status" IN ('enviada', 'corrigida')`) <br> $C$: A questão é objetiva (`q."tipo" IN ('multipla_escolha', 'verdadeiro_falso')`) <br> $D$: O aluno selecionou uma alternativa (`ra."alternativa_id" IS NOT NULL`) |
| **Expressão lógica proposicional** | $A \land B \land C \land D$ |
| **Tabela Verdade** | <table><thead><tr><th>$A$</th><th>$B$</th><th>$C$</th><th>$D$</th><th>$A \land B \land C \land D$</th></tr></thead><tbody><tr><td>F</td><td>F</td><td>F</td><td>F</td><td>F</td></tr><tr><td>F</td><td>F</td><td>F</td><td>V</td><td>F</td></tr><tr><td>F</td><td>F</td><td>V</td><td>F</td><td>F</td></tr><tr><td>F</td><td>F</td><td>V</td><td>V</td><td>F</td></tr><tr><td>F</td><td>V</td><td>F</td><td>F</td><td>F</td></tr><tr><td>F</td><td>V</td><td>F</td><td>V</td><td>F</td></tr><tr><td>F</td><td>V</td><td>V</td><td>F</td><td>F</td></tr><tr><td>F</td><td>V</td><td>V</td><td>V</td><td>F</td></tr><tr><td>V</td><td>F</td><td>F</td><td>F</td><td>F</td></tr><tr><td>V</td><td>F</td><td>F</td><td>V</td><td>F</td></tr><tr><td>V</td><td>F</td><td>V</td><td>F</td><td>F</td></tr><tr><td>V</td><td>F</td><td>V</td><td>V</td><td>F</td></tr><tr><td>V</td><td>V</td><td>F</td><td>F</td><td>F</td></tr><tr><td>V</td><td>V</td><td>F</td><td>V</td><td>F</td></tr><tr><td>V</td><td>V</td><td>V</td><td>F</td><td>F</td></tr><tr><td>V</td><td>V</td><td>V</td><td>V</td><td>V</td></tr></tbody></table> |

**Descrição:**
Essa consulta (UPSERT) realiza a correção automática de questões objetivas: insere um registro de correção com a pontuação máxima para cada resposta de múltipla escolha ou verdadeiro/falso que o aluno respondeu. Se já existir uma correção anterior, a nota é sobrescrita. A query utiliza JOINs entre 5 tabelas (`resposta_aluno`, `prova_aluno`, `prova_questao`, `questao`, `alternativa`) e condições com `IN` e `IS NOT NULL`. Fonte: `correcao.repository.ts`.

---


| #4 | --- |
| --- | --- |
| **Expressão SQL** | `DELETE FROM "prova_questao" WHERE "prova_id" = $1 AND "questao_id" = $2` |
| **Proposições lógicas** | $A$: A associação pertence à prova informada (`"prova_id" = $1`) <br> $B$: A associação é da questão informada (`"questao_id" = $2`) |
| **Expressão lógica proposicional** | $A \land B$ |
| **Tabela Verdade** | <table><thead><tr><th>$A$</th><th>$B$</th><th>$A \land B$</th></tr></thead><tbody><tr><td>F</td><td>F</td><td>F</td></tr><tr><td>F</td><td>V</td><td>F</td></tr><tr><td>V</td><td>F</td><td>F</td></tr><tr><td>V</td><td>V</td><td>V</td></tr></tbody></table> |

**Descrição:**
Essa consulta remove uma associação entre prova e questão na tabela associativa `prova_questao`, garantindo que apenas o vínculo específico seja deletado por meio de duas condições combinadas com AND. Fonte: `prova-questao.repository.ts`.

---


| #5 | --- |
| --- | --- |
| **Expressão SQL** | `INSERT INTO questao (titulo, tipo, ativa) VALUES ('Questão sobre lógica', 'multipla_escolha', true);` |
| **Proposições lógicas** | $A$: O título da questão foi informado (`titulo IS NOT NULL`) <br> $B$: O tipo da questão é múltipla escolha (`tipo = 'multipla_escolha'`) <br> $C$: A questão está ativa (`ativa = true`) |
| **Expressão lógica proposicional** | $A \land B \land C$ |
| **Tabela Verdade** | <table><thead><tr><th>$A$</th><th>$B$</th><th>$C$</th><th>$A \land B$</th><th>$A \land B \land C$</th></tr></thead><tbody><tr><td>F</td><td>F</td><td>F</td><td>F</td><td>F</td></tr><tr><td>F</td><td>F</td><td>V</td><td>F</td><td>F</td></tr><tr><td>F</td><td>V</td><td>F</td><td>F</td><td>F</td></tr><tr><td>F</td><td>V</td><td>V</td><td>F</td><td>F</td></tr><tr><td>V</td><td>F</td><td>F</td><td>F</td><td>F</td></tr><tr><td>V</td><td>F</td><td>V</td><td>F</td><td>F</td></tr><tr><td>V</td><td>V</td><td>F</td><td>V</td><td>F</td></tr><tr><td>V</td><td>V</td><td>V</td><td>V</td><td>V</td></tr></tbody></table> |

**Descrição:**
Essa consulta insere uma nova questão ativa de múltipla escolha no banco de dados.



## 3.7. WebAPI e endpoints (sprints 3 e 4)

*Utilize um link para outra página de documentação contendo a descrição completa de cada endpoint. Ou descreva aqui cada endpoint criado para seu sistema.* 

*Cada endpoint deve conter endereço, método (GET, POST, PUT, PATCH, DELETE), header, body, formatos de response e os status codes possíveis (200, 201, 204, 400, 401, 403, 404, 409, 422, 500).*

## 3.8. Autenticação, Autorização e Resiliência (sprint 5)

### 3.8.1. Autenticação

*Descreva o fluxo de autenticação implementado: persistência de senha com hash bcrypt/argon2 (parâmetros de custo explícitos e justificados), validação de credenciais e criação de sessão. Senhas em texto plano no banco não são aceitas.*

### 3.8.2. Controle de sessão

*Descreva o controle de sessão baseado em `session id` persistido em tabela própria, com expiração. Se optar por JWT, justifique a escolha explicando os trade-offs (stateless, não revogável, payload exposto).*

### 3.8.3. Autorização

*Descreva as regras de autorização por rota e por operação, baseadas no perfil do usuário autenticado. A verificação deve ocorrer no backend — o frontend nunca é fonte de verdade para autorização.*

### 3.8.4. Estratégias de Resiliência

*Descreva as estratégias aplicadas no tratamento de falhas de rede: timeout, retry com backoff exponencial, circuit breaker e idempotência em operações críticas (`PUT`, `DELETE`, operações de pagamento etc.).*

## 3.9. Matriz de Rastreabilidade (RTM) (sprints 3 a 5)

A matriz abaixo consolida a rastreabilidade entre Personas, RFs, RNs, Endpoints, Telas e Testes. A coluna "Status/Evidência" reflete o estado atual da implementação ao final da Sprint 3: o backend possui a estrutura completa de camadas (controllers, services, repositories, middlewares, schemas, rotas), migration SQL com triggers, índices e RLS; os endpoints prioritários (RF001 a RF008) estão implementados com validação Zod e Swagger em `/docs`; os fluxos de autenticação, correção automática e resultados ainda necessitam integração frontend.

| Persona | RF | RN | Endpoint previsto | Tela | Teste | Status/Evidência |
|---------|----|----|-------------------|------|-------|------------------|
| Professor, Coordenador | RF002 | RN18, RN19 | `/auth/google`, `/auth/callback`, `/auth/session` | Login interno | CT-UC01 | Não implementado; evidência parcial em `migration.sql` com `auth_user_id`, funções `auth_*` e RLS |
| Professor, Coordenador | RF001 | RN01 | `GET /provas` | Home de provas | CT-UC02 | Parcial — controller, service e repository implementados; rota registrada em `prova.routes.ts` |
| Professor, Coordenador | RF022 | RN02 | `GET /provas?turma=&semestre=&materiaId=&professorId=` | Home de provas com filtros | CT-UC02-FILTROS | Parcial — suporte a filtros no migration (índice `prova_filtros_index`) |
| Coordenador | RF020 | RN01 | `GET /coordenador/provas?status=` | Gestão de provas do coordenador | CT-UC02-COORD | Parcial — RLS de `prova` configurada; controller e rota scaffold |
| Professor | RF021 | RN18 | `POST /provas`, `GET /provas/{id}` | Nova prova / Editor de prova | CT-UC03 | Parcial — controller, service e repository com CRUD implementados; trigger `validar_professor_materia_prova` |
| Professor | RF003 | RN20 | `GET /questoes` | Banco de questões | CT-UC05 | Parcial — controller, service e repository implementados; migration com tabelas `questao`, `tema`, `materia` |
| Professor | RF004 | RN03 | `POST /questoes` | Nova questão / Editor de questão | CT-UC04-LATEX | Parcial — suporte a enunciado LaTeX em `enunciado.conteudo_latex` |
| Professor | RF005 | RN03 | `POST /questoes` | Nova questão / Editor de questão | CT-UC04-TIPO | Parcial — enum `questao_tipo` implementado no migration |
| Professor | RF006 | RN04 | `PUT /questoes/{id}` | Configuração da questão | CT-UC04-ANEXO | Parcial — `questao.permite_anexo` no schema |
| Professor | RF007 | RN05 | `PUT /provas/{id}/configuracoes` | Configurações da prova | CT-UC06-TEMPO | Parcial — controller `updateConfiguracoes` implementado |
| Professor | RF023 | RN06 | `PUT /provas/{id}/configuracoes` | Configurações da prova | CT-UC06-EMBARALHAR | Parcial — campos `embaralhar_questoes` e `embaralhar_alternativas` no modelo |
| Professor | RF008 | RN07 | `POST /provas/{id}/publicar` | Compartilhar prova | CT-UC07 | Parcial — trigger `gerar_qr_code_prova` e `url_acesso` no migration |
| Aluno | RF024 | RN09 | `GET /public/provas/{token}` | Portal de instruções | CT-UC08-PORTAL | Parcial — policy de RLS para acesso anônimo; controller scaffold |
| Aluno | RF009 | RN08 | `POST /public/provas/{token}/identificacao` | Identificação do aluno | CT-UC08-ID | Parcial — modelagem de `aluno` com CPF único e consentimento |
| Aluno | RF025 | RN09 | Sem endpoint próprio | Responder prova | CT-UC09-TIMER | Pendente no frontend; não há implementação atual |
| Aluno | RF010 | RN10 | Sem endpoint próprio | Responder prova | CT-UC09-ZOOM | Pendente no frontend; não há implementação atual |
| Aluno | RF011 | RN10 | Sem endpoint próprio | Responder prova | CT-UC09-LATEX | Pendente no frontend; suporte parcial no banco por enunciado em LaTeX |
| Aluno | RF012 | RN04 | `/respostas/{id}/anexos` | Responder prova / Upload | CT-UC09-UPLOAD | Não implementado; evidência parcial em `resposta_anexo` |
| Aluno | RF013 | RN11 | Sem endpoint próprio | Responder prova / Upload | CT-UC09-COMPRESSAO | Pendente no frontend; não há implementação atual |
| Aluno | RF026 | RN12 | `/provas-aluno/{id}/revisao`, `/provas-aluno/{id}/envio-final` | Revisão final | CT-UC11 | Não implementado; evidência parcial em `prova_aluno.status` e `resposta_aluno` |
| Professor | RF014 | RN13 | `/provas/{id}/correcao/questoes/{questaoId}` | Correção por questão | CT-UC12-LISTAR | Não implementado; evidência parcial em `resposta_aluno` e `correcao` |
| Professor | RF015 | RN13 | `/respostas/{id}/correcao` | Correção por questão | CT-UC12-NOTA | Não implementado; evidência parcial em `correcao.nota` e `feedback` |
| Professor | RF016 | RN13 | `/respostas/{id}/anexos` | Correção por questão / Galeria | CT-UC12-ANEXO | Não implementado; evidência parcial em `resposta_anexo` |
| Professor, Coordenador | RF017 | RN14 | `/provas/{id}/resultados/exportacao` | Resultados | CT-UC14-EXCEL | Não implementado; evidência parcial em `resultado_aluno`, `relatorio`, `exportacao_resultado` |
| Coordenador | RF018 | RN17 | `/coordenador/provas` | Painel do coordenador | CT-UC14-COORD | Não implementado; evidência parcial em RLS de coordenador |
| Coordenador | RF019 | RN17 | `/coordenador/relatorios`, `/coordenador/analytics` | Relatórios / Analytics | CT-UC16 | Não implementado; evidência parcial em `relatorio` e `avaliacao_log` |
| Professor, Coordenador | RF027 | RN15 | `/provas/{id}/resultados/liberacao-email` | Liberação de resultados | CT-UC15 | Não implementado; evidência parcial em `email_envio` |
| Coordenador | RF028 | RN16 | `/provas/{id}/anexos/exportacao` | Exportação de anexos | CT-UC14-ANEXOS | Não implementado; evidência parcial em `exportacao_resultado` e `resposta_anexo` |

# <a name="c4"></a>4. Desenvolvimento da Aplicação Web

## 4.1. Primeira versão da aplicação web (sprint 3)

Durante a sprint 3, o desenvolvimento concentrou-se na estruturação inicial da aplicação web, na definição da base técnica do backend e na consolidação dos artefatos arquiteturais necessários para orientar a implementação das próximas etapas. A primeira versão ainda não representa o fluxo completo da plataforma em produção, mas estabelece a base do sistema e reduz incertezas técnicas importantes para as sprints seguintes.

**(a) O que foi implementado**

- Estrutura inicial do backend em Node.js com Fastify, incluindo configuração de CORS, Swagger UI e validação/serialização com `fastify-type-provider-zod`.
- Configuração da conexão com PostgreSQL/Supabase por meio de `pg` e variáveis de ambiente.
- Script de execução de migrations, permitindo aplicar os arquivos SQL versionados do projeto.
- Migration inicial do banco de dados, contemplando tabelas centrais do domínio, enums, chaves estrangeiras, índices, triggers, funções auxiliares e políticas de Row Level Security (RLS).
- Estrutura inicial do frontend com Vite/React, servindo como base para a construção das telas da aplicação.
- Atualização dos artefatos de documentação técnica, incluindo diagramas UML em PlantUML, matriz de rastreabilidade e detalhamento dos casos de uso principais.

**(b) O que não foi concluído**

- Os endpoints funcionais de domínio ainda não foram implementados no backend.
- As rotas de autenticação, provas, questões, submissões, correção, resultados e analytics ainda precisam ser codificadas e integradas ao banco.
- O frontend ainda não contempla os fluxos finais de uso para professor, coordenador e aluno.
- Os testes automatizados necessários para validar endpoints, regras de negócio e integração com banco ainda não foram finalizados.
- A integração completa entre frontend, backend e banco de dados ainda está pendente.

**(c) Dificuldades técnicas enfrentadas**

A principal dificuldade técnica da sprint foi a adaptação às novas tecnologias utilizadas pelo grupo. A equipe precisou compreender melhor a organização do backend com Fastify, o uso de migrations SQL para modelar regras de negócio no banco e a relação entre autenticação, autorização e RLS no Supabase/PostgreSQL.

Também houve uma curva de aprendizado relacionada ao PlantUML. A ferramenta se mostrou versátil para representar diferentes visões do sistema, mas exigiu atenção à sintaxe, à escolha correta dos tipos de participantes e à coerência semântica dos diagramas com o restante do projeto.

**(d) Próximos passos**

Os próximos passos são programar o frontend, implementar os endpoints principais do backend e finalizar os testes necessários para o projeto. A prioridade será transformar a modelagem já documentada em fluxos funcionais, integrando as telas às rotas da API e validando os cenários centrais com testes automatizados e evidências de funcionamento.

## 4.2. Segunda versão da aplicação web (sprint 4)

*Descreva e ilustre aqui o desenvolvimento da segunda versão do sistema web, com foco no que foi consolidado entre a primeira versão funcional e o sistema operacional integrado. Utilize prints de tela para ilustrar. Indique obrigatoriamente: (a) o que foi implementado, (b) o que não foi concluído, (c) dificuldades técnicas enfrentadas e próximos passos.*

## 4.3. Versão final da aplicação web (sprint 5)

*Descreva e ilustre aqui o desenvolvimento da versão final do sistema web, com foco em refatorações, correções finais e na camada de autenticação/autorização entregue. Utilize prints de tela para ilustrar. Indique obrigatoriamente: (a) o que foi refinado ou adicionado desde a sprint 4, (b) pendências remanescentes, (c) dificuldades técnicas enfrentadas.*

# <a name="c5"></a>5. Testes

## 5.1. Relatório de testes de integração de endpoints automatizados (sprint 4)

*Liste e descreva os testes automatizados dos endpoints criados e planejados para sua solução, implementados com **Jest**. Cubra as duas abordagens:*

- ***White-box*** *— testes unitários de Service que exercitam ramos internos, exceções e regras de negócio (conhecimento da implementação).*
- ***Black-box*** *— testes de integração dos endpoints via Jest + Supertest, verificando apenas o contrato HTTP (status, body, efeito observável), sem depender da implementação interna.*

*Posicione aqui também o relatório de cobertura de testes Jest se houver (através de link ou transcrito para estrutura markdown).*

## 5.2. Testes de usabilidade (sprint 5)

### 5.2.1. Relatório de testes de guerrilha

*Posicione aqui as tabelas com enunciados de tarefas, etapas e resultados de testes de usabilidade. Ou utilize um link para seu relatório de testes (mantenha o link sempre público para visualização).*

### 5.2.2. Relatório de testes SUS (System Usability Scale)

*Posicione aqui o relatório dos testes SUS realizados.*

# <a name="c6"></a>6. Estudo de Mercado e Plano de Marketing (sprint 4)

## 6.1 Resumo Executivo

*Preencher com até 300 palavras, sem necessidade de fonte*

*Apresente de forma clara e objetiva os principais destaques do projeto: oportunidades de mercado, diferenciais competitivos da aplicação web e os objetivos estratégicos pretendidos.*

## 6.2 Análise de Mercado

*a) Visão Geral do Setor (até 250 palavras)*
*Contextualize o setor no qual a aplicação está inserida, considerando aspectos econômicos, tecnológicos e regulatórios. Utilize fontes confiáveis.*

*b) Tamanho e Crescimento do Mercado (até 250 palavras)*
*Apresente dados quantitativos sobre o tamanho atual e projeções de crescimento do mercado. Utilize fontes confiáveis.*

*c) Tendências de Mercado (até 300 palavras)*
*Identifique e analise tendências relevantes (tecnológicas, comportamentais e mercadológicas) que influenciam o setor. Utilize fontes confiáveis.*

## 6.3 Análise da Concorrência

*a) Principais Concorrentes (até 250 palavras)*
*Liste os concorrentes diretos e indiretos, destacando suas principais características e posicionamento no mercado.*

*b) Vantagens Competitivas da Aplicação Web (até 250 palavras)*
*Descreva os diferenciais da sua aplicação em relação aos concorrentes, sem necessidade de citação de fontes.*


## 6.4 Público-Alvo

*a) Segmentação de Mercado (até 250 palavras)*
Descreva os principais segmentos de mercado a serem atendidos pela aplicação. Utilize bases de dados e fontes confiáveis.*

*b) Perfil do Público-Alvo (até 250 palavras)*
*Caracterize o público-alvo com dados demográficos, psicográficos e comportamentais, incluindo necessidades específicas. Utilize fontes obrigatórias.*


## 6.5 Posicionamento

*a) Proposta de Valor Única (até 250 palavras)*
*Defina de maneira clara o que torna a sua aplicação única e valiosa para o mercado.*

*b) Estratégia de Diferenciação (até 250 palavras)*
*Explique como sua aplicação se destacará da concorrência, evidenciando a lógica por trás do posicionamento.*

## 6.6 Estratégia de Marketing 

*a) Produto/Serviço (até 200 palavras)*
*Descreva as funcionalidades, benefícios e diferenciais da aplicação*

*b) Preço (até 200 palavras)*
*Explique o modelo de precificação adotado e justifique com base nas análises anteriores.*

*c) Praça (Distribuição) (até 200 palavras)*
*Apresente os canais digitais utilizados para distribuir e entregar a aplicação ao público.*

*d) Promoção (até 200 palavras)*
*Descreva as estratégias digitais planejadas, como SEO, redes sociais, marketing de conteúdo e campanhas pagas.*

# <a name="c7"></a>7. Conclusões e trabalhos futuros (sprint 5)

*Escreva de que formas a solução da aplicação web atingiu os objetivos descritos na seção 2 deste documento. Indique pontos fortes e pontos a melhorar de maneira geral.*

*Relacione os pontos de melhorias evidenciados nos testes com planos de ações para serem implementadas. O grupo não precisa implementá-las, pode deixar registrado aqui o plano para ações futuras*

*Relacione também quaisquer outras ideias que o grupo tenha para melhorias futuras*

# <a name="c8"></a>8. Referências (sprints 1 a 5)

ABONG – Associação Brasileira de Organizações Não Governamentais. **Panorama das Associações Brasileiras de Organizações da Sociedade Civil**. São Paulo: ABONG, 2021. Disponível em: https://www.abong.org.br. Acesso em: 1 mai. 2025.

CAF – Charities Aid Foundation. **World Giving Index 2022**. West Malling: CAF, 2022. Disponível em: https://www.cafonline.org/docs/default-source/about-us-publications/caf_world_giving_index_2022_210922-final.pdf. Acesso em: 1 mai. 2025.

BRASIL. Lei nº 13.709, de 14 de agosto de 2018. **Lei Geral de Proteção de Dados Pessoais (LGPD)**. Brasília: Presidência da República, 2018. Disponível em: http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm. Acesso em: 1 mai. 2025.

FUNDAÇÃO ESTUDAR. **Relatório de Impacto 2023**. São Paulo: Fundação Estudar, 2023. Disponível em: https://www.estudar.org.br/relatorio-de-impacto. Acesso em: 1 mai. 2025.

FUNDAÇÃO LEMANN. **Relatório Anual 2022**. São Paulo: Fundação Lemann, 2022. Disponível em: https://fundacaolemann.org.br/relatorio-anual. Acesso em: 1 mai. 2025.

GIFE – Grupo de Institutos, Fundações e Empresas. **Mapeamento do Investimento Social Privado no Brasil**. São Paulo: GIFE, 2021. Disponível em: https://gife.org.br/publicacoes. Acesso em: 1 mai. 2025.

IDIS – Instituto para o Desenvolvimento do Investimento Social. **Doação Brasil 2022**. São Paulo: IDIS, 2022. Disponível em: https://idis.org.br/pesquisa/doacao-brasil. Acesso em: 1 mai. 2025.

IDIS – Instituto para o Desenvolvimento do Investimento Social. **Censo GIFE 2020**. São Paulo: IDIS/GIFE, 2020. Disponível em: https://idis.org.br. Acesso em: 1 mai. 2025.

INSTITUTO PONTE. **TAPI – Termo de Abertura do Projeto Inteli**. Vitória: Instituto Ponte, 2024. (Documento interno fornecido pelo parceiro ao Inteli.)

IPEA – Instituto de Pesquisa Econômica Aplicada. **Desigualdades socioeducacionais no Brasil: acesso, permanência e aprendizado**. Brasília: IPEA, 2021. (Texto para Discussão, n. 2644). Disponível em: https://repositorio.ipea.gov.br. Acesso em: 1 mai. 2025.

ISO/IEC 25010:2011. **Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models**. Geneva: ISO, 2011.

ITAÚ SOCIAL. **Avaliação de Impacto em Educação: desafios e perspectivas**. São Paulo: Fundação Itaú Social, 2020. Disponível em: https://www.itausocial.org.br/publicacoes. Acesso em: 1 mai. 2025.

MCKINSEY & COMPANY. **High-performing NGOs: unlocking their potential**. Nova York: McKinsey, 2022. Disponível em: https://www.mckinsey.com/featured-insights/social-sector. Acesso em: 1 mai. 2025.

MINISTÉRIO DA EDUCAÇÃO. **Programa Universidade para Todos (ProUni)**. Brasília: MEC, 2023. Disponível em: http://prouniportal.mec.gov.br. Acesso em: 1 mai. 2025.

OECD. **Education at a Glance 2023: OECD Indicators**. Paris: OECD Publishing, 2023. Disponível em: https://doi.org/10.1787/e13bef63-en. Acesso em: 1 mai. 2025.

OECD. **Philanthropy and Education: Harnessing the Potential for Learning**. Paris: OECD Publishing, 2019. Disponível em: https://doi.org/10.1787/000e0c1e-en. Acesso em: 1 mai. 2025.

TODOS PELA EDUCAÇÃO. **Anuário Brasileiro da Educação Básica 2023**. São Paulo: Todos Pela Educação, 2023. Disponível em: https://todospelaeducacao.org.br/anuario. Acesso em: 1 mai. 2025.

TRANSPARÊNCIA BRASIL. **Organizações da Sociedade Civil: dados e transparência**. São Paulo: Transparência Brasil, 2022. Disponível em: https://www.transparencia.org.br. Acesso em: 1 mai. 2025.

UNICEF – United Nations Children's Fund. **Relatório Situação da Infância e Adolescência Brasileira 2022**. Brasília: UNICEF, 2022. Disponível em: https://www.unicef.org/brazil/relatorios. Acesso em: 1 mai. 2025.

W3C – World Wide Web Consortium. **Web Content Accessibility Guidelines (WCAG) 2.1**. W3C Recommendation, 5 June 2018. Disponível em: https://www.w3.org/TR/WCAG21. Acesso em: 1 mai. 2025.

# <a name="c9"></a>Anexos

*Inclua aqui quaisquer complementos para seu projeto, como diagramas, imagens, tabelas etc. Organize em sub-tópicos utilizando headings menores (use ## ou ### para isso)*
