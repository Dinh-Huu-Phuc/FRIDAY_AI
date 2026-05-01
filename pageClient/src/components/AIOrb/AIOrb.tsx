"use client"

import type { CSSProperties, RefObject } from "react"

import { useAudioLevel } from "@/hooks/useAudioLevel"
import { useAutoAIOrbState } from "@/hooks/useAutoAIOrbState"
import { cn } from "@/lib/utils"

import { AIOrbCanvas } from "./AIOrbCanvas"
import "./aiOrb.css"

interface AIOrbProps {
  audioRef?: RefObject<HTMLAudioElement | null>
  isListening?: boolean
  isRecording?: boolean
  isThinking?: boolean
  isLoading?: boolean
  isGenerating?: boolean
  isStreaming?: boolean
  isSpeaking?: boolean
  error?: unknown
  latestAssistantText?: string
  size?: number
  className?: string
}

export function AIOrb({
  audioRef,
  isListening,
  isRecording,
  isThinking,
  isLoading,
  isGenerating,
  isStreaming,
  isSpeaking,
  error,
  latestAssistantText,
  size = 320,
  className,
}: AIOrbProps) {
  const state = useAutoAIOrbState({
    audioRef,
    isListening,
    isRecording,
    isThinking,
    isLoading,
    isGenerating,
    isStreaming,
    isSpeaking,
    error,
    latestAssistantText,
  })
  const audioLevel = useAudioLevel(audioRef)

  return (
    <div
      className={cn("ai-orb", className)}
      data-state={state}
      style={{ "--ai-orb-size": `${size}px` } as CSSProperties}
      aria-label={`FIRDAY agent status: ${state}`}
      role="img"
    >
      <AIOrbCanvas state={state} audioLevel={audioLevel} size={size} />
      <div className="ai-orb__halo" aria-hidden="true" />
    </div>
  )
}
