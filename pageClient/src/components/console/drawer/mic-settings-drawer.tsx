"use client"

import { AlertCircle, Mic, MicOff, Settings2, X } from "lucide-react"

import { AudioBars } from "@/components/console/audio/audio-bars"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MicSettingsDrawerProps {
  open: boolean
  isListening: boolean
  voiceDetected: boolean
  voiceInputSupported: boolean
  voiceOutputSupported: boolean
  transcriptPreview: string
  voiceError?: string | null
  onClose: () => void
  onToggleListening: () => void
}

export function MicSettingsDrawer({
  open,
  isListening,
  voiceDetected,
  voiceInputSupported,
  voiceOutputSupported,
  transcriptPreview,
  voiceError,
  onClose,
  onToggleListening,
}: MicSettingsDrawerProps) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-white/10 bg-[#090d12]/98 p-5 shadow-[-28px_0_80px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-full flex-col gap-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">
                Mic Menu
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-zinc-100">
                Voice Input Setup
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Configure microphone capture, watch the live user voice input waveform, and keep voice conversations ready.
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              className={cn(
                "border px-2.5 py-1 text-xs font-medium",
                voiceInputSupported
                  ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
                  : "border-white/10 bg-white/[0.03] text-zinc-400"
              )}
            >
              Mic {voiceInputSupported ? "Ready" : "Unavailable"}
            </Badge>
            <Badge
              className={cn(
                "border px-2.5 py-1 text-xs font-medium",
                voiceOutputSupported
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                  : "border-white/10 bg-white/[0.03] text-zinc-400"
              )}
            >
              Agent Audio {voiceOutputSupported ? "Ready" : "Unavailable"}
            </Badge>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-4 flex items-center gap-2">
              <Settings2 className="size-4 text-cyan-200" />
              <p className="text-sm font-medium text-zinc-100">Microphone Controls</p>
            </div>
            <Button
              variant={isListening ? "destructive" : "default"}
              onClick={onToggleListening}
              disabled={!voiceInputSupported}
              className="w-full"
            >
              {isListening ? <MicOff /> : <Mic />}
              {isListening ? "Stop Voice Capture" : "Start Voice Capture"}
            </Button>
          </div>

          {voiceError ? (
            <div className="flex items-start gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{voiceError}</span>
            </div>
          ) : null}

          <div className="rounded-[28px] border border-cyan-400/15 bg-[#07131a] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">
                  User Voice Input
                </p>
                <p className="mt-2 text-lg font-semibold text-zinc-100">
                  Live Microphone Feed
                </p>
              </div>
              <div
                className={cn(
                  "rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em]",
                  voiceDetected
                    ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
                    : "border-white/10 bg-white/[0.03] text-zinc-400"
                )}
              >
                {voiceDetected ? "Voice Detected" : isListening ? "Mic Armed" : "Idle"}
              </div>
            </div>

            <div className="mt-4 rounded-[24px] border border-white/10 bg-[#05090d] px-6 py-10">
              <div className="flex min-h-[180px] flex-col items-center justify-center gap-6">
                <AudioBars active={voiceDetected} variant="user" />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Transcript Preview
              </p>
              <p className="mt-2 min-h-20 text-sm leading-7 text-zinc-200">
                {transcriptPreview || "Voice transcript will appear here while the browser is listening."}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
