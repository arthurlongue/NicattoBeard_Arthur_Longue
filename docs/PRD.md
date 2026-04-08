# PRD - NicattoBeard

## 1. Visao geral

NicattoBeard e uma aplicacao web para organizar os atendimentos de uma barbearia. O produto permite que clientes criem conta, facam login, escolham um barbeiro de acordo com a especialidade desejada e reservem horarios disponiveis em slots fixos de 30 minutos. O administrador acompanha os agendamentos do dia e os proximos atendimentos para operar a barbearia com clareza.

## 2. Objetivo do produto

- Reduzir conflitos de agenda entre clientes e barbeiros.
- Centralizar o historico e os proximos agendamentos em uma unica aplicacao.
- Dar previsibilidade operacional para o administrador com uma visao simples da agenda atual e futura.

## 3. Perfis de usuario

- Cliente: cria conta, autentica, consulta seus agendamentos, agenda e cancela dentro da regra permitida.
- Administrador: autentica no mesmo sistema com permissao elevada e consulta todos os agendamentos do dia atual e futuros. Na primeira versao, o usuario administrador e criado via seed do banco de dados.
- Barbeiro: faz parte do dominio operacional, mas nao possui login proprio na primeira versao.

## 4. Escopo da versao do teste

### Incluido

- Cadastro e login de clientes com JWT.
- Controle de usuarios por papel (`customer` e `admin`).
- Cadastro e listagem de barbeiros.
- Cadastro e listagem de especialidades.
- Relacionamento entre barbeiros e especialidades.
- Listagem de disponibilidade por barbeiro e data.
- Criacao de agendamentos.
- Cancelamento de agendamento com antecedencia minima de 2 horas.
- Visualizacao dos agendamentos do proprio cliente.
- Visualizacao administrativa dos agendamentos do dia atual e futuros.

### Fora de escopo

- Pagamentos.
- Notificacoes por e-mail ou WhatsApp.
- Login para barbeiros.
- Reagendamento com preservacao do mesmo registro.
- Controle de feriados, pausas de almoco e escalas variaveis por barbeiro.

## 5. Regras de negocio

- A barbearia funciona todos os dias das 08:00 as 18:00.
- Cada atendimento possui duracao fixa de 30 minutos.
- O cliente escolhe uma especialidade antes de selecionar o barbeiro.
- Um barbeiro so pode ser escolhido se atender a especialidade selecionada.
- Um barbeiro nao pode ter dois atendimentos ativos no mesmo horario.
- O cliente so pode visualizar e cancelar os proprios agendamentos.
- O cancelamento so pode ocorrer ate 2 horas antes do inicio do atendimento.
- O administrador pode visualizar todos os agendamentos do dia atual e qualquer agendamento futuro.
- O e-mail do usuario deve ser unico no sistema.

## 6. Jornadas principais

### 6.1 Cadastro e autenticacao

1. O visitante informa nome, e-mail e senha.
2. O sistema valida unicidade do e-mail e persiste um usuario com papel `customer`.
3. O usuario realiza login e recebe um JWT.
4. O JWT protege rotas privadas de agenda.

### 6.2 Criacao de agendamento

1. O cliente autenticado lista especialidades disponiveis.
2. O cliente escolhe uma especialidade e consulta barbeiros aptos.
3. O cliente seleciona barbeiro e data.
4. O sistema apresenta slots livres entre 08:00 e 18:00.
5. O cliente confirma um slot de 30 minutos.
6. O sistema grava o agendamento com status `scheduled`.

### 6.3 Cancelamento

1. O cliente acessa seus agendamentos.
2. O cliente solicita cancelamento de um item futuro.
3. O sistema valida se faltam pelo menos 2 horas para o inicio.
4. Em caso valido, o status muda para `cancelled` e o horario volta a ficar disponivel.

### 6.4 Operacao administrativa

1. O administrador autentica com `role=admin`.
2. O sistema exibe os agendamentos do dia atual.
3. O administrador pode alternar para a visao de futuros.
4. A listagem deve exibir cliente, barbeiro, especialidade, horario e status.

