import { cn } from "@/utils/cn";

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20",
        className
      )}
      {...props}
    />
  );
}
