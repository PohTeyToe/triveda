# Single stage: Bun runs TypeScript directly, no bundling needed
FROM oven/bun:1.3-slim

# pnpm for workspace resolution
RUN npm i -g pnpm@9.15.9

WORKDIR /app

# Install deps first (cached layer)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/shared/api-client/package.json packages/shared/api-client/
COPY packages/db/package.json packages/db/
RUN pnpm install --frozen-lockfile

# Copy source (node_modules excluded via .dockerignore)
COPY . .

EXPOSE 3001
CMD ["bun", "run", "apps/api/src/index.ts"]
