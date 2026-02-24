import { getDatabase } from "@/lib/db";

/**
 * GET /api/parent/chat?parentId=1
 * Returns chat history for the parent: questions with answers.
 * Per spec: operator replies override AI/handbook in the displayed answer.
 * Also returns hasUnread (operator replies not yet read).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parentId = Number(searchParams.get("parentId") ?? "1");
  const db = getDatabase();

  const questions = db
    .prepare(
      `SELECT id, content, outcome, created_at
       FROM questions
       WHERE parent_id = ?
       ORDER BY created_at DESC`
    )
    .all(parentId) as Array<{ id: number; content: string; outcome: string; created_at: string }>;

  const threads: Array<{
    questionId: number;
    question: string;
    createdAt: string;
    currentAnswer: string;
    sourceSlug: string | null;
    fromOperator: boolean;
    operatorName: string | null;
    answerId: number;
    unread: boolean;
    allAnswers: Array<{
      content: string;
      fromOperator: boolean;
      operatorName: string | null;
      sourceSlug: string | null;
      createdAt: string;
      unread: boolean;
    }>;
  }> = [];

  for (const q of questions) {
    const answers = db
      .prepare(
        `SELECT id, content, source_citation, from_operator, operator_name, created_at, read_at
         FROM answers
         WHERE question_id = ?
         ORDER BY created_at ASC`
      )
      .all(q.id) as Array<{
      id: number;
      content: string;
      source_citation: string | null;
      from_operator: number;
      operator_name: string | null;
      created_at: string;
      read_at: string | null;
    }>;

    const operatorReplies = answers.filter((a) => a.from_operator === 1);
    const current = operatorReplies.length > 0 ? operatorReplies[operatorReplies.length - 1] : answers[0];
    const hasUnreadOperator = answers.some((a) => a.from_operator === 1 && a.read_at == null);

    threads.push({
      questionId: q.id,
      question: q.content,
      createdAt: q.created_at,
      currentAnswer: current?.content ?? "",
      sourceSlug: current?.source_citation?.replace(/^\/handbook#?/, "") ?? null,
      fromOperator: current ? current.from_operator === 1 : false,
      operatorName: current?.operator_name ?? null,
      answerId: current?.id ?? 0,
      unread: hasUnreadOperator,
      allAnswers: answers.map((a) => ({
        content: a.content,
        fromOperator: a.from_operator === 1,
        operatorName: a.operator_name,
        sourceSlug: a.source_citation?.replace(/^\/handbook#?/, "") ?? null,
        createdAt: a.created_at,
        unread: a.from_operator === 1 && a.read_at == null,
      })),
    });
  }

  const hasUnread = threads.some((t) => t.unread);

  return Response.json({
    threads,
    hasUnread,
  });
}
