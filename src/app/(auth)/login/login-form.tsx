"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
})
type FormData = z.infer<typeof schema>

const darkInput = cn(
  "h-10 w-full px-3 text-sm outline-none transition-colors disabled:opacity-50",
  "bg-[#16181c] border-[1.5px] border-[#3a3f46] text-[#c2c7cc]",
  "placeholder:text-[#6b7178] focus:border-[#b5652f]"
)

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })
      if (result?.error) {
        toast.error("E-mail ou senha incorretos")
        return
      }
      router.push(callbackUrl)
      router.refresh()
    } catch {
      toast.error("Erro ao fazer login. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    /* Card */
    <div
      className="w-full max-w-[400px] relative"
      style={{ backgroundColor: "#21242a", padding: "40px 36px" }}
    >
      {/* Top-right copper triangle motif */}
      <div
        className="absolute top-0 right-0 w-7 h-7"
        style={{
          backgroundColor: "#b5652f",
          clipPath: "polygon(100% 0, 100% 100%, 0 0)",
        }}
      />

      {/* Logo mark */}
      <div className="mb-9">
        <Image
          src="/logo/FORJA%20BRANCO%20SEM%20FUNDO-%20Editado.png"
          alt="Forja Pro"
          width={180}
          height={60}
          className="object-contain"
          priority
        />
      </div>

      {/* Eyebrow */}
      <p className="font-mono text-[11px] text-[#9ba1a8] tracking-[0.08em] uppercase mb-1">
        Sistema de Gestão Comercial
      </p>

      {/* Heading */}
      <h1 className="font-display font-bold text-[22px] text-[#f5f6f7] mb-7">
        Acesse sua conta
      </h1>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-[12px] font-semibold text-[#c2c7cc] mb-1.5"
          >
            E-mail
          </label>
          <input
            id="email"
            type="email"
            placeholder="nome@forjapro.com.br"
            autoComplete="email"
            disabled={loading}
            className={darkInput}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-[#b23b32] mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-[12px] font-semibold text-[#c2c7cc] mb-1.5"
          >
            Senha
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={loading}
              className={cn(darkInput, "pr-10")}
              {...register("password")}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7178] hover:text-[#c2c7cc] transition-colors"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-[#b23b32] mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Forgot password */}
        <div className="flex justify-end -mt-1">
          <Link
            href="/forgot-password"
            className="text-[12px] text-[#9ba1a8] hover:text-[#c2c7cc] transition-colors"
          >
            Esqueci minha senha
          </Link>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          className="w-full mt-2"
          disabled={loading}
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  )
}
