# Бэкенд «Хлопушки». Контекст сборки — корень монорепо (см. docker-compose.yml).
# Образ node:24-bookworm-slim мультиархитектурный (arm64/amd64).

FROM node:24-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS build
COPY package.json package-lock.json tsconfig.base.json ./
COPY shared/package.json shared/
COPY backend/package.json backend/
RUN npm ci --workspace=shared --workspace=backend
COPY shared shared
COPY backend backend
RUN npm run build -w shared \
 && npx -w backend prisma generate \
 && npm run build -w backend

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/shared/package.json shared/
COPY --from=build /app/shared/dist shared/dist
COPY --from=build /app/backend/package.json backend/
COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/backend/prisma backend/prisma
WORKDIR /app/backend
EXPOSE 4000
# Миграции применяются при старте контейнера, затем запускается сервер.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
