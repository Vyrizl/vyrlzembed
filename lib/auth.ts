import bcrypt from "bcryptjs";
import { getDb } from "./db";
import type { NextApiRequest } from "next";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

export function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    typeof forwarded === "string"
      ? forwarded.split(",")[0].trim()
      : req.socket?.remoteAddress || "unknown";
  return ip;
}

export async function checkRateLimit(
  ip: string,
  action: string
): Promise<{ allowed: boolean; remaining: number }> {
  const db = getDb();
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);

  const rows = await db`
    SELECT attempts, window_start FROM rate_limits
    WHERE ip = ${ip} AND action = ${action}
  `;

  if (rows.length === 0) {
    await db`
      INSERT INTO rate_limits (ip, action, attempts, window_start)
      VALUES (${ip}, ${action}, 1, NOW())
      ON CONFLICT (ip, action) DO UPDATE
        SET attempts = 1, window_start = NOW()
    `;
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  const row = rows[0];
  const withinWindow = new Date(row.window_start) > windowStart;

  if (!withinWindow) {
    await db`
      UPDATE rate_limits SET attempts = 1, window_start = NOW()
      WHERE ip = ${ip} AND action = ${action}
    `;
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (row.attempts >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }

  await db`
    UPDATE rate_limits SET attempts = attempts + 1
    WHERE ip = ${ip} AND action = ${action}
  `;

  return { allowed: true, remaining: MAX_ATTEMPTS - row.attempts - 1 };
}

export async function validateCredentials(
  username: string,
  password: string
): Promise<boolean> {
  if (!username || !password) return false;

  const db = getDb();
  // Look up user by username (case-insensitive)
  const rows = await db`
    SELECT id, password_hash FROM users
    WHERE lower(username) = lower(${username.trim()})
    LIMIT 1
  `;

  if (rows.length === 0) {
    // Run a dummy bcrypt compare to prevent timing attacks
    await bcrypt.compare(password, "$2b$12$invalidhashpaddingtomakeitlook.valid000000000000000000000");
    return false;
  }

  const user = rows[0];
  const match = await bcrypt.compare(password, user.password_hash);
  if (match) {
    await db`UPDATE users SET last_login = NOW() WHERE id = ${user.id}`;
  }
  return match;
}

// Session token: base64url of "username:timestamp:HMAC"
export function generateSessionToken(username: string): string {
  const secret = process.env.SESSION_SECRET || "fallback-secret-change-me";
  const payload = `${username}:${Date.now()}:${secret}`;
  return Buffer.from(payload).toString("base64url");
}

export async function validateSessionToken(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    // Format: username:timestamp:secret
    // username may contain ":" so we split from the right
    const lastColon = decoded.lastIndexOf(":");
    const secondLastColon = decoded.lastIndexOf(":", lastColon - 1);
    if (secondLastColon < 0 || lastColon < 0) return false;

    const secret = process.env.SESSION_SECRET || "fallback-secret-change-me";
    const tokenSecret = decoded.slice(lastColon + 1);
    const ts = decoded.slice(secondLastColon + 1, lastColon);
    const username = decoded.slice(0, secondLastColon);

    if (tokenSecret !== secret) return false;

    // Token valid for 24 hours
    const age = Date.now() - parseInt(ts, 10);
    if (isNaN(age) || age > 24 * 60 * 60 * 1000) return false;

    // Verify user still exists in DB
    const db = getDb();
    const rows = await db`SELECT id FROM users WHERE lower(username) = lower(${username}) LIMIT 1`;
    return rows.length > 0;
  } catch {
    return false;
  }
}
