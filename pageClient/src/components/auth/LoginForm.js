"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { validateLoginForm } from "@/validators/authValidator"

export function LoginForm({ onSubmit, loading }) {
  const [form, setForm] = useState({ username_or_email: "", password: "" })
  const [errors, setErrors] = useState({})

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validation = validateLoginForm(form)
    setErrors(validation.errors)
    if (!validation.ok) return
    await onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-200">Username or email</label>
        <Input
          value={form.username_or_email}
          onChange={(event) => update("username_or_email", event.target.value)}
          autoComplete="username"
          className="border-white/10 bg-black/30"
          placeholder="you@example.com"
        />
        {errors.username_or_email ? <p className="text-xs text-rose-300">{errors.username_or_email}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-200">Password</label>
        <Input
          type="password"
          value={form.password}
          onChange={(event) => update("password", event.target.value)}
          autoComplete="current-password"
          className="border-white/10 bg-black/30"
          placeholder="Password"
        />
        {errors.password ? <p className="text-xs text-rose-300">{errors.password}</p> : null}
      </div>

      <Button
        type="submit"
        className="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400"
        disabled={loading}
      >
        {loading ? "Signing in..." : "Login"}
      </Button>
    </form>
  )
}
