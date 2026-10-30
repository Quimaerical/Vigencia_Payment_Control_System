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
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3333
ENV HOST=0.0.0.0

# Copy compiled backend output from builder
COPY --from=builder /app/backend/build ./

# Install production dependencies only
RUN npm ci --omit="dev"

EXPOSE 3333

CMD ["node", "bin/server.js"]
