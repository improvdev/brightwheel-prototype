"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function HandbookContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [centerId, setCenterId] = useState<number | null>(null);
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [showUpdatedBanner, setShowUpdatedBanner] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (r.status === 401) {
          router.replace("/login?next=/operator/handbook");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data?.centerId != null) setCenterId(data.centerId);
      });
  }, [router]);

  useEffect(() => {
    if (searchParams.get("updated") === "1") {
      setShowUpdatedBanner(true);
      router.replace("/operator/handbook");
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (centerId == null) return;
    fetch(`/api/handbook?centerId=${centerId}`)
      .then((r) => r.json())
      .then((data) => setMarkdown(data.markdown ?? ""))
      .catch(() => setMarkdown(""))
      .finally(() => setLoading(false));
  }, [centerId]);

  async function handleSave() {
    if (centerId == null) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/operator/handbook", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ centerId, markdown }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setMessage({ type: "ok", text: "Saved." });
    } catch {
      setMessage({ type: "error", text: "Failed to save." });
    } finally {
      setSaving(false);
    }
  }

  if (centerId == null || loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <p className="text-zinc-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/operator" className="text-zinc-500 hover:text-zinc-700">
            ← Dashboard
          </Link>
        </div>
        {showUpdatedBanner && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Reply was sent to the parent and the handbook was updated. New content was added at the bottom—review and edit as needed.
          </div>
        )}
        <div className="mb-6 flex items-center justify-end gap-2">
          {message && (
            <span
              className={
                message.type === "ok" ? "text-green-600" : "text-red-600"
              }
            >
              {message.text}
            </span>
          )}
          <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
        </div>
        <textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          className="min-h-[60vh] w-full rounded-lg border border-zinc-300 p-4 font-mono text-sm text-zinc-900"
          spellCheck={false}
        />
      </div>
    </div>
  );
}

export default function OperatorHandbookPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen p-6 flex items-center justify-center">
        <p className="text-zinc-500">Loading…</p>
      </div>
    }>
      <HandbookContent />
    </Suspense>
  );
}
