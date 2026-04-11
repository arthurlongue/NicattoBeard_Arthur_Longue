FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@10.23.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/package.json

RUN pnpm install --filter ./backend... --frozen-lockfile

COPY backend ./backend

EXPOSE 3001

WORKDIR /app/backend

CMD ["pnpm", "dev"]
