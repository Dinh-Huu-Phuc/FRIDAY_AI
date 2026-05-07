"use client"

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { DashboardBackground } from "@/components/dashboard/dashboard-background"
import { createDashboardThreeCore, type DashboardCoreColor } from "@/components/dashboard/js/dashboard-three-core"

type Locale = "en" | "vi"
type CoreSessionState = "idle" | "connecting" | "speaking" | "listening" | "thinking" | "error"

type BrowserSpeechRecognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition

type SpeechRecognitionEvent = {
  results: {
    length: number
    [index: number]: {
      isFinal: boolean
      [index: number]: {
        transcript: string
      }
    }
  }
}

const copy = {
  en: {
    nav: ["CORE: ONLINE", "REACTOR: 97%", "LINK: SECURE"],
    communicate: "COMMUNICATE",
    disconnect: "DISCONNECT",
    overlayStatus: "SYSTEM ONLINE",
    overlayListening: "LISTENING...",
    overlayConnecting: "CONNECTING...",
    overlaySpeaking: "SPEAKING...",
    overlayThinking: "THINKING...",
    overlayReady: "READY FOR INPUT",
    textInputPlaceholder: "Type to FRIDAY...",
    send: "SEND",
    coreColor: "CORE COLOR",
    eyebrow: "FRIDAY // ACTIVE INTERFACE",
    title: "MARK VII NEURAL COMMAND",
    brief:
      "Real-time tactical telemetry, autonomous defense projections, and synthetic cognition streams are synchronized through the central arc matrix.",
    integrity: "Suit Integrity",
    threat: "Threat Index",
    latency: "AI Latency",
    telemetry: "TELEMETRY",
    liveFeed: "LIVE SYSTEM FEED",
    analytics: "ANALYTICS",
    cognitive: "COGNITIVE LOAD",
    grid: "GRID",
    orbital: "ORBITAL LOCK",
    mission: "MISSION HISTORY",
    timeline: "EVENT TIMELINE",
  },
  vi: {
    nav: ["CORE: ONLINE", "REACTOR: 97%", "LINK: SECURE"],
    communicate: "GIAO TIEP",
    disconnect: "NGAT KET NOI",
    overlayStatus: "HE THONG ONLINE",
    overlayListening: "DANG LANG NGHE...",
    overlayConnecting: "DANG KET NOI...",
    overlaySpeaking: "DANG BAO CAO...",
    overlayThinking: "DANG SUY NGHI...",
    overlayReady: "SAN SANG NHAN LENH",
    textInputPlaceholder: "Nhap lenh cho FRIDAY...",
    send: "GUI",
    coreColor: "MAU LOI",
    eyebrow: "FRIDAY // GIAO DIEN DANG HOAT DONG",
    title: "DIEU KHIEN THAN KINH MARK VII",
    brief:
      "Telemetry thoi gian thuc, du bao phong thu tu dong va luong nhan thuc tong hop duoc dong bo qua ma tran arc trung tam.",
    integrity: "Do Toan Ven Giap",
    threat: "Chi So De Doa",
    latency: "Do Tre AI",
    telemetry: "TELEMETRY",
    liveFeed: "LUONG HE THONG TRUC TIEP",
    analytics: "PHAN TICH",
    cognitive: "TAI NHAN THUC",
    grid: "LUOI",
    orbital: "KHOA QUY DAO",
    mission: "LICH SU NHIEM VU",
    timeline: "DONG SU KIEN",
  },
} satisfies Record<Locale, Record<string, string | string[]>>

const timelineItems = [
  {
    accent: "var(--stark-cyan)",
    image: "/dashboard/assets/img/FRIDAY_IMG4.png",
    caption: "FRIDAY core online. Command kernel and memory lattice are loading.",
    time: "STAGE 01 // 00:04",
    title: "SYSTEM INITIALIZATION",
    body: "Friday AI boots into the command layer, loading tactical memory, environment sensors, and authorization keys.",
    data: [
      ["AI CORE", "ONLINE"],
      ["BOOT", "99.8%"],
    ],
  },
  {
    accent: "var(--stark-amber)",
    image: "/dashboard/assets/img/FIRDAY3.png",
    caption: "Pilot neural handshake stabilized through the biometric control bus.",
    time: "STAGE 02 // 00:18",
    title: "NEURAL LINK ESTABLISHED",
    body: "Pilot biometrics are mapped to the armor control bus with predictive response correction enabled.",
    data: [
      ["SYNC", "LOCKED"],
      ["LATENCY", "03MS"],
    ],
  },
  {
    accent: "var(--stark-red)",
    image: "/dashboard/assets/img/ironman.png",
    caption: "Mark VII armor enters combat-ready posture with live targeting.",
    time: "STAGE 03 // 00:31",
    title: "MARK VII ACTIVATED",
    body: "Combat profile deploys with repulsor channels armed, navigation locked, and threat modeling live.",
    data: [
      ["ARMOR", "READY"],
      ["THREAT", "TRACK"],
    ],
  },
]

