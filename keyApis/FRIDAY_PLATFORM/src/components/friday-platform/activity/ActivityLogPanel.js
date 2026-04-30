"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/friday-platform/shared/StatusBadge";
import EmptyState from "@/components/friday-platform/shared/EmptyState";
import { useActivity } from "@/hooks/useActivity";
import { formatDate } from "@/utils/dateUtils";

export default function ActivityLogPanel() {
  const { activity, loading, error } = useActivity();
  if (loading) return <div className="text-sm text-slate-400">Loading activity...</div>;
  if (error) return <EmptyState title="Activity data unavailable" description="Backend activity logs are not available yet for this account." />;
  const items = activity.items || [];
  return (
    <Card>
      <CardHeader><CardTitle>Security & Gateway Activity</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.length ? items.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-white/10 p-3 text-sm"><div><div className="text-white">{item.event || item.action}</div><div className="text-xs text-slate-500">{item.actor || "system"} - {item.ip || "no ip"} - {formatDate(item.createdAt || item.timestamp)}</div>{item.metadata ? <div className="mt-1 text-xs text-slate-600">{JSON.stringify(item.metadata)}</div> : null}</div><StatusBadge status={item.status || (item.severity === "success" ? "active" : item.severity === "warning" ? "expired" : "enabled")} /></div>) : <EmptyState title="No activity logs" description="Security and gateway activity will appear here after backend logging is enabled." />}
      </CardContent>
    </Card>
  );
}
