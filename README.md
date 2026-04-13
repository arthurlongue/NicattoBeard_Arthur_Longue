# NicattoBeard

Avaliacao tecnica de uma plataforma de agendamento para barbearia.

## Tech Stack

| Layer    | Technologies                                      |
|----------|---------------------------------------------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Base UI, Motion |
| Backend  | Node.js, Express 5, TypeScript, PostgreSQL        |
| Tooling  | pnpm, Biome, Docker, Docker Compose               |

Documentacao: [`docs/PRD.md`](docs/PRD.md) (requisitos do produto), [`docs/API.md`](docs/API.md) (contrato da API), [`DER.md`](DER.md) (modelo de dados).

## Diretriz de validacao

- TypeScript tipa codigo, mas nao valida payload recebido em runtime.
- Backend usa `Zod` como camada para validar entrada na borda da aplicacao.
- Validar `req.body`, `req.params`, `req.query` e variaveis de ambiente antes da regra de negocio.
- `422` fica reservado para entrada invalida. Regras de negocio continuam na camada de servico e no banco, como e-mail duplicado, conflito de horario e janela de cancelamento.

## Rodando o projeto

**Pre-requisito:** Docker + Docker Compose.

```bash
pnpm docker:dev
```

Na primeira subida, o Postgres executa automaticamente os scripts em `database/sql/`, carregando schema + dados de exemplo (barbeiros, especialidades, relacoes e agendamentos).

| Service     | URL                       |
|-------------|---------------------------|
| Frontend    | http://localhost:5173     |
| Backend API | http://localhost:3001     |
| PostgreSQL  | localhost:5432            |

### Credenciais de teste

| Role     | Email                  | Password    |
|----------|------------------------|-------------|
| Admin    | admin@nicattobeard.com | Admin@123   |
| Customer | joao.silva@example.com | Cliente@123 |

### Comandos uteis

```bash
pnpm docker:dev     # Start all services
pnpm docker:down    # Stop all services
pnpm docker:reset   # Stop + reset DB volume
docker compose logs -f
```

### Personalizando portas

Se alguma porta estiver ocupada, copie o `.env.example` da raiz e ajuste:

```bash
cp .env.example .env
```

Variaveis disponiveis: `HOST_FRONTEND_PORT`, `HOST_BACKEND_PORT`, `HOST_POSTGRES_PORT`, `JWT_SECRET` (min 32 caracteres).

Se mudar a porta do frontend, passe tambem `CORS_ORIGIN=http://localhost:<porta>`.

## Modelo do Banco

```mermaid
erDiagram
    USERS {
        bigint id PK
        user_role role
    }

    BARBERS {
        bigint id PK
        varchar name
        boolean active
    }

    SPECIALTIES {
        bigint id PK
        citext name UK
        boolean active
    }

    BARBER_SPECIALTIES {
        bigint barber_id FK
        bigint specialty_id FK
    }

    APPOINTMENTS {
        bigint id PK
        bigint customer_id FK
        bigint barber_id FK
        bigint specialty_id FK
        appointment_status status
        timestamptz start_at
    }

    USERS ||--o{ APPOINTMENTS : books
    BARBERS ||--o{ BARBER_SPECIALTIES : has
    SPECIALTIES ||--o{ BARBER_SPECIALTIES : qualifies
    BARBER_SPECIALTIES --o{ APPOINTMENTS : validates
```

- `users -> appointments`: a customer can create many appointments.
- `barbers <-> specialties`: many-to-many relation through `barber_specialties`.
- `appointments -> barber_specialties`: composite FK `(barber_id, specialty_id)` ensures an appointment only uses a specialty offered by that barber.
