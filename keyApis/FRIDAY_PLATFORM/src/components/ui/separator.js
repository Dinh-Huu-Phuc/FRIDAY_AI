import { cn } from "@/utils/cn";

export function Separator({ className, ...props }) {
  return <div className={cn("h-px w-full bg-white/10", className)} {...props} />;
}
