import { getAuthUserByKey, type AuthUser } from "./auth-users";

export const COOKIE_NAME = "front-desk-auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function parseUserKeyFromValue(cookieValue: string | null): string | null {
  if (!cookieValue) return null;
  try {
    const decoded = cookieValue.startsWith("%") ? decodeURIComponent(cookieValue) : cookieValue;
    const { userKey } = JSON.parse(decoded) as { userKey?: string };
    return userKey ?? null;
  } catch {
    return null;
  }
}

/** Use from Server Component: cookies().get(COOKIE_NAME)?.value */
export function getAuthFromCookieValue(cookieValue: string | undefined): AuthUser | null {
  const userKey = parseUserKeyFromValue(cookieValue ?? null);
  return userKey ? getAuthUserByKey(userKey) ?? null : null;
}

/** Use from middleware/API: request.headers.get("cookie") */
export function getAuthFromCookie(cookieHeader: string | null): AuthUser | null {
  if (!cookieHeader) return null;
  const part = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(COOKIE_NAME + "="));
  if (!part) return null;
  const value = part.slice(COOKIE_NAME.length + 1).trim();
  const userKey = parseUserKeyFromValue(value);
  return userKey ? getAuthUserByKey(userKey) ?? null : null;
}

export function setAuthCookie(userKey: string): string {
  const value = encodeURIComponent(JSON.stringify({ userKey }));
  return `${COOKIE_NAME}=${value}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax; HttpOnly`;
}

export function clearAuthCookie(): string {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly`;
}
