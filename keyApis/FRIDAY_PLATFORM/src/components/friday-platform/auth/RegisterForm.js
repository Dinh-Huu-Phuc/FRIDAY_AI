"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateRegisterForm } from "@/validators/authValidator";

export default function RegisterForm({ onSubmit, loading = false }) {
  const [values, setValues] = useState({ username: "", email: "", full_name: "", password: "", confirm_password: "" });
  const [errors, setErrors] = useState({});

  async function submit(event) {
    event.preventDefault();
    const result = validateRegisterForm(values);
    setErrors(result.errors);
    if (result.ok) {
      const { confirm_password, ...payload } = values;
      await onSubmit(payload);
    }
  }

  function update(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label>Username</Label><Input autoComplete="username" placeholder="friday_admin" value={values.username} onChange={(e) => update("username", e.target.value)} />{errors.username ? <p className="text-xs text-red-300">{errors.username}</p> : null}</div>
        <div className="space-y-2"><Label>Email</Label><Input autoComplete="email" placeholder="admin@friday.local" value={values.email} onChange={(e) => update("email", e.target.value)} />{errors.email ? <p className="text-xs text-red-300">{errors.email}</p> : null}</div>
      </div>
      <div className="space-y-2"><Label>Full name</Label><Input autoComplete="name" placeholder="Friday Operator" value={values.full_name} onChange={(e) => update("full_name", e.target.value)} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label>Password</Label><Input autoComplete="new-password" type="password" placeholder="Minimum 8 characters" value={values.password} onChange={(e) => update("password", e.target.value)} />{errors.password ? <p className="text-xs text-red-300">{errors.password}</p> : null}</div>
        <div className="space-y-2"><Label>Confirm password</Label><Input autoComplete="new-password" type="password" placeholder="Repeat password" value={values.confirm_password} onChange={(e) => update("confirm_password", e.target.value)} />{errors.confirm_password ? <p className="text-xs text-red-300">{errors.confirm_password}</p> : null}</div>
      </div>
      <Button className="friday-gradient-button w-full" type="submit" disabled={loading}>{loading ? "Creating account..." : "Create Account"}</Button>
    </form>
  );
}
