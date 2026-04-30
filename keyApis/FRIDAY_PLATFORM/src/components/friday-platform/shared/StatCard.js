import { Card, CardContent } from "@/components/ui/card";

export default function StatCard({ label, value, hint }) {
  return (
    <Card className="glow-border">
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
        <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
        {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
      </CardContent>
    </Card>
  );
}
