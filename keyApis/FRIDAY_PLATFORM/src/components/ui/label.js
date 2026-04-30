import { cn } from "@/utils/cn";

export function Label({ className, ...props }) {
  return <label className={cn("text-sm font-medium text-slate-200", className)} {...props} />;
}
