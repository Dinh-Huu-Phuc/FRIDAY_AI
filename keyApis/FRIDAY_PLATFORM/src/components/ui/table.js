import { cn } from "@/utils/cn";

export function Table({ className, ...props }) {
  return <table className={cn("w-full caption-bottom text-sm", className)} {...props} />;
}

export function TableHeader(props) {
  return <thead {...props} />;
}

export function TableBody(props) {
  return <tbody {...props} />;
}

export function TableRow({ className, ...props }) {
  return <tr className={cn("border-b border-white/10", className)} {...props} />;
}

export function TableHead({ className, ...props }) {
  return <th className={cn("h-11 px-3 text-left align-middle text-xs font-medium uppercase tracking-wide text-slate-400", className)} {...props} />;
}

export function TableCell({ className, ...props }) {
  return <td className={cn("px-3 py-3 align-middle text-slate-200", className)} {...props} />;
}
