import Link from "next/link"
import { ArrowRight, Gauge } from "lucide-react"

import { DashboardStatusStrip } from "@/components/dashboard/dashboard-status-strip"

const fridayPlatformUrl = process.env.NEXT_PUBLIC_FRIDAY_PLATFORM_URL ?? "http://localhost:3004/friday-platform"

export function DashboardHero() {
  return (
    <section className="relative h-screen overflow-hidden rounded-[2rem] border border-white/10 bg-black">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
      >
        <source src="/video/FIRDAY.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,rgba(255,255,255,0.12),transparent_34%),linear-gradient(to_bottom,rgba(0,0,0,0.12),rgba(0,0,0,0.62)_72%,#000_100%)]" />

      <div className="pointer-events-none absolute inset-0 px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto flex h-full max-w-[1280px] flex-col items-center justify-center text-center">
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
                href={fridayPlatformUrl}
                className="glass-btn-hover inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold uppercase tracking-widest text-black active:scale-95"
              >
                FRIDAY Platform
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
