# NicattoBeard

Technical evaluation repository for a barbershop scheduling platform. The repository includes:

- a Vite + React 19 frontend
- an Express 5 + TypeScript backend
- PostgreSQL schema and seed scripts
- product and API documentation that describe the intended application scope

## Current Status

The repository is partially implemented.

- `frontend/` is running with the default Vite app shell and project styling/dependencies.
- `backend/` currently exposes a minimal Express server listening on port `3001`.
- `database/sql/` contains the main schema and seed data for the target domain.
- `docs/PRD.md`, `docs/API.md`, and `DER.md` describe the expected product, API contract, and data model.

## Tech Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS v4, Base UI, Motion
- Backend: Node.js, Express 5, TypeScript, PostgreSQL
- Tooling: pnpm, Biome, Docker, Docker Compose

## Repository Structure

- `frontend/`: Vite client application
- `backend/`: Express API server
- `database/sql/`: PostgreSQL schema and seed files
- `docs/`: PRD and API contract
- `DER.md`: Mermaid ER diagram
- `docker-compose.yml`: local development stack (frontend + backend + PostgreSQL)
- `docker-compose.prod.yml`: production frontend deployment for EasyPanel / Traefik

## Running Locally

### Prerequisites

- Docker and Docker Compose

### Quick Start

```bash
docker compose up --build
```

This single command starts the entire stack:

| Service    | URL                        |
|------------|----------------------------|
| Frontend   | http://localhost:5173       |
| Backend API| http://localhost:3001       |
| PostgreSQL | localhost:5432              |

The database is **automatically created and seeded** on first run — no manual SQL commands needed.

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

### Seeded Data

The database ships with sample domain data:

- 3 specialties
- 3 barbers
- barber-specialty relations
- sample scheduled and cancelled appointments

### Manual Development (without Docker)

If you prefer running services directly on your machine:

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

## Available Scripts

### Frontend

```bash
cd frontend
pnpm dev        # Start Vite dev server
pnpm build      # Production build
pnpm preview    # Preview production build
pnpm lint       # Lint with Biome
```

### Backend

```bash
cd backend
pnpm dev        # Start with ts-node-dev (hot-reload)
pnpm build      # Compile TypeScript
pnpm start      # Run compiled output
```

## Documentation

- Product requirements: `docs/PRD.md`
- API contract: `docs/API.md`
- Data model: `DER.md`

These documents describe the intended product behavior and target API surface. They are ahead of the current code implementation.

## Database Model

The ER diagram below is embedded here for quick visual reference. The full modeling notes, constraints, and indexes remain documented in `DER.md`.

```mermaid
erDiagram
    USERS {
        bigint id PK
        user_role role
        varchar name
        citext email UK
        text password_hash
        timestamptz created_at
        timestamptz updated_at
    }

    BARBERS {
        bigint id PK
        varchar name
        smallint age
        date hire_date
        boolean active
        timestamptz created_at
        timestamptz updated_at
    }

    SPECIALTIES {
        bigint id PK
        citext name UK
        text description
        boolean active
        timestamptz created_at
        timestamptz updated_at
    }

    BARBER_SPECIALTIES {
        bigint barber_id FK
        bigint specialty_id FK
        timestamptz created_at
    }

    APPOINTMENTS {
        bigint id PK
        bigint customer_id FK
        bigint barber_id FK
        bigint specialty_id FK
        appointment_status status
        timestamptz start_at
        timestamptz end_at
        timestamptz cancelled_at
        text cancellation_reason
        text notes
        timestamptz created_at
        timestamptz updated_at
    }

    USERS ||--o{ APPOINTMENTS : books
    BARBERS ||--o{ BARBER_SPECIALTIES : has
    SPECIALTIES ||--o{ BARBER_SPECIALTIES : qualifies
    BARBER_SPECIALTIES ||--o{ APPOINTMENTS : validates
```

Key relationships:

- `users -> appointments`: a customer can create many appointments.
- `barbers <-> specialties`: many-to-many relation through `barber_specialties`.
- `appointments -> barber_specialties`: the composite FK `(barber_id, specialty_id)` ensures an appointment only uses a specialty actually offered by that barber.

## Deployment

`docker-compose.prod.yml` is set up for an EasyPanel / Traefik deployment of the frontend image:

- image: `ghcr.io/arthurlongue/nicattobeard:latest`
- exposed through Traefik for `nicatto.artudev.com`
- container healthcheck served from `/health`

The production compose file does not provision PostgreSQL. The database is expected to live in a separate environment and be connected externally.
