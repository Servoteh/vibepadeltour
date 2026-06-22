// Proxy (Next.js 16 — bivši "middleware"). Optimistička zaštita /admin ruta:
// preusmeri na login ako nema session cookie-ja. Prava provera potpisa radi se u
// requireAdmin() u admin layout-u i u svakoj server akciji.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "vpt_admin"; // mora da odgovara lib/auth.ts

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin/login")) return NextResponse.next();
  if (!req.cookies.get(SESSION_COOKIE)?.value) {
    return NextResponse.redirect(new URL("/admin/login", req.nextUrl));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
