"use client"

import { useEffect, useRef } from "react"

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

function findScrollParent(element: HTMLElement | null) {
  let current = element?.parentElement ?? null

  while (current) {
    const style = window.getComputedStyle(current)
    if (/(auto|scroll|overlay)/.test(`${style.overflowY}${style.overflow}`)) {
      return current
    }
    current = current.parentElement
  }

  return window
}

interface DashboardScrollVideoProps {
  src: string
  className?: string
}

export function DashboardScrollVideo({ src, className }: DashboardScrollVideoProps) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const frameRef = useRef<number | null>(null)
  const durationRef = useRef(0)
  const targetTimeRef = useRef(0)

  useEffect(() => {
    const section = sectionRef.current
    const video = videoRef.current
    if (!section || !video) return

    const scrollParent = findScrollParent(section)

    const updateTargetTime = () => {
      const duration = durationRef.current || video.duration
      if (!Number.isFinite(duration) || duration <= 0) return

      const sectionRect = section.getBoundingClientRect()
      const viewportHeight = scrollParent instanceof Window ? window.innerHeight : scrollParent.clientHeight
      const viewportTop = scrollParent instanceof Window ? 0 : scrollParent.getBoundingClientRect().top
      const scrollableDistance = Math.max(
        viewportHeight * 0.95,
        sectionRect.height - viewportHeight
      )
      const progress = clamp((viewportTop - sectionRect.top) / scrollableDistance)
      targetTimeRef.current = Math.min(duration - 0.05, progress * duration * 0.96)
    }

    const animateVideoTime = () => {
      frameRef.current = null
      updateTargetTime()

      const targetTime = targetTimeRef.current
      if (!Number.isFinite(targetTime)) return

      const delta = targetTime - video.currentTime
      if (Math.abs(delta) > 0.012) {
        video.currentTime = video.currentTime + delta * 0.42
        frameRef.current = window.requestAnimationFrame(animateVideoTime)
      }
    }

    const scheduleUpdate = () => {
      if (frameRef.current !== null) return
      frameRef.current = window.requestAnimationFrame(animateVideoTime)
    }

    const handleLoadedMetadata = () => {
      durationRef.current = video.duration
      video.pause()
      video.currentTime = 0
      scheduleUpdate()
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    window.addEventListener("resize", scheduleUpdate)
    window.addEventListener("scroll", scheduleUpdate, { passive: true })
    if (!(scrollParent instanceof Window)) {
      scrollParent.addEventListener("scroll", scheduleUpdate, { passive: true })
    }

    scheduleUpdate()

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      window.removeEventListener("resize", scheduleUpdate)
      window.removeEventListener("scroll", scheduleUpdate)
      if (!(scrollParent instanceof Window)) {
        scrollParent.removeEventListener("scroll", scheduleUpdate)
      }
    }
  }, [])

  return (
    <section ref={sectionRef} className={className}>
      <div className="sticky top-0 h-[calc(100vh-1.5rem)] overflow-hidden rounded-[2rem] border border-white/10 bg-black">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
        muted
        playsInline
        preload="metadata"
        controls={false}
        disablePictureInPicture
      >
          <source src={src} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,rgba(255,255,255,0.13),transparent_34%),linear-gradient(to_bottom,rgba(0,0,0,0.06),rgba(0,0,0,0.62)_68%,#000_100%)]" />
      </div>
    </section>
  )
}
