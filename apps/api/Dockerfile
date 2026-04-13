# Stage 1: Install deps with pnpm (correct workspace resolution)
FROM node:20-slim AS deps
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/shared/api-client/package.json packages/shared/api-client/
COPY packages/db/package.json packages/db/
RUN pnpm install --frozen-lockfile

# Stage 2: Bun runtime with pnpm-resolved node_modules
FROM oven/bun:1.3-slim
WORKDIR /app

# Copy pnpm node_modules (with correct workspace symlinks)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules

# Copy source
COPY . .

EXPOSE 3001
CMD ["bun", "run", "apps/api/src/index.ts"]
