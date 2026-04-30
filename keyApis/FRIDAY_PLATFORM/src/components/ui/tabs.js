"use client";

import { cn } from "@/utils/cn";

export function Tabs({ value, onValueChange, children, className }) {
  return <div className={className}>{typeof children === "function" ? children({ value, onValueChange }) : children}</div>;
}

export function TabsList({ className, ...props }) {
  return <div className={cn("inline-flex rounded-lg border border-white/10 bg-white/5 p-1", className)} {...props} />;
}

export function TabsTrigger({ active, className, ...props }) {
  return <button className={cn("rounded-md px-3 py-2 text-sm text-slate-400 transition hover:text-white", active && "bg-cyan-400 text-slate-950", className)} {...props} />;
}
