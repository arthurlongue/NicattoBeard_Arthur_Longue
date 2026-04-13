FROM node:20-alpine AS deps

RUN corepack enable && corepack prepare pnpm@10.23.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

RUN pnpm install --frozen-lockfile

FROM deps AS build

COPY backend ./backend
COPY frontend ./frontend

RUN pnpm --dir backend build
RUN pnpm --dir frontend build

FROM node:20-alpine AS runtime

RUN corepack enable && corepack prepare pnpm@10.23.0 --activate

ENV NODE_ENV=production
ENV PORT=3001

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/package.json

RUN pnpm install --filter ./backend... --prod --frozen-lockfile

COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/frontend/dist ./frontend/dist

EXPOSE 3001

WORKDIR /app/backend

USER node

CMD ["node", "dist/server.js"]
