import { getDatabase } from "@/lib/db";

export async function PUT(req: Request) {
  const body = await req.json();
  const { centerId = 1, markdown } = body as { centerId?: number; markdown?: string };
  if (typeof markdown !== "string") {
    return Response.json({ error: "markdown is required" }, { status: 400 });
  }

  const db = getDatabase();
  const existing = db
    .prepare(
      "SELECT id, version_number FROM knowledge_items WHERE center_id = ? AND slug = 'handbook' LIMIT 1"
    )
    .get(centerId) as { id: number; version_number: number } | undefined;

  if (existing) {
    db.prepare(
      "UPDATE knowledge_items SET content = ?, updated_at = datetime('now'), version_number = ? WHERE id = ?"
    ).run(markdown, existing.version_number + 1, existing.id);
  } else {
    db.prepare(
      "INSERT INTO knowledge_items (center_id, slug, title, content, updated_at, version_number) VALUES (?, 'handbook', 'Handbook', ?, datetime('now'), 1)"
    ).run(centerId, markdown);
  }

  return Response.json({ ok: true });
}
