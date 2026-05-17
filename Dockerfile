# MCP Server — Hetzner / Kubernetes
# Image contract: docs/superpowers/specs/2026-04-25-mcp-infrastructure-standard-design.md §3
# Profile: node-native (better-sqlite3 — native modules built in builder, pruned, copied)
#
# DB pattern: build-inside-image (canary pattern from Swedish-civil-protection-mcp).
# The builder stage runs `npm run build:db` to materialise data/database.db from
# the seed JSON files committed to the repo. The DB is then copied --from=builder
# into the runtime stage.
#
# Why not the release-asset fallback path? The .github/workflows/publish-ghcr.yml
# "Provision database from GitHub Release" step only triggers when the Dockerfile
# COPYs a data/*.db file from the build context. By building inside the image we
# skip that path entirely — meaning every CI build ships a freshly-built DB,
# never a stale release asset. The v1.0.1 release (2026-02-15) shipped a WAL-mode
# DB, which crash-loops on read-only filesystems (issue #67). Building inside the
# image makes that class of regression impossible.

FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
# Keep dev deps for the builder stage — `tsx` is dev-only but build:db invokes it.
RUN npm ci --ignore-scripts && npm cache clean --force
# Native module rebuild — better-sqlite3 needs its .node binding for build:db
# to open the DB. --ignore-scripts above skipped the prebuild-fetch.
RUN npm rebuild better-sqlite3

COPY tsconfig.json ./
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY data/seed/ ./data/seed/
RUN npm run build
# Build the SQLite corpus from the committed seed JSON files. The build script
# explicitly switches journal_mode to DELETE before close (see scripts/build-db.ts)
# so the DB can be opened on the production container's read-only filesystem.
RUN npm run build:db
# Drop dev deps AFTER build:db (tsx is dev-only).
RUN npm prune --omit=dev

FROM node:20-alpine AS runtime

WORKDIR /app

RUN addgroup -g 1001 -S nodejs \
 && adduser -u 1001 -S nodejs -G nodejs

COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/data/database.db ./data/database.db
COPY --chown=nodejs:nodejs package.json ./
COPY --chown=nodejs:nodejs sources.yml ./sources.yml

USER nodejs

ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

CMD ["node", "dist/http-server.js"]
