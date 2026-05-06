"use client"

import { useEffect, useRef } from "react"
import { createDashboardBackgroundCore } from "@/components/dashboard/js/dashboard-background-core"

export function DashboardBackground() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const coreRef = useRef<ReturnType<typeof createDashboardBackgroundCore> | null>(null)

  useEffect(() => {
    if (!canvasRef.current || !wrapperRef.current || coreRef.current) return

    const core = createDashboardBackgroundCore(canvasRef.current)
    coreRef.current = core

    const dashboardElement = canvasRef.current.closest<HTMLElement>(".stark-dashboard")
    const foregroundElement = dashboardElement?.querySelector<HTMLElement>(".stark-dashboard-shell")

    function syncSize() {
      if (!dashboardElement || !wrapperRef.current) return

      const width = dashboardElement.clientWidth || window.innerWidth
      const height = Math.max(
        dashboardElement.scrollHeight,
        foregroundElement?.scrollHeight || 0,
        dashboardElement.clientHeight,
        window.innerHeight
      )

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

    const resizeObserver = new ResizeObserver(syncSize)
    if (dashboardElement) resizeObserver.observe(dashboardElement)
    if (foregroundElement) resizeObserver.observe(foregroundElement)
    window.addEventListener("resize", syncSize)
    dashboardElement?.addEventListener("scroll", handleScroll, { passive: true })
    syncSize()
    handleScroll()

    return () => {
      window.removeEventListener("resize", syncSize)
      dashboardElement?.removeEventListener("scroll", handleScroll)
      resizeObserver.disconnect()
      core.dispose()
      coreRef.current = null
    }
  }, [])

  return (
    <div ref={wrapperRef} className="stark-global-background" aria-hidden="true">
      <canvas ref={canvasRef} className="stark-background-canvas" />
      <div className="stark-depth-vignette" />
    </div>
  )
}
