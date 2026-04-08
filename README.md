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

## Deployment

`docker-compose.prod.yml` is set up for an EasyPanel / Traefik deployment of the frontend image:

- image: `ghcr.io/arthurlongue/nicattobeard:latest`
- exposed through Traefik for `nicatto.artudev.com`
- container healthcheck served from `/health`

The production compose file does not provision PostgreSQL. The database is expected to live in a separate environment and be connected externally.
