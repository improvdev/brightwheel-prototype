import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthFromCookie } from "@/lib/auth-cookie";

const LOGIN = "/login";

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path.startsWith("/api/")) return NextResponse.next();

  const cookieHeader = req.headers.get("cookie");
  const user = getAuthFromCookie(cookieHeader);

  if (path === LOGIN) {
    if (user) return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }

  const protectedPaths = ["/parent", "/operator", "/handbook"];
  const isProtected = protectedPaths.some((p) => path === p || path.startsWith(p + "/"));
  if (!isProtected) {
    if (path === "/" && !user) return NextResponse.redirect(new URL(LOGIN, req.url));
    return NextResponse.next();
  }

  if (!user) {
    const next = new URL(LOGIN, req.url);
    next.searchParams.set("next", path);
    return NextResponse.redirect(next);
  }

  if (path.startsWith("/parent") && user.role !== "parent") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (path.startsWith("/operator") && user.role !== "operator") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/parent", "/parent/:path*", "/operator", "/operator/:path*", "/handbook", "/handbook/:path*"],
};
