"use client"

import { cn } from "@/lib/utils"

interface AudioBarsProps {
  active: boolean
  variant?: "agent" | "user"
  className?: string
}

const BAR_HEIGHTS = [48, 64, 60, 68, 56]

export function AudioBars({
  active,
  variant = "agent",
  className,
}: AudioBarsProps) {
  const barClassName =
    variant === "agent" ? "bg-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.2)]" : "bg-cyan-300/80"

  return (
    <div className={cn("flex items-end justify-center gap-5", className)}>
      {BAR_HEIGHTS.map((height, index) => (
        <span
          key={`${variant}-${index}`}
          data-active={active}
          className={cn(
            "audio-wave-bar block w-8 rounded-full transition-opacity duration-300",
            barClassName,
            active ? "opacity-100" : "opacity-40"
          )}
          style={{
            height: `${active ? height : 44}px`,
            animationDelay: `${index * 90}ms`,
          }}
        />
      ))}
    </div>
  )
}
