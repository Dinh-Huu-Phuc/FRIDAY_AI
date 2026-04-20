"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { LogEntry } from "@/lib/types"
import { badgeTone, cn, formatTimestamp, statusTone, titleCase } from "@/lib/utils"

interface LogsPanelProps {
  logs: LogEntry[]
}

export function LogsPanel({ logs }: LogsPanelProps) {
  const [query, setQuery] = useState("")

  const filteredLogs = useMemo(() => {
    if (!query.trim()) return logs
    const normalized = query.toLowerCase()
    return logs.filter(
      (log) =>
        log.message.toLowerCase().includes(normalized) ||
        log.level.toLowerCase().includes(normalized) ||
        log.source.toLowerCase().includes(normalized)
    )
  }, [logs, query])

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-zinc-500" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter logs..."
          className="pl-9"
        />
      </div>

      <ScrollArea className="terminal-panel h-[640px] rounded-2xl border border-white/10 bg-[#0b0f14]">
        <div className="space-y-2 p-4 font-mono text-xs">
          {!filteredLogs.length ? (
            <div className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-zinc-500">
              No logs match the current filter.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-zinc-300"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-zinc-500">
                    {formatTimestamp(log.timestamp)}
                  </span>
                  <span
                    className={cn(
                      "rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]",
                      badgeTone(statusTone(log.level))
                    )}
                  >
                    {titleCase(log.level)}
                  </span>
                  <span className="text-zinc-500">{log.source}</span>
                </div>
                <p className="leading-6 text-zinc-200">{log.message}</p>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
