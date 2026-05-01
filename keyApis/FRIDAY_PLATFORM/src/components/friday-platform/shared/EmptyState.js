export default function EmptyState({ title = "No data", description = "Nothing to display yet." }) {
  return <div className="rounded-lg border border-dashed border-white/15 p-8 text-center text-sm text-slate-400"><div className="text-white">{title}</div><p className="mt-1">{description}</p></div>;
}
