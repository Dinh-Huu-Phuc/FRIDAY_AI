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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? "Send FIRDAY a command or ask for the next safe step..."}
        className="min-h-28 resize-none border-white/10 bg-[#0f1419]"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
          Ctrl + Enter to send quickly
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          {onClear ? (
            <Button variant="outline" onClick={onClear} disabled={loading}>
              <Trash2 />
              Clear
            </Button>
          ) : null}
          <Button onClick={onSubmit} disabled={loading || !value.trim()}>
            {loading ? <Loader2 className="animate-spin" /> : <Send />}
            Send Text
          </Button>
        </div>
      </div>
    </div>
  )
}
