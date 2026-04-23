"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bot,
  ChevronRight,
  Computer,
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
  { href: "/runtime", label: "Runtime State", icon: Sparkles },
  { href: "/logs", label: "Logs", icon: Logs },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden border-r border-white/10 bg-[#0d1117] lg:flex lg:w-72 lg:flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <Bot className="size-5 text-zinc-100" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
              FIRDAY
            </p>
            <h1 className="text-lg font-semibold text-zinc-100">
              Agent Control Panel
            </h1>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
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
                "group flex items-center justify-between rounded-xl border px-3 py-2.5 transition-colors",
                active
                  ? "border-white/15 bg-white/8 text-zinc-50"
                  : "border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/5 hover:text-zinc-100"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg",
                    active ? "bg-white/10" : "bg-transparent"
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <span className="text-sm font-medium">{titleCase(item.label)}</span>
              </div>
              <ChevronRight
                className={cn(
                  "size-4 transition-transform",
                  active ? "translate-x-0 text-zinc-300" : "translate-x-1 text-zinc-600 group-hover:text-zinc-400"
                )}
              />
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 px-5 py-4 text-xs text-zinc-500">
        Built for monitoring and operating the FIRDAY computer control agent.
      </div>
    </aside>
  )
}
