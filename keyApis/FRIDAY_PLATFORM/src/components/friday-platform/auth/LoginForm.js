"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateLoginForm } from "@/validators/authValidator";

export default function LoginForm({ onSubmit, loading = false }) {
  const [values, setValues] = useState({ username_or_email: "", password: "" });
  const [errors, setErrors] = useState({});

  async function submit(event) {
    event.preventDefault();
    const result = validateLoginForm(values);
    setErrors(result.errors);
    if (result.ok) await onSubmit(values);
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="space-y-2">
        <Label>Username or email</Label>
        <Input autoComplete="username" placeholder="admin@friday.local" value={values.username_or_email} onChange={(e) => setValues({ ...values, username_or_email: e.target.value })} />
        {errors.username_or_email ? <p className="text-xs text-red-300">{errors.username_or_email}</p> : null}
      </div>
      <div className="space-y-2">
        <Label>Password</Label>
        <Input autoComplete="current-password" type="password" placeholder="Enter secure password" value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} />
        {errors.password ? <p className="text-xs text-red-300">{errors.password}</p> : null}
      </div>
      <Button className="friday-gradient-button w-full" type="submit" disabled={loading}>{loading ? "Authenticating..." : "Login"}</Button>
    </form>
  );
}
