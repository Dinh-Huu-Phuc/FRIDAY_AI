const STORAGE_KEY = "friday.localCore.appearance"

const defaults = {
  primaryColor: "#5bdcff",
  secondaryColor: "#ffc768",
  glowIntensity: 1,
  pulseSpeed: 1,
  orbSize: 260,
  voiceReactive: true,
  reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  voiceEnabled: true,
  historyVisible: true,
}

const state = {
  socket: null,
  coreState: "disconnected",
  powerState: "active",
  voiceUnlocked: false,
  voiceUnlockedAt: 0,
  pendingSpeech: "",
  lastAssistantId: "",
  messages: [],
  expandedCards: new Set(),
  recognition: null,
  recognitionWanted: true,
  recognitionBlocked: false,
  recognitionPausedForSpeech: false,
  recognitionRestartTimer: 0,
  pendingWindowAction: "",
  windowActionTimer: 0,
  settings: loadSettings(),
}

const root = document.querySelector(".app-shell")
const messagesEl = document.querySelector("#messages")
const historyDock = document.querySelector("#history-dock")
const form = document.querySelector("#chat-form")
const input = document.querySelector("#message-input")
const statusLabel = document.querySelector("#status")
const transport = document.querySelector("#transport")
const clearChat = document.querySelector("#clear-chat")
const toggleHistory = document.querySelector("#toggle-history")
const micButton = document.querySelector("#mic-button")
const connectionIndicator = document.querySelector("#connection-indicator")
const connectionPopover = document.querySelector("#connection-popover")
const coreServiceStatus = document.querySelector("#core-service-status")
const websocketStatus = document.querySelector("#websocket-status")
const voiceStatus = document.querySelector("#voice-status")
const settingsToggle = document.querySelector("#settings-toggle")
const settingsPanel = document.querySelector("#settings-panel")
const settingsClose = document.querySelector("#settings-close")

const controls = {
  primaryColor: document.querySelector("#primary-color"),
  secondaryColor: document.querySelector("#secondary-color"),
  glowIntensity: document.querySelector("#glow-intensity"),
  pulseSpeed: document.querySelector("#pulse-speed"),
  orbSize: document.querySelector("#orb-size"),
  voiceReactive: document.querySelector("#voice-reactive"),
  reduceMotion: document.querySelector("#reduce-motion"),
  voiceEnabled: document.querySelector("#voice-enabled"),
}

function loadSettings() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }
  } catch {
    return { ...defaults }
  }
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings))
}

function hexToRgb(hex) {
  const normalized = String(hex || "").replace("#", "")
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return "91, 220, 255"
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ].join(", ")
}

function setCoreState(nextState, label) {
  state.coreState = nextState
  root.dataset.coreState = nextState
  statusLabel.textContent = label
  transport.textContent = nextState === "disconnected" ? "offline" : nextState === "error" ? "error" : "online"
  websocketStatus.textContent = nextState === "disconnected" ? "disconnected" : nextState
  connectionIndicator.dataset.status =
    nextState === "disconnected" || nextState === "error" ? nextState : nextState === "reconnecting" ? "reconnecting" : "connected"
}

function setPowerState(payload) {
  const previousPowerState = state.powerState
  state.powerState = payload?.state === "sleeping" ? "sleeping" : "active"
  if (state.powerState === "sleeping") {
    if (previousPowerState !== "sleeping") queueWindowAction("minimize")
    setCoreState("sleeping", "Sleeping. Say FRIDAY wake up")
    return
  }
  if (previousPowerState === "sleeping") {
    state.pendingWindowAction = ""
    window.clearTimeout(state.windowActionTimer)
    void performWindowAction("restore")
  }
  if (state.coreState === "sleeping") setCoreState("idle", "Awake and ready")
}

async function performWindowAction(action) {
  const endpoint = action === "restore" ? "restore" : "minimize"
  try {
    await fetch(`/api/v1/runtime/windows/${endpoint}`, { method: "POST" })
  } catch {
    if (action === "restore") setCoreState("error", "Could not restore application windows")
  }
}

function queueWindowAction(action) {
  state.pendingWindowAction = action
  window.clearTimeout(state.windowActionTimer)
  const delay = state.settings.voiceEnabled ? 8000 : 600
  state.windowActionTimer = window.setTimeout(() => runPendingWindowAction(), delay)
}

function runPendingWindowAction() {
  const action = state.pendingWindowAction
  state.pendingWindowAction = ""
  window.clearTimeout(state.windowActionTimer)
  if (action) void performWindowAction(action)
}

