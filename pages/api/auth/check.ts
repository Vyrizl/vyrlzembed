import type { NextApiRequest, NextApiResponse } from "next";
import { parseCookies } from "../../lib/cookies";
import { validateSessionToken } from "../../lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cookies = parseCookies(req.headers.cookie || "");
  const token = cookies.session || "";
  const valid = await validateSessionToken(token);
  return res.status(200).json({ authenticated: valid });
}
