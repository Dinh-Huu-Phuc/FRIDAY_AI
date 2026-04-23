"use client"

import { useEffect, useRef } from "react"
import { Bot, MapPin, Volume2, X } from "lucide-react"

import { useBackendConnection } from "@/hooks/use-backend-connection"
import { useConnectionGreeting } from "@/hooks/use-connection-greeting"
import { Button } from "@/components/ui/button"

export function GlobalConnectionReport() {
  const { isConnected } = useBackendConnection()
  const { greeting, clearGreeting } = useConnectionGreeting()
  const lastSpokenGreetingRef = useRef<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !isConnected || !greeting) {
      return
    }

    const greetingKey = `${greeting.generatedAt}:${greeting.message}`
    if (lastSpokenGreetingRef.current === greetingKey) {
      return
    }

    lastSpokenGreetingRef.current = greetingKey

    if (!window.speechSynthesis) {
      return
    }

    const utterance = new SpeechSynthesisUtterance(greeting.message)
    utterance.lang = "vi-VN"
    utterance.rate = 1
    utterance.pitch = 1

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)

    return () => {
      window.speechSynthesis.cancel()
    }
  }, [greeting, isConnected])

  if (!isConnected || !greeting) {
    return null
  }

  return (
    <section className="border-b border-cyan-400/10 bg-[linear-gradient(135deg,rgba(14,116,144,0.16),rgba(9,12,18,0.98))] px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-4 rounded-[24px] border border-cyan-400/15 bg-[#091017]/90 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.24)] xl:flex-row xl:items-start xl:justify-between">
        <div className="flex gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
            <Bot className="size-5" />
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-cyan-100/80">
              <span>FIRDAY Connected Report</span>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 tracking-[0.16em]">
                Live Greeting
              </span>
            </div>

            <p className="max-w-5xl text-sm leading-7 text-zinc-100">
              {greeting.message}
            </p>

            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                <MapPin className="size-3.5 text-cyan-200" />
                {greeting.location}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                <Volume2 className="size-3.5 text-cyan-200" />
                Greeting synced after connect
              </span>
            </div>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={clearGreeting} className="self-end xl:self-start">
          <X />
        </Button>
      </div>
    </section>
  )
}
