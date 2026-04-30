"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/router/routes";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTES.platform);
  }, [router]);

  return <main className="flex min-h-screen items-center justify-center text-sm text-slate-300">Routing to FRIDAY Platform...</main>;
}
