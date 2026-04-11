# NicattoBeard

Technical evaluation for a barbershop scheduling platform.

It includes:

- a React 19 + Vite frontend
- an Express 5 + TypeScript backend
- a PostgreSQL schema with seed data
- supporting product, API, and data-model documentation

## Tech Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS v4, Base UI, Motion
- Backend: Node.js, Express 5, TypeScript, PostgreSQL
- Tooling: pnpm, Biome, Docker, Docker Compose

## Running Locally

### Quick Start

```bash
docker compose up --build
```

Prerequisite: Docker + Docker Compose.

This starts the full stack and initializes the database automatically on first run.

| Service    | URL                        |
|------------|----------------------------|
| Frontend   | http://localhost:5173       |
| Backend API| http://localhost:3001       |
| PostgreSQL | localhost:5432              |

### Test Credentials

| Role     | Email                       | Password      |
|----------|-----------------------------|---------------|
| Admin    | admin@nicattobeard.com      | Admin@123     |
| Customer | joao.silva@example.com      | Cliente@123   |

### Useful Commands

```bash
docker compose up --build   # Start all services
docker compose down         # Stop all services
docker compose down -v      # Stop and reset database (full re-seed on next start)
docker compose logs -f      # Follow logs from all services
```

Seeded data includes barbers, specialties, barber-specialty links, and sample appointments.

### Manual Development (without Docker)

**Prerequisites:** Node.js 20+, pnpm, PostgreSQL 15+

1. Copy the env examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. Start PostgreSQL and apply the SQL files:

```bash
psql postgresql://admin:adminpassword@localhost:5432/nicattobeard_db -f database/sql/001_schema.sql
psql postgresql://admin:adminpassword@localhost:5432/nicattobeard_db -f database/sql/002_seed.sql
```

3. Install and run the backend:

```bash
cd backend
pnpm install
pnpm dev
```

4. Install and run the frontend:

```bash
cd frontend
pnpm install
pnpm dev
```

**Ports:** Frontend `5173`, Backend API `3001`, PostgreSQL `5432`

## Documentation

- Product requirements: `docs/PRD.md`
- API contract: `docs/API.md`
- Full ERD and modeling notes: `DER.md`

## Database Model

Quick visual reference:

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
- `appointments -> barber_specialties`: the composite FK `(barber_id, specialty_id)` ensures an appointment only uses a specialty actually offered by that barber.

## Deployment

`docker-compose.prod.yml` contains the frontend deployment setup for EasyPanel / Traefik. PostgreSQL is expected to be provided externally in production.
