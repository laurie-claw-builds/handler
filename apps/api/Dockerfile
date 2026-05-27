FROM node:20-alpine AS base
RUN npm install -g pnpm@9

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --filter @handler/api

# Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
WORKDIR /app/apps/api
# Generate Prisma client before build
RUN pnpm exec prisma generate
RUN pnpm build

# Runner stage — use slim (glibc) so mounted claude CLI binary works
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 --gid nodejs nestjs

# Copy workspace node_modules (contains all hoisted packages like @nestjs/core)
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
# Copy api-specific node_modules, dist, and prisma
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/prisma ./apps/api/prisma

USER nestjs
EXPOSE 3001
ENV PORT=3001

CMD ["node", "apps/api/dist/main.js"]