## 7. Requisitos funcionais

### RF01 - Cadastro de usuario

- O sistema deve permitir cadastro com `name`, `email` e `password`.
- O sistema deve rejeitar e-mails ja existentes.

### RF02 - Login

- O sistema deve autenticar usuarios validos.
- O sistema deve devolver JWT e dados basicos do usuario autenticado.

### RF03 - Gestao de barbeiros

- O sistema deve cadastrar barbeiros com `name`, `age` e `hireDate`.
- O sistema deve associar uma ou mais especialidades a cada barbeiro.

### RF04 - Gestao de especialidades

- O sistema deve permitir cadastro e listagem de especialidades.

### RF05 - Disponibilidade

- O sistema deve listar slots livres de um barbeiro por data.
- O sistema deve considerar apenas horarios operacionais e agendamentos ativos.

### RF06 - Agendamento

- O sistema deve criar agendamento somente para barbeiro habilitado na especialidade escolhida.
- O sistema deve impedir conflito de horario do barbeiro.

### RF07 - Cancelamento

- O sistema deve permitir cancelamento apenas pelo proprio cliente.
- O sistema deve bloquear cancelamentos com menos de 2 horas de antecedencia.

### RF08 - Consultas de agenda

- O cliente deve listar apenas os proprios agendamentos.
- O administrador deve listar agendamentos do dia atual e futuros.

## 8. Requisitos nao funcionais

- Backend em Node.js com TypeScript.
- Frontend em React com TypeScript.
- Banco de dados PostgreSQL.
- Autenticacao baseada em JWT.
- Ambiente local com Docker Compose.
- Todos os horarios sao armazenados em `TIMESTAMPTZ` (UTC interno) e trafegam em ISO 8601 com offset. O fuso de referencia da operacao e `America/Sao_Paulo`.
- Gerenciamento de estado do servidor (cache, refetch, invalidacao) via TanStack Query. Estado local de UI e autenticacao gerenciado com React Context.
- Estrutura de dados e endpoints devem ser simples de entender durante a avaliacao tecnica.

## 9. Modelo de dados

O modelo completo com tabelas, campos, constraints e indices esta documentado no diagrama entidade-relacionamento: [DER.md](../DER.md).

Resumo das entidades:

- `users`: autenticacao e autorizacao (`customer` | `admin`).
- `barbers`: profissionais da barbearia, sem login proprio na v1. Possui flag `active` para desativacao.
- `specialties`: servicos oferecidos. Possui flag `active` para desativacao.
- `barber_specialties`: relacao N:N entre barbeiros e especialidades.
- `appointments`: agendamentos com status `scheduled` ou `cancelled`. A FK composta `(barber_id, specialty_id)` aponta para `barber_specialties`, garantindo integridade da associacao.

## 10. Criterios de aceite

### Cadastro e login

- Cadastro com e-mail novo deve funcionar.
- Cadastro com e-mail repetido deve falhar com erro de validacao.
- Login com credenciais validas deve retornar token JWT.
- Rotas privadas sem token valido devem responder com erro de autenticacao.

### Agendamento

- Um cliente autenticado deve conseguir agendar um horario livre.
- O sistema deve rejeitar agendamento para barbeiro sem a especialidade selecionada.
- O sistema deve rejeitar dois agendamentos ativos do mesmo barbeiro no mesmo horario.
- O sistema deve rejeitar horarios fora da faixa 08:00-18:00.
- O sistema deve rejeitar duracoes diferentes de 30 minutos.

### Cancelamento

- O cliente deve conseguir cancelar um agendamento com mais de 2 horas de antecedencia.
- O sistema deve rejeitar cancelamento com menos de 2 horas de antecedencia.

### Consultas

- O cliente deve visualizar apenas agendamentos do proprio usuario.
- O administrador deve visualizar todos os agendamentos do dia atual e futuros.

## 11. Backlog sugerido apos a entrega

- Reagendamento nativo.
- Pausas e bloqueios de agenda por barbeiro.
- Confirmacao de presenca.
- Painel de indicadores.
- Notificacoes automaticas para cliente e administrador.