function applyAppearance() {
  const settings = state.settings
  root.style.setProperty("--primary", settings.primaryColor)
  root.style.setProperty("--secondary", settings.secondaryColor)
  root.style.setProperty("--primary-rgb", hexToRgb(settings.primaryColor))
  root.style.setProperty("--secondary-rgb", hexToRgb(settings.secondaryColor))
  root.style.setProperty("--glow-intensity", settings.glowIntensity)
  root.style.setProperty("--pulse-speed", `${settings.pulseSpeed}s`)
  root.style.setProperty("--orb-size", `${settings.orbSize}px`)
  root.dataset.reduceMotion = settings.reduceMotion ? "true" : "false"
  root.dataset.voiceReactive = settings.voiceReactive ? "true" : "false"
  historyDock.dataset.collapsed = settings.historyVisible ? "false" : "true"
  toggleHistory.textContent = settings.historyVisible ? "Hide" : "Show"

  for (const [key, control] of Object.entries(controls)) {
    if (!control) continue
    if (control.type === "checkbox") control.checked = Boolean(settings[key])
    else control.value = settings[key]
  }
  voiceStatus.textContent = settings.voiceEnabled ? (state.voiceUnlocked ? "enabled" : "waiting for gesture") : "disabled"
}

function updateSetting(key, value) {
  state.settings[key] = value
  saveSettings()
  applyAppearance()
}

function bindAudioReactive(audio) {
  if (!state.settings.voiceReactive || !window.AudioContext) return () => {}
  const audioContext = new AudioContext()
  const source = audioContext.createMediaElementSource(audio)
  const analyser = audioContext.createAnalyser()
  analyser.fftSize = 128
  source.connect(analyser)
  analyser.connect(audioContext.destination)

  const samples = new Uint8Array(analyser.frequencyBinCount)
  let frame = 0
  const tick = () => {
    analyser.getByteFrequencyData(samples)
    const sum = samples.reduce((total, value) => total + value, 0)
    const level = Math.min(1, sum / samples.length / 140)
    root.style.setProperty("--voice-level", level.toFixed(3))
    frame = window.requestAnimationFrame(tick)
  }
  frame = window.requestAnimationFrame(tick)

  return () => {
    window.cancelAnimationFrame(frame)
    root.style.setProperty("--voice-level", "0")
    void audioContext.close().catch(() => null)
  }
}

function ConversationCard(message, index, total) {
  const node = document.createElement("article")
  const role = message.role === "user" ? "user" : message.role === "system" ? "system" : "assistant"
  const age = total - index - 1
  const expanded = state.expandedCards.has(message.id)
  node.className = `conversation-card ${role}${expanded ? " expanded" : ""}`
  node.style.setProperty("--age", Math.min(age, 6))
  node.dataset.id = message.id

  const meta = document.createElement("span")
  meta.className = "card-meta"
  meta.textContent = `${role === "assistant" ? "FRIDAY" : role.toUpperCase()} / ${new Date(message.timestamp).toLocaleTimeString()}`

  const content = document.createElement("p")
  content.textContent = message.content

  node.append(meta, content)
  node.addEventListener("click", () => {
    if (state.expandedCards.has(message.id)) state.expandedCards.delete(message.id)
    else state.expandedCards.add(message.id)
    ConversationStack(state.messages)
  })
  return node
}

function ConversationStack(items) {
  const visible = (items || []).filter((item) => item.id !== "console-bootstrap")
  messagesEl.replaceChildren()
  visible.forEach((item, index) => messagesEl.append(ConversationCard(item, index, visible.length)))
  messagesEl.scrollTop = messagesEl.scrollHeight

  const latestAssistant = [...visible].reverse().find((item) => item.role === "assistant")
  if (latestAssistant && latestAssistant.id !== state.lastAssistantId) {
    state.lastAssistantId = latestAssistant.id
    void VoiceController.speak(latestAssistant.content)
  }
}

