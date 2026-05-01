export function percentUsed(used, limit) {
  if (!limit) return 0;
  return Math.min(100, Math.round((Number(used || 0) / Number(limit)) * 100));
}
