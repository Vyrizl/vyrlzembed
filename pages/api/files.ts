import type { NextApiRequest, NextApiResponse } from "next";
import { parseCookies } from "../../lib/cookies";
import { validateSessionToken } from "../../lib/auth";
import { getDb } from "../../lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") return res.status(405).end();

  const cookies = parseCookies(req.headers.cookie || "");
  const authed = await validateSessionToken(cookies.session || "");
  if (!authed) return res.status(401).json({ error: "Unauthorized" });

  const db = getDb();
  const files = await db`
    SELECT id, original_name, file_type, mime_type, file_size, embed_slug, created_at, view_count
    FROM files
    ORDER BY created_at DESC
    LIMIT 100
  `;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://your-domain.vercel.app`;

  return res.status(200).json({
    files: files.map((f) => ({
      ...f,
      embedUrl: `${baseUrl}/e/${f.embed_slug}`,
    })),
  });
}
