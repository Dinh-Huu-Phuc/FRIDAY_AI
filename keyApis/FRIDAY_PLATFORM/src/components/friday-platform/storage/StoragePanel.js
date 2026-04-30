"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SimpleBarChart from "@/components/friday-platform/shared/SimpleBarChart";
import SimpleLineChart from "@/components/friday-platform/shared/SimpleLineChart";
import StatCard from "@/components/friday-platform/shared/StatCard";
import EmptyState from "@/components/friday-platform/shared/EmptyState";
import { useStorage } from "@/hooks/useStorage";
import { compactNumber } from "@/utils/numberUtils";
import { formatBytes } from "@/utils/storageUtils";

export default function StoragePanel() {
  const { storage, loading, error } = useStorage();
  if (loading) return <div className="text-sm text-slate-400">Loading storage...</div>;
  if (error || !storage) return <EmptyState title="Storage & Memory data unavailable" description="Backend storage analytics are not available yet for this account." />;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4"><StatCard label="Total Storage Used" value={formatBytes(storage.totalStorageUsed)} /><StatCard label="Session Memory" value={formatBytes(storage.sessionMemorySize)} /><StatCard label="User Memory" value={formatBytes(storage.userMemorySize)} /><StatCard label="Embedding Estimate" value={formatBytes(storage.embeddingStorageEstimate)} /><StatCard label="Cached Prompts" value={formatBytes(storage.cachedPromptStorage)} /><StatCard label="Accumulated Tokens" value={compactNumber(storage.tokenUsageAccumulated)} /><StatCard label="Avg Tokens / Request" value={compactNumber(storage.averageTokensPerRequest)} /></div>
      <div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle>Storage Growth</CardTitle></CardHeader><CardContent><SimpleBarChart data={storage.growth} /></CardContent></Card><Card><CardHeader><CardTitle>Token Usage Trend</CardTitle></CardHeader><CardContent><SimpleLineChart data={storage.growth} /></CardContent></Card></div>
      <Card><CardHeader><CardTitle>Key Consumption</CardTitle></CardHeader><CardContent className="space-y-2">{storage.consumption?.length ? storage.consumption.map((item) => <div key={`${item.date || ""}-${item.key}`} className="grid gap-2 rounded border border-white/10 p-3 text-sm md:grid-cols-7"><span>{item.date || "No date"}</span><span>{item.key}</span><span>{item.requests || 0} req</span><span>{compactNumber(item.inputTokens || 0)} in</span><span>{compactNumber(item.outputTokens || 0)} out</span><span>{compactNumber(item.tokens)} total</span><span>{item.storage}</span></div>) : <EmptyState title="No key consumption rows" description="No storage consumption data has been recorded yet." />}</CardContent></Card>
    </div>
  );
}
