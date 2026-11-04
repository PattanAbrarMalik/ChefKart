# ── Stage 1: Build frontend ──────────────────────────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
RUN npm ci --workspace frontend --ignore-scripts
COPY frontend/ ./frontend/
RUN npm run build --workspace frontend

# ── Stage 2: Production backend ─────────────────────────────────────────────
FROM node:20-alpine AS production
LABEL maintainer="ChefKart Platform"
LABEL description="ChefKart — Home Cook Discovery & Booking Platform"

# Security: run as non-root user
RUN addgroup -g 1001 -S chefkart && \
    adduser -S chefkart -u 1001 -G chefkart

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
RUN npm ci --workspace backend --omit=dev --ignore-scripts && \
    npm cache clean --force

# Copy application code
COPY backend/ ./backend/
COPY scripts/ ./scripts/

# Copy built frontend from stage 1
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Create data directory with proper permissions
RUN mkdir -p /app/backend/data && chown -R chefkart:chefkart /app

USER chefkart

ENV NODE_ENV=production
ENV PORT=8000
ENV HOST=0.0.0.0

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8000/api/health || exit 1

CMD ["node", "backend/server.js"]

