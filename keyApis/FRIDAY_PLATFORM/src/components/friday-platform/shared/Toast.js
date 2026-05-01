export default function Toast({ toast }) {
  if (!toast) return null;
  return <div className="fixed bottom-5 right-5 z-50 rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white shadow-xl">{toast.message}</div>;
}
