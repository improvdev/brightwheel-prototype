"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type LoginOption = { userKey: string; displayName: string; role: string; centerLabel: string };

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [options, setOptions] = useState<LoginOption[]>([]);
  const [userKey, setUserKey] = useState("");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/options")
      .then((r) => r.json())
      .then((data) => {
        setOptions(data.options ?? []);
        if (data.options?.length) setUserKey(data.options[0].userKey);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userKey, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      router.push(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold text-zinc-900 text-center">
          AI Front Desk
        </h1>
        <p className="text-zinc-600 text-center text-sm">
          Sign in as parent or operator for any center
        </p>
        <form onSubmit={handleSubmit} className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
          <div>
            <label htmlFor="userKey" className="block text-sm font-medium text-zinc-700 mb-1">
              Login as
            </label>
            <select
              id="userKey"
              value={userKey}
              onChange={(e) => setUserKey(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
              required
            >
              {options.map((o) => (
                <option key={o.userKey} value={o.userKey}>
                  {o.displayName} — {o.centerLabel} ({o.role})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
              placeholder="demo"
              autoComplete="current-password"
            />
            <p className="mt-1 text-xs text-zinc-500">Prototype: use &quot;demo&quot;</p>
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 flex items-center justify-center"><p className="text-zinc-500">Loading…</p></div>}>
      <LoginForm />
    </Suspense>
  );
}
