import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
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
