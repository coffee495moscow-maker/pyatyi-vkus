import "server-only";
import { Pool } from "pg";

declare global {
  var __pgPool: Pool | undefined;
}

// `pg` connects lazily on the first query, so it's safe to construct this
// even when DATABASE_URL is unset at build time (e.g. `next build` in CI
// without a live database) — it only fails when a query is actually run.
function createPool() {
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

// Reused across hot-reloads in dev; a fresh pool per server process in prod.
export const pool = globalThis.__pgPool ?? createPool();
if (process.env.NODE_ENV !== "production") {
  globalThis.__pgPool = pool;
}
