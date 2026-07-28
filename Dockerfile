# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
COPY patches/ ./patches/

RUN pnpm install --frozen-lockfile

COPY . .

# Vite (frontend → dist/public) + esbuild (api → dist/index.js)
RUN pnpm run build

# ─── Stage 2: Production image ───────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts
COPY --from=builder /app/dist ./dist

# Copy public assets (images, PWA icons)
COPY --from=builder /app/public/images ./dist/public/images
COPY --from=builder /app/public/logo.png ./dist/public/logo.png
COPY --from=builder /app/public/logo-192.png ./dist/public/logo-192.png
COPY --from=builder /app/public/logo-512.png ./dist/public/logo-512.png

# SQLite volume directory
RUN mkdir -p /app/data

ENV DB_PATH=/app/data/hotel.db
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

CMD ["node", "dist/index.js"]
