"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function DropdownMenu({ trigger = "Actions", children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)}>{trigger}</Button>
      {open ? <div className="absolute right-0 z-20 mt-2 min-w-36 rounded-md border border-white/10 bg-slate-950 p-1 shadow-xl">{children}</div> : null}
    </div>
  );
}

export function DropdownMenuItem({ children, onClick, className = "" }) {
  return <button className={`block w-full rounded px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10 ${className}`} onClick={onClick}>{children}</button>;
}
