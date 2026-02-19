import { Pool } from "pg";

let pool;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("Missing DATABASE_URL");
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Supabase braucht SSL in Vercel fast immer
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pool;
}

// Named export
export const db = {
  query: (text, params) => getPool().query(text, params),
};

// Default export (damit beide Varianten funktionieren)
export default db;
