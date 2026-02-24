import { cookies } from "next/headers";
import Link from "next/link";
import { getAuthFromCookieValue, COOKIE_NAME } from "@/lib/auth-cookie";
import { LogoutButton } from "./components/LogoutButton";

export default async function Home() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(COOKIE_NAME)?.value;
  const user = getAuthFromCookieValue(authCookie);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="mx-auto max-w-md space-y-8 pt-12">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900">
            AI Front Desk
          </h1>
          <span className="text-sm text-zinc-500">{user.displayName}</span>
        </div>
        <p className="text-zinc-600">
          Sunnyvale Childcare Center — prototype. Choose a view:
        </p>
        <div className="flex flex-col gap-4">
          {user.role === "parent" && (
            <Link
              href="/parent"
              className="rounded-lg bg-blue-600 px-4 py-3 text-center font-medium text-white hover:bg-blue-700"
            >
              Parent — Ask a question
            </Link>
          )}
          {user.role === "operator" && (
            <Link
              href="/operator"
              className="rounded-lg bg-blue-600 px-4 py-3 text-center font-medium text-white hover:bg-blue-700"
            >
              Operator — Control center
            </Link>
          )}
          <Link
            href="/handbook"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-3 text-center font-medium text-zinc-800 hover:bg-zinc-50"
          >
            View handbook (read-only)
          </Link>
          <div className="pt-4">
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
