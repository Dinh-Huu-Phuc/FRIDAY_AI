import { cn } from "@/utils/cn";

const variants = {
  default: "bg-cyan-400 text-slate-950 hover:bg-cyan-300",
  secondary: "bg-white/10 text-slate-100 hover:bg-white/15",
  ghost: "text-slate-300 hover:bg-white/10 hover:text-white",
  destructive: "bg-red-500 text-white hover:bg-red-400",
  outline: "border border-white/15 bg-transparent text-slate-100 hover:bg-white/10"
};

export function Button({ className, variant = "default", size = "md", ...props }) {
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-sm"
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
