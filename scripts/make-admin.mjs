// Promotes a registered user to the admin role.
// Usage: DATABASE_URL=... node scripts/make-admin.mjs someone@example.com
import pg from "pg";

const { Client } = pg;

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: node scripts/make-admin.mjs <email>");
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const { rowCount } = await client.query(
      "update users set role = 'admin' where email = $1",
      [email],
    );
    if (rowCount === 0) {
      console.error(`No user found with email ${email}`);
      process.exit(1);
    }
    console.log(`${email} is now an admin.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
