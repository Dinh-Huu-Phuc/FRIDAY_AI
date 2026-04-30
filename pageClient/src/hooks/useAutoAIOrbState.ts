"use client"

import { RefObject, useEffect, useMemo, useRef, useState } from "react"

import type { AIOrbState } from "@/components/AIOrb/types"

const MIN_SPEAKING_MS = 1200
const MAX_SPEAKING_MS = 8000

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

interface UseAutoAIOrbStateOptions {
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
}

export function useAutoAIOrbState({
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
}: UseAutoAIOrbStateOptions) {
  const [textSpeaking, setTextSpeaking] = useState(false)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const lastTextRef = useRef<string | undefined>(undefined)
  const initializedRef = useRef(false)

  useEffect(() => {
    const text = latestAssistantText?.trim() ?? ""
    if (!text) {
      lastTextRef.current = text
      return
    }

    if (!initializedRef.current) {
      initializedRef.current = true
      lastTextRef.current = text
      return
    }

    if (lastTextRef.current === text) return

    lastTextRef.current = text
    setTextSpeaking(true)

    const speakingDuration = clamp(text.length * 35, MIN_SPEAKING_MS, MAX_SPEAKING_MS)
    const timer = window.setTimeout(() => setTextSpeaking(false), speakingDuration)

    return () => window.clearTimeout(timer)
  }, [latestAssistantText])

  useEffect(() => {
    const audioElement = audioRef?.current
    if (!audioElement || typeof window === "undefined") {
      setAudioPlaying(false)
      return
    }

    const updateAudioPlaying = () => {
      setAudioPlaying(!audioElement.paused && !audioElement.ended)
    }

    updateAudioPlaying()
    audioElement.addEventListener("play", updateAudioPlaying)
    audioElement.addEventListener("playing", updateAudioPlaying)
    audioElement.addEventListener("pause", updateAudioPlaying)
    audioElement.addEventListener("ended", updateAudioPlaying)

    return () => {
      audioElement.removeEventListener("play", updateAudioPlaying)
      audioElement.removeEventListener("playing", updateAudioPlaying)
      audioElement.removeEventListener("pause", updateAudioPlaying)
      audioElement.removeEventListener("ended", updateAudioPlaying)
    }
  }, [audioRef])

  return useMemo<AIOrbState>(() => {
    // Priority: error > listening > speaking > thinking > idle.
    if (error) return "error"
    if (isListening || isRecording) return "listening"
    if (isSpeaking || isStreaming || audioPlaying || textSpeaking) return "speaking"
    if (isThinking || isLoading || isGenerating) return "thinking"
    return "idle"
  }, [
    audioPlaying,
    error,
    isGenerating,
    isListening,
    isLoading,
    isRecording,
    isSpeaking,
    isStreaming,
    isThinking,
    textSpeaking,
  ])
}
