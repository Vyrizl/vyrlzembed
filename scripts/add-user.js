#!/usr/bin/env node
/**
 * add-user.js — Create a new user in Neon DB.
 *
 * Usage:
 *   DATABASE_URL="your-neon-url" node scripts/add-user.js <username> <password>
 *
 * The password is hashed with bcrypt (cost 12) before storing.
 * Run this locally — never expose this script via a web endpoint.
 */

const bcrypt = require("bcryptjs");
const { neon } = require("@neondatabase/serverless");

async function main() {
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.error("❌ Usage: node scripts/add-user.js <username> <password>");
    process.exit(1);
  }

  if (username.length < 3) {
    console.error("❌ Username must be at least 3 characters.");
    process.exit(1);
  }

  if (password.length < 12) {
    console.error("❌ Password must be at least 12 characters.");
    process.exit(1);
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ Set DATABASE_URL environment variable first.");
    process.exit(1);
  }

  const sql = neon(dbUrl);

  // Ensure tables exist
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      username      TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      last_login    TIMESTAMPTZ
    )
  `;
  await sql`
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
  await sql`
    CREATE TABLE IF NOT EXISTS rate_limits (
      ip           TEXT NOT NULL,
      action       TEXT NOT NULL,
      attempts     INT DEFAULT 1,
      window_start TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (ip, action)
    )
  `;

  console.log("🔐 Hashing password (cost 12, takes a moment)...");
  const hash = await bcrypt.hash(password, 12);

  try {
    await sql`
      INSERT INTO users (username, password_hash)
      VALUES (${username}, ${hash})
    `;
  } catch (err) {
    if (err.message?.includes("unique")) {
      console.error(`❌ Username "${username}" already exists.`);
      process.exit(1);
    }
    throw err;
  }

  console.log(`\n✅ User created successfully!`);
  console.log(`   Username: ${username}`);
  console.log(`   Password: ${"*".repeat(password.length)} (stored as bcrypt hash)`);
  console.log(`\n🔑 Keep these credentials safe — passwords cannot be recovered from the DB.`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
