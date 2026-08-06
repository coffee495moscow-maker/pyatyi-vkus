FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Minimal runtime image — only the Next.js standalone server output plus the
# db/ (migrations, seed) and scripts/ folders needed to migrate on boot.
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/db ./db
COPY --from=builder /app/scripts ./scripts

EXPOSE 3000

# Migrations are idempotent (tracked in a _migrations table) — safe to run
# on every boot, which means schema updates ship automatically on redeploy.
# Seeding the catalog is NOT run here (it would clobber admin edits made
# through /admin/menu) — that's a one-time manual step, see README.
CMD ["sh", "-c", "node scripts/migrate.mjs && node server.js"]
