import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"]
const AUTH_ROUTE = "/login"
const DEFAULT_REDIRECT = "/dashboard"

export async function middleware(req: NextRequest) {
  const { nextUrl } = req
  const isPublicRoute = PUBLIC_ROUTES.some((r) => nextUrl.pathname.startsWith(r))

  let token = null
  try {
    token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
    })
  } catch {
    // AUTH_SECRET ausente ou token inválido — tratar como não autenticado
  }

  if (!token && !isPublicRoute) {
    const loginUrl = new URL(AUTH_ROUTE, nextUrl.origin)
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL(DEFAULT_REDIRECT, nextUrl.origin))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
