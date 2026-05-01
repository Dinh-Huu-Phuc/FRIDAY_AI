"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoginForm } from "@/components/auth/LoginForm"
import { RegisterForm } from "@/components/auth/RegisterForm"
import { useAuth } from "@/hooks/useAuth"

export function AuthPanel() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, register } = useAuth()
  const [mode, setMode] = useState("login")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const redirectTarget = useMemo(() => {
    const next = searchParams.get("next") || "/console"
    return next.startsWith("/") ? next : "/console"
  }, [searchParams])

  async function handleLogin(payload) {
    setLoading(true)
    setError(null)
    try {
      await login(payload)
      router.replace(redirectTarget)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(payload) {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const response = await register(payload)
      if (response.auto_login || response.user) {
        router.replace(redirectTarget)
        return
      }
      setMessage("Account created. Please login with the new credentials.")
      setMode("login")
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-xl border-cyan-400/20 bg-slate-950/75 shadow-2xl shadow-cyan-950/30 backdrop-blur">
      <CardHeader className="space-y-4">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-cyan-100">
          <ShieldCheck className="size-4" />
          Shared Backend Auth
        </div>
        <CardTitle className="text-2xl text-zinc-50">
          Sign in to connect a FRIDAY Internal API Key
        </CardTitle>
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/30 p-1">
          <Button
            type="button"
            variant={mode === "login" ? "default" : "ghost"}
            onClick={() => setMode("login")}
          >
            Login
          </Button>
          <Button
            type="button"
            variant={mode === "register" ? "default" : "ghost"}
            onClick={() => setMode("register")}
          >
            Create Account
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {message ? <p className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">{message}</p> : null}
        {error ? <p className="rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p> : null}
        {mode === "login" ? (
          <LoginForm onSubmit={handleLogin} loading={loading} />
        ) : (
          <RegisterForm onSubmit={handleRegister} loading={loading} />
        )}
      </CardContent>
    </Card>
  )
}
