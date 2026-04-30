"use client"

import { Badge } from "@/components/ui/badge"

export function FreeUsageBadge({ used, limit, connected }) {
  if (connected) {
    return (
      <Badge className="border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-100">
        Gateway quota active
      </Badge>
    )
  }

  const remaining = Math.max(limit - used, 0)
  return (
    <Badge className="border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-zinc-200">
      Free questions left today: {remaining}/{limit}
    </Badge>
  )
}
