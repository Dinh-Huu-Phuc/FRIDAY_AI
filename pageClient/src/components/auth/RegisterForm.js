"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { validateRegisterForm } from "@/validators/authValidator"

export function RegisterForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    full_name: "",
    password: "",
    confirm_password: "",
  })
  const [errors, setErrors] = useState({})

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validation = validateRegisterForm(form)
    setErrors(validation.errors)
    if (!validation.ok) return
    await onSubmit({
      username: form.username,
      email: form.email,
      full_name: form.full_name,
      password: form.password,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Username" value={form.username} error={errors.username} onChange={(value) => update("username", value)} autoComplete="username" />
        <Field label="Email" value={form.email} error={errors.email} onChange={(value) => update("email", value)} autoComplete="email" />
      </div>
      <Field label="Full name" value={form.full_name} error={errors.full_name} onChange={(value) => update("full_name", value)} autoComplete="name" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Password" type="password" value={form.password} error={errors.password} onChange={(value) => update("password", value)} autoComplete="new-password" />
        <Field label="Confirm password" type="password" value={form.confirm_password} error={errors.confirm_password} onChange={(value) => update("confirm_password", value)} autoComplete="new-password" />
      </div>

      <Button className="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400" disabled={loading}>
        {loading ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  )
}

function Field({ label, value, onChange, error, type = "text", autoComplete }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-200">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        className="border-white/10 bg-black/30"
      />
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  )
}
