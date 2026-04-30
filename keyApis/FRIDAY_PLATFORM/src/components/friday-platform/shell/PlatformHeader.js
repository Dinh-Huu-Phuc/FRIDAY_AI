"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { tabCopy } from "@/router/navigation";

export default function PlatformHeader({ activeTab, user, onLogout, onCreate, onLogin, onRegister }) {
  const [title, subtitle] = tabCopy[activeTab] || tabCopy.overview;
  return (
    <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-white/10 bg-slate-950/70 p-5 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
          <Badge>Secure Gateway Active</Badge>
        </div>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {user ? (
          <>
            <div className="text-right text-sm">
              <div className="text-white">{user?.full_name || user?.username || "FRIDAY user"}</div>
              <div className="text-xs text-slate-500">{user?.email}</div>
            </div>
            <Button onClick={onCreate}>Create API Key</Button>
            <Button variant="ghost" onClick={onLogout}>Logout</Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onLogin}>Login</Button>
            <Button onClick={onRegister}>Create Account</Button>
          </>
        )}
      </div>
    </header>
  );
}
