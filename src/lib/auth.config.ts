import type { NextAuthConfig } from "next-auth"
import { SignJWT, jwtVerify } from "jose"
import type { JWT } from "next-auth/jwt"

// NextAuth's default JWT encoding uses JWE (AES-256-GCM via crypto.subtle).
// In certain Node.js 20.x builds on Vercel, this triggers a native assertion
// failure in CipherJob<AESCipherTraits>::ToResult (SIGABRT crash).
// Fix: override encode/decode to use JWS (HMAC-SHA256). The payload is still
// auth-controlled and unforgeable — only the encryption layer is removed.
// Trade-off: the JWT payload is base64-readable, but it only contains the
// user's own role/permissions which are already visible in the UI.
function jwtKey(secret: string | string[] | Buffer | unknown): Uint8Array {
  const s = Array.isArray(secret) ? secret[0] : (secret as string)
  return new TextEncoder().encode(s)
}

export const authConfig = {
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  jwt: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    encode: async ({ token, secret, maxAge }: any) => {
      const key = jwtKey(secret)
      const expiry = Math.floor(Date.now() / 1000) + (maxAge ?? 30 * 24 * 60 * 60)
      return await new SignJWT(token as Record<string, unknown>)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(expiry)
        .sign(key)
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    decode: async ({ token, secret }: any): Promise<JWT | null> => {
      if (!token) return null
      try {
        const key = jwtKey(secret)
        const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] })
        return payload as unknown as JWT
      } catch {
        return null
      }
    },
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jwt({ token, user }: any) {
      if (user) {
        token.roleId = user.roleId
        token.roleName = user.roleName
        token.permissions = user.permissions
      }
      return token
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session({ session, token }: any) {
      if (token) {
        session.user.id = token.sub as string
        session.user.roleId = token.roleId as string
        session.user.roleName = token.roleName as string
        session.user.permissions = token.permissions as string[]
      }
      return session
    },
  },
} satisfies NextAuthConfig
