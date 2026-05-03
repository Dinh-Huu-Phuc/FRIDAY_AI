"use client"

import { MessageSquareText } from "lucide-react"

import { MessageBubble } from "@/components/console/message-bubble"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ChatMessage } from "@/lib/types"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface ChatPanelProps {
  messages: ChatMessage[]
  loading?: boolean
  className?: string
  floatingWidget?: ReactNode
}

export function ChatPanel({ messages, loading, className, floatingWidget }: ChatPanelProps) {
  if (loading) {
    return (
      <div className={cn("relative flex min-h-[520px] items-center justify-center rounded-[28px] bg-[#080d12] text-sm text-zinc-400", className)}>
        {floatingWidget ? (
          <div className="absolute right-4 top-4 z-10">{floatingWidget}</div>
        ) : null}
        Loading conversation...
      </div>
    )
  }

  if (!messages.length) {
    return (
      <div className={cn("relative flex min-h-[520px] flex-col items-center justify-center rounded-[28px] bg-[#080d12] px-6 text-center", className)}>
        {floatingWidget ? (
          <div className="absolute right-4 top-4 z-10">{floatingWidget}</div>
        ) : null}
        <MessageSquareText className="mb-4 size-10 text-zinc-500" />
        <h3 className="text-lg font-medium text-zinc-100">No messages yet</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
          Send a command below to start interacting with F.I.R.D.A.Y.
        </p>
      </div>
    )
  }

  return (
    <div className={cn("relative rounded-[28px] bg-[#080d12]", className)}>
      {floatingWidget ? (
        <div className="absolute right-4 top-4 z-20">{floatingWidget}</div>
      ) : null}
      <ScrollArea className="h-full rounded-[inherit]">
        <div className="mx-auto flex w-full max-w-[900px] flex-col gap-5 px-4 pb-8 pt-28 sm:px-6 lg:ml-[5%] lg:mr-auto lg:pt-10 xl:ml-[8%]">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        </div>
      </ScrollArea>
    </div>
  )
}
