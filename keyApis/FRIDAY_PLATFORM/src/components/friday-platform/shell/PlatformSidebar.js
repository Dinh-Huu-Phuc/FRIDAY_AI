"use client";

import { platformNavigation } from "@/router/navigation";

export default function PlatformSidebar({ activeTab, onSelectTab, user }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-slate-950/55 p-4 backdrop-blur-xl md:block">
      <div className="mb-8 flex items-center gap-3">
        <img src="/logo.svg" alt="FRIDAY" className="h-10 w-10 rounded-lg" />
        <div>
          <div className="font-semibold text-white">FRIDAY Platform</div>
          <div className="text-xs text-slate-500">Internal Gateway</div>
        </div>
      </div>
      <nav className="space-y-1">
        {platformNavigation.map((item) => (
          <button
            key={item.id}
            className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition ${activeTab === item.id ? "bg-cyan-400 text-slate-950" : "text-slate-400 hover:bg-white/10 hover:text-white"}`}
            onClick={() => onSelectTab(item.id)}
          >
            <span>{item.label}</span>
            {item.protected && !user ? <span className="text-[10px] opacity-75">Lock</span> : null}
          </button>
        ))}
      </nav>
    </aside>
  );
}
