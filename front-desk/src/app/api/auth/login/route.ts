import { getAuthUserByKeyAndPassword } from "@/lib/auth-users";
import { setAuthCookie } from "@/lib/auth-cookie";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { userKey, password } = body as { userKey?: string; password?: string };
  if (!userKey || typeof userKey !== "string") {
    return Response.json({ error: "userKey required" }, { status: 400 });
  }
  const user = getAuthUserByKeyAndPassword(
    userKey,
    typeof password === "string" ? password : "demo"
  );
  if (!user) {
    return Response.json({ error: "Invalid login" }, { status: 401 });
  }
  return new Response(JSON.stringify({ ok: true, user: { role: user.role, displayName: user.displayName, centerId: user.centerId } }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": setAuthCookie(user.userKey),
    },
  });
}
