"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/router/routes";

export default function LoginGuard({ children }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace(ROUTES.login);
  }, [loading, user, router]);

  if (loading) return <main className="flex min-h-screen items-center justify-center text-sm text-slate-300">Checking secure session...</main>;
  if (!user) return null;
  return children(user);
}
