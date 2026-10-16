import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { authConfig } from "./auth.config"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        let dbUser = await prisma.user.findUnique({
          where: { email: parsed.data.email, deletedAt: null },
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        })

        if (!dbUser || !dbUser.password || !dbUser.isActive) return null

        // Bootstrap: promote to ADMIN once if ADMIN_EMAIL matches, email is confirmed,
        // and no other active ADMIN exists yet (one-time idempotent operation).
        if (process.env.ADMIN_EMAIL && dbUser.email === process.env.ADMIN_EMAIL) {
          const adminRole = await prisma.role.findFirst({
            where: { name: "ADMIN" },
            include: { permissions: { include: { permission: true } } },
          })
          if (adminRole && dbUser.roleId !== adminRole.id) {
            const emailConfirmed = dbUser.emailVerified !== null
            const adminAlreadyExists = await prisma.user.count({
              where: { role: { name: "ADMIN" }, isActive: true, deletedAt: null },
            }) > 0
            if (emailConfirmed && !adminAlreadyExists) {
              await prisma.user.update({ where: { id: dbUser.id }, data: { roleId: adminRole.id } })
              dbUser = { ...dbUser, roleId: adminRole.id, role: adminRole }
            }
          }
        }

        const valid = await bcrypt.compare(parsed.data.password, dbUser.password!)
        if (!valid) return null

        await prisma.auditLog.create({
          data: {
            userId: dbUser.id,
            action: "LOGIN",
            entity: "User",
            entityId: dbUser.id,
          },
        })

        return {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          image: dbUser.image,
          roleId: dbUser.roleId,
          roleName: dbUser.role.name,
          permissions: dbUser.role.permissions.map(
            (rp) => `${rp.permission.module}:${rp.permission.action}`
          ),
        }
      },
    }),
  ],
})
