"use client"

import type { CSSProperties } from "react"
import { Maximize2, Volume2, VolumeX } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FloatingVoiceWidgetProps {
  active: boolean
  statusLabel: string
  voiceReplyEnabled: boolean
  voiceOutputSupported: boolean
  voiceLevel: number
  onToggleVoiceReply: () => void
  onExpand: () => void
}

export function FloatingVoiceWidget({
  active,
  statusLabel,
  voiceReplyEnabled,
  voiceOutputSupported,
  voiceLevel,
  onToggleVoiceReply,
  onExpand,
}: FloatingVoiceWidgetProps) {
  const reactiveScale = 1 + voiceLevel * 0.28
  const reactiveGlow = 0.22 + voiceLevel * 0.58
  const particleState = active || voiceLevel > 0.04

  return (
    <div className="min-w-[320px] rounded-[22px] border border-cyan-400/25 bg-[#071017]/92 p-3.5 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div
          className="relative flex size-[4.25rem] shrink-0 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-400/10 shadow-[0_0_28px_rgba(34,211,238,0.2)]"
          style={
            {
              "--voice-scale": reactiveScale,
              "--voice-glow": reactiveGlow,
            } as CSSProperties
          }
        >
          <span className="absolute inset-0 rounded-full bg-cyan-300/10 animate-ping" />
          <span
            className={cn(
              "absolute inset-1 rounded-full border border-cyan-300/30 transition-transform duration-100",
              particleState ? "animate-pulse bg-cyan-300/15" : "animate-pulse bg-cyan-300/10"
            )}
            style={{ transform: `scale(${reactiveScale})` }}
          />
          <span
            className="absolute size-8 rounded-full bg-cyan-300/35 blur-md transition-opacity duration-100"
            style={{ opacity: reactiveGlow }}
          />
          <span
            className="absolute size-9 rounded-full bg-[radial-gradient(circle,rgba(103,232,249,0.85),rgba(34,211,238,0.26)_48%,transparent_72%)] transition-transform duration-100"
            style={{ transform: `scale(${0.78 + voiceLevel * 0.36})` }}
          />
          <span className="absolute inset-2 animate-spin rounded-full border border-cyan-300/30 border-t-cyan-100/70" />
          <span className="absolute inset-0 animate-[spin_6s_linear_infinite] rounded-full">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <span
                key={index}
                className="absolute left-1/2 top-1/2 size-1 rounded-full bg-cyan-200 shadow-[0_0_10px_rgba(103,232,249,0.9)]"
                style={{
                  transform: `rotate(${index * 60}deg) translateX(${28 + voiceLevel * 8}px)`,
                  opacity: particleState ? 0.9 : 0.45,
                }}
              />
            ))}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-200/70">
            Voice
          </p>
          <p
            className={cn(
              "mt-0.5 text-sm font-semibold",
              active ? "text-cyan-100" : "text-zinc-200"
            )}
          >
            {statusLabel}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            size="sm"
            variant={voiceReplyEnabled ? "outline" : "secondary"}
            onClick={onToggleVoiceReply}
            disabled={!voiceOutputSupported}
            title={voiceReplyEnabled ? "Voice Reply On" : "Voice Reply Off"}
            className="h-9 px-3"
          >
            {voiceReplyEnabled ? <Volume2 /> : <VolumeX />}
            <span>
              {voiceReplyEnabled ? "Voice Reply On" : "Voice Reply Off"}
            </span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onExpand}
            title="Open full voice visualizer"
            className="size-9"
          >
            <Maximize2 />
          </Button>
        </div>
      </div>
    </div>
  )
}
