// Simple cookie parser — avoids external `cookie` package issues in some envs
export function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((part) => {
    const [key, ...vals] = part.trim().split("=");
    if (key) cookies[key.trim()] = decodeURIComponent(vals.join("="));
  });
  return cookies;
}

export function serializeCookie(
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
    maxAge?: number;
    path?: string;
  } = {}
): string {
  let cookie = `${name}=${encodeURIComponent(value)}`;
  if (options.httpOnly) cookie += "; HttpOnly";
  if (options.secure) cookie += "; Secure";
  if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;
  if (options.maxAge !== undefined) cookie += `; Max-Age=${options.maxAge}`;
  cookie += `; Path=${options.path || "/"}`;
  return cookie;
}
