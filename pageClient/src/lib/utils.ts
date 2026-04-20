import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimestamp(value: string | number | Date | undefined | null) {
  if (!value) {
    return "N/A"
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "N/A"
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function compactPath(path: string | undefined | null, max = 42) {
  const value = String(path ?? "").trim()
  if (!value) {
    return "Unavailable"
  }

  if (value.length <= max) {
    return value
  }

  const start = value.slice(0, Math.floor(max / 2) - 2)
  const end = value.slice(-(Math.floor(max / 2) - 1))
  return `${start}...${end}`
}

export function titleCase(value: string | undefined | null) {
  return String(value ?? "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function badgeTone(
  tone: "neutral" | "success" | "warning" | "danger" | "info" = "neutral"
) {
  switch (tone) {
    case "success":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
    case "warning":
      return "border-amber-500/20 bg-amber-500/10 text-amber-300"
    case "danger":
      return "border-rose-500/20 bg-rose-500/10 text-rose-300"
    case "info":
      return "border-sky-500/20 bg-sky-500/10 text-sky-300"
    default:
      return "border-white/10 bg-white/5 text-zinc-300"
  }
}

export function statusTone(status: string | undefined | null) {
  const normalized = String(status ?? "").toLowerCase()
  if (["connected", "success", "healthy", "synced", "active"].includes(normalized)) {
    return "success" as const
  }
  if (["blocked", "warning", "degraded", "pending"].includes(normalized)) {
    return "warning" as const
  }
  if (["failed", "error", "offline", "disconnected"].includes(normalized)) {
    return "danger" as const
  }
  if (["mock", "info"].includes(normalized)) {
    return "info" as const
  }
  return "neutral" as const
}

export function riskTone(riskLevel: string | undefined | null) {
  const normalized = String(riskLevel ?? "").toLowerCase()
  if (normalized === "low") {
    return "success" as const
  }
  if (normalized === "medium") {
    return "warning" as const
  }
  if (["high", "critical"].includes(normalized)) {
    return "danger" as const
  }
  return "neutral" as const
}
