"use client"

import { RefObject, useEffect, useRef, useState } from "react"

const audioGraphByElement = new WeakMap<
  HTMLAudioElement,
  {
    context: AudioContext
    source: MediaElementAudioSourceNode
  }
>()

interface UseAudioLevelOptions {
  enabled?: boolean
}

export function useAudioLevel(
  audioRef?: RefObject<HTMLAudioElement | null>,
  options: UseAudioLevelOptions = {}
) {
  const { enabled = true } = options
  const [level, setLevel] = useState(0)
  const frameRef = useRef<number | null>(null)
  const contextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    const audioElement = audioRef?.current
    if (!enabled || !audioElement || typeof window === "undefined") {
      setLevel(0)
      return
    }

    let analyser: AnalyserNode | null = null
    let disposed = false

    const stop = () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      setLevel(0)
    }

    const sample = () => {
      if (disposed || !analyser || audioElement.paused || audioElement.ended) {
        stop()
        return
      }

      const data = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(data)

      let total = 0
      for (const value of data) {
        total += value
      }

      setLevel(Math.min(1, total / (data.length * 255)))
      frameRef.current = window.requestAnimationFrame(sample)
    }

    const start = () => {
      try {
        const AudioContextCtor = window.AudioContext || window.webkitAudioContext
        if (!AudioContextCtor) return

        const graph = audioGraphByElement.get(audioElement)
        const context = graph?.context ?? contextRef.current ?? new AudioContextCtor()
        contextRef.current = context

        if (context.state === "suspended") {
          void context.resume().catch(() => undefined)
        }

        const source = graph?.source ?? context.createMediaElementSource(audioElement)
        audioGraphByElement.set(audioElement, { context, source })

        analyser = context.createAnalyser()
        analyser.fftSize = 512
        analyser.smoothingTimeConstant = 0.82
        source.connect(analyser)
        analyser.connect(context.destination)

        stop()
        frameRef.current = window.requestAnimationFrame(sample)
      } catch {
        stop()
      }
    }

    audioElement.addEventListener("play", start)
    audioElement.addEventListener("playing", start)
    audioElement.addEventListener("pause", stop)
    audioElement.addEventListener("ended", stop)

    if (!audioElement.paused && !audioElement.ended) {
      start()
    }

    return () => {
      disposed = true
      audioElement.removeEventListener("play", start)
      audioElement.removeEventListener("playing", start)
      audioElement.removeEventListener("pause", stop)
      audioElement.removeEventListener("ended", stop)
      stop()
      analyser?.disconnect()
      const activeContext = contextRef.current
      contextRef.current = null
      void activeContext?.close().catch(() => undefined)
    }
  }, [audioRef, enabled])

  return level
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}