const VoiceController = {
  async speak(text) {
    if (!state.settings.voiceEnabled || !text) return
    if (!state.voiceUnlocked) {
      state.pendingSpeech = text
      setCoreState("idle", "Voice will start after your first click")
      voiceStatus.textContent = "waiting for gesture"
      return
    }

    SpeechInputController.pauseForSpeech()
    setCoreState("speaking", "Speaking")
    try {
      const response = await fetch("/api/v1/agent/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 1800), provider: "auto" }),
      })
      if (!response.ok) throw new Error("Backend TTS unavailable")
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      const stopReactive = bindAudioReactive(audio)
      audio.onended = () => {
        stopReactive()
        URL.revokeObjectURL(url)
        SpeechInputController.resumeAfterSpeech()
        runPendingWindowAction()
        if (state.powerState === "sleeping") setCoreState("sleeping", "Sleeping. Say FRIDAY wake up")
        else setCoreState("idle", "Local connected")
      }
      audio.onerror = () => {
        stopReactive()
        SpeechInputController.resumeAfterSpeech()
        runPendingWindowAction()
        setCoreState("error", "Voice playback failed")
      }
      await audio.play()
    } catch {
      if (!window.speechSynthesis) {
        SpeechInputController.resumeAfterSpeech()
        runPendingWindowAction()
        setCoreState("error", "Voice unavailable")
        return
      }
      const utterance = new SpeechSynthesisUtterance(text.slice(0, 1800))
      utterance.lang = "en-US"
      utterance.onend = () => {
        SpeechInputController.resumeAfterSpeech()
        runPendingWindowAction()
        if (state.powerState === "sleeping") setCoreState("sleeping", "Sleeping. Say FRIDAY wake up")
        else setCoreState("idle", "Local connected")
      }
      utterance.onerror = () => {
        SpeechInputController.resumeAfterSpeech()
        runPendingWindowAction()
        setCoreState("error", "Voice synthesis failed")
      }
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    }
  },
  unlock() {
    if (state.voiceUnlocked) return
    state.voiceUnlocked = true
    state.voiceUnlockedAt = Date.now()
    voiceStatus.textContent = state.settings.voiceEnabled ? "enabled" : "disabled"
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    const pending = state.pendingSpeech
    state.pendingSpeech = ""
    if (pending) void this.speak(pending)
  },
}

function sendMessage(message, channel = "text") {
  const normalized = message.trim()
  if (!normalized || state.socket?.readyState !== WebSocket.OPEN) return
  state.socket.send(JSON.stringify({ message: normalized, channel }))
  input.value = ""
  input.style.height = "auto"
  if (state.powerState !== "sleeping") setCoreState("thinking", "Thinking")
}

const SpeechInputController = {
  supported() {
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  },
  start({ userInitiated = false } = {}) {
    if (!this.supported()) {
      voiceStatus.textContent = "unsupported"
      return
    }
    if (userInitiated) {
      state.recognitionBlocked = false
      state.recognitionWanted = true
    }
    if (
      state.recognition
      || state.recognitionBlocked
      || state.recognitionPausedForSpeech
      || !state.recognitionWanted
      || state.socket?.readyState !== WebSocket.OPEN
    ) return

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new Recognition()
    state.recognition = recognition
    recognition.lang = "en-US"
    recognition.continuous = true
    recognition.interimResults = false
    recognition.maxAlternatives = 3
    recognition.onstart = () => {
      voiceStatus.textContent = "always listening"
      micButton.dataset.active = "true"
      if (state.powerState !== "sleeping" && state.coreState !== "speaking") {
        setCoreState("listening", "FRIDAY is listening")
      }
    }
    recognition.onresult = (event) => {
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        if (!result.isFinal) continue
        const transcript = result[0]?.transcript || ""
        sendMessage(transcript, "voice")
      }
    }
    recognition.onerror = (event) => {
      const error = event.error || "unknown"
      if (error === "not-allowed" || error === "service-not-allowed") {
        state.recognitionBlocked = true
        voiceStatus.textContent = "permission required"
        micButton.dataset.active = "false"
        return
      }
      if (error !== "no-speech" && error !== "aborted") voiceStatus.textContent = "reconnecting"
    }
    recognition.onend = () => {
      if (state.recognition === recognition) state.recognition = null
      micButton.dataset.active = "false"
      this.scheduleRestart()
    }
    try {
      recognition.start()
    } catch {
      state.recognition = null
      this.scheduleRestart()
    }
  },
  scheduleRestart() {
    window.clearTimeout(state.recognitionRestartTimer)
    if (
      state.recognitionBlocked
      || state.recognitionPausedForSpeech
      || !state.recognitionWanted
    ) return
    state.recognitionRestartTimer = window.setTimeout(() => this.start(), 450)
  },
  pauseForSpeech() {
    state.recognitionPausedForSpeech = true
    window.clearTimeout(state.recognitionRestartTimer)
    if (state.recognition) state.recognition.abort()
  },
  resumeAfterSpeech() {
    state.recognitionPausedForSpeech = false
    this.scheduleRestart()
  },
}

