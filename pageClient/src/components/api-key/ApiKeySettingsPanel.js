"use client"

import { useAuth } from "@/hooks/useAuth"
import { useFridayApiKey } from "@/hooks/useFridayApiKey"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ApiKeyConnectModal } from "@/components/api-key/ApiKeyConnectModal"
import { useState } from "react"

export function ApiKeySettingsPanel() {
  const { isAuthenticated, user } = useAuth()
  const { keyStatus, connected, connectKey, disconnectKey } = useFridayApiKey()
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
        />
      </CardContent>
    </Card>
  )
}
