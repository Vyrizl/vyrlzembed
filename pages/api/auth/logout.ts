import type { NextApiRequest, NextApiResponse } from "next";
import { serializeCookie } from "../../../lib/cookies";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader(
    "Set-Cookie",
    serializeCookie("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    })
  );
  return res.status(200).json({ ok: true });
}
