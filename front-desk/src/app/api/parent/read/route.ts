import { getDatabase } from "@/lib/db";

/**
 * POST /api/parent/read
 * Body: { parentId: number }
 * Marks all operator-sent answers for this parent's questions as read.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parentId = Number(body.parentId ?? 1);
  const db = getDatabase();
  db.prepare(
    `UPDATE answers SET read_at = datetime('now')
     WHERE from_operator = 1 AND read_at IS NULL
     AND question_id IN (SELECT id FROM questions WHERE parent_id = ?)`
  ).run(parentId);
  return Response.json({ ok: true });
}
