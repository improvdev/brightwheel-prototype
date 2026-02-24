import { getDatabase } from "./db";

export type Center = { id: number; name: string; phone: string | null; address: string | null; hours: string | null };

export function getCenter(centerId: number): Center | null {
  const db = getDatabase();
  const row = db
    .prepare("SELECT id, name, phone, address, hours FROM centers WHERE id = ? LIMIT 1")
    .get(centerId) as { id: number; name: string; phone: string | null; address: string | null; hours: string | null } | undefined;
  return row ?? null;
}

export function getKnowledgeForCenter(centerId: number): string {
  const db = getDatabase();
  const center = getCenter(centerId);
  const centerBlock =
    center ?
      `## Center (from database)\nName: ${center.name}\nPhone: ${center.phone ?? "—"}\nAddress: ${center.address ?? "—"}\nHours: ${center.hours ?? "—"}\n\n---\n\n`
    : "";
  const rows = db
    .prepare(
      "SELECT slug, title, content FROM knowledge_items WHERE center_id = ? ORDER BY slug"
    )
    .all(centerId) as { slug: string; title: string; content: string }[];
  const knowledgeBlock = rows.map((r) => `## ${r.title} (slug: ${r.slug})\n${r.content}`).join("\n\n---\n\n");
  return centerBlock + knowledgeBlock;
}

export function getHandbookMarkdown(centerId: number): string | null {
  const db = getDatabase();
  const row = db
    .prepare("SELECT content FROM knowledge_items WHERE center_id = ? AND slug = 'handbook' LIMIT 1")
    .get(centerId) as { content: string } | undefined;
  return row?.content ?? null;
}
