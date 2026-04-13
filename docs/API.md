# API alvo - NicattoBeard

Este documento define o contrato esperado para a primeira versao da API. A base path sugerida e `/api`.

## Bootstrap local

- `pnpm dev`: sobe frontend + backend juntos pela raiz.
- `pnpm docker:dev`: sobe stack Docker pela raiz.
- O frontend usa proxy `/api` para o backend local.

## Formato de erros

Todas as respostas de erro seguem o formato abaixo:

```json
{
  "error": "CONFLICT",
  "message": "Este horario ja esta ocupado para o barbeiro selecionado",
  "details": {
    "barberId": 1,
    "startAt": "2026-04-08T10:00:00-03:00"
  }
}
```

- `error`: codigo curto e constante do erro (ex: `CONFLICT`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`).
- `message`: descricao legivel para exibicao.
- `details`: objeto opcional com campos contextuais do erro.
- JSON malformado no corpo deve responder `400` com `error=BAD_REQUEST`.
- Rotas `/api/*` inexistentes devem responder `404` no mesmo formato JSON.

## Convencao de validacao de entrada

- TypeScript sozinho nao protege entrada HTTP em runtime.
- Ao implementar endpoints, validar `body`, `params` e `query` antes de entrar na regra de negocio.
- `Zod` e abordagem recomendada para esses contratos de entrada no backend.
- Erro de validacao deve responder `422` com `error=VALIDATION_ERROR`.
- Conflitos e regras de dominio continuam separados da validacao estrutural: `409` para unicidade ou conflito de agenda, `403` para permissao, `401` para autenticacao.

Exemplo sugerido para `422`:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Payload invalido",
  "details": {
    "fieldErrors": {
      "email": ["E-mail invalido"],
      "password": ["Senha deve ter pelo menos 8 caracteres"]
    }
  }
}
```

## Autenticacao

### `GET /api/health`

Endpoint simples para validar se o backend subiu no ambiente local.

Response `200`:

```json
{
  "status": "ok"
}
```

### `POST /api/auth/register`

Cria um usuario cliente.

Request:

```json
{
  "name": "Joao Silva",
  "email": "joao.silva@example.com",
  "password": "Cliente@123"
}
```

Response `201`:

```json
{
  "user": {
    "id": 2,
    "name": "Joao Silva",
    "email": "joao.silva@example.com",
    "role": "customer"
  }
}
```

Erros:

- `409` para e-mail ja cadastrado.
- `422` para payload invalido.

### `POST /api/auth/login`

Autentica usuario e retorna JWT.

Request:

```json
{
  "email": "joao.silva@example.com",
  "password": "Cliente@123"
}
```

Response `200`:

```json
{
  "token": "jwt-token",
  "user": {
    "id": 2,
    "name": "Joao Silva",
    "email": "joao.silva@example.com",
    "role": "customer"
  }
}
```

Erros:

- `401` para credenciais invalidas.
- `422` para payload invalido.

## Especialidades

### `GET /api/specialties`

Lista especialidades ativas.

Response `200`:

```json
[
  {
    "id": 1,
    "name": "Barba",
    "description": "Modelagem e acabamento de barba"
  }
]
```

### `POST /api/specialties`

Cria uma especialidade. Requer `role=admin`.

Request:

```json
{
  "name": "Corte de tesoura",
  "description": "Corte com acabamento manual"
}
```

- `description` e opcional.

Response `201`:

```json
{
  "id": 2,
  "name": "Corte de tesoura",
  "description": "Corte com acabamento manual"
}
```

Erros:

- `403` para usuario sem permissao.
- `422` para payload invalido.
- `409` para especialidade duplicada.

### `PATCH /api/specialties/:specialtyId`

Atualiza uma especialidade existente. Requer `role=admin`. Todos os campos sao opcionais. Inclui `active` para desativacao/reativacao.

Request:

```json
{
  "name": "Corte de tesoura premium",
  "description": "Corte com acabamento refinado e lavagem",
  "active": false
}
```

Response `200`:

```json
{
  "id": 2,
  "name": "Corte de tesoura premium",
  "description": "Corte com acabamento refinado e lavagem"
}
```

Erros:

- `403` para usuario sem permissao.
- `404` se a especialidade nao existir.
- `422` para payload invalido.
- `409` para nome duplicado.

## Barbeiros

### `GET /api/barbers`

Lista barbeiros ativos. Pode filtrar por especialidade.

Query params:

- `specialtyId` opcional para retornar apenas barbeiros habilitados naquela especialidade.

Response `200`:

```json
[
  {
    "id": 1,
    "name": "Rafael Costa",
    "age": 31,
    "hireDate": "2024-03-01",
    "specialties": [
      {
        "id": 1,
        "name": "Barba"
      },
      {
        "id": 2,
        "name": "Corte de tesoura"
      }
    ]
  }
]
```

### `POST /api/barbers`

Cria barbeiro. Requer `role=admin`.

Request:

```json
{
  "name": "Rafael Costa",
  "age": 31,
  "hireDate": "2024-03-01",
  "specialtyIds": [1, 2]
}
```

Response `201`:

```json
{
  "id": 1,
  "name": "Rafael Costa",
  "age": 31,
  "hireDate": "2024-03-01",
  "specialties": [
    {
      "id": 1,
      "name": "Barba"
    },
    {
      "id": 2,
      "name": "Corte de tesoura"
    }
  ]
}
```

Erros:

- `403` para usuario sem permissao.
- `422` para payload invalido (ex: idade fora do intervalo 18–100, `hireDate` futura).

### `PATCH /api/barbers/:barberId`

Atualiza dados de um barbeiro. Requer `role=admin`. Todos os campos sao opcionais. Inclui `active` para desativacao/reativacao.

Request:

```json
{
  "name": "Rafael Costa Silva",
  "age": 32,
  "active": false
}
```

Response `200`:

```json
{
  "id": 1,
  "name": "Rafael Costa Silva",
  "age": 32,
  "hireDate": "2024-03-01",
  "specialties": [
    {
      "id": 1,
      "name": "Barba"
    },
    {
      "id": 2,
      "name": "Corte de tesoura"
    }
  ]
}
```

Erros:

- `403` para usuario sem permissao.
- `404` se o barbeiro nao existir.
- `422` para payload invalido.

### `PUT /api/barbers/:barberId/specialties`

Substitui todas as especialidades de um barbeiro. Requer `role=admin`.

Request:

```json
{
  "specialtyIds": [1, 3]
}
```

Response `200`:

```json
{
  "barberId": 1,
  "specialties": [
    {
      "id": 1,
      "name": "Barba"
    },
    {
      "id": 3,
      "name": "Sobrancelha"
    }
  ]
}
```

Erros:

- `403` para usuario sem permissao.
- `404` se o barbeiro nao existir.
- `422` se algum `specialtyId` nao existir ou a lista estiver vazia.

### `GET /api/barbers/:barberId/availability?date=2026-04-08&specialtyId=1`

Lista slots disponiveis do barbeiro em uma data. O parametro `specialtyId` e obrigatorio e o sistema valida que o barbeiro atende essa especialidade. A data deve estar entre hoje e 90 dias a frente.

Response `200`:

```json
{
  "barberId": 1,
  "date": "2026-04-08",
  "specialtyId": 1,
  "slots": [
    {
      "startAt": "2026-04-08T08:00:00-03:00",
      "endAt": "2026-04-08T08:30:00-03:00"
    },
    {
      "startAt": "2026-04-08T09:00:00-03:00",
      "endAt": "2026-04-08T09:30:00-03:00"
    }
  ]
}
```

Erros:

- `404` se o barbeiro nao existir.
- `422` se a data for invalida, estiver fora da janela de 90 dias ou se o `specialtyId` estiver ausente.
- `422` se o barbeiro nao atender a especialidade informada.

## Agendamentos do cliente

### `GET /api/appointments`

Lista os agendamentos do usuario autenticado.

Response `200`:

```json
[
  {
    "id": 10,
    "status": "scheduled",
    "startAt": "2026-04-08T10:00:00-03:00",
    "endAt": "2026-04-08T10:30:00-03:00",
    "specialty": {
      "id": 2,
      "name": "Corte de tesoura"
    },
    "barber": {
      "id": 1,
      "name": "Rafael Costa"
    }
  }
]
```

### `POST /api/appointments`

Cria um agendamento para o usuario autenticado.

Request:

```json
{
  "barberId": 1,
  "specialtyId": 2,
  "startAt": "2026-04-08T10:00:00-03:00"
}
```

Regras:

- `endAt` e derivado automaticamente como `startAt + 30 minutos`.
- O horario deve estar entre 08:00 e 18:00.
- O agendamento deve estar entre hoje e 90 dias a frente.
- O barbeiro deve atender a especialidade informada.
- O slot deve estar livre.

Response `201`:

```json
{
  "id": 10,
  "status": "scheduled",
  "startAt": "2026-04-08T10:00:00-03:00",
  "endAt": "2026-04-08T10:30:00-03:00",
  "customerId": 2,
  "barberId": 1,
  "specialtyId": 2
}
```

Erros:

- `409` para conflito de horario.
- `422` para regra de negocio violada (horario fora da faixa, data fora da janela ou barbeiro sem a especialidade).

### `PATCH /api/appointments/:appointmentId/cancel`

Cancela um agendamento do proprio cliente.

Request:

```json
{
  "reason": "Imprevisto pessoal"
}
```

- `reason` e opcional.

Response `200`:

```json
{
  "id": 10,
  "status": "cancelled",
  "cancelledAt": "2026-04-07T12:00:00-03:00",
  "cancellationReason": "Imprevisto pessoal"
}
```

Erros:

- `403` se o agendamento nao pertencer ao usuario autenticado.
- `409` se faltarem menos de 2 horas para o inicio.
- `404` se o agendamento nao existir.

## Visao administrativa

### `GET /api/admin/appointments?scope=today`

Lista todos os agendamentos do dia atual. Requer `role=admin`.

### `GET /api/admin/appointments?scope=future`

Lista todos os agendamentos futuros. Requer `role=admin`.

Response `200`:

```json
[
  {
    "id": 10,
    "status": "scheduled",
    "startAt": "2026-04-08T10:00:00-03:00",
    "endAt": "2026-04-08T10:30:00-03:00",
    "customer": {
      "id": 2,
      "name": "Joao Silva"
    },
    "barber": {
      "id": 1,
      "name": "Rafael Costa"
    },
    "specialty": {
      "id": 2,
      "name": "Corte de tesoura"
    }
  }
]
```

Erros:

- `403` para usuario sem permissao administrativa.

## Convencoes gerais

- Todas as rotas privadas exigem header `Authorization: Bearer <token>`.
- Datas e horarios devem trafegar em ISO 8601 com offset (ex: `-03:00`).
- O backend armazena todos os horarios em `TIMESTAMPTZ` (UTC interno) e retorna com offset do fuso `America/Sao_Paulo`.
- O frontend deve exibir os horarios no fuso da operacao da barbearia.
- Erros de validacao devem seguir o formato descrito na secao "Formato de erros".
