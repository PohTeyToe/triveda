# Stage 1: Install and build with pnpm + Bun
FROM node:20-slim AS builder
RUN apt-get update && apt-get install -y curl unzip && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/shared/api-client/package.json packages/shared/api-client/
COPY packages/db/package.json packages/db/
RUN pnpm install --frozen-lockfile
COPY . .
# Dereference pnpm workspace symlinks so Bun bundler can resolve deep imports
RUN rm -rf node_modules/@triveda && \
    mkdir -p node_modules/@triveda && \
    cp -rL packages/shared node_modules/@triveda/shared && \
    cp -rL packages/db node_modules/@triveda/db && \
    cp -rL packages/shared/api-client node_modules/@triveda/api-client
RUN pnpm --filter @triveda/api build

# Stage 2: Slim Bun runtime
FROM oven/bun:1.3-slim
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./
COPY --from=builder /app/apps/api/assets ./assets
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["bun", "run", "index.js"]
