import { cn } from "@/utils/cn";

const variants = {
  default: "border-cyan-300/30 bg-cyan-300/10 text-cyan-200",
  success: "border-green-400/30 bg-green-400/10 text-green-300",
  warning: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  danger: "border-red-400/30 bg-red-400/10 text-red-300",
  muted: "border-white/10 bg-white/5 text-slate-300"
};

export function Badge({ className, variant = "default", ...props }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", variants[variant], className)} {...props} />;
}
