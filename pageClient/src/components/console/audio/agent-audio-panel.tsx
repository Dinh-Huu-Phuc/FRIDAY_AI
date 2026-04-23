"use client"

import { Volume2, VolumeX } from "lucide-react"

import { AudioBars } from "@/components/console/audio/audio-bars"
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
    <section className="rounded-[28px] border border-white/10 bg-[#070b0f] p-4 shadow-[0_24px_56px_rgba(0,0,0,0.28)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">
            Agent Audio
          </p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-100">
            FIRDAY Voice Output
          </h3>
          <p className="mt-1 text-sm text-zinc-400">
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
            variant={voiceReplyEnabled ? "outline" : "secondary"}
            onClick={onToggleVoiceReply}
            disabled={!voiceOutputSupported}
          >
            {voiceReplyEnabled ? <Volume2 /> : <VolumeX />}
            {voiceReplyEnabled ? "Voice Reply On" : "Voice Reply Off"}
          </Button>
        </div>
      </div>

      <div className="agent-audio-grid relative overflow-hidden rounded-[24px] border border-white/10 bg-black px-6 py-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.08),transparent_50%)]" />
        <div className="relative flex min-h-[150px] flex-col items-center justify-center gap-4">
          <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">
            Agent Audio
          </p>
          <AudioBars active={active} variant="agent" />
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
          Latest Spoken Reply
        </p>
        <p className="mt-2 text-sm leading-6 text-zinc-200">
          {latestReply || "Voice reply is armed and waiting for the next assistant message."}
        </p>
      </div>
    </section>
  )
}
