import { NextRequest, NextResponse } from "next/server"

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"]
const AUTH_ROUTE = "/login"
const DEFAULT_REDIRECT = "/dashboard"

// NextAuth v5 cookie names (session-token is present = user has an active session)
const COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token"

export function middleware(req: NextRequest) {
  const { nextUrl } = req
  const isPublicRoute = PUBLIC_ROUTES.some((r) => nextUrl.pathname.startsWith(r))
  const hasSession = !!req.cookies.get(COOKIE_NAME)?.value

  if (!hasSession && !isPublicRoute) {
    const loginUrl = new URL(AUTH_ROUTE, nextUrl.origin)
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (hasSession && isPublicRoute) {
    return NextResponse.redirect(new URL(DEFAULT_REDIRECT, nextUrl.origin))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
