"use client"

import { useCallback, useEffect, useState } from "react"

import { ChatInput } from "@/components/console/chat-input"
import { ChatPanel } from "@/components/console/chat-panel"
import { PlannedActionCard } from "@/components/computer/planned-action-card"
import { RuntimeMiniCard } from "@/components/computer/runtime-mini-card"
import { PageShell } from "@/components/layout/page-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getConsoleSnapshot, sendAgentMessage } from "@/lib/runtime-api"
import type { ChatMessage, ConsoleSnapshot } from "@/lib/types"

export default function ConsolePage() {
  const [snapshot, setSnapshot] = useState<ConsoleSnapshot | null>(null)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const loadSnapshot = useCallback(async () => {
    setLoading(true)
    const result = await getConsoleSnapshot()
    setSnapshot(result.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSnapshot()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadSnapshot])

  async function handleSend() {
    if (!message.trim()) return
    setSending(true)
    const optimisticMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
      status: "sent",
    }

    setSnapshot((current) =>
      current
        ? { ...current, messages: [...current.messages, optimisticMessage] }
        : current
    )

    const nextMessage = message
    setMessage("")
    const result = await sendAgentMessage(nextMessage)
    setSnapshot((current) =>
      current
        ? { ...current, messages: result.data.messages }
        : current
    )
    setSending(false)
  }

  if (loading || !snapshot) {
    return (
      <PageShell
        title="Agent Console"
        description="Chat with FIRDAY and inspect the latest runtime responses."
        backendStatus={{ status: "mock", label: "Loading", detail: "Fetching console state...", source: "mock" }}
        safetyMode="strict"
        busy
      >
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-sm text-zinc-400">
          Loading console...
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Agent Console"
      description="Send commands to FIRDAY and review the latest planning and execution context."
      backendStatus={snapshot.backendStatus}
      safetyMode={snapshot.runtimeState.safetyMode}
      busy={sending}
    >
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <ChatPanel messages={snapshot.messages} loading={loading} />
          <ChatInput
            value={message}
            onChange={setMessage}
            onSubmit={handleSend}
            onClear={() => setSnapshot((current) => (current ? { ...current, messages: [] } : current))}
            loading={sending}
          />
        </div>

        <div className="space-y-6">
          <RuntimeMiniCard runtime={snapshot.runtimeState} />
          <PlannedActionCard plan={snapshot.latestPlan} />
          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader>
              <CardTitle>Latest Execution Result</CardTitle>
              <CardDescription>
                Most recent executor output returned by the backend.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-xl border border-white/10 bg-[#0f1419] p-4 text-xs leading-6 text-zinc-300">
                {JSON.stringify(snapshot.latestExecution ?? {}, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  )
}
