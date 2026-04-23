"use client"

import { Bot, Keyboard, Mic, User } from "lucide-react"

import type { ChatMessage } from "@/lib/types"
import { cn, formatTimestamp } from "@/lib/utils"

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user"
  const isVoice = message.channel === "voice"

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser ? (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <Bot className="size-4 text-zinc-200" />
        </div>
      ) : null}

      <div
        className={cn(
          "max-w-[85%] rounded-2xl border px-4 py-3 text-sm leading-6 shadow-sm",
          isUser
            ? "border-white/10 bg-white/[0.08] text-zinc-50"
            : "border-white/8 bg-[#11161c] text-zinc-200"
        )}
      >
        <div className="mb-1 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
          <div className="flex items-center gap-2">
            <span>{isUser ? "User" : "FIRDAY"}</span>
            <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] tracking-[0.14em] text-zinc-400">
              {isVoice ? <Mic className="size-3" /> : <Keyboard className="size-3" />}
              {isVoice ? "Voice" : "Text"}
            </span>
          </div>
          <span>{formatTimestamp(message.timestamp)}</span>
        </div>
        <p>{message.content}</p>
      </div>

      {isUser ? (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <User className="size-4 text-zinc-200" />
        </div>
      ) : null}
    </div>
  )
}
