import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALE_COOKIE, LOCALE_HEADER, isLocaleCode } from "@/lib/locale-cookie";

export function proxy(request: NextRequest) {
  const proto = request.headers.get("x-forwarded-proto");
  if (process.env.NODE_ENV === "production" && proto === "http") {
    const httpsUrl = request.nextUrl.clone();
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 308);
  }

  const { pathname } = request.nextUrl;
  const session = request.cookies.get("glai_session");
  const gated = pathname.startsWith("/admin") || pathname.startsWith("/dashboard");
  if (gated && !session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  const langParam = request.nextUrl.searchParams.get("lang");
  const langCookie = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocaleCode(langParam)
    ? langParam
    : isLocaleCode(langCookie)
      ? langCookie
      : "en";

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER, locale);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (isLocaleCode(langParam) && langParam !== langCookie) {
    response.cookies.set(LOCALE_COOKIE, langParam, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api/|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)"],
};
