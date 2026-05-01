import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface DashboardStatCardProps {
  title: string
  status: string
  description: string
  icon: LucideIcon
  className?: string
}

export function DashboardStatCard({
  title,
  status,
  description,
  icon: Icon,
  className,
}: DashboardStatCardProps) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl transition duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:shadow-[0_0_30px_rgba(255,255,255,0.08)]",
        className
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-white/10 blur-3xl opacity-0 transition duration-300 group-hover:opacity-100" />
      <div className="relative flex h-full min-h-[220px] flex-col justify-between gap-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex size-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.07]">
            <Icon className="size-5 text-white" />
          </div>
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/70">
            {status}
          </span>
        </div>

        <div>
          <h3 className="text-2xl font-semibold tracking-tight text-white">{title}</h3>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/58">{description}</p>
        </div>
      </div>
    </article>
  )
}

