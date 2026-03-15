import type { NextApiRequest, NextApiResponse } from "next";
import {
  validateCredentials,
  checkRateLimit,
  getClientIp,
  generateSessionToken,
} from "../../../lib/auth";
import { serializeCookie } from "../../../lib/cookies";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = getClientIp(req);

  const rateCheck = await checkRateLimit(ip, "login");
  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: "Too many attempts. Try again in 15 minutes.",
      remaining: 0,
    });
  }

  let body: { username?: string; password?: string };
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { username, password } = body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  // Artificial delay — slows brute force
  await new Promise((r) => setTimeout(r, 200 + Math.floor(Math.random() * 300)));

  const valid = await validateCredentials(username, password);

  if (!valid) {
    return res.status(401).json({
      error: "Invalid username or password",
      remaining: rateCheck.remaining,
    });
  }

  const token = generateSessionToken(username);

  res.setHeader(
    "Set-Cookie",
    serializeCookie("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24,
      path: "/",
    })
  );

  return res.status(200).json({ ok: true });
}
