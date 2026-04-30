"use client";

import { cn } from "@/utils/cn";

export function Dialog({ open, children }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">{children}</div>;
}

export function DialogContent({ className, ...props }) {
  return <div className={cn("glass-panel max-h-[90vh] w-full max-w-lg overflow-auto rounded-lg p-5", className)} {...props} />;
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn("mb-4 space-y-1", className)} {...props} />;
}

export function DialogTitle({ className, ...props }) {
  return <h2 className={cn("text-lg font-semibold text-white", className)} {...props} />;
}

export function DialogDescription({ className, ...props }) {
  return <p className={cn("text-sm text-slate-400", className)} {...props} />;
}

export function DialogFooter({ className, ...props }) {
  return <div className={cn("mt-5 flex justify-end gap-2", className)} {...props} />;
}
