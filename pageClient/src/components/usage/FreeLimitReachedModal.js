"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function FreeLimitReachedModal({ open, onClose, onConnectKey }) {
  const router = useRouter()
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-rose-400/20 bg-slate-950 p-6 shadow-2xl shadow-rose-950/30">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-200">
            Daily free limit reached
          </p>
          <h2 className="text-2xl font-semibold text-white">
            Connect a FRIDAY API Key to continue
          </h2>
          <p className="text-sm leading-6 text-zinc-300">
            You have used 10 free questions today. Login and connect a FRIDAY API Key created from FRIDAY Platform to continue.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => router.push("/login?next=/console")}>
            Login / Create Account
          </Button>
          <Button variant="outline" onClick={onConnectKey}>
            Connect API Key
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
