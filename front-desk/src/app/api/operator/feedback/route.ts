import { getDatabase } from "@/lib/db";

/**
 * POST /api/operator/feedback
 * Body: { answerId: number, thumbs: 1 | -1 }
 * Stores thumbs up (1) or thumbs down (-1) for an answer. One feedback per answer (latest wins).
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { answerId, thumbs, centerId = 1 } = body as { answerId?: number; thumbs?: number; centerId?: number };
  if (typeof answerId !== "number" || (thumbs !== 1 && thumbs !== -1)) {
    return Response.json(
      { error: "answerId and thumbs (1 or -1) required" },
      { status: 400 }
    );
  }
  const db = getDatabase();
  const answer = db
    .prepare(
      "SELECT a.id FROM answers a JOIN questions q ON a.question_id = q.id WHERE a.id = ? AND q.center_id = ?"
    )
    .get(answerId, centerId) as { id: number } | undefined;
  if (!answer) {
    return Response.json({ error: "Answer not found" }, { status: 404 });
  }
  // Delete existing feedback for this answer so we have at most one
  db.prepare("DELETE FROM answer_feedback WHERE answer_id = ?").run(answerId);
  db.prepare(
    "INSERT INTO answer_feedback (answer_id, thumbs) VALUES (?, ?)"
  ).run(answerId, thumbs);
  return Response.json({ ok: true });
}
