FROM node:22-alpine

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy application source code with non-root ownership
COPY --chown=node:node . .

# Run as non-root user built into alpine
USER node

# Port used by server/index.js
EXPOSE 4000

# Docker healthcheck on GET /health
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["node", "index.js"]