function levelStyle(level: string) {
  return { "--level": level } as CSSProperties
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

const ARC_REACTOR_SEED = {
  pulse: 0.4,
  ripple: 1.2,
  sweep: 8.8,
}

const COGNITIVE_BAR_SEEDS = [0.46, 0.64, 0.58, 0.76, 0.52, 0.68, 0.48, 0.72, 0.56, 0.66]
const COGNITIVE_BAR_DURATIONS = [620, 780, 710, 890, 680, 830, 740, 920, 760, 860]

const ORBITAL_TARGET_SEEDS = [
  { x: 0.45, y: -0.28, duration: 7.2 },
  { x: -0.52, y: 0.22, duration: 8.1 },
  { x: 0.18, y: 0.58, duration: 7.7 },
]

const DEFAULT_CORE_COLOR: DashboardCoreColor = { r: 255, g: 193, b: 90, a: 1 }

function clampColorInput(value: number) {
  return Math.min(255, Math.max(0, Math.round(Number.isFinite(value) ? value : 0)))
}

function clampAlphaInput(value: number) {
  return Math.min(1, Math.max(0.08, Number.isFinite(value) ? value : 1))
}

function channelToHex(value: number) {
  return clampColorInput(value).toString(16).padStart(2, "0")
}

function coreColorToHex(color: DashboardCoreColor) {
  return `#${channelToHex(color.r)}${channelToHex(color.g)}${channelToHex(color.b)}`
}

function hexToCoreColor(hex: string, alpha: number): DashboardCoreColor {
  const normalized = hex.replace("#", "")
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return { ...DEFAULT_CORE_COLOR, a: alpha }

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
    a: alpha,
  }
}

function AnimatedArcReactor() {
  const [pulseSeed, setPulseSeed] = useState(ARC_REACTOR_SEED)

  useEffect(() => {
    if (prefersReducedMotion()) return

    const initialize = window.setTimeout(() => setPulseSeed({
      pulse: randomBetween(0, 2.8),
      ripple: randomBetween(0, 2.4),
      sweep: randomBetween(7.2, 10.5),
    }), 0)

    const timer = window.setInterval(() => {
      setPulseSeed({
        pulse: randomBetween(0, 2.8),
        ripple: randomBetween(0, 2.4),
        sweep: randomBetween(7.2, 10.5),
      })
    }, 6200)

    return () => {
      window.clearTimeout(initialize)
      window.clearInterval(timer)
    }
  }, [])

  return (
    <div
      className="stark-arc-reactor"
      style={{
        "--arc-pulse-delay": `${pulseSeed.pulse}s`,
        "--arc-ripple-delay": `${pulseSeed.ripple}s`,
        "--arc-sweep-duration": `${pulseSeed.sweep}s`,
      } as CSSProperties}
      aria-hidden="true"
    >
      <span className="stark-arc-ring stark-arc-ring-outer" />
      <span className="stark-arc-ring stark-arc-ring-middle" />
      <span className="stark-arc-ring stark-arc-ring-inner" />
      <span className="stark-arc-sweep" />
      <span className="stark-arc-ripple stark-arc-ripple-a" />
      <span className="stark-arc-ripple stark-arc-ripple-b" />
      <span className="stark-arc-core">ARC</span>
    </div>
  )
}

