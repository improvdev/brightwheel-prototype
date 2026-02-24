"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

type Question = {
  id: number;
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
};

export default function OperatorPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<{ centerId: number; dbOperatorId: number; displayName: string } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState<Record<number, string>>({});
  const [sending, setSending] = useState<number | null>(null);
  const [rerunResult, setRerunResult] = useState<Record<number, string>>({});
  const [rerunError, setRerunError] = useState<Record<number, string>>({});
  const [rerunning, setRerunning] = useState<number | null>(null);

  const centerId = auth?.centerId ?? 1;

  const loadQuestions = useCallback(() => {
    return fetch(`/api/operator/questions?centerId=${centerId}`)
      .then((r) => r.json())
      .then((data) => setQuestions(data.questions ?? []));
  }, [centerId]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (r.status === 401) {
          router.replace("/login?next=/operator");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data?.dbOperatorId != null) {
          setAuth({
            centerId: data.centerId ?? 1,
            dbOperatorId: data.dbOperatorId,
            displayName: data.displayName ?? "Operator",
          });
        }
      });
  }, [router]);

  useEffect(() => {
    if (!auth) return;
    loadQuestions().finally(() => setLoading(false));
  }, [auth, loadQuestions]);

  async function sendReply(
    questionId: number,
    updateHandbook: boolean,
    contentOverride?: string
  ) {
    const content = (contentOverride ?? replyContent[questionId])?.trim();
    if (!content) return;
    setSending(questionId);
    try {
      const res = await fetch("/api/operator/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          content,
          operatorId: auth?.dbOperatorId ?? 1,
          operatorName: auth?.displayName ?? "Operator",
          updateHandbook,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { handbookUpdated?: boolean };
      if (!contentOverride) setReplyContent((prev) => ({ ...prev, [questionId]: "" }));
      loadQuestions();
      if (data.handbookUpdated) {
        window.location.assign("/operator/handbook?updated=1");
        return;
      }
    } finally {
      setSending(null);
    }
  }

  async function submitThumbs(answerId: number, thumbs: 1 | -1) {
    try {
      await fetch("/api/operator/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answerId, thumbs, centerId }),
      });
      loadQuestions();
    } catch {
      // ignore
    }
  }

  async function rerunQuestion(questionId: number) {
    setRerunning(questionId);
    setRerunResult((prev) => ({ ...prev, [questionId]: "" }));
    setRerunError((prev) => ({ ...prev, [questionId]: "" }));
    try {
      const res = await fetch(`/api/operator/rerun?questionId=${questionId}`);
      const text = await res.text();
      let data: { answer?: string; error?: string };
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setRerunError((prev) => ({ ...prev, [questionId]: res.ok ? "Invalid response" : `Error ${res.status}` }));
        return;
      }
      if (!res.ok) {
        setRerunError((prev) => ({ ...prev, [questionId]: data.error ?? `Error ${res.status}` }));
        return;
      }
      if (data.answer != null) {
        const answer = data.answer;
        setRerunResult((prev) => ({ ...prev, [questionId]: answer }));
        setReplyContent((prev) => ({ ...prev, [questionId]: answer }));
      }
    } finally {
      setRerunning(null);
    }
  }

  if (!auth) {
    return (
      <div className="min-h-screen bg-zinc-50 p-4 flex items-center justify-center">
        <p className="text-zinc-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="text-zinc-500 hover:text-zinc-700">
            ← Home
          </Link>
          <div className="text-right">
            <h1 className="text-xl font-semibold text-zinc-900">Operator dashboard</h1>
            <p className="text-sm text-zinc-500">Logged in as {auth.displayName}</p>
          </div>
        </div>

        <div className="mb-6 flex gap-2">
          <Link
            href="/operator/handbook"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Edit handbook
          </Link>
        </div>

        <h2 className="mb-3 text-sm font-medium text-zinc-500">Recent questions</h2>
        {loading ? (
          <p className="text-zinc-500">Loading…</p>
        ) : questions.length === 0 ? (
          <p className="rounded-lg border border-zinc-200 bg-white p-4 text-zinc-500">
            No questions yet. Ask something from the Parent view.
          </p>
        ) : (
          <ul className="space-y-4">
            {questions.map((q) => (
              <li
                key={q.id}
                className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <p className="font-medium text-zinc-900">{q.content}</p>
                {q.parent_display_name && (
                  <p className="mt-1 text-xs text-zinc-500">Asked by {q.parent_display_name}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span
                    className={`rounded px-1.5 py-0.5 ${
                      q.outcome === "answered"
                        ? "bg-green-100 text-green-800"
                        : q.outcome === "low_confidence" || q.outcome === "no_match"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {q.outcome.replace("_", " ")}
                  </span>
                  {q.confidence != null && (
                    <span
                      className={`rounded px-1.5 py-0.5 ${
                        q.confidence === "high" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      Confidence: {q.confidence}
                    </span>
                  )}
                  {q.sensitive_flag ? (
                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-800">
                      Sensitive
                    </span>
                  ) : null}
                  {q.operator_reply_count > 0 && (
                    <span className="text-zinc-500">
                      Replied by {q.last_operator_name || "Operator"}
                    </span>
                  )}
                </div>
                {q.operator_reply_count > 0 && q.last_operator_reply && (
                  <div className="mt-3 rounded border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-xs font-medium text-zinc-500">
                      Reply from {q.last_operator_name || "Operator"}
                      {q.last_operator_reply_at && (
                        <span className="ml-1 font-normal">
                          · {new Date(q.last_operator_reply_at).toLocaleString()}
                        </span>
                      )}
                    </p>
                    <div className="prose prose-sm prose-zinc mt-1 max-w-none font-sans text-base leading-relaxed text-zinc-700">
                      <ReactMarkdown>{q.last_operator_reply}</ReactMarkdown>
                    </div>
                  </div>
                )}
                {q.system_answer && (
                  <div className="mt-2">
                    <div className="prose prose-sm prose-zinc max-w-none font-sans text-base leading-relaxed text-zinc-700">
                      <ReactMarkdown>{q.system_answer}</ReactMarkdown>
                    </div>
                    {q.system_answer_id != null && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-zinc-500">Rate answer:</span>
                        <button
                          type="button"
                          onClick={() => submitThumbs(q.system_answer_id!, 1)}
                          className={`rounded p-1 ${q.system_answer_thumbs === 1 ? "bg-green-200 text-green-800" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}
                          title="Thumbs up"
                        >
                          👍
                        </button>
                        <button
                          type="button"
                          onClick={() => submitThumbs(q.system_answer_id!, -1)}
                          className={`rounded p-1 ${q.system_answer_thumbs === -1 ? "bg-red-200 text-red-800" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}
                          title="Thumbs down"
                        >
                          👎
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => rerunQuestion(q.id)}
                      disabled={rerunning !== null}
                      className="mt-2 text-xs text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {rerunning === q.id ? "Rerunning…" : "Rerun question (verify after handbook edit)"}
                    </button>
                    {rerunError[q.id] && (
                      <div className="mt-2 rounded border border-red-200 bg-red-50 p-3">
                        <span className="text-xs font-medium text-red-800">Rerun error: {rerunError[q.id]}</span>
                      </div>
                    )}
                    {rerunResult[q.id] && (
                      <div className="mt-2 rounded border border-green-200 bg-green-50 p-3">
                        <span className="text-xs font-medium text-green-800">New answer after rerun:</span>
                        <div className="prose prose-sm prose-zinc mt-1 max-w-none font-sans text-base leading-relaxed text-zinc-700">
                          <ReactMarkdown>{rerunResult[q.id]}</ReactMarkdown>
                        </div>
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => sendReply(q.id, false, rerunResult[q.id])}
                            disabled={sending !== null}
                            className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            Send to parent
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {q.suggested_draft && q.operator_reply_count === 0 && (
                  <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-3">
                    <span className="text-xs font-medium text-amber-800">
                      Suggested reply (draft):
                    </span>
                    <div className="prose prose-sm prose-zinc mt-1 max-w-none font-sans text-base leading-relaxed text-zinc-700">
                      <ReactMarkdown>{q.suggested_draft}</ReactMarkdown>
                    </div>
                  </div>
                )}
                <div className="mt-3 border-t border-zinc-100 pt-3">
                  <textarea
                    value={replyContent[q.id] ?? ""}
                    onChange={(e) =>
                      setReplyContent((prev) => ({
                        ...prev,
                        [q.id]: e.target.value,
                      }))
                    }
                    placeholder="Type your reply…"
                    className="w-full rounded border border-zinc-300 p-2 text-sm text-zinc-900 placeholder:text-zinc-400"
                    rows={2}
                    disabled={sending !== null}
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => sendReply(q.id, false)}
                      disabled={sending !== null || !replyContent[q.id]?.trim()}
                      className="rounded bg-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-300 disabled:opacity-50"
                    >
                      Send to parent
                    </button>
                    {(q.outcome === "low_confidence" ||
                      q.outcome === "no_match" ||
                      q.outcome === "escalated") && (
                      <button
                        type="button"
                        onClick={() => sendReply(q.id, true)}
                        disabled={sending !== null || !replyContent[q.id]?.trim()}
                        className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                      >
                        Reply & Update Handbook
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  {new Date(q.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
