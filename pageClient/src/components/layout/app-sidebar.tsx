"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bot,
  Computer,
  Hand,
  LayoutDashboard,
  Logs,
  MessageSquareText,
  Settings,
  Sparkles,
} from "lucide-react"

import { cn, titleCase } from "@/lib/utils"

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/console", label: "Agent Console", icon: MessageSquareText },
  { href: "/computer", label: "Computer Control", icon: Computer },
  { href: "/spatial", label: "Spatial Control", icon: Hand },
  { href: "/runtime", label: "Runtime State", icon: Sparkles },
  { href: "/logs", label: "Logs", icon: Logs },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 shrink-0 border-b border-white/10 bg-[#070b10]/92 px-3 py-3 text-zinc-50 shadow-[0_16px_44px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/dashboard" className="flex min-w-fit items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg border border-cyan-300/25 bg-cyan-300/8 shadow-[0_0_18px_rgba(0,245,255,0.18)]">
            <Bot className="size-5 text-cyan-100" />
          </div>
          <div>
            <p className="text-[11px] uppercase text-zinc-500">FIRDAY</p>
            <h1 className="text-base font-semibold text-zinc-100">Agent Control Panel</h1>
          </div>
        </Link>

        <nav className="flex gap-2 overflow-x-auto pb-1 lg:justify-end lg:pb-0" aria-label="Primary navigation">
          {navigation.map((item) => {
            const Icon = item.icon
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium uppercase transition-colors",
                  active
                    ? "border-cyan-300/35 bg-cyan-300/14 text-cyan-50 shadow-[0_0_18px_rgba(0,245,255,0.16)]"
                    : "border-white/8 bg-white/[0.03] text-zinc-400 hover:border-white/14 hover:bg-white/[0.06] hover:text-zinc-100"
                )}
              >
                <Icon className="size-4" />
                <span>{titleCase(item.label)}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
