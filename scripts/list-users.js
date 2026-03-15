#!/usr/bin/env node
/**
 * list-users.js — List all users in Neon DB.
 *
 * Usage:
 *   DATABASE_URL="your-neon-url" node scripts/list-users.js
 */

const { neon } = require("@neondatabase/serverless");

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) { console.error("❌ Set DATABASE_URL first."); process.exit(1); }

  const sql = neon(dbUrl);
  let users;
  try {
    users = await sql`SELECT id, username, created_at, last_login FROM users ORDER BY created_at DESC`;
  } catch {
    console.log("No users table yet. Run add-user.js first.");
    return;
  }

  if (users.length === 0) {
    console.log("No users found. Add one with: node scripts/add-user.js <username> <password>");
    return;
  }

  console.log(`\n👥 Users (${users.length} total)\n`);
  users.forEach((u) => {
    console.log(`  ID: ${u.id}  |  Username: ${u.username}  |  Created: ${u.created_at}  |  Last login: ${u.last_login || "never"}`);
  });
  console.log();
}

main().catch((err) => { console.error("❌ Error:", err.message); process.exit(1); });
