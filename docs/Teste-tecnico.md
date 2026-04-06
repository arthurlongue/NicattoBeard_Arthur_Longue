# **TESTE TÉCNICO FULL STACK**

## **Escopo do teste**
**Sistema de Agendamento para Barbearia - NicattoBeard**
Um dono de barbearia está buscando um sistema simples para organizar seus atendimentos. Sua missão é construir esse sistema com backend em **Node.js** e frontend em **React**, com banco de Dados **PostgreSQL**.

### **Objetivo**
Desenvolver uma **aplicação web** onde clientes podem se cadastrar, autenticar e realizar agendamentos com barbeiros disponíveis. O administrador visualiza os agendamentos do dia e futuros de forma clara.

### **Requisitos do Sistema**

**Autenticação:**
* Cadastro e login de clientes (nome, e-mail, senha).
* O e-mail deve ser único.
* Autenticação via **JWT**.
* Apenas usuários autenticados podem acessar seus agendamentos.

**Barbeiros e Especialidades:**
* Cadastro de barbeiros com nome, idade e data de contratação.
* Cada barbeiro pode ter mais de uma especialidade (sobrancelha, corte de tesoura, barba etc.).
* Cadastro de especialidades.
* Relacionamento entre barbeiros e especialidades.

**Agendamentos:**
* Funcionamento da barbearia: todos os dias, das 8h às 18h.
* Cada atendimento dura 30 minutos.
* O cliente escolhe a especialidade desejada, um barbeiro com essa especialidade e um horário disponível.

**Regras:**
* Um barbeiro não pode ter dois atendimentos no mesmo horário.
* O cliente pode cancelar até 2 horas antes.
* O cliente pode visualizar seus agendamentos.
* O administrador pode visualizar todos os agendamentos do dia atual e agendamentos futuros.

---

## **Tecnologias Obrigatórias**
* **Node.js** (TypeScript)
* **React.js** (TypeScript)
* **Docker/docker-compose**
* **PostgreSQL**
* **JWT** para autenticação

---

## **Entrega**
Criar um repositório público no GitHub ou Bitbucket com o nome: **NicattoBeard_seu_nome**.

Incluir:
* **README.md** com passo a passo para rodar o projeto.
* **Diagrama Entidade-Relacionamento** na raiz do projeto.
* **Scripts SQL** de criação do banco de dados.

Enviar o link do repositório para gabriel.nascimento@nicatto.com.br e thiago.lino@nicatto.com.br. O prazo final de entrega é de 7 dias após o recebimento, e entregas antecipadas são bem-vindas.

---

## **Critérios de Avaliação**
* Clareza e organização do código.
* Lógica e estrutura do banco de dados.
* Controle de regras de negócio (agendamento, conflitos, cancelamentos).
* Boas práticas de segurança e autenticação.
* Integração entre front-end e back-end.
* Capricho e documentação.
