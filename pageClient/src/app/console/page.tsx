"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { KeyRound, Menu, Mic } from "lucide-react"

import { AgentAudioPanel } from "@/components/console/audio/agent-audio-panel"
import { FloatingVoiceWidget } from "@/components/console/audio/floating-voice-widget"
import { ApiKeyConnectModal } from "@/components/api-key/ApiKeyConnectModal"
import { ChatInput } from "@/components/console/chat-input"
import { ChatPanel } from "@/components/console/chat-panel"
import { FreeLimitReachedModal } from "@/components/usage/FreeLimitReachedModal"
import { FreeUsageBadge } from "@/components/usage/FreeUsageBadge"
import { MicSettingsDrawer } from "@/components/console/drawer/mic-settings-drawer"
import { PageShell } from "@/components/layout/page-shell"
import { useBackendConnection } from "@/hooks/use-backend-connection"
import { useAuth } from "@/hooks/useAuth"
import { useFreeUsageLimit } from "@/hooks/useFreeUsageLimit"
import { useFridayApiKey } from "@/hooks/useFridayApiKey"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { resolveBackendStatus } from "@/lib/api"
import { getConsoleSnapshot, sendAgentMessage } from "@/lib/api/runtime"
import type { ChatChannel, ChatMessage, ConsoleSnapshot } from "@/lib/types"

type BrowserSpeechRecognitionEvent = {
  resultIndex: number
  results: ArrayLike<{
    isFinal: boolean
    0: {
      transcript: string
    }
  }>
}

type BrowserSpeechRecognitionErrorEvent = {
  error: string
}

type BrowserSpeechRecognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onstart: ((event: Event) => void) | null
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null
  onend: ((event: Event) => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition

function resolveSpeechRecognitionConstructor() {
  if (typeof window === "undefined") {
    return null
  }

  const voiceWindow = window as Window &
    typeof globalThis & {
      SpeechRecognition?: BrowserSpeechRecognitionConstructor
      webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor
    }

  return voiceWindow.SpeechRecognition || voiceWindow.webkitSpeechRecognition || null
}

export default function ConsolePage() {
  const { isConnected } = useBackendConnection()
  const { isAuthenticated } = useAuth()
  const {
    keyStatus,
    savedKeys,
    connected: apiKeyConnected,
    connectKey,
  } = useFridayApiKey()
  const {
    freeUsedToday,
    freeLimit,
    recordFreeUse,
    isFreeLimitReached,
  } = useFreeUsageLimit()
  const [snapshot, setSnapshot] = useState<ConsoleSnapshot | null>(null)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false)
  const [freeLimitModalOpen, setFreeLimitModalOpen] = useState(false)
  const [voiceVisualizerOpen, setVoiceVisualizerOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(true)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [voiceDetected, setVoiceDetected] = useState(false)
  const [voiceLevel, setVoiceLevel] = useState(0)
  const [voiceInputSupported] = useState(() => Boolean(resolveSpeechRecognitionConstructor()))
  const [voiceOutputSupported] = useState(() => {
    if (typeof window === "undefined") return false
    return Boolean(window.speechSynthesis)
  })
  const draftRef = useRef("")
  const recognizedTranscriptRef = useRef("")
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastAssistantMessageIdRef = useRef<string | null>(null)
  const hasInitializedSpeechRef = useRef(false)

  const loadSnapshot = useCallback(async () => {
    setLoading(true)
    const result = await getConsoleSnapshot()
    setSnapshot(result.data)
    setLoading(false)
  }, [])

  const updateDraft = useCallback((nextValue: string) => {
    draftRef.current = nextValue
    setMessage(nextValue)
  }, [])

  const submitMessage = useCallback(
    async (content: string, channel: ChatChannel) => {
      const normalizedContent = content.trim()
      if (!normalizedContent) return

      setSending(true)
      const optimisticMessage: ChatMessage = {
        id: `local-${Date.now()}`,
        role: "user",
        content: normalizedContent,
        timestamp: new Date().toISOString(),
        channel,
        status: "sent",
      }

      setSnapshot((current) =>
        current
          ? { ...current, messages: [...current.messages, optimisticMessage] }
          : current
      )

      updateDraft("")
      try {
        const result = await sendAgentMessage(normalizedContent, channel)
        setSnapshot(result.data)
        if (!apiKeyConnected) {
          recordFreeUse()
        }
      } catch (error) {
        if ((error as Error & { code?: string }).code === "FREE_LIMIT_REACHED") {
          setFreeLimitModalOpen(true)
        }
      } finally {
        setSending(false)
      }
    },
    [apiKeyConnected, recordFreeUse, updateDraft]
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSnapshot()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [isConnected, loadSnapshot])

  useEffect(() => {
    draftRef.current = message
  }, [message])

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        recognitionRef.current?.abort()
        window.speechSynthesis?.cancel()
      }
      if (animationFrameRef.current !== null && typeof window !== "undefined") {
        window.cancelAnimationFrame(animationFrameRef.current)
      }
      analyserRef.current?.disconnect()
      audioStreamRef.current?.getTracks().forEach((track) => track.stop())
      void audioContextRef.current?.close()
    }
  }, [])

  useEffect(() => {
    if (!snapshot?.messages.length || !voiceOutputSupported) return

    const latestAssistantMessage = [...snapshot.messages]
      .reverse()
      .find((entry) => entry.role === "assistant")

    if (!latestAssistantMessage) return

    if (!hasInitializedSpeechRef.current) {
      hasInitializedSpeechRef.current = true
      lastAssistantMessageIdRef.current = latestAssistantMessage.id
      return
    }

    if (lastAssistantMessageIdRef.current === latestAssistantMessage.id) {
      return
    }

    lastAssistantMessageIdRef.current = latestAssistantMessage.id

    if (!voiceReplyEnabled || typeof window === "undefined") {
      return
    }

    const utterance = new SpeechSynthesisUtterance(latestAssistantMessage.content)
    utterance.lang = "vi-VN"
    utterance.rate = 1
    utterance.pitch = 1
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }, [snapshot?.messages, voiceOutputSupported, voiceReplyEnabled])

  const latestAssistantReply = useMemo(() => {
    return [...(snapshot?.messages ?? [])]
      .reverse()
      .find((entry) => entry.role === "assistant")?.content ?? ""
  }, [snapshot?.messages])

  const agentAudioActive = voiceDetected || isSpeaking
  const agentAudioStatus = isSpeaking
    ? "Speaking"
    : voiceDetected
      ? "Mic Live"
      : isListening
        ? "Mic Armed"
        : "Standby"

  function handleSend() {
    void submitMessage(message, "text")
  }

  function toggleVoiceReply() {
    setVoiceReplyEnabled((current) => {
      const nextValue = !current

      if (!nextValue && typeof window !== "undefined") {
        window.speechSynthesis?.cancel()
        setIsSpeaking(false)
      }

      return nextValue
    })
  }

  function handleToggleListening() {
    if (!voiceInputSupported || typeof window === "undefined") {
      setVoiceError("This browser does not expose speech recognition.")
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      return
    }

    const SpeechRecognitionCtor = resolveSpeechRecognitionConstructor()

    if (!SpeechRecognitionCtor) {
      setVoiceError("Speech recognition is unavailable in this browser.")
      return
    }

    setVoiceError(null)
    recognizedTranscriptRef.current = ""
    updateDraft("")

    const stopMicMonitoring = () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      analyserRef.current?.disconnect()
      analyserRef.current = null

      audioStreamRef.current?.getTracks().forEach((track) => track.stop())
      audioStreamRef.current = null

      if (audioContextRef.current) {
        const activeAudioContext = audioContextRef.current
        audioContextRef.current = null
        void activeAudioContext.close()
      }

      setVoiceDetected(false)
      setVoiceLevel(0)
    }

    const startMicMonitoring = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        return
      }

      stopMicMonitoring()

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const audioContext = new window.AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      const sampleBuffer = new Uint8Array(analyser.fftSize)

      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.76
      source.connect(analyser)

      audioStreamRef.current = stream
      audioContextRef.current = audioContext
      analyserRef.current = analyser

      const tick = () => {
        analyser.getByteTimeDomainData(sampleBuffer)

        let sumSquares = 0
        for (const value of sampleBuffer) {
          const normalized = (value - 128) / 128
          sumSquares += normalized * normalized
        }

        const rms = Math.sqrt(sumSquares / sampleBuffer.length)
        setVoiceDetected(rms > 0.03)
        setVoiceLevel(Math.min(1, rms * 14))
        animationFrameRef.current = window.requestAnimationFrame(tick)
      }

      animationFrameRef.current = window.requestAnimationFrame(tick)
    }

    const recognition = new SpeechRecognitionCtor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "vi-VN"
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      void startMicMonitoring().catch(() => {
        setVoiceDetected(false)
      })
    }

    recognition.onresult = (event) => {
      let finalTranscriptChunk = ""
      let interimTranscript = ""

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index]?.[0]?.transcript?.trim() ?? ""
        if (!transcript) continue

        if (event.results[index].isFinal) {
          finalTranscriptChunk = `${finalTranscriptChunk} ${transcript}`.trim()
        } else {
          interimTranscript = `${interimTranscript} ${transcript}`.trim()
        }
      }

      if (finalTranscriptChunk) {
        recognizedTranscriptRef.current = `${recognizedTranscriptRef.current} ${finalTranscriptChunk}`
          .replace(/\s+/g, " ")
          .trim()
      }

      const nextDraft = `${recognizedTranscriptRef.current} ${interimTranscript}`
        .replace(/\s+/g, " ")
        .trim()
      updateDraft(nextDraft)
    }

    recognition.onerror = (event) => {
      setVoiceError(`Voice input error: ${event.error}`)
      setIsListening(false)
      stopMicMonitoring()
    }

    recognition.onend = () => {
      setIsListening(false)
      recognitionRef.current = null
      stopMicMonitoring()

      const spokenMessage = (
        recognizedTranscriptRef.current || draftRef.current
      ).trim()
      recognizedTranscriptRef.current = ""
      updateDraft("")

      if (spokenMessage) {
        void submitMessage(spokenMessage, "voice")
      }
    }

    recognitionRef.current = recognition
    recognition.start()
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
      description="Type or talk to FIRDAY. Conversation turns sync to backend logs and training storage."
      backendStatus={resolveBackendStatus(snapshot.backendStatus.source)}
      safetyMode={snapshot.runtimeState.safetyMode}
      busy={sending || isListening}
    >
      <div className="flex min-h-[calc(100vh-9rem)] flex-col gap-5">
        <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">
              Console Channel
            </p>
            <h2 className="text-xl font-semibold text-zinc-100">
              Wide chat area with a right-side mic drawer
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-zinc-400">
              Every turn in this console is synced to backend logs and appended into trainModel raw storage for future retraining.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-100">
              {snapshot.messages.length} Turns Synced
            </Badge>
            <FreeUsageBadge
              used={freeUsedToday}
              limit={freeLimit}
              connected={apiKeyConnected}
            />
            <Button
              variant="outline"
              onClick={() => setApiKeyModalOpen(true)}
            >
              <KeyRound />
              {apiKeyConnected ? "Replace Key" : "Connect Key"}
            </Button>
            <Button variant="outline" onClick={() => setDrawerOpen(true)}>
              <Menu />
              Mic Menu
            </Button>
            <Button
              variant={isListening ? "destructive" : "default"}
              onClick={handleToggleListening}
              disabled={!voiceInputSupported}
            >
              <Mic />
              {isListening ? "Stop Voice" : "Start Voice"}
            </Button>
          </div>
        </div>

        <ChatPanel
          messages={snapshot.messages}
          loading={loading}
          className="min-h-[680px] flex-1"
          floatingWidget={
            <FloatingVoiceWidget
              active={agentAudioActive}
              statusLabel={agentAudioStatus}
              voiceReplyEnabled={voiceReplyEnabled}
              voiceOutputSupported={voiceOutputSupported}
              voiceLevel={voiceLevel}
              onToggleVoiceReply={toggleVoiceReply}
              onExpand={() => setVoiceVisualizerOpen(true)}
            />
          }
        />

        <div className="sticky bottom-0 z-20 bg-[#0b0f14]/90 pb-1 pt-2 backdrop-blur-xl">
          <ChatInput
            value={message}
            onChange={updateDraft}
            onSubmit={handleSend}
            onClear={() => setSnapshot((current) => (current ? { ...current, messages: [] } : current))}
            loading={sending}
            placeholder={
              !apiKeyConnected && isFreeLimitReached
                ? "Free limit reached. Connect a FRIDAY API key to continue..."
                : "Message FIRDAY..."
            }
          />
        </div>
      </div>

      <MicSettingsDrawer
        open={drawerOpen}
        isListening={isListening}
        voiceDetected={voiceDetected}
        voiceInputSupported={voiceInputSupported}
        voiceOutputSupported={voiceOutputSupported}
        transcriptPreview={message}
        voiceError={voiceError}
        onClose={() => setDrawerOpen(false)}
        onToggleListening={handleToggleListening}
      />

      <ApiKeyConnectModal
        open={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        isAuthenticated={isAuthenticated}
        onConnected={connectKey}
        savedKeys={savedKeys}
        connectedKey={keyStatus}
      />
      <FreeLimitReachedModal
        open={freeLimitModalOpen}
        onClose={() => setFreeLimitModalOpen(false)}
        onConnectKey={() => {
          setFreeLimitModalOpen(false)
          setApiKeyModalOpen(true)
        }}
      />
      {voiceVisualizerOpen ? (
        <div className="fixed right-4 top-24 z-50 w-[min(28rem,calc(100vw-2rem))]">
          <div className="rounded-[22px] border border-cyan-400/20 bg-[#050b10]/95 p-2 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl">
            <AgentAudioPanel
              active={agentAudioActive}
              statusLabel={agentAudioStatus}
              voiceReplyEnabled={voiceReplyEnabled}
              voiceOutputSupported={voiceOutputSupported}
              latestReply={latestAssistantReply}
              onToggleVoiceReply={toggleVoiceReply}
            />
            <div className="mt-3 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setVoiceVisualizerOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  )
}
