"use client"

import type { ReactNode } from "react"

import { AppHeader } from "@/components/layout/app-header"
import type { BackendStatus, SafetyMode } from "@/lib/types"

interface PageShellProps {
  title: string
  description?: string
  backendStatus: BackendStatus
  safetyMode: SafetyMode
  busy?: boolean
  showConnectionToggle?: boolean
  onObserve?: () => void
  onPlan?: () => void
  children: ReactNode
}

export function PageShell({ children, ...headerProps }: PageShellProps) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#0b0f14]">
      <AppHeader {...headerProps} />
      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
  )
}
