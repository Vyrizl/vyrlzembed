import type { NextApiRequest, NextApiResponse } from "next";
import { parseCookies } from "../../lib/cookies";
import { validateSessionToken } from "../../lib/auth";
import { getDb } from "../../lib/db";
import { getFileCategory, MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from "../../lib/fileTypes";
import formidable from "formidable";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

export const config = {
  api: { bodyParser: false },
};

function generateSlug(): string {
  // 12-char URL-safe random slug
  return crypto.randomBytes(9).toString("base64url");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Auth check
  const cookies = parseCookies(req.headers.cookie || "");
  const token = cookies.session || "";
  const authed = await validateSessionToken(token);
  if (!authed) return res.status(401).json({ error: "Unauthorized" });

  // Parse multipart
  const form = formidable({ maxFileSize: MAX_FILE_SIZE });
  let fields: formidable.Fields;
  let files: formidable.Files;

  try {
    [fields, files] = await form.parse(req);
  } catch {
    return res.status(400).json({ error: "File too large or parse error (max 50MB)" });
  }

  const fileArray = files.file;
  if (!fileArray || fileArray.length === 0) {
    return res.status(400).json({ error: "No file provided" });
  }

  const file = fileArray[0];
  const mimeType = file.mimetype || "application/octet-stream";

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return res.status(400).json({ error: `File type not allowed: ${mimeType}` });
  }

  const fileData = fs.readFileSync(file.filepath);
  const fileType = getFileCategory(mimeType);
  const originalName = file.originalFilename || "unnamed";
  const slug = generateSlug();
  const id = uuidv4();

  const db = getDb();

  await db`
    INSERT INTO files (id, original_name, file_type, mime_type, file_size, file_data, embed_slug)
    VALUES (
      ${id},
      ${originalName},
      ${fileType},
      ${mimeType},
      ${file.size},
      ${fileData},
      ${slug}
    )
  `;

  // Cleanup temp
  fs.unlinkSync(file.filepath);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.host}`;
  const embedUrl = `${baseUrl}/e/${slug}`;

  return res.status(200).json({
    ok: true,
    id,
    slug,
    embedUrl,
    fileType,
    originalName,
  });
}
