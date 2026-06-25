# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json pnpm-lock.yaml* ./
COPY patches/ ./patches/

# Install ALL dependencies (including devDeps needed for build)
RUN pnpm install --frozen-lockfile

# Copy the full source
COPY . .

# Build: Vite (frontend → dist/public) + esbuild (server → dist/index.js)
RUN pnpm run build

# ─── Stage 2: Production image ───────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

WORKDIR /app

# Copy package files and install production deps only
COPY package.json pnpm-lock.yaml* ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Copy public images so the server can serve them at /images/*
COPY --from=builder /app/client/public/images ./dist/public/images
COPY --from=builder /app/client/public/logo.png ./dist/public/logo.png
COPY --from=builder /app/client/public/logo-192.png ./dist/public/logo-192.png
COPY --from=builder /app/client/public/logo-512.png ./dist/public/logo-512.png

# Create a volume-ready directory for the SQLite database
RUN mkdir -p /app/data

# The server resolves DB path relative to the compiled server file (dist/index.js → dist/)
# We override it via env so the DB lives on a named volume, not inside the image
ENV DB_PATH=/app/data/hotel.db
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Use a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

CMD ["node", "dist/index.js"]
