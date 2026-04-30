import { cn } from "@/utils/cn";

export function Progress({ value = 0, className }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-white/10", className)}>
      <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400" style={{ width: `${safe}%` }} />
    </div>
  );
}
