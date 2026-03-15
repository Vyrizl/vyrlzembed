#!/usr/bin/env node
/**
 * delete-user.js — Remove a user by username.
 *
 * Usage:
 *   DATABASE_URL="your-neon-url" node scripts/delete-user.js <username>
 */

const { neon } = require("@neondatabase/serverless");

async function main() {
  const username = process.argv[2];
  if (!username) { console.error("❌ Usage: node scripts/delete-user.js <username>"); process.exit(1); }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) { console.error("❌ Set DATABASE_URL first."); process.exit(1); }

  const sql = neon(dbUrl);
  const result = await sql`DELETE FROM users WHERE lower(username) = lower(${username}) RETURNING id, username`;

  if (result.length === 0) {
    console.log(`❌ No user found with username "${username}"`);
  } else {
    console.log(`✅ Deleted user: ${result[0].username} (ID ${result[0].id})`);
  }
}

main().catch((err) => { console.error("❌ Error:", err.message); process.exit(1); });
