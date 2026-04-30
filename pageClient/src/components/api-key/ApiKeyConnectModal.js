"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { validateApiKey } from "@/validators/apiKeyValidator"

export function ApiKeyConnectModal({ open, onClose, isAuthenticated, onConnected }) {
  const router = useRouter()
  const [apiKey, setApiKey] = useState("")
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  if (!open) return null

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    const validation = validateApiKey(apiKey)
    if (!validation.ok) {
      setError(validation.errors.api_key)
      return
    }

    setLoading(true)
    try {
      await onConnected(apiKey)
      setApiKey("")
      onClose()
    } catch (requestError) {
      setError(
        requestError.message ||
          "This API key is invalid, revoked, expired, or does not belong to your account."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-cyan-400/20 bg-slate-950 p-6 shadow-2xl shadow-cyan-950/30">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
            FRIDAY Internal API Key
          </p>
          <h2 className="text-2xl font-semibold text-white">Connect existing key</h2>
          <p className="text-sm leading-6 text-zinc-300">
            Paste a FRIDAY Internal API Key created from FRIDAY Platform. The key must belong to the same logged-in account.
          </p>
        </div>

        {!isAuthenticated ? (
          <div className="mt-6 space-y-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
            <p>Please login before connecting an API key.</p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => router.push("/login?next=/console")}>
                Login
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-200">FRIDAY API Key</label>
              <Input
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                type="password"
                autoComplete="off"
                placeholder="friday_sk_dev_xxxxx"
                className="border-white/10 bg-black/30"
              />
            </div>

            {error ? (
              <p className="rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap justify-end gap-3">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button disabled={loading}>
                {loading ? "Verifying..." : "Verify & Save"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
