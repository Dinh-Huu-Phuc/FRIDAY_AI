export default function SimpleLineChart({ data = [] }) {
  if (!data.length) return <div className="text-sm text-slate-500">No chart data</div>;
  const max = Math.max(...data.map((item) => Number(item.value || 0)), 1);
  const points = data.map((item, index) => {
    const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
    const y = 100 - (Number(item.value || 0) / max) * 86 - 7;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 100 100" className="h-36 w-full overflow-visible">
      <polyline fill="none" stroke="#22d3ee" strokeWidth="2" points={points} />
      {data.map((item, index) => {
        const [x, y] = points.split(" ")[index].split(",");
        return <circle key={item.label} cx={x} cy={y} r="2.2" fill="#a855f7" />;
      })}
    </svg>
  );
}
