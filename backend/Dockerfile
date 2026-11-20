FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# -------------------------------------------------------------
# Stage 1: Build
# -------------------------------------------------------------
FROM base AS builder
WORKDIR /app

# Copy root manifest and lockfiles
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy packages
COPY packages ./packages
COPY backend ./backend

# Install dependencies for backend and packages
RUN pnpm install --frozen-lockfile

# Build shared package and backend
RUN pnpm --filter @app/shared run build 2>/dev/null || true
RUN pnpm --filter @app/backend run build

# -------------------------------------------------------------
# Stage 2: Production Runner
# -------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3333
ENV HOST=0.0.0.0

# Copy workspace manifests, shared package and compiled backend output
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY backend/package.json ./backend/package.json
COPY --from=builder /app/backend/build ./backend/build

# Install production dependencies only (supports workspace:* for @app/shared)
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

WORKDIR /app/backend
EXPOSE 3333

CMD ["node", "build/bin/server.js"]
