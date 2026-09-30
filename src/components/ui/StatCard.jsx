import { ChevronRight } from 'lucide-react';

const TONE_STYLES = {
  blue: { bg: 'from-brand-blue/25 to-brand-blue/5', icon: 'bg-brand-blue/25 text-blue-200' },
  violet: { bg: 'from-brand-violet/25 to-brand-violet/5', icon: 'bg-brand-violet/25 text-violet-200' },
  teal: { bg: 'from-brand-teal/25 to-brand-teal/5', icon: 'bg-brand-teal/25 text-teal-200' },
  amber: { bg: 'from-brand-amber/25 to-brand-amber/5', icon: 'bg-brand-amber/25 text-amber-200' },
  neutral: { bg: 'from-white/[0.06] to-transparent', icon: 'bg-white/10 text-slate-200' },
};

export default function StatCard({ icon: Icon, label, value, sublabel, tone = 'neutral', highlight = false, onClick }) {
  const styles = TONE_STYLES[tone] || TONE_STYLES.neutral;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 text-left transition
        ${highlight ? 'border-brand-amber/50' : 'border-line'}
        bg-gradient-to-br ${styles.bg} bg-ink-800/60 hover:border-white/20`}
    >
      <div className="flex items-center justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles.icon}`}>
          <Icon size={20} />
        </span>
        <ChevronRight size={18} className="text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-slate-300" />
      </div>
      <div className="mt-4">
        <p className="text-sm text-slate-300">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-white">{value}</p>
        {sublabel ? <p className="mt-0.5 text-xs text-slate-400">{sublabel}</p> : null}
      </div>
    </button>
  );
}
