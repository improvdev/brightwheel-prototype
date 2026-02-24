import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getDatabase, ensureDemoParentsExist } from "@/lib/db";
import { getKnowledgeForCenter } from "@/lib/knowledge";

const AnswerSchema = z.object({
  answer: z.string().describe("Reply to the parent. If uncertain or not in context, give a brief graceful bridge. For SENSITIVE topics use Warm Bridge: (1) empathetic line, (2) handbook answer, (3) flagged for staff follow-up."),
  confidence: z.enum(["high", "low"]).describe("Set 'high' only when the answer is explicitly supported by the knowledge base. Otherwise 'low'."),
  escalate: z.boolean().describe("Set true when the answer is not explicitly in the context or topic is sensitive."),
  noMatch: z.boolean().describe("Set true when the knowledge base has NO relevant information for this question (e.g. completely out of scope, or no matching policy/section). When true, give a polite bridge and suggest staff follow-up."),
  sensitive: z.boolean().describe("Set true when the question is about illness/fever, fees/cost, discipline, or staff/personnel—use Warm Bridge tone and flag for staff."),
  suggestedDraft: z.string().describe("For operator: suggested reply text when confidence is low. Use empty string when not applicable."),
  sourceSlug: z.string().describe("Slug of the handbook section that supports the answer, e.g. 'hours' or 'tuition'. Use empty string when no section applies."),
});

export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json();
  const { message, parentId = 1 } = body as { message?: string; parentId?: number; centerId?: number };
  if (!message || typeof message !== "string") {
    return Response.json({ error: "message is required" }, { status: 400 });
  }

  const id = Number(parentId);
  if (!Number.isInteger(id) || id < 1) {
    return Response.json({ error: "Invalid session. Please log in again as a parent." }, { status: 400 });
  }
  const db = getDatabase();
  let parentRow = db.prepare("SELECT id, center_id FROM parents WHERE id = ?").get(id) as { id: number; center_id: number } | undefined;
  if (!parentRow && id >= 1 && id <= 3) {
    ensureDemoParentsExist(db);
    parentRow = db.prepare("SELECT id, center_id FROM parents WHERE id = ?").get(id) as { id: number; center_id: number } | undefined;
  }
  if (!parentRow) {
    return Response.json({ error: "Parent not found. Please log out and log in again." }, { status: 400 });
  }
  const centerId = parentRow.center_id;

  const knowledge = getKnowledgeForCenter(centerId);
  const systemPrompt = `You are the AI front desk for a childcare center. Answer ONLY using the knowledge base below. Do not invent details.

Knowledge base for this center:
${knowledge}

Rules:
- If the answer is explicitly supported by the knowledge base (you are quoting or summarizing a specific section), set confidence to "high". Include sourceSlug (e.g. "hours", "tuition", "illness-policy") for linking. You may still set escalate to true if the KB directs the parent to staff for the "current" list or to confirm (e.g. holiday schedule: handbook lists typical holidays and says get the current list from the office—that is high confidence from the KB, with escalate true so staff can provide the list).
- If the answer is NOT in the knowledge base or you are uncertain, set confidence to "low" and escalate to true. Give a short, kind message to the parent (graceful bridge) and provide a suggestedDraft for staff.
- When the knowledge base has NO relevant information at all for the question (e.g. out of scope, or no matching policy), set noMatch to true (and confidence low, escalate true). Give a polite bridge (e.g. "I don't have that in our handbook—I've flagged this for staff to follow up.") and a suggestedDraft for the operator.
- WARM BRIDGE (FR-009b): For sensitive topics (illness/fever, fees/cost, discipline, staff/personnel), set sensitive=true and escalate=true. Your answer MUST: (1) Start with a brief empathetic acknowledgment (e.g. "I understand that's stressful." or "I know that can be worrying."). (2) Give the handbook answer with the relevant section. (3) Say the question has been flagged for staff follow-up (e.g. "I've flagged this for the director so they can check in on you."). Never give a cold policy-only reply on sensitive topics.
- Never fabricate policies or dates. If you don't know, say so and escalate.`;

  const model = openai("gpt-4o-mini");
  const { output } = await generateText({
    model,
    output: Output.object({
      schema: AnswerSchema,
      name: "FrontDeskAnswer",
      description: "Structured answer with confidence and escalation for the parent and operator.",
    }),
    prompt: `${systemPrompt}\n\nParent question: ${message}`,
  });

  const outcome =
    output.confidence === "high" && !output.escalate
      ? "answered"
      : "noMatch" in output && output.noMatch
        ? "no_match"
        : output.escalate
          ? "escalated"
          : "low_confidence";
  const sensitiveFlag = "sensitive" in output && output.sensitive ? 1 : 0;
  const suggestedDraft = output.suggestedDraft?.trim() || null;
  const sourceSlug = output.sourceSlug?.trim() || null;
  const run = db.prepare(
    `INSERT INTO questions (center_id, parent_id, content, outcome, confidence, answered, sensitive_flag, suggested_draft)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(centerId, parentRow.id, message, outcome, output.confidence, output.confidence === "high" ? 1 : 0, sensitiveFlag, suggestedDraft);
  const qid = run.lastInsertRowid;
  db.prepare(
    `INSERT INTO answers (question_id, content, source_citation, from_operator, sent_to_parent)
     VALUES (?, ?, ?, 0, 1)`
  ).run(qid, output.answer, sourceSlug ? `/handbook#${sourceSlug}` : null);

  return Response.json({
    answer: output.answer,
    confidence: output.confidence,
    escalate: output.escalate,
    suggestedDraft,
    sourceSlug,
    questionId: qid,
  });
}
