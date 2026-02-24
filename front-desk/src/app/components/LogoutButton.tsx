"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={handleLogout}
      className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-center text-zinc-600 hover:bg-zinc-100"
    >
      Sign out
    </button>
  );
}
