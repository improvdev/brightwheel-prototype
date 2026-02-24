import { getHandbookMarkdown } from "@/lib/knowledge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const centerId = Number(searchParams.get("centerId") ?? "1");
  const markdown = getHandbookMarkdown(centerId);
  if (!markdown) return Response.json({ error: "Handbook not found" }, { status: 404 });
  return Response.json({ markdown });
}
