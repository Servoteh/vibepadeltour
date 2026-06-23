// Magic-link prijava kapitena: postavi cookie i preusmeri na /kapiten.
// (Cookie se sme menjati u Route Handler-u, ne u render-u strane.)
import { NextResponse, type NextRequest } from "next/server";
import { captainByToken, CAPTAIN_COOKIE } from "@/lib/captain-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const cap = await captainByToken(token);
  const base = req.nextUrl;

  if (!cap) return NextResponse.redirect(new URL("/kapiten?err=link", base));

  const res = NextResponse.redirect(new URL("/kapiten", base));
  res.cookies.set(CAPTAIN_COOKIE, token, {
    httpOnly: true,
    secure: base.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 dana
  });
  return res;
}
