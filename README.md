# NicattoBeard

A full-stack technical evaluation project for Nicatto, featuring a React frontend and a Node.js backend.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Base UI, Framer Motion
- **Backend:** Node.js, Express 5, TypeScript, PostgreSQL (pg driver)
- **Deployment:** Docker, Docker Compose, EasyPanel (Traefik)

## Structure

- `/frontend`: React application built with Vite
- `/backend`: Node.js Express server
- `docker-compose.yml`: Local Docker environment with Postgres
- `docker-compose.prod.yml`: Production Docker setup mapped for EasyPanel

## Running Locally

### Using Docker (Recommended)

To spin up the entire application stack including a local PostgreSQL instance:

```bash
docker-compose up --build
```

- Web interface will be available at `http://localhost:3000`
- Local PostgreSQL runs on port `5432` (User: `admin`, Password: `adminpassword`, DB: `nicattobeard_db`)

### Manual Development

**1. Install & run Frontend**
```bash
cd frontend
pnpm install
pnpm dev
```

**2. Install & run Backend**
```bash
cd backend
pnpm install
pnpm dev
```

## Deployment

This application includes configuration (`docker-compose.prod.yml`) optimized for deployment via EasyPanel. The production deployment pulls an external Docker image and routes traffic at the designated domain (`nicatto.artudev.com`) using Traefik labels.
