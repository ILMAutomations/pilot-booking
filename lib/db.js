import { Pool } from "pg";

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Missing env: DATABASE_URL");
  }

  if (!globalThis.__pgPool) {
    globalThis.__pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1
    });
  }
  return globalThis.__pgPool;
}

export async function query(text, params) {
  const pool = getPool();
  return pool.query(text, params);
}
