"use client"

import { MessageSquareText } from "lucide-react"

import { MessageBubble } from "@/components/console/message-bubble"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ChatMessage } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ChatPanelProps {
  messages: ChatMessage[]
  loading?: boolean
  className?: string
}

export function ChatPanel({ messages, loading, className }: ChatPanelProps) {
  if (loading) {
    return (
      <div className={cn("flex min-h-[520px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-zinc-400", className)}>
        Loading conversation...
      </div>
    )
  }

  if (!messages.length) {
    return (
      <div className={cn("flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center", className)}>
        <MessageSquareText className="mb-4 size-10 text-zinc-500" />
        <h3 className="text-lg font-medium text-zinc-100">No messages yet</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
          Send a command below to start interacting with FIRDAY.
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className={cn("h-[520px] rounded-2xl border border-white/10 bg-white/[0.03]", className)}>
      <div className="space-y-4 p-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>
    </ScrollArea>
  )
}
