import { useState, useEffect } from 'react';
import {
  LineChart,
  RefreshCw,
  AlertTriangle,
  Info,
  AlertCircle,
  Sparkles,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { getAiInsights } from '../../api/ai.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Alert from '../../components/ui/Alert.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

export default function AiInsightsPage() {
  const { company } = useAuth();
  const { t } = useLanguage();
  const [insights, setInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadInsights() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAiInsights();
      setInsights(data?.insights || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to load AI insights. Ensure your backend AI service is online.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadInsights();
  }, []);

  function getSeverityConfig(severity) {
    switch (severity) {
      case 'alert':
        return {
          icon: AlertCircle,
          borderColor: 'border-red-500/40',
          bgColor: 'bg-red-500/10',
          textColor: 'text-red-400',
          badgeClass: 'bg-red-500/20 text-red-300 border-red-500/30',
          label: 'Critical Alert',
        };
      case 'watch':
        return {
          icon: AlertTriangle,
          borderColor: 'border-amber-500/40',
          bgColor: 'bg-amber-500/10',
          textColor: 'text-amber-400',
          badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          label: 'Watch Item',
        };
      default:
        return {
          icon: Info,
          borderColor: 'border-brand-blue/40',
          bgColor: 'bg-brand-blue/10',
          textColor: 'text-brand-blue',
          badgeClass: 'bg-brand-blue/20 text-blue-300 border-brand-blue/30',
          label: 'Insight',
        };
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-ink-900/80 p-5 shadow-panel backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
            <LineChart size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              {t('aiBiTitle', 'AI Business Intelligence')}
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <ShieldCheck size={12} />
                {t('aiLiveDataGrounded', 'Strictly Grounded')}
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              {t('aiBiSubtitle', 'Automated synthesis of profit, debtor risks, and inventory runouts')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadInsights}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl border border-line bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition disabled:opacity-50"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          {isLoading ? t('aiAnalyzing', 'Analyzing...') : t('aiRefreshInsights', 'Refresh Insights')}
        </button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Explanatory Banner */}
      <div className="rounded-xl border border-brand-violet/20 bg-brand-violet/5 p-4 text-xs text-slate-300 flex items-start gap-3">
        <Sparkles size={18} className="text-brand-violet shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">{t('intelligenceLabel')} </span>
          The backend runs exact mathematical queries across your transactions (profit, top 3 items, low stock alerts, unpaid customer debt).
          The AI model then interprets these deterministic figures and summarizes them into prioritized actionable items without hallucinating numbers.
        </div>
      </div>

      {/* Insights List */}
      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Spinner size="lg" text={t('aiThinking', 'Computing metrics and generating business insights...')} />
        </div>
      ) : insights.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title={t('aiNoInsights', 'No insights generated yet')}
          description={t('aiNoInsightsDesc', 'Record more sales, expenses, and inventory items so Modiri AI can detect meaningful business patterns.')}
          actionLabel={t('aiRefreshInsights', 'Refresh Insights')}
          onAction={loadInsights}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.map((item, idx) => {
            const config = getSeverityConfig(item.severity);
            const Icon = config.icon;
            return (
              <div
                key={idx}
                className={`rounded-2xl border ${config.borderColor} bg-ink-900/90 p-5 shadow-panel backdrop-blur transition hover:border-slate-500/50 flex flex-col justify-between`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${config.badgeClass}`}
                    >
                      <Icon size={12} />
                      {config.label}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-300">{item.detail}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs text-slate-500">
                  <span>{t('computedFromLedger')}</span>
                  <span className="text-slate-400 capitalize">{item.severity} {t('priority')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
