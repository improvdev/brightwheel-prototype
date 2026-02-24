import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { getDatabase } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const {
    questionId,
    content,
    operatorId = 1,
    operatorName = "Director Sarah",
    updateHandbook = false,
  } = body as {
    questionId: number;
    content: string;
    operatorId?: number;
    operatorName?: string;
    updateHandbook?: boolean;
  };

  if (!questionId || typeof content !== "string" || !content.trim()) {
    return Response.json(
      { error: "questionId and content are required" },
      { status: 400 }
    );
  }

  const db = getDatabase();
  const question = db
    .prepare(
      "SELECT id, center_id, content as question_content FROM questions WHERE id = ? LIMIT 1"
    )
    .get(questionId) as { id: number; center_id: number; question_content: string } | undefined;
  if (!question) {
    return Response.json({ error: "Question not found" }, { status: 404 });
  }

  // Idempotency (FR-012): if the last answer for this question is already an operator reply with the same content and sent, do not insert again
  const lastAnswer = db
    .prepare(
      `SELECT id, content, from_operator, sent_to_parent FROM answers WHERE question_id = ? ORDER BY created_at DESC LIMIT 1`
    )
    .get(questionId) as { id: number; content: string; from_operator: number; sent_to_parent: number } | undefined;
  if (
    lastAnswer &&
    lastAnswer.from_operator === 1 &&
    lastAnswer.sent_to_parent === 1 &&
    lastAnswer.content.trim() === content.trim()
  ) {
    return Response.json({ ok: true, idempotent: true });
  }

  db.prepare(
    "UPDATE questions SET answered = 1 WHERE id = ?"
  ).run(questionId);

  db.prepare(
    `INSERT INTO answers (question_id, content, from_operator, operator_id, operator_name, sent_to_parent)
     VALUES (?, ?, 1, ?, ?, 1)`
  ).run(questionId, content.trim(), operatorId, operatorName);

  let handbookUpdated = false;
  if (updateHandbook) {
    let snippet = content.trim();
    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: `You are helping add a policy/FAQ entry to a childcare center handbook.

Parent question: ${question.question_content}
Staff reply: ${content.trim()}

Turn this into a single, clean Markdown snippet for the handbook: use a ## heading that summarizes the topic (e.g. "## Veterans Day" or "## Holiday Hours"), then 1–3 short paragraphs. No preamble. Output only the Markdown.`,
      });
      if (text?.trim()) snippet = text.trim();
    } catch {
      // fallback: use operator content as-is
    }
    const existing = db
      .prepare(
        "SELECT id, content FROM knowledge_items WHERE center_id = ? AND slug = 'handbook' LIMIT 1"
      )
      .get(question.center_id) as { id: number; content: string } | undefined;
    if (existing) {
      const newContent = (existing.content || "").trimEnd() + "\n\n---\n\n" + snippet;
      db.prepare(
        "UPDATE knowledge_items SET content = ?, updated_at = datetime('now'), version_number = version_number + 1 WHERE center_id = ? AND slug = 'handbook'"
      ).run(newContent, question.center_id);
      handbookUpdated = true;
    } else {
      db.prepare(
        `INSERT INTO knowledge_items (center_id, slug, title, content, updated_at, version_number)
         VALUES (?, 'handbook', 'Handbook', ?, datetime('now'), 1)`
      ).run(question.center_id, snippet);
      handbookUpdated = true;
    }
  }

  return Response.json({ ok: true, handbookUpdated });
}
