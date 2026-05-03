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
      className={cn("flex w-full gap-3", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser ? (
        <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/10">
          <Bot className="size-4 text-cyan-100" />
        </div>
      ) : null}

      <div
        className={cn(
          "max-w-[78%] px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[72%]",
          isUser
            ? "rounded-[22px] rounded-br-md bg-cyan-500/15 text-zinc-50"
            : "rounded-[22px] rounded-bl-md bg-transparent text-zinc-200"
        )}
      >
        <div className="mb-1 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          <div className="flex items-center gap-2">
            <span>{isUser ? "User" : "FIRDAY"}</span>
            <span className="flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] tracking-[0.12em] text-zinc-400">
              {isVoice ? <Mic className="size-3" /> : <Keyboard className="size-3" />}
              {isVoice ? "Voice" : "Text"}
            </span>
          </div>
          <span>{formatTimestamp(message.timestamp)}</span>
        </div>
        <p>{message.content}</p>
      </div>

      {isUser ? (
        <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-white/8">
          <User className="size-4 text-zinc-100" />
        </div>
      ) : null}
    </div>
  )
}
