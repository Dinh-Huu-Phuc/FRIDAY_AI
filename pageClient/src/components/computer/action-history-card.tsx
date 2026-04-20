"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ActionHistoryItem } from "@/lib/types"
import { badgeTone, cn, formatTimestamp, riskTone, statusTone, titleCase } from "@/lib/utils"

interface ActionHistoryCardProps {
  history: ActionHistoryItem[]
}

export function ActionHistoryCard({ history }: ActionHistoryCardProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle>Action History</CardTitle>
        <CardDescription>
          Chronological list of recent actions with execution outcomes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!history.length ? (
          <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-sm text-zinc-400">
            No action history available yet.
          </p>
        ) : (
          history.map((item) => (
            <details
              key={item.id}
              className="rounded-xl border border-white/10 bg-[#0f1419] p-4"
            >
              <summary className="flex cursor-pointer list-none flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-100">
                    {titleCase(item.action.type)} · {item.action.description}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatTimestamp(item.timestamp)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={cn("border", badgeTone(statusTone(item.status)))}>
                    {titleCase(item.status)}
                  </Badge>
                  <Badge className={cn("border", badgeTone(riskTone(item.riskLevel)))}>
                    {titleCase(item.riskLevel)}
                  </Badge>
                </div>
              </summary>
              <div className="mt-4 space-y-3 border-t border-white/10 pt-4 text-sm text-zinc-300">
                <p>{item.message}</p>
                {item.details ? (
                  <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-zinc-400">
                    {JSON.stringify(item.details, null, 2)}
                  </pre>
                ) : null}
              </div>
            </details>
          ))
        )}
      </CardContent>
    </Card>
  )
}
