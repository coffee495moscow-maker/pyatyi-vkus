import { NextResponse, type NextRequest } from "next/server";
import { pool } from "@/lib/db/pool";

async function getSessionUser(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  if (!token) return null;

  const { rows } = await pool.query(
    `select u.id, u.role from sessions s
     join users u on u.id = s.user_id
     where s.id = $1 and s.expires_at > now()`,
    [token],
  );

  return rows[0] ?? null;
}

export async function proxy(request: NextRequest) {
  const user = await getSessionUser(request);

  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    if (user.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  const protectedPrefixes = ["/profile", "/checkout", "/bonuses"];
  if (
    !user &&
    protectedPrefixes.some((p) => request.nextUrl.pathname.startsWith(p))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/|uploads/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
