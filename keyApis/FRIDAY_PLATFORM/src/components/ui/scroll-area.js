import { cn } from "@/utils/cn";

export function ScrollArea({ className, ...props }) {
  return <div className={cn("overflow-auto", className)} {...props} />;
}
