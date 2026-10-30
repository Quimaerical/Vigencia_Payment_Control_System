FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# -------------------------------------------------------------
# Stage 1: Build
# -------------------------------------------------------------
FROM base AS builder
WORKDIR /app

ENV ADAPTER=node

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY frontend ./frontend

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @app/frontend run build

# -------------------------------------------------------------
# Stage 2: Production Runner
# -------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY --from=builder /app/frontend/package.json ./package.json
COPY --from=builder /app/frontend/build ./build
COPY --from=builder /app/frontend/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "build"]
