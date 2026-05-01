"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import SimpleBarChart from "@/components/friday-platform/shared/SimpleBarChart";
import SimpleLineChart from "@/components/friday-platform/shared/SimpleLineChart";
import StatCard from "@/components/friday-platform/shared/StatCard";
import EmptyState from "@/components/friday-platform/shared/EmptyState";
import { useUsage } from "@/hooks/useUsage";
import { percentUsed } from "@/utils/quotaUtils";
import { compactNumber } from "@/utils/numberUtils";

export default function UsageQuotaPanel() {
  const { usage, loading, error } = useUsage();
  if (loading) return <div className="text-sm text-slate-400">Loading usage...</div>;
  if (error || !usage) return <EmptyState title="Usage data unavailable" description="Backend usage analytics are not available yet for this account." />;
  const percent = percentUsed(usage.usedToday, usage.dailyLimit);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3"><StatCard label="Daily Token Limit" value={compactNumber(usage.dailyLimit)} /><StatCard label="Used Tokens Today" value={compactNumber(usage.usedToday)} /><StatCard label="Remaining Tokens" value={compactNumber((usage.dailyLimit || 0) - (usage.usedToday || 0))} /><StatCard label="Requests Today" value={compactNumber(usage.requestsToday)} /><StatCard label="Rate Limit" value={`${usage.rateLimitPerMinute || 20}/min`} /><StatCard label="Max Output Tokens" value={compactNumber(usage.maxOutputTokens || 1024)} /></div>
      <Card><CardHeader><CardTitle>Quota Consumption</CardTitle></CardHeader><CardContent><Progress value={percent} /><div className="mt-2 text-sm text-slate-400">{percent}% used, resets at {usage.resetTime || "backend policy window"}.</div></CardContent></Card>
      <div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle>7-Day Token Usage</CardTitle></CardHeader><CardContent><SimpleBarChart data={usage.tokens7d} /></CardContent></Card><Card><CardHeader><CardTitle>7-Day Requests</CardTitle></CardHeader><CardContent><SimpleLineChart data={usage.requests7d} /></CardContent></Card></div>
      <Card><CardHeader><CardTitle>Top Keys by Token Usage</CardTitle></CardHeader><CardContent className="space-y-2">{usage.topKeys?.map((item) => <div key={item.name} className="flex justify-between rounded border border-white/10 p-3 text-sm"><span>{item.name}</span><span>{compactNumber(item.tokens)} tokens</span></div>)}</CardContent></Card>
    </div>
  );
}
