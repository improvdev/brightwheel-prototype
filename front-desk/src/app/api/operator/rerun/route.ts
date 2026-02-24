import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getDatabase } from "@/lib/db";
import { getKnowledgeForCenter } from "@/lib/knowledge";

const AnswerSchema = z.object({
  answer: z.string(),
  confidence: z.enum(["high", "low"]),
  sourceSlug: z.string().describe("Slug of handbook section that supports the answer, e.g. 'hours'. Use empty string when no section applies."),
});

/**
 * GET /api/operator/rerun?questionId=1
 * Re-runs the question against the current KB and returns the new answer (for operator to verify after handbook edit).
 * Does not persist the new answer or notify the parent.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const questionId = Number(searchParams.get("questionId"));
    if (!questionId) {
      return Response.json({ error: "questionId required" }, { status: 400 });
    }
    const db = getDatabase();
    const question = db
      .prepare("SELECT id, content, center_id FROM questions WHERE id = ? LIMIT 1")
      .get(questionId) as { id: number; content: string; center_id: number } | undefined;
    if (!question) {
      return Response.json({ error: "Question not found" }, { status: 404 });
    }

    const knowledge = getKnowledgeForCenter(question.center_id);
    const { output } = await generateText({
      model: openai("gpt-4o-mini"),
      output: Output.object({
        schema: AnswerSchema,
        name: "RerunAnswer",
      }),
      prompt: `You are the AI front desk for a childcare center. Answer ONLY using the knowledge base below. Do not invent details.

Knowledge base:
${knowledge}

Parent question: ${question.content}

Return a direct, helpful answer. If the answer is in the knowledge base, set confidence to "high" and set sourceSlug to the section slug (e.g. "hours", "tuition"). Otherwise set confidence to "low" and sourceSlug to "".`,
    });

    return Response.json({
      answer: output.answer,
      confidence: output.confidence,
      sourceSlug: output.sourceSlug ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Rerun failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
