import { neon } from "@neondatabase/serverless";

let sql: ReturnType<typeof neon> | null = null;

export function getDb() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

export async function initDb() {
  const db = getDb();

  // Users table — username + bcrypt password hash
  await db`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      username      TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      last_login    TIMESTAMPTZ
    )
  `;

  // Files table — stores uploaded file metadata + binary
  await db`
    CREATE TABLE IF NOT EXISTS files (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      original_name TEXT NOT NULL,
      file_type     TEXT NOT NULL,
      mime_type     TEXT NOT NULL,
      file_size     BIGINT NOT NULL,
      file_data     BYTEA NOT NULL,
      embed_slug    TEXT NOT NULL UNIQUE,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      view_count    INT DEFAULT 0
    )
  `;

  // Rate-limiting table
  await db`
    CREATE TABLE IF NOT EXISTS rate_limits (
      ip           TEXT NOT NULL,
      action       TEXT NOT NULL,
      attempts     INT DEFAULT 1,
      window_start TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (ip, action)
    )
  `;
}
