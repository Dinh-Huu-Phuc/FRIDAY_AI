import Link from "next/link"
import { ArrowRight, Gauge } from "lucide-react"

import { DashboardScrollVideo } from "@/components/dashboard/dashboard-scroll-video"
import { DashboardStatusStrip } from "@/components/dashboard/dashboard-status-strip"

export function DashboardHero() {
  return (
    <section className="relative bg-black">
      <DashboardScrollVideo src="/video/FIRDAY.mp4" className="relative h-screen px-3 py-3 sm:px-4" />

      <div className="pointer-events-none absolute inset-0 px-6 py-20 sm:px-10 lg:px-16">
        <div className="sticky top-16 mx-auto flex h-[calc(100vh-8rem)] max-w-[1280px] flex-col items-center justify-center text-center">
          <div className="pointer-events-auto mx-auto max-w-4xl">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[12px] font-semibold uppercase tracking-widest text-white/78 backdrop-blur-xl">
              <span className="size-1.5 rounded-full bg-white shadow-[0_0_16px_rgba(255,255,255,0.9)]" />
              FRIDAY AGENT / Runtime Dashboard
            </div>

            <h1 className="hero-gradient-text mx-auto max-w-4xl text-5xl font-semibold leading-[1.04] tracking-tight sm:text-6xl xl:text-7xl">
              FRIDAY Agent Control Center
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/68 sm:text-lg">
              A cinematic command surface for monitoring agent runtime, system health, memory flow, and real-time AI interaction.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link
                href="/console"
                className="glass-btn-hover inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold uppercase tracking-widest text-black active:scale-95"
              >
                Open Console
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/runtime"
                className="glass-btn-hover inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-8 py-3.5 text-sm font-semibold uppercase tracking-widest text-white backdrop-blur-xl hover:border-white/35 hover:bg-white/10 active:scale-95"
              >
                <Gauge className="size-4" />
                View Runtime
              </Link>
            </div>

            <div className="mx-auto mt-12 max-w-4xl">
              <DashboardStatusStrip />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
