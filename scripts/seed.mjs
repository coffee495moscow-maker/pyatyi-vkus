// Seeds the catalog (categories + products) from db/seed.sql. Safe to
// re-run — the seed file upserts by slug.
import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const sql = await readFile(path.join(process.cwd(), "db", "seed.sql"), "utf8");
    await client.query(sql);
    console.log("Seed applied.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