function AnimatedCognitiveBars() {
  const [levels, setLevels] = useState(COGNITIVE_BAR_SEEDS)

  const durations = useMemo(() => COGNITIVE_BAR_DURATIONS, [])

  useEffect(() => {
    if (prefersReducedMotion()) return

    const initialize = window.setTimeout(() => {
      setLevels(Array.from({ length: 10 }, () => randomBetween(0.32, 0.88)))
    }, 0)

    const timer = window.setInterval(() => {
      setLevels((previous) =>
        previous.map((value, index) => {
          const drift = randomBetween(-0.34, 0.34)
          const occasionalSpike = Math.random() > 0.82 ? randomBetween(0.18, 0.34) : 0
          const next = value + drift + occasionalSpike
          const min = index % 3 === 2 ? 0.42 : 0.26
          return Math.min(0.98, Math.max(min, next))
        })
      )
    }, 560)

    return () => {
      window.clearTimeout(initialize)
      window.clearInterval(timer)
    }
  }, [])

  return (
    <div className="stark-cognitive-bars" aria-hidden="true">
      {Array.from({ length: 10 }).map((_, index) => (
        <i
          key={index}
          className={index % 3 === 2 ? "is-warning" : undefined}
          style={{
            "--bar-level": levels[index],
            "--bar-transition": `${durations[index]}ms`,
            "--bar-opacity": 0.62 + levels[index] * 0.34,
            "--bar-brightness": 0.82 + levels[index] * 0.62,
            "--bar-glow": `${4 + levels[index] * 14}px`,
            "--bar-warning-brightness": 0.86 + levels[index] * 0.7,
            "--bar-warning-glow": `${5 + levels[index] * 16}px`,
          } as CSSProperties}
        />
      ))}
    </div>
  )
}

function AnimatedOrbitalRadar() {
  const [lockedTarget, setLockedTarget] = useState(0)
  const [targetSeeds, setTargetSeeds] = useState(ORBITAL_TARGET_SEEDS)

  useEffect(() => {
    if (prefersReducedMotion()) return

    const initialize = window.setTimeout(() => setTargetSeeds(
      Array.from({ length: 3 }, () => ({
        x: randomBetween(-1, 1),
        y: randomBetween(-1, 1),
        duration: randomBetween(5.8, 9.2),
      }))
    ), 0)

    const timer = window.setInterval(() => {
      setLockedTarget((value) => (value + 1) % 3)
      setTargetSeeds(
        Array.from({ length: 3 }, () => ({
          x: randomBetween(-1, 1),
          y: randomBetween(-1, 1),
          duration: randomBetween(5.8, 9.2),
        }))
      )
    }, 3600)

    return () => {
      window.clearTimeout(initialize)
      window.clearInterval(timer)
    }
  }, [])

  const pulseClass = lockedTarget === 0 ? "lock-one" : lockedTarget === 1 ? "lock-two" : "lock-three"
  const targetOffsets = targetSeeds.map((seed) => ({
    dx: `${seed.x * 8}px`,
    dy: `${seed.y * 8}px`,
    dxAlt: `${seed.x * -5}px`,
    dyAlt: `${seed.y * 7}px`,
    duration: `${seed.duration}s`,
  }))

  return (
    <div className={`stark-orbital-radar ${pulseClass}`} aria-hidden="true">
      <span className="stark-radar-grid" />
      <span className="stark-radar-crosshair" />
      <span className="stark-radar-ring" />
      <span className="stark-radar-sweep" />
      <span className="stark-radar-link stark-radar-link-a" />
      <span className="stark-radar-link stark-radar-link-b" />
      <span
        className="stark-radar-target stark-target-one"
        style={{
          "--target-dx": targetOffsets[0].dx,
          "--target-dy": targetOffsets[0].dy,
          "--target-dx-alt": targetOffsets[0].dxAlt,
          "--target-dy-alt": targetOffsets[0].dyAlt,
          "--target-duration": targetOffsets[0].duration,
        } as CSSProperties}
      />
      <span
        className="stark-radar-target stark-target-two"
        style={{
          "--target-dx": targetOffsets[1].dx,
          "--target-dy": targetOffsets[1].dy,
          "--target-dx-alt": targetOffsets[1].dxAlt,
          "--target-dy-alt": targetOffsets[1].dyAlt,
          "--target-duration": targetOffsets[1].duration,
        } as CSSProperties}
      />
      <span
        className="stark-radar-target stark-target-three"
        style={{
          "--target-dx": targetOffsets[2].dx,
          "--target-dy": targetOffsets[2].dy,
          "--target-dx-alt": targetOffsets[2].dxAlt,
          "--target-dy-alt": targetOffsets[2].dyAlt,
          "--target-duration": targetOffsets[2].duration,
        } as CSSProperties}
      />
      <span className="stark-lock-pulse stark-lock-pulse-a" />
      <span className="stark-lock-pulse stark-lock-pulse-b" />
      <span className="stark-lock-pulse stark-lock-pulse-c" />
    </div>
  )
}

