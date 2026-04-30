"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "@/components/friday-platform/auth/LoginForm";
import RegisterForm from "@/components/friday-platform/auth/RegisterForm";
import Toast from "@/components/friday-platform/shared/Toast";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { ROUTES } from "@/router/routes";

export default function AuthPanel() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState(initialMode);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const { login, register } = useAuth({ autoLoad: false });
  const { toast, showToast } = useToast();
  const router = useRouter();

  function redirectAfterAuth() {
    const next = searchParams.get("next") || ROUTES.platform;
    const tab = searchParams.get("tab") || "api-keys";
    router.replace(`${next}?tab=${tab}`);
  }

  async function handleLogin(payload) {
    setSubmitting(true);
    setFormError("");
    try {
      await login(payload);
      redirectAfterAuth();
    } catch (error) {
      setFormError(error.message);
      showToast(error.message, "danger");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(payload) {
    setSubmitting(true);
    setFormError("");
    try {
      const data = await register(payload);
      if (data?.autoLogin && data?.user) {
        redirectAfterAuth();
      } else {
        showToast("Account created. Login to continue.");
        setMode("login");
      }
    } catch (error) {
      setFormError(error.message);
      showToast(error.message, "danger");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Card className="friday-auth-card w-full max-w-[31rem]">
        <CardHeader className="pb-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100">
              INTERNAL GATEWAY
            </div>
            <div className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)]" />
          </div>
          <CardTitle className="text-2xl">FRIDAY Platform</CardTitle>
          <CardDescription>Secure access for internal API key management.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <TabsList className="friday-auth-tabs w-full">
            <TabsTrigger className="flex-1" active={mode === "login"} onClick={() => setMode("login")}>Login</TabsTrigger>
            <TabsTrigger className="flex-1" active={mode === "register"} onClick={() => setMode("register")}>Create Account</TabsTrigger>
          </TabsList>
          {formError ? <div className="rounded-md border border-red-400/25 bg-red-400/10 px-3 py-2 text-sm text-red-100">{formError}</div> : null}
          <div className="friday-auth-form-swap">
            {mode === "login" ? <LoginForm onSubmit={handleLogin} loading={submitting} /> : <RegisterForm onSubmit={handleRegister} loading={submitting} />}
          </div>
          <p className="text-center text-xs leading-5 text-slate-500">
            FRIDAY internal keys protect the real model provider keys from client exposure.
          </p>
        </CardContent>
      </Card>
      <Toast toast={toast} />
    </>
  );
}
