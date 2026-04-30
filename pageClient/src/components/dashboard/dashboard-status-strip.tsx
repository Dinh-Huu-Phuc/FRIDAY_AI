import { Activity, Brain, Database, Mic2 } from "lucide-react"

const statuses = [
  { label: "Backend Online", icon: Activity },
  { label: "Voice Ready", icon: Mic2 },
  { label: "Memory Active", icon: Database },
  { label: "Runtime Synced", icon: Brain },
]

export function DashboardStatusStrip() {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {statuses.map((status) => {
        const Icon = status.icon

        return (
          <div
            key={status.label}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-medium text-white/75 backdrop-blur-xl"
          >
            <Icon className="size-3.5 text-white" />
            <span>{status.label}</span>
          </div>
        )
      })}
    </div>
  )
}

