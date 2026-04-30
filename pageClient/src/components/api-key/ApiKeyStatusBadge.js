"use client"

import { KeyRound, ShieldAlert, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function ApiKeyStatusBadge({ connected, limitReached, preview }) {
  if (connected) {
    return (
      <Badge className="border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-100">
        <ShieldCheck className="size-3.5" />
        API Key Connected{preview ? `: ${preview}` : ""}
      </Badge>
    )
  }

  if (limitReached) {
    return (
      <Badge className="border border-rose-400/20 bg-rose-400/10 px-2.5 py-1 text-xs font-medium text-rose-100">
        <ShieldAlert className="size-3.5" />
        Key Required
      </Badge>
    )
  }

  return (
    <Badge className="border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs font-medium text-amber-100">
      <KeyRound className="size-3.5" />
      Free Mode
    </Badge>
  )
}
