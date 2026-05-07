"use client"

import { useEffect, useRef } from "react"
import { createDashboardBackgroundCore } from "@/components/dashboard/js/dashboard-background-core"
import { createDashboardThreeCore } from "@/components/dashboard/js/dashboard-three-core"

interface DashboardBackgroundProps {
  coreColor?: string
  paused?: boolean
}

export function DashboardBackground({ coreColor = "#ffbd34", paused = false }: DashboardBackgroundProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const coreRef = useRef<ReturnType<typeof createDashboardBackgroundCore> | null>(null)
  const aiCoreRef = useRef<ReturnType<typeof createDashboardThreeCore> | null>(null)
  const pausedRef = useRef(paused)

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    if (!canvasRef.current || !wrapperRef.current || coreRef.current) return

    const core = createDashboardBackgroundCore(canvasRef.current)
    coreRef.current = core

    const dashboardElement = canvasRef.current.closest<HTMLElement>(".stark-dashboard")
    let scrollFrame = 0
    let scrollIdleTimer = 0

    function syncSize() {
      if (!dashboardElement || !wrapperRef.current) return

      const width = dashboardElement.clientWidth || window.innerWidth
      const height = dashboardElement.clientHeight || window.innerHeight

      wrapperRef.current.style.width = `${width}px`
      wrapperRef.current.style.height = `${height}px`
      core.resize(width, height)
    }

    function handleScroll() {
      if (!dashboardElement) return

      const maxScroll = dashboardElement.scrollHeight - dashboardElement.clientHeight
      const progress = maxScroll > 0 ? dashboardElement.scrollTop / maxScroll : 0
      core.setScrollProgress(progress)
      dashboardElement.style.setProperty("--dashboard-scroll", String(progress))
    }

    function scheduleScrollUpdate() {
      if (scrollFrame) return

      dashboardElement?.classList.add("is-scrolling")
      core.stop()
      if (scrollIdleTimer) window.clearTimeout(scrollIdleTimer)

      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0
        handleScroll()
        scrollIdleTimer = window.setTimeout(() => {
          scrollIdleTimer = 0
          dashboardElement?.classList.remove("is-scrolling")
          if (!pausedRef.current) core.start()
        }, 120)
      })
    }

    const resizeObserver = new ResizeObserver(syncSize)
    if (dashboardElement) resizeObserver.observe(dashboardElement)
    window.addEventListener("resize", syncSize)
    dashboardElement?.addEventListener("scroll", scheduleScrollUpdate, { passive: true })
    syncSize()
    handleScroll()

    return () => {
      window.removeEventListener("resize", syncSize)
      dashboardElement?.removeEventListener("scroll", scheduleScrollUpdate)
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame)
      if (scrollIdleTimer) window.clearTimeout(scrollIdleTimer)
      resizeObserver.disconnect()
      aiCoreRef.current?.dispose()
      aiCoreRef.current = null
      core.dispose()
      coreRef.current = null
    }
  }, [])

  useEffect(() => {
    const core = coreRef.current
    if (!core) return

    core.setPaused(paused)

    if (paused) {
      if (!aiCoreRef.current) {
        aiCoreRef.current = createDashboardThreeCore({
          canvas: core.canvas,
          coreColor,
          renderer: core.renderer,
        })
      }
      aiCoreRef.current.setActive(true)
      return
    }

    aiCoreRef.current?.dispose()
    aiCoreRef.current = null
    core.resize(core.canvas.clientWidth || window.innerWidth, core.canvas.clientHeight || window.innerHeight)
  }, [coreColor, paused])

  useEffect(() => {
    aiCoreRef.current?.setCoreColor(coreColor)
  }, [coreColor])

  return (
    <div ref={wrapperRef} className={paused ? "stark-global-background is-core-active" : "stark-global-background"} aria-hidden="true">
      <canvas ref={canvasRef} className="stark-background-canvas" />
      <div className="stark-depth-vignette" />
    </div>
  )
}
