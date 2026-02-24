import { getAuthFromCookie } from "@/lib/auth-cookie";
import { getDatabase } from "@/lib/db";

export async function GET(req: Request) {
  const cookieHeader = req.headers.get("cookie");
  const user = getAuthFromCookie(cookieHeader);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  let displayName = user.displayName;
  const db = getDatabase();
  if (user.role === "parent" && user.dbParentId != null) {
    const row = db.prepare("SELECT display_name FROM parents WHERE id = ?").get(user.dbParentId) as { display_name: string } | undefined;
    if (row) displayName = row.display_name;
  } else if (user.role === "operator" && user.dbOperatorId != null) {
    const row = db.prepare("SELECT display_name FROM operators WHERE id = ?").get(user.dbOperatorId) as { display_name: string } | undefined;
    if (row) displayName = row.display_name;
  }
  return Response.json({
    userKey: user.userKey,
    role: user.role,
    centerId: user.centerId,
    displayName,
    dbParentId: user.dbParentId ?? null,
    dbOperatorId: user.dbOperatorId ?? null,
  });
}