export function StarkNeuralDashboard() {
  const [locale, setLocale] = useState<Locale>("en")
  const [overlayActive, setOverlayActive] = useState(false)
  const [coreColor, setCoreColor] = useState<DashboardCoreColor>(DEFAULT_CORE_COLOR)
  const [coreSessionState, setCoreSessionState] = useState<CoreSessionState>("idle")
  const [coreReport, setCoreReport] = useState("")
  const [coreTextInput, setCoreTextInput] = useState("")
  const terminalRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const coreColorRef = useRef(coreColor)
  const threeCoreRef = useRef<ReturnType<typeof createDashboardThreeCore> | null>(null)
  const greetingAbortRef = useRef<AbortController | null>(null)
  const ttsAbortRef = useRef<AbortController | null>(null)
  const chatAbortRef = useRef<AbortController | null>(null)
  const speechRecognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const coreTextSubmitRef = useRef<((message: string) => void) | null>(null)
  const coreAudioRef = useRef<HTMLAudioElement | null>(null)
  const coreAudioUrlRef = useRef<string | null>(null)
  const t = copy[locale]
  const coreColorHex = useMemo(() => coreColorToHex(coreColor), [coreColor])
  const coreColorCss = useMemo(
    () => `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, ${coreColor.a})`,
    [coreColor]
  )

  useEffect(() => {
    const initialize = window.setTimeout(() => {
      const saved = window.localStorage.getItem("dashboard-language")
      if (saved === "vi" || saved === "en") {
        setLocale(saved)
        return
      }

      if (window.navigator.language.toLowerCase().startsWith("vi")) {
        setLocale("vi")
      }
    }, 0)

    return () => window.clearTimeout(initialize)
  }, [])

  useEffect(() => {
    window.localStorage.setItem("dashboard-language", locale)
    document.documentElement.lang = locale
  }, [locale])

  useEffect(() => {
    if (!overlayActive) return

    const dashboard = document.querySelector<HTMLElement>(".stark-dashboard")
    const previousBodyOverflow = document.body.style.overflow
    const previousDashboardOverflow = dashboard?.style.overflowY
    const dashboardScrollTop = dashboard?.scrollTop ?? 0

    document.body.style.overflow = "hidden"
    if (dashboard) dashboard.style.overflowY = "hidden"

    return () => {
      document.body.style.overflow = previousBodyOverflow
      if (dashboard) {
        dashboard.style.overflowY = previousDashboardOverflow ?? ""
        dashboard.scrollTop = dashboardScrollTop
      }
    }
  }, [overlayActive])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const firstLine = terminalRef.current?.firstElementChild
      if (firstLine) terminalRef.current?.appendChild(firstLine)
    }, 1450)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!overlayActive) {
      threeCoreRef.current?.dispose()
      threeCoreRef.current = null
      return
    }

    if (!canvasRef.current || threeCoreRef.current) return

    const core = createDashboardThreeCore(canvasRef.current, coreColorRef.current)
    threeCoreRef.current = core
    core.setActive(true)

    return () => {
      core.dispose()
      threeCoreRef.current = null
    }
  }, [overlayActive])

  useEffect(() => {
    threeCoreRef.current?.setActive(overlayActive)
  }, [overlayActive])

  useEffect(() => {
    if (!overlayActive) {
      greetingAbortRef.current?.abort()
      ttsAbortRef.current?.abort()
      chatAbortRef.current?.abort()
      speechRecognitionRef.current?.abort()
      speechRecognitionRef.current = null
      coreTextSubmitRef.current = null
      coreAudioRef.current?.pause()
      coreAudioRef.current = null

      if (coreAudioUrlRef.current) {
        URL.revokeObjectURL(coreAudioUrlRef.current)
        coreAudioUrlRef.current = null
      }

      window.speechSynthesis?.cancel()
      return
    }

    let cancelled = false
    let shouldListen = false
    let handlingTranscript = false
    const greetingController = new AbortController()
    greetingAbortRef.current = greetingController

    async function speakWithBrowserFallback(text: string) {
      if (!window.speechSynthesis || cancelled) return

      await new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = locale === "vi" ? "vi-VN" : "en-US"
        utterance.rate = 1
        utterance.pitch = 1
        utterance.onend = () => resolve()
        utterance.onerror = () => resolve()
        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(utterance)
      })
    }

    async function speakWithBackendTts(text: string) {
      const ttsController = new AbortController()
      ttsAbortRef.current = ttsController

      const response = await fetch("/api/backend/agent/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, provider: "openai" }),
        cache: "no-store",
        signal: ttsController.signal,
      })

      if (!response.ok) {
        throw new Error(`TTS failed with status ${response.status}`)
      }

      const audioBlob = await response.blob()
      if (cancelled) return

      if (coreAudioUrlRef.current) URL.revokeObjectURL(coreAudioUrlRef.current)
      const audioUrl = URL.createObjectURL(audioBlob)
      coreAudioUrlRef.current = audioUrl

      const audio = new Audio(audioUrl)
      coreAudioRef.current = audio

      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve()
        audio.onerror = () => reject(new Error("Audio playback failed."))
        audio.play().catch(reject)
      })
    }

    async function speakCoreResponse(text: string) {
      try {
        await speakWithBackendTts(text)
      } catch {
        await speakWithBrowserFallback(text)
      }
    }

    function extractAssistantReply(payload: unknown) {
      const messages = (payload as { messages?: Array<{ role?: string; content?: string }> }).messages ?? []
      const assistantMessage = [...messages].reverse().find((message) => message.role === "assistant")
      return String(assistantMessage?.content ?? "").trim()
    }

    function startListening() {
      if (cancelled || handlingTranscript) return

      const SpeechRecognitionConstructor =
        (window as typeof window & {
          SpeechRecognition?: BrowserSpeechRecognitionConstructor
          webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor
        }).SpeechRecognition ??
        (window as typeof window & {
          webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor
        }).webkitSpeechRecognition

      if (!SpeechRecognitionConstructor) {
        setCoreSessionState("error")
        setCoreReport("Speech recognition is not available in this browser. Use Chrome, or add backend STT for this Core AI session.")
        return
      }

      const recognition = new SpeechRecognitionConstructor()
      speechRecognitionRef.current = recognition
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = locale === "vi" ? "vi-VN" : "en-US"

      recognition.onresult = (event) => {
        let transcript = ""
        for (let index = 0; index < event.results.length; index += 1) {
          const result = event.results[index]
          if (result.isFinal) transcript += result[0]?.transcript ?? ""
        }

        const normalizedTranscript = transcript.trim()
        if (normalizedTranscript) {
          void handleTranscript(normalizedTranscript)
        }
      }

      recognition.onend = () => {
        if (!cancelled && shouldListen && !handlingTranscript) {
          window.setTimeout(() => {
            try {
              recognition.start()
            } catch {
              // Recognition can throw if the browser is still transitioning.
            }
          }, 220)
        }
      }

      recognition.onerror = () => {
        if (!cancelled && shouldListen && !handlingTranscript) {
          setCoreSessionState("listening")
        }
      }

      shouldListen = true
      setCoreSessionState("listening")

      try {
        recognition.start()
      } catch {
        // Ignore duplicate-start errors from Chrome's SpeechRecognition implementation.
      }
    }

    async function handleTranscript(transcript: string) {
      if (cancelled || handlingTranscript) return

      handlingTranscript = true
      shouldListen = false
      speechRecognitionRef.current?.stop()
      setCoreSessionState("thinking")
      setCoreReport(transcript)

      const chatController = new AbortController()
      chatAbortRef.current = chatController

      try {
        const response = await fetch("/api/backend/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: transcript, channel: "voice" }),
          cache: "no-store",
          signal: chatController.signal,
        })

        const payload = await response.json()
        const assistantReply = extractAssistantReply(payload)

        if (!assistantReply || cancelled) return

        setCoreSessionState("speaking")
        setCoreReport(assistantReply)
        await speakCoreResponse(assistantReply)
      } catch (error) {
        if (!cancelled && !(error instanceof DOMException && error.name === "AbortError")) {
          setCoreSessionState("error")
          setCoreReport("Core AI could not process the voice turn. Check backend chat and TTS connectivity.")
        }
      } finally {
        handlingTranscript = false
        if (!cancelled) {
          startListening()
        }
      }
    }

    coreTextSubmitRef.current = (message: string) => {
      const normalizedMessage = message.trim()
      if (!normalizedMessage) return
      void handleTranscript(normalizedMessage)
    }

    async function startCoreGreeting() {
      setCoreSessionState("connecting")
      setCoreReport("")

      try {
        const response = await fetch("/api/backend/agent/greeting", {
          method: "GET",
          cache: "no-store",
          signal: greetingController.signal,
        })
        const payload = (await response.json()) as { message?: string }
        const report = String(payload.message ?? "").trim()

        if (!report || cancelled) return

        setCoreReport(report)
        setCoreSessionState("speaking")

        await speakCoreResponse(report)

        if (!cancelled) {
          startListening()
        }
      } catch (error) {
        if (!cancelled && !(error instanceof DOMException && error.name === "AbortError")) {
          setCoreSessionState("error")
          setCoreReport("Core AI session could not start. Check the backend connection and TTS configuration.")
        }
      }
    }

    void startCoreGreeting()

    return () => {
      cancelled = true
      shouldListen = false
      greetingController.abort()
      ttsAbortRef.current?.abort()
      chatAbortRef.current?.abort()
      speechRecognitionRef.current?.abort()
      speechRecognitionRef.current = null
      coreTextSubmitRef.current = null
      coreAudioRef.current?.pause()
      coreAudioRef.current = null
      window.speechSynthesis?.cancel()

      if (coreAudioUrlRef.current) {
        URL.revokeObjectURL(coreAudioUrlRef.current)
        coreAudioUrlRef.current = null
      }
    }
  }, [locale, overlayActive])

  useEffect(() => {
    coreColorRef.current = coreColor
    threeCoreRef.current?.setColor(coreColor)
  }, [coreColor])

  useEffect(() => {
    const dashboard = document.querySelector<HTMLElement>(".stark-dashboard")
    if (!dashboard) return
    const dashboardElement = dashboard

    const revealItems = Array.from(dashboardElement.querySelectorAll<HTMLElement>(".stark-reveal"))
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return

          entry.target.classList.add("is-visible")
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.16 }
    )

    revealItems.forEach((item) => observer.observe(item))

    function handlePointerMove(event: PointerEvent) {
      const layers = dashboardElement.querySelectorAll<HTMLElement>(".stark-parallax-layer")
      const pointerX = (event.clientX / window.innerWidth - 0.5) * 2
      const pointerY = (event.clientY / window.innerHeight - 0.5) * 2

      layers.forEach((layer) => {
        const depth = Number(layer.dataset.depth || 0)
        const x = pointerX * depth * 120
        const y = pointerY * depth * 90
        layer.style.transform = `translate3d(${x}px, ${y}px, 0)`
      })
    }

    function handlePointerLeave() {
      dashboardElement.querySelectorAll<HTMLElement>(".stark-parallax-layer").forEach((layer) => {
        layer.style.transform = "translate3d(0, 0, 0)"
      })
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerleave", handlePointerLeave)

    return () => {
      observer.disconnect()
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerleave", handlePointerLeave)
    }
  }, [])

  return (
    <main className="stark-dashboard">
      <DashboardBackground />
      <div
        className={overlayActive ? "stark-ai-overlay is-active" : "stark-ai-overlay"}
        style={{
          "--stark-core-color": coreColorCss,
          "--stark-core-rgb": `${coreColor.r}, ${coreColor.g}, ${coreColor.b}`,
          "--stark-core-alpha": coreColor.a,
        } as CSSProperties}
        aria-hidden={!overlayActive}
      >
        <div className="stark-ai-core-stage">
          {overlayActive ? <canvas ref={canvasRef} id="neural-canvas" className="stark-neural-canvas" aria-hidden="true" /> : null}
          <div className="stark-ai-equation" aria-hidden="true">
            x<sup>2</sup> + y<sup>2</sup> + z<sup>2</sup> = R<sup>2</sup>
          </div>
          <div className="stark-ai-physics-readout" aria-hidden="true">
            <span>E = mc<sup>2</sup></span>
            <span>Psi = exp(-i k r) / r</span>
            <span>Systemic Cohesion: Optimal</span>
          </div>
          <div className="stark-ai-overlay-label">
            <span>{t.overlayStatus}</span>
            <b>
              {coreSessionState === "connecting"
                ? t.overlayConnecting
                : coreSessionState === "speaking"
                  ? t.overlaySpeaking
                  : coreSessionState === "thinking"
                    ? t.overlayThinking
                  : coreSessionState === "listening"
                    ? t.overlayReady
                    : t.overlayListening}
            </b>
            {coreReport ? <p className="stark-ai-session-report">{coreReport}</p> : null}
            <form
              className="stark-core-text-input"
              onSubmit={(event) => {
                event.preventDefault()
                const message = coreTextInput.trim()
                if (!message || coreSessionState === "connecting" || coreSessionState === "speaking" || coreSessionState === "thinking") return
                setCoreTextInput("")
                coreTextSubmitRef.current?.(message)
              }}
            >
              <input
                type="text"
                value={coreTextInput}
                onChange={(event) => setCoreTextInput(event.target.value)}
                placeholder={t.textInputPlaceholder as string}
                aria-label={t.textInputPlaceholder as string}
                disabled={!overlayActive}
              />
              <button
                type="submit"
                disabled={
                  !coreTextInput.trim() ||
                  coreSessionState === "connecting" ||
                  coreSessionState === "speaking" ||
                  coreSessionState === "thinking"
                }
              >
                {t.send}
              </button>
            </form>
          </div>
          <button className="stark-overlay-close" type="button" onClick={() => setOverlayActive(false)}>
            {t.disconnect}
          </button>
          <div className="stark-core-color-picker" aria-label={t.coreColor as string}>
            <div className="stark-core-color-picker__head">
              <span>{t.coreColor}</span>
              <output>{coreColorCss}</output>
            </div>
            <div className="stark-core-color-picker__row">
              <label className="stark-core-swatch">
                <span>HEX</span>
                <input
                  type="color"
                  value={coreColorHex}
                  onChange={(event) => setCoreColor(hexToCoreColor(event.target.value, coreColor.a))}
                  aria-label="Core color swatch"
                />
              </label>
              {(["r", "g", "b"] as const).map((channel) => (
                <label className="stark-core-channel" key={channel}>
                  <span>{channel.toUpperCase()}</span>
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={coreColor[channel]}
                    onChange={(event) =>
                      setCoreColor((current) => ({
                        ...current,
                        [channel]: clampColorInput(Number(event.target.value)),
                      }))
                    }
                  />
                </label>
              ))}
            </div>
            <label className="stark-core-alpha">
              <span>A</span>
              <input
                type="range"
                min={0.08}
                max={1}
                step={0.01}
                value={coreColor.a}
                onChange={(event) =>
                  setCoreColor((current) => ({
                    ...current,
                    a: clampAlphaInput(Number(event.target.value)),
                  }))
                }
              />
              <b>{coreColor.a.toFixed(2)}</b>
            </label>
          </div>
        </div>
      </div>

      <div className="stark-dashboard-shell">
        <nav className="stark-topbar stark-glass-panel" aria-label="Dashboard status">
          <div className="stark-brand-lockup">
            <span className="stark-brand-mark" />
            <span>FRIDAY OS</span>
          </div>
          <div className="stark-nav-actions">
            <div className="stark-system-readouts">
              {(t.nav as string[]).map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <label className="stark-language-switcher" htmlFor="language-select">
              <span>LANG</span>
              <select id="language-select" aria-label="Select language" value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>
                <option value="en">EN</option>
                <option value="vi">VI</option>
              </select>
            </label>
            <button className={overlayActive ? "stark-mic-toggle is-listening" : "stark-mic-toggle"} type="button" onClick={() => setOverlayActive(true)}>
              {t.communicate}
            </button>
          </div>
        </nav>

        <section className="stark-hero-grid" aria-labelledby="dashboard-title">
          <div className="stark-hero-copy stark-glass-panel stark-reveal stark-parallax-layer is-visible" data-depth="0.03">
            <p className="stark-eyebrow">{t.eyebrow}</p>
            <h1 id="dashboard-title" className="stark-glitch-title" data-glitch={t.title}>
              {t.title}
            </h1>
            <p className="stark-hero-brief">{t.brief}</p>

            <div className="stark-metrics-grid">
              <article className="stark-metric-card">
                <span className="stark-metric-label">{t.integrity}</span>
                <strong>99.2%</strong>
                <span className="stark-metric-bar"><i style={levelStyle("92%")} /></span>
              </article>
              <article className="stark-metric-card">
                <span className="stark-metric-label">{t.threat}</span>
                <strong>14.8</strong>
                <span className="stark-metric-bar danger"><i style={levelStyle("38%")} /></span>
              </article>
              <article className="stark-metric-card">
                <span className="stark-metric-label">{t.latency}</span>
                <strong>03ms</strong>
                <span className="stark-metric-bar"><i style={levelStyle("78%")} /></span>
              </article>
            </div>
          </div>

          <aside className="stark-portrait-stage stark-reveal stark-parallax-layer is-visible" data-depth="-0.045" aria-label="Primary armor portrait">
            <div className="stark-portrait-frame">
              <div className="stark-portrait-hud">
                <div className="stark-hud-radar" aria-hidden="true">
                  <span />
                  <i />
                </div>
                <div className="stark-terminal-feed" ref={terminalRef} aria-label="Armor diagnostics">
                  <span>&gt; INIT ARMOR.SCHEMATIC/MK-07</span>
                  <span>&gt; ARC_CORE_OUTPUT: 7.8PJ</span>
                  <span>&gt; SERVO ARRAY: SYNCHRONIZED</span>
                  <span>&gt; PILOT BIOLOCK: VERIFIED</span>
                  <span>&gt; FLIGHT_SURFACE: CALIBRATING</span>
                  <span>&gt; TARGETING BUS: ONLINE</span>
                </div>
                <div className="stark-bio-wave" aria-hidden="true">
                  <svg viewBox="0 0 260 54" preserveAspectRatio="none">
                    <polyline points="0,31 18,31 27,18 37,43 49,8 63,31 88,31 99,22 112,36 128,31 145,31 155,15 166,45 180,27 198,31 220,31 229,22 240,35 260,31" />
                  </svg>
                  <b>HEART 074 BPM</b>
                </div>
              </div>
              <img src="/dashboard/assets/img/ironman.png" alt="Iron Man tactical armor portrait" />
              <span className="stark-hud-tint" />
              <span className="stark-monitor-grid" />
              <span className="stark-scanline" />
              <span className="stark-glitch stark-glitch-a" />
              <span className="stark-glitch stark-glitch-b" />
            </div>
          </aside>
        </section>

        <section className="stark-control-grid" aria-label="Operational panels">
          <article className="stark-glass-panel stark-telemetry-panel stark-reveal">
            <header>
              <p className="stark-eyebrow">{t.telemetry}</p>
              <h2>{t.liveFeed}</h2>
            </header>
            <AnimatedArcReactor />
            <ul className="stark-signal-list">
              <li><span>Repulsor Sync</span><b>Stable</b></li>
              <li><span>Flight Path</span><b>Locked</b></li>
              <li><span>Nanite Mesh</span><b>Adaptive</b></li>
            </ul>
          </article>

          <article className="stark-glass-panel stark-data-panel stark-reveal">
            <header>
              <p className="stark-eyebrow">{t.analytics}</p>
              <h2>{t.cognitive}</h2>
            </header>
            <AnimatedCognitiveBars />
            <p>Predictive routing and weapons orchestration are operating inside target thermal tolerances.</p>
          </article>

          <article className="stark-glass-panel stark-map-panel stark-reveal">
            <header>
              <p className="stark-eyebrow">{t.grid}</p>
              <h2>{t.orbital}</h2>
            </header>
            <AnimatedOrbitalRadar />
          </article>
        </section>

        <section className="stark-timeline-section" aria-labelledby="timeline-title">
          <div className="stark-section-heading stark-reveal">
            <p className="stark-eyebrow">{t.mission}</p>
            <h2 id="timeline-title" className="stark-glitch-title" data-glitch={t.timeline}>
              {t.timeline}
            </h2>
          </div>
          <div className="stark-timeline-shell stark-glass-panel stark-reveal">
            <div className="stark-timeline-rail" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="stark-timeline">
              {timelineItems.map((item) => (
                <article className="stark-timeline-card stark-glass-panel stark-reveal" style={{ "--accent": item.accent } as CSSProperties} key={item.title}>
                  <span className="stark-timeline-node" />
                  <figure>
                    <img src={item.image} alt={item.title} />
                    <figcaption>{item.caption}</figcaption>
                  </figure>
                  <time>{item.time}</time>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  <dl className="stark-card-data">
                    {item.data.map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="stark-ops-strip" aria-label="Auxiliary tactical readouts">
          <article className="stark-glass-panel stark-reveal"><span>COMBAT ROUTER</span><b>1,284 PATHS</b></article>
          <article className="stark-glass-panel stark-reveal"><span>THERMAL LIMIT</span><b>84.1 C</b></article>
          <article className="stark-glass-panel stark-reveal"><span>DRONE SWARM</span><b>12 LINKED</b></article>
        </section>
      </div>
    </main>
  )
}
