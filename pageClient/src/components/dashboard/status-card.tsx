"use client"

import type { LucideIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { badgeTone, cn, statusTone } from "@/lib/utils"

interface StatusCardProps {
  title: string
  value: string
  description: string
  icon: LucideIcon
  tone?: "neutral" | "success" | "warning" | "danger" | "info"
}

export function StatusCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "neutral",
}: StatusCardProps) {
  return (
    <Card className="border-white/5 bg-white/[0.03]">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-sm text-zinc-400">{title}</CardTitle>
        </div>
        <div className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <Icon className="size-4 text-zinc-200" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-2xl font-semibold tracking-tight text-zinc-50">
          {value}
        </div>
        <Badge className={cn("border", badgeTone(tone ?? statusTone(value)))}>
          {value}
        </Badge>
        <p className="text-sm leading-6 text-zinc-400">{description}</p>
      </CardContent>
    </Card>
  )
}
