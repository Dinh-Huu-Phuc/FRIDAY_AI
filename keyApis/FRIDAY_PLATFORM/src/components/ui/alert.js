import { cn } from "@/utils/cn";

export function Alert({ className, ...props }) {
  return <div className={cn("rounded-lg border border-amber-400/25 bg-amber-400/10 p-3 text-sm text-amber-100", className)} {...props} />;
}
