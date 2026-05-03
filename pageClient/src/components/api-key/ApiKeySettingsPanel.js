"use client"

import { useAuth } from "@/hooks/useAuth"
import { useFridayApiKey } from "@/hooks/useFridayApiKey"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ApiKeyConnectModal } from "@/components/api-key/ApiKeyConnectModal"
import { useState } from "react"

export function ApiKeySettingsPanel() {
  const { isAuthenticated, user } = useAuth()
  const { keyStatus, savedKeys, connected, connectKey, disconnectKey } = useFridayApiKey()
  const [open, setOpen] = useState(false)

  return (
    <Card className="max-w-3xl border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle>API Access</CardTitle>
        <CardDescription>
          Connect an existing FRIDAY Internal API Key created in FRIDAY Platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-[#0f1419] p-4 text-sm text-zinc-300">
          <p>Status: <span className="text-zinc-100">{connected ? "Connected" : "Not connected"}</span></p>
          <p>User: <span className="text-zinc-100">{user?.email || user?.username || "Not logged in"}</span></p>
          <p>Key preview: <span className="text-zinc-100">{keyStatus?.preview || "None"}</span></p>
          <p>Scopes: <span className="text-zinc-100">{keyStatus?.scopes?.join(", ") || "None"}</span></p>
          {keyStatus?.quota ? (
            <p>Remaining quota: <span className="text-zinc-100">{keyStatus.quota.remaining ?? "Unknown"}</span></p>
          ) : null}
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0f1419] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
              Saved keys
            </p>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-zinc-400">
              {savedKeys.length}
            </span>
          </div>
          {!savedKeys.length ? (
            <p className="text-sm text-zinc-400">
              No keys are available for this account yet.
            </p>
          ) : (
            <div className="space-y-2">
              {savedKeys.map((key) => (
                <div
                  key={key.id || key.keyId || key.preview}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-zinc-100">{key.name}</p>
                    <p className="font-mono text-xs text-cyan-100">{key.preview}</p>
                  </div>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-100">
                    {keyStatus?.preview === key.preview ? "Connected" : key.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setOpen(true)}>
            {connected ? "Replace Key" : "Connect API Key"}
          </Button>
          {connected ? (
            <Button variant="outline" onClick={disconnectKey}>
              Disconnect
            </Button>
          ) : null}
        </div>

        <ApiKeyConnectModal
          open={open}
          onClose={() => setOpen(false)}
          isAuthenticated={isAuthenticated}
          onConnected={connectKey}
          savedKeys={savedKeys}
          connectedKey={keyStatus}
        />
      </CardContent>
    </Card>
  )
}
