# syntax=docker/dockerfile:1

# ---- Stage 1: build the React client
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---- Stage 2: API + built client, production dependencies only
FROM node:20-alpine
ENV NODE_ENV=production \
    PORT=4100
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY server/ ./
COPY seed-assets/ /app/seed-assets/
COPY --from=client-build /app/client/dist /app/client/dist
# uploads is a volume in docker-compose; create it owned by the unprivileged user
RUN mkdir -p /app/server/uploads && chown -R node:node /app
USER node
EXPOSE 4100
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" >/dev/null || exit 1
CMD ["node", "src/index.js"]
