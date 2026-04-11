# NicattoBeard

Avaliacao tecnica de uma plataforma de agendamento para barbearia.

## Tech Stack

| Layer    | Technologies                                      |
|----------|---------------------------------------------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Base UI, Motion |
| Backend  | Node.js, Express 5, TypeScript, PostgreSQL        |
| Tooling  | pnpm, Biome, Docker, Docker Compose               |

Documentacao: [`docs/PRD.md`](docs/PRD.md) (requisitos do produto), [`docs/API.md`](docs/API.md) (contrato da API), [`DER.md`](DER.md) (modelo de dados).

## Executando Localmente

### Quick Start (Docker)

```bash
pnpm docker:dev
```

Pre-requisito: Docker + Docker Compose.

Na primeira subida, carrega barbeiros, especialidades, relacoes barbeiro-especialidade e agendamentos de exemplo.

| Service     | URL                   |
|-------------|-----------------------|
| Frontend    | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| PostgreSQL  | localhost:5432        |

#### Credenciais de teste

| Role     | Email                  | Password    |
|----------|------------------------|-------------|
| Admin    | admin@nicattobeard.com | Admin@123   |
| Customer | joao.silva@example.com | Cliente@123 |

#### Comandos uteis

```bash
pnpm docker:dev     # Start all services
pnpm docker:down    # Stop all services
pnpm docker:reset   # Stop + reset DB volume
docker compose logs -f
```

### Desenvolvimento manual (sem Docker)

**Pre-requisitos:** Node.js 20+, pnpm, PostgreSQL 15+, `psql`

1. Copie os exemplos de ambiente:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. Crie o banco local e aplique os SQLs:

```bash
createdb -U admin nicattobeard_db
psql postgresql://admin:adminpassword@localhost:5432/nicattobeard_db -f database/sql/001_schema.sql
psql postgresql://admin:adminpassword@localhost:5432/nicattobeard_db -f database/sql/002_seed.sql
```

3. Instale dependencias do monorepo leve:

```bash
pnpm install
```

4. Suba front + back juntos:

```bash
pnpm dev
```

Ou rode separado:

```bash
pnpm dev:backend
pnpm dev:frontend
```

Servicos padrao:

| Servico     | URL                           |
|-------------|-------------------------------|
| Frontend    | http://localhost:5173         |
| Backend API | http://localhost:3001         |
| Healthcheck | http://localhost:3001/api/health |

Notas de dev sem Docker:

- `frontend` usa proxy `/api` para `http://localhost:3001`.
- Se `5173` estiver ocupada, o Vite sobe na proxima porta livre sozinho.
- `backend` aceita requisicoes de `localhost` e `127.0.0.1` em qualquer porta de dev, entao o CORS nao quebra quando o frontend muda.
- Se `3001` estiver ocupada, troque `PORT` no `backend/.env` e `VITE_API_PROXY_TARGET` no `frontend/.env` para a mesma URL.

Notas de Docker:

- Por padrao, Docker publica `5173`, `3001` e `5432`.
- Se alguma estiver ocupada, sobrescreva `HOST_FRONTEND_PORT`, `HOST_BACKEND_PORT` e/ou `HOST_POSTGRES_PORT`.
- Se mudar a porta publicada do frontend no Docker, tambem passe `CORS_ORIGIN=http://localhost:<porta>`.

Exemplo:

```bash
HOST_FRONTEND_PORT=5174 CORS_ORIGIN=http://localhost:5174 pnpm docker:dev
```

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
    BARBER_SPECIALTIES ||--o{ APPOINTMENTS : validates
```

- `users -> appointments`: a customer can create many appointments.
- `barbers <-> specialties`: many-to-many relation through `barber_specialties`.
- `appointments -> barber_specialties`: composite FK `(barber_id, specialty_id)` ensures an appointment only uses a specialty offered by that barber.

## Deploy

`docker-compose.prod.yml` contem a configuracao de deploy do frontend para EasyPanel / Traefik. Em producao, PostgreSQL deve ser provido externamente.
