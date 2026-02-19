// lib/db.js
import { Pool } from "pg";

let _pool;

/**
 * Singleton Pool (Vercel serverless safe enough for pilot)
 */
export function pool() {
  if (_pool) return _pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL env var");
  }

  _pool = new Pool({
    connectionString,
    // Optional hardening:
    // ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });

  return _pool;
}

/**
 * Canonical query helper.
 * Always import { query } from "@/lib/db" (or relative) and call query(sql, params)
 */
export async function query(text, params = []) {
  return pool().query(text, params);
}
