"use client"

import { Volume2, VolumeX } from "lucide-react"

import { AIOrb } from "@/components/AIOrb/AIOrb"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AgentAudioPanelProps {
  active: boolean
  statusLabel?: string
  voiceReplyEnabled: boolean
  voiceOutputSupported: boolean
  latestReply: string
  onToggleVoiceReply: () => void
}

export function AgentAudioPanel({
  active,
  statusLabel = "Standby",
  voiceReplyEnabled,
  voiceOutputSupported,
  latestReply,
  onToggleVoiceReply,
}: AgentAudioPanelProps) {
  return (
    <section className="rounded-2xl border border-cyan-400/15 bg-[#070b0f] p-3 shadow-[0_18px_42px_rgba(0,0,0,0.32)]">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">
            Agent Audio
          </p>
          <h3 className="mt-1 text-base font-semibold text-zinc-100">
            FIRDAY Voice Output
          </h3>
          <p className="mt-1 max-w-md text-xs leading-5 text-zinc-400">
            Visualizer follows live conversation activity from your mic and FIRDAY replies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={cn(
              "rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em]",
              active
                ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
                : "border-white/10 bg-white/[0.03] text-zinc-400"
            )}
          >
            {statusLabel}
          </div>
          <Button
            size="sm"
            variant={voiceReplyEnabled ? "outline" : "secondary"}
            onClick={onToggleVoiceReply}
            disabled={!voiceOutputSupported}
          >
            {voiceReplyEnabled ? <Volume2 /> : <VolumeX />}
            {voiceReplyEnabled ? "Voice Reply On" : "Voice Reply Off"}
          </Button>
        </div>
      </div>

      <div className="agent-audio-grid relative overflow-hidden rounded-2xl border border-white/10 bg-black px-4 py-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.08),transparent_50%)]" />
        <div className="relative flex min-h-[180px] flex-col items-center justify-center gap-2">
          <p className="text-[10px] uppercase tracking-[0.26em] text-zinc-500">
            Agent Audio
          </p>
          <AIOrb
            isListening={active}
            isSpeaking={active && voiceReplyEnabled}
            latestAssistantText={latestReply}
            size={170}
          />
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          Latest Spoken Reply
        </p>
        <p className="mt-1 line-clamp-3 text-xs leading-5 text-zinc-200">
          {latestReply || "Voice reply is armed and waiting for the next assistant message."}
        </p>
      </div>
    </section>
  )
}
