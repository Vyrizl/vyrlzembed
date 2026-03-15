import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "../../../lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { slug } = req.query;
  if (!slug || typeof slug !== "string") return res.status(400).end();

  const db = getDb();
  const rows = await db`
    UPDATE files SET view_count = view_count + 1
    WHERE embed_slug = ${slug}
    RETURNING original_name, mime_type, file_data
  `;

  if (rows.length === 0) return res.status(404).end("Not found");

  const { mime_type, file_data, original_name } = rows[0];

  // file_data comes back as Buffer from neon
  const buffer = Buffer.isBuffer(file_data)
    ? file_data
    : Buffer.from(file_data as string, "base64");

  res.setHeader("Content-Type", mime_type);
  res.setHeader("Content-Length", buffer.length);
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${encodeURIComponent(original_name)}"`
  );

  return res.end(buffer);
}
