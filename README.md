# NicattoBeard

Technical evaluation for a barbershop scheduling platform.

## Tech Stack

| Layer    | Technologies                                      |
|----------|---------------------------------------------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Base UI, Motion |
| Backend  | Node.js, Express 5, TypeScript, PostgreSQL        |
| Tooling  | pnpm, Biome, Docker, Docker Compose               |

Documentation: [`docs/PRD.md`](docs/PRD.md) (product requirements), [`docs/API.md`](docs/API.md) (API contract), [`DER.md`](DER.md) (data model).

## Running Locally

### Quick Start (Docker)

```bash
docker compose up --build
```

Prerequisite: Docker + Docker Compose.

Seeds barbers, specialties, barber-specialty links, and sample appointments on first run.

| Service     | URL                   |
|-------------|-----------------------|
| Frontend    | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| PostgreSQL  | localhost:5432        |

#### Test Credentials

| Role     | Email                  | Password    |
|----------|------------------------|-------------|
| Admin    | admin@nicattobeard.com | Admin@123   |
| Customer | joao.silva@example.com | Cliente@123 |

#### Useful Commands

```bash
docker compose up --build   # Start all services
docker compose down         # Stop all services
docker compose down -v      # Stop and reset database (full re-seed on next start)
docker compose logs -f      # Follow logs from all services
```

### Manual Development (without Docker)

**Prerequisites:** Node.js 20+, pnpm, PostgreSQL 15+

1. Copy the env examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. Apply the SQL files:

```bash
psql postgresql://admin:adminpassword@localhost:5432/nicattobeard_db -f database/sql/001_schema.sql
psql postgresql://admin:adminpassword@localhost:5432/nicattobeard_db -f database/sql/002_seed.sql
```

3. Install and run each workspace:

```bash
cd backend && pnpm install && pnpm dev
cd frontend && pnpm install && pnpm dev
```

Services are available at the same ports listed above.

## Database Model

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

## Deployment

`docker-compose.prod.yml` contains the frontend deployment setup for EasyPanel / Traefik. PostgreSQL is expected to be provided externally in production.
