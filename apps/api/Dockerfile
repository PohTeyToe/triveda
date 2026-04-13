# Single stage: Bun runs TypeScript directly, no bundling needed
FROM oven/bun:1.3-slim

WORKDIR /app

# Copy everything first (node_modules excluded via .dockerignore)
COPY . .

# Use bun install for workspace resolution (no symlink issues)
RUN bun install --frozen-lockfile

EXPOSE 3001
CMD ["bun", "run", "apps/api/src/index.ts"]