function PromptInput() {

  form.addEventListener("submit", (event) => {
    event.preventDefault()
    sendMessage(input.value)
  })

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      sendMessage(input.value)
    }
  })

  input.addEventListener("input", () => {
    input.style.height = "auto"
    input.style.height = `${Math.min(input.scrollHeight, 150)}px`
  })

  micButton.addEventListener("click", () => {
    VoiceController.unlock()
    if (!SpeechInputController.supported()) {
      setCoreState("error", "Browser speech recognition unavailable")
      return
    }
    SpeechInputController.start({ userInitiated: true })
  })
}

function ConnectionIndicator() {
  connectionIndicator.addEventListener("click", () => {
    connectionPopover.hidden = !connectionPopover.hidden
  })
}

function SettingsPanel() {
  settingsToggle.addEventListener("click", () => { settingsPanel.hidden = false })
  settingsClose.addEventListener("click", () => { settingsPanel.hidden = true })
  toggleHistory.addEventListener("click", () => updateSetting("historyVisible", !state.settings.historyVisible))

  controls.primaryColor.addEventListener("input", (event) => updateSetting("primaryColor", event.target.value))
  controls.secondaryColor.addEventListener("input", (event) => updateSetting("secondaryColor", event.target.value))
  controls.glowIntensity.addEventListener("input", (event) => updateSetting("glowIntensity", Number(event.target.value)))
  controls.pulseSpeed.addEventListener("input", (event) => updateSetting("pulseSpeed", Number(event.target.value)))
  controls.orbSize.addEventListener("input", (event) => updateSetting("orbSize", Number(event.target.value)))
  controls.voiceReactive.addEventListener("change", (event) => updateSetting("voiceReactive", event.target.checked))
  controls.reduceMotion.addEventListener("change", (event) => updateSetting("reduceMotion", event.target.checked))
  controls.voiceEnabled.addEventListener("change", (event) => updateSetting("voiceEnabled", event.target.checked))

  clearChat.addEventListener("click", () => {
    if (state.socket?.readyState !== WebSocket.OPEN) return
    state.socket.send(JSON.stringify({ type: "clear" }))
  })
}

function connect() {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws"
  const socket = new WebSocket(`${protocol}://${window.location.host}/ws/chat`)
  state.socket = socket
  websocketStatus.textContent = "connecting"
  setCoreState("disconnected", "Connecting to local core...")

  socket.addEventListener("open", () => {
    coreServiceStatus.textContent = "online"
    websocketStatus.textContent = "connected"
    setCoreState("idle", "Local connected")
    SpeechInputController.start()
  })
  socket.addEventListener("close", () => {
    if (state.recognition) state.recognition.abort()
    websocketStatus.textContent = "reconnecting"
    setCoreState("reconnecting", "Reconnecting")
    window.setTimeout(connect, 1200)
  })
  socket.addEventListener("error", () => {
    setCoreState("error", "Connection error")
  })
  socket.addEventListener("message", (event) => {
    const packet = JSON.parse(event.data)
    if (packet.type === "snapshot") {
      state.messages = packet.payload.messages || []
      ConversationStack(state.messages)
      if (state.coreState !== "speaking" && state.powerState !== "sleeping") setCoreState("idle", "Local connected")
      return
    }
    if (packet.type === "power") {
      setPowerState(packet.payload)
      return
    }
    if (packet.type === "cleared") {
      state.lastAssistantId = ""
      state.expandedCards.clear()
      state.messages = packet.payload.messages || []
      ConversationStack(state.messages)
      setCoreState("idle", packet.payload.archivePath ? "Chat saved. New session ready." : "New session ready.")
      return
    }
    if (packet.type === "state") {
      if (packet.state === "thinking") setCoreState("thinking", "Thinking")
      if (packet.state === "briefing") setCoreState("thinking", "Checking weather and news")
      return
    }
    if (packet.type === "error") {
      setCoreState("error", packet.message)
    }
  })
}

function CoreOrb() {
  applyAppearance()
  window.addEventListener("pointerdown", () => VoiceController.unlock(), { once: true })
  window.addEventListener("keydown", () => VoiceController.unlock(), { once: true })
}

window.addEventListener("pagehide", () => {
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/ui/chat/clear")
    return
  }
  fetch("/ui/chat/clear", {
    method: "POST",
    keepalive: true,
  }).catch(() => null)
})

CoreOrb()
PromptInput()
ConnectionIndicator()
SettingsPanel()
connect()
