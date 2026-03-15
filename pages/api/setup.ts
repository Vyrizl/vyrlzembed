import type { NextApiRequest, NextApiResponse } from "next";
import { initDb } from "../../lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow internal calls with a setup secret
  const setupSecret = req.headers["x-setup-secret"];
  if (setupSecret !== process.env.SETUP_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    await initDb();
    return res.status(200).json({ ok: true, message: "Database initialized" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
}
