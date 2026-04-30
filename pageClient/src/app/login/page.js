"use client"

import { Suspense } from "react"
import { AuthPanel } from "@/components/auth/AuthPanel"

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] text-zinc-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.16),transparent_30%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px] opacity-30" />
      <section className="relative z-10 mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
            FIRDAY Agent Access
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">
              Keep provider secrets behind the FRIDAY gateway.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-zinc-300">
              Use 10 free agent questions each day, then login with the same account used by FRIDAY Platform and connect an owned internal API key.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-zinc-300 sm:grid-cols-3">
            {["10 free questions/day", "Owner-matched key verification", "No provider keys in browser"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                {item}
              </div>
            ))}
          </div>
        </div>
        <Suspense fallback={<div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 text-zinc-300">Loading auth...</div>}>
          <AuthPanel />
        </Suspense>
      </section>
    </main>
  )
}
