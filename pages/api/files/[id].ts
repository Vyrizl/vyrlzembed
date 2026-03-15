import type { NextApiRequest, NextApiResponse } from "next";
import { parseCookies } from "../../../lib/cookies";
import { validateSessionToken } from "../../../lib/auth";
import { getDb } from "../../../lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") return res.status(405).end();

  const cookies = parseCookies(req.headers.cookie || "");
  const authed = await validateSessionToken(cookies.session || "");
  if (!authed) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.query;
  if (!id || typeof id !== "string") return res.status(400).json({ error: "Missing id" });

  const db = getDb();
  const result = await db`DELETE FROM files WHERE id = ${id} RETURNING id`;

  if (result.length === 0) {
    return res.status(404).json({ error: "File not found" });
  }

  return res.status(200).json({ ok: true });
}
