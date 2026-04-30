export default function SimpleBarChart({ data = [] }) {
  if (!data.length) return <div className="text-sm text-slate-500">No chart data</div>;
  const max = Math.max(...data.map((item) => Number(item.value || 0)), 1);
  return (
    <div className="flex h-36 items-end gap-2">
      {data.map((item) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="w-full rounded-t bg-gradient-to-t from-blue-500 to-cyan-300" style={{ height: `${(Number(item.value || 0) / max) * 100}%` }} />
          <span className="text-[11px] text-slate-500">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
