import { Activity, BrainCircuit, Cpu, Mic2, MonitorCog } from "lucide-react"

import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card"

const cards = [
  {
    title: "Agent Runtime",
    status: "Online",
    description: "Realtime reasoning loop, tool orchestration, memory routing, and response pipeline status.",
    icon: Cpu,
    className: "lg:col-span-7",
  },
  {
    title: "Voice Interface",
    status: "Listening Ready",
    description: "Mic input, backend TTS output, audio visualizer state, and speech handoff readiness.",
    icon: Mic2,
    className: "lg:col-span-5",
  },
  {
    title: "Memory & Knowledge",
    status: "Synced",
    description: "RAG documents, session memory, long-term context, and training data continuity.",
    icon: BrainCircuit,
    className: "lg:col-span-4",
  },
  {
    title: "Computer Control",
    status: "Standby",
    description: "Planned actions, screenshots, execution history, and safety-aware operating loop.",
    icon: MonitorCog,
    className: "lg:col-span-4",
  },
  {
    title: "System Probe",
    status: "Healthy",
    description: "Backend connection, latency checks, route proxy diagnostics, and runtime observability.",
    icon: Activity,
    className: "lg:col-span-4",
  },
]

export function DashboardBentoGrid() {
  return (
    <section className="bg-black px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-widest text-white/45">
              Operational Surface
            </p>
            <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Runtime intelligence, compressed into a quiet command grid.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-white/55">
            Glass cards surface only the important state: agent health, voice, memory, automation, and diagnostics.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          {cards.map((card) => (
            <DashboardStatCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </section>
  )
}
