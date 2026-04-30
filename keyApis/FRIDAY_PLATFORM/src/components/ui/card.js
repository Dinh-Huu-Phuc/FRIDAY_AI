import { cn } from "@/utils/cn";

export function Card({ className, ...props }) {
  return <div className={cn("glass-panel rounded-lg", className)} {...props} />;
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("space-y-1.5 p-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn("text-base font-semibold text-white", className)} {...props} />;
}

export function CardDescription({ className, ...props }) {
  return <p className={cn("text-sm text-slate-400", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}
