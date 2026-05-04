"use client"

import { GestureHUD } from "@/components/spatial/gesture-hud"
import { HandCursor } from "@/components/spatial/hand-cursor"
import { SpatialScene } from "@/components/spatial/spatial-scene"
import { SpatialToolbar } from "@/components/spatial/spatial-toolbar"
import { useSpatialSession } from "@/hooks/use-spatial-session"
import { useSpatialSocket } from "@/hooks/use-spatial-socket"

export function SpatialPageClient() {
  const session = useSpatialSession()
  const socket = useSpatialSocket()

  return (
    <main className="min-h-screen bg-[#070a0f] px-4 py-6 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <div>
          <p className="text-xs uppercase text-zinc-500">FRIDAY Spatial Interaction Engine</p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-50">Spatial Control</h1>
        </div>

        <SpatialToolbar
          state={session.state}
          loading={session.loading}
          onStart={() => void session.start()}
          onStop={() => void session.stop()}
        />

        {session.error ? (
          <div className="border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {session.error}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <div className="relative">
            <SpatialScene event={socket.event} />
            <HandCursor event={socket.event} />
          </div>
          <GestureHUD connected={socket.connected} event={socket.event} error={socket.error} />
        </div>
      </div>
    </main>
  )
}
