import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"]
const AUTH_ROUTE = "/login"
const DEFAULT_REDIRECT = "/dashboard"

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isPublicRoute = PUBLIC_ROUTES.some((r) => nextUrl.pathname.startsWith(r))

  if (!session && !isPublicRoute) {
    const loginUrl = new URL(AUTH_ROUTE, nextUrl.origin)
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL(DEFAULT_REDIRECT, nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
