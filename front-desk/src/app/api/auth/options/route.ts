import { getDatabase } from "@/lib/db";
import { listLoginOptions } from "@/lib/auth-users";

export async function GET() {
  const raw = listLoginOptions();
  const db = getDatabase();
  const options = raw.map((o) => {
    let displayName = o.displayName;
    if (o.role === "parent" && o.dbParentId != null) {
      const row = db.prepare("SELECT display_name FROM parents WHERE id = ?").get(o.dbParentId) as { display_name: string } | undefined;
      if (row) displayName = row.display_name;
    } else if (o.role === "operator" && o.dbOperatorId != null) {
      const row = db.prepare("SELECT display_name FROM operators WHERE id = ?").get(o.dbOperatorId) as { display_name: string } | undefined;
      if (row) displayName = row.display_name;
    }
    return { userKey: o.userKey, displayName, role: o.role, centerLabel: o.centerLabel };
  });
  return Response.json({ options });
}
