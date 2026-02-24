import ReactMarkdown from "react-markdown";
import rehypeSlug from "rehype-slug";
import Link from "next/link";
import { cookies } from "next/headers";
import { getAuthFromCookieValue, COOKIE_NAME } from "@/lib/auth-cookie";
import { getHandbookMarkdown } from "@/lib/knowledge";

export default async function HandbookPage() {
  const cookieStore = await cookies();
  const user = getAuthFromCookieValue(cookieStore.get(COOKIE_NAME)?.value);
  const centerId = user?.centerId ?? 1;
  const markdown = getHandbookMarkdown(centerId);
  if (!markdown) {
    return (
      <div className="min-h-screen p-6">
        <p className="text-zinc-600">Handbook not found.</p>
        <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
          ← Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <Link href="/" className="text-zinc-500 hover:text-zinc-700">
            ← Home
          </Link>
        </div>
        <article className="prose prose-zinc max-w-none">
          <ReactMarkdown rehypePlugins={[rehypeSlug]}>
            {markdown}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
