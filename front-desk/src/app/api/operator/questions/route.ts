import { getDatabase } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const centerId = searchParams.get("centerId") ?? "1";
  const db = getDatabase();
  const questions = db
    .prepare(
      `SELECT q.id, q.parent_id, q.content, q.outcome, q.confidence, q.answered, q.sensitive_flag, q.suggested_draft, q.created_at,
              p.display_name as parent_display_name,
              (SELECT content FROM answers WHERE question_id = q.id AND from_operator = 0 ORDER BY created_at ASC LIMIT 1) as system_answer,
              (SELECT id FROM answers WHERE question_id = q.id AND from_operator = 0 ORDER BY created_at ASC LIMIT 1) as system_answer_id,
              (SELECT thumbs FROM answer_feedback WHERE answer_id = (SELECT id FROM answers WHERE question_id = q.id AND from_operator = 0 ORDER BY created_at ASC LIMIT 1) LIMIT 1) as system_answer_thumbs,
              (SELECT COUNT(*) FROM answers WHERE question_id = q.id AND from_operator = 1) as operator_reply_count,
              (SELECT operator_name FROM answers WHERE question_id = q.id AND from_operator = 1 ORDER BY created_at DESC LIMIT 1) as last_operator_name,
              (SELECT content FROM answers WHERE question_id = q.id AND from_operator = 1 ORDER BY created_at DESC LIMIT 1) as last_operator_reply,
              (SELECT created_at FROM answers WHERE question_id = q.id AND from_operator = 1 ORDER BY created_at DESC LIMIT 1) as last_operator_reply_at
       FROM questions q
       LEFT JOIN parents p ON q.parent_id = p.id
       WHERE q.center_id = ?
       ORDER BY q.created_at DESC
       LIMIT 50`
    )
    .all(Number(centerId)) as Array<{
    id: number;
    parent_id: number;
    content: string;
    outcome: string;
    confidence: string | null;
    answered: number;
    sensitive_flag: number;
    suggested_draft: string | null;
    created_at: string;
    parent_display_name: string | null;
    system_answer: string | null;
    system_answer_id: number | null;
    system_answer_thumbs: number | null;
    operator_reply_count: number;
    last_operator_name: string | null;
    last_operator_reply: string | null;
    last_operator_reply_at: string | null;
  }>;
  return Response.json({ questions });
}
