"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

type Thread = {
  questionId: number;
  question: string;
  createdAt: string;
  currentAnswer: string;
  sourceSlug: string | null;
  fromOperator: boolean;
  operatorName: string | null;
  unread: boolean;
  allAnswers: Array<{
    content: string;
    fromOperator: boolean;
    operatorName: string | null;
    sourceSlug: string | null;
    createdAt: string;
    unread: boolean;
  }>;
};

export default function ParentPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auth, setAuth] = useState<{ dbParentId: number; centerId: number } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (r.status === 401) {
          router.replace("/login?next=/parent");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data != null) setAuth({ dbParentId: data.dbParentId ?? 0, centerId: data.centerId ?? 1 });
      });
  }, [router]);

  const parentId = auth?.dbParentId ?? 0;
  const centerId = auth?.centerId ?? 1;

  const fetchChat = useCallback(() => {
    if (!parentId) return;
    fetch(`/api/parent/chat?parentId=${parentId}`)
      .then((r) => r.json())
      .then((data) => {
        setThreads(data.threads ?? []);
        setHasUnread(data.hasUnread ?? false);
      });
  }, [parentId]);

  useEffect(() => {
    if (parentId) fetchChat();
  }, [fetchChat, parentId]);

  // Mark operator replies as read when parent views the page (once when we detect unread)
  const markedReadRef = useRef(false);
  useEffect(() => {
    if (!hasUnread || markedReadRef.current) return;
    markedReadRef.current = true;
    fetch("/api/parent/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentId }),
    }).then(() => {
      setHasUnread(false);
      setThreads((prev) => prev.map((t) => ({ ...t, unread: false })));
    });
  }, [hasUnread, parentId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || !parentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          parentId,
          centerId,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || res.statusText);
      }
      setMessage("");
      fetchChat();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!auth) {
    return (
      <div className="min-h-screen bg-zinc-50 p-4 flex items-center justify-center">
        <p className="text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (auth === null) {
    return (
      <div className="min-h-screen bg-zinc-50 p-4 flex items-center justify-center">
        <p className="text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (!parentId) {
    return (
      <div className="min-h-screen bg-zinc-50 p-4 flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-600">Log in as a parent to ask questions.</p>
        <Link href="/login?next=/parent" className="text-blue-600 hover:underline">Go to login</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-4 pb-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-zinc-500 hover:text-zinc-700">
              ← Home
            </Link>
            <h1 className="text-xl font-semibold text-zinc-900">
              Ask a question
            </h1>
          </div>
          {hasUnread && (
            <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-medium text-white">
              New reply
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. What are your hours? When is tuition due?"
            className="w-full rounded-lg border border-zinc-300 p-3 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={3}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Asking…" : "Send"}
          </button>
        </form>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}

        {/* Chat history */}
        <div className="space-y-4">
          {threads.length === 0 && !loading && (
            <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-4 text-center text-zinc-500">
              No questions yet. Ask something above.
            </p>
          )}
          {threads.map((t) => (
            <div
              key={t.questionId}
              className={`rounded-lg border bg-white p-4 shadow-sm ${
                t.unread ? "ring-2 ring-amber-400" : "border-zinc-200"
              }`}
            >
              <p className="text-sm font-medium text-zinc-500">You asked</p>
              <p className="mt-1 text-zinc-900">{t.question}</p>
              {t.allAnswers.length > 0 ? (
                <div className="mt-3 space-y-4">
                  {t.allAnswers.map((a, idx) => (
                    <div key={idx} className="rounded border border-zinc-100 bg-zinc-50/50 p-3">
                      <p className="text-sm font-medium text-zinc-500">
                        {a.fromOperator && a.operatorName
                          ? `${a.operatorName} replied`
                          : "Answer"}
                        {a.unread && (
                          <span className="ml-2 text-xs font-medium text-amber-600">New reply</span>
                        )}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-zinc-800">
                        {a.content}
                      </p>
                      {a.sourceSlug && !a.fromOperator && (
                        <Link
                          href={`/handbook#${a.sourceSlug}`}
                          className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline"
                        >
                          View in handbook →
                        </Link>
                      )}
                      <p className="mt-2 text-xs text-zinc-400">
                        {new Date(a.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
              <p className="mt-2 text-xs text-zinc-400">
                Asked {new Date(t.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
