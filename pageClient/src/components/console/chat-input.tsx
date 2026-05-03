"use client"

import type { KeyboardEvent } from "react"
import { Loader2, Send, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onClear?: () => void
  loading?: boolean
  placeholder?: string
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onClear,
  loading,
  placeholder,
}: ChatInputProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="mx-auto w-full max-w-[820px] rounded-[28px] border border-white/10 bg-[#0b1117]/95 p-3 shadow-2xl shadow-black/30 backdrop-blur">
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? "Send FIRDAY a command or ask for the next safe step..."}
        className="min-h-20 resize-none rounded-[20px] border-transparent bg-transparent px-3 py-3 text-sm leading-6 focus-visible:border-cyan-400/30 focus-visible:ring-cyan-400/15"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
          Ctrl + Enter
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          {onClear ? (
            <Button size="sm" variant="ghost" onClick={onClear} disabled={loading}>
              <Trash2 />
              Clear
            </Button>
          ) : null}
          <Button size="sm" onClick={onSubmit} disabled={loading || !value.trim()}>
            {loading ? <Loader2 className="animate-spin" /> : <Send />}
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
