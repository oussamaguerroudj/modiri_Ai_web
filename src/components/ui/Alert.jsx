import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function Alert({ tone = 'error', children }) {
  if (!children) return null;
  const isError = tone === 'error';
  return (
    <div
      className={`mb-4 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${
        isError
          ? 'border-red-500/30 bg-red-500/10 text-red-300'
          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      }`}
    >
      {isError ? <AlertTriangle size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
      <span>{children}</span>
    </div>
  );
}
