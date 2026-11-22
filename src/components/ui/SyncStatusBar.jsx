import { useState } from 'react';
import { CloudOff, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useSyncStatus } from '../../sync/hooks.js';
import { engine } from '../../sync/engine.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

const TXT = {
  en: { offline: 'Offline — changes are saved on this device', pending: '{n} change(s) waiting to sync', syncing: 'Syncing…', synced: 'All changes synced', failed: '{n} change(s) could not be synced', retry: 'Retry', discard: 'Discard', now: 'Sync now' },
  fr: { offline: 'Hors ligne — modifications enregistrées sur cet appareil', pending: '{n} modification(s) en attente de synchronisation', syncing: 'Synchronisation…', synced: 'Tout est synchronisé', failed: '{n} modification(s) non synchronisée(s)', retry: 'Réessayer', discard: 'Annuler', now: 'Synchroniser' },
  ar: { offline: 'بدون اتصال — التعديلات محفوظة على هذا الجهاز', pending: '{n} تعديل بانتظار المزامنة', syncing: 'جارٍ المزامنة…', synced: 'تمت مزامنة كل شيء', failed: 'تعذّرت مزامنة {n} تعديل', retry: 'إعادة المحاولة', discard: 'تجاهل', now: 'مزامنة الآن' },
};

export default function SyncStatusBar() {
  const { language } = useLanguage();
  const s = useSyncStatus();
  const [open, setOpen] = useState(false);
  const L = TXT[language] || TXT.en;
  const n = (k, c) => L[k].replace('{n}', c);

  let tone = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
  let Icon = CheckCircle2;
  let label = L.synced;
  if (s.failed.length) { tone = 'bg-red-500/10 text-red-300 border-red-500/30'; Icon = AlertTriangle; label = n('failed', s.failed.length); }
  else if (!s.online) { tone = 'bg-amber-500/10 text-amber-300 border-amber-500/30'; Icon = CloudOff; label = s.pending ? `${L.offline} · ${n('pending', s.pending)}` : L.offline; }
  else if (s.syncing) { tone = 'bg-sky-500/10 text-sky-300 border-sky-500/30'; Icon = RefreshCw; label = L.syncing; }
  else if (s.pending) { tone = 'bg-sky-500/10 text-sky-300 border-sky-500/30'; Icon = RefreshCw; label = n('pending', s.pending); }

  // Stay out of the way when everything is fine and we are online.
  if (s.online && !s.syncing && !s.pending && !s.failed.length) return null;

  return (
    <div className={`border-b px-4 py-2 text-sm ${tone}`}>
      <div className="flex flex-wrap items-center gap-3">
        <Icon size={16} className={s.syncing ? 'animate-spin' : ''} />
        <span className="flex-1">{label}</span>
        {s.online && !s.syncing && (s.pending > 0) && (
          <button type="button" onClick={() => engine.syncNow()} className="underline">{L.now}</button>
        )}
        {s.failed.length > 0 && (
          <button type="button" onClick={() => setOpen((v) => !v)} className="underline">{open ? '−' : '+'}</button>
        )}
      </div>
      {open && (
        <ul className="mt-2 space-y-1">
          {s.failed.map((op) => (
            <li key={op.id} className="flex flex-wrap items-center gap-2 text-xs">
              <code className="opacity-80">{op.method.toUpperCase()} {op.url}</code>
              <span className="flex-1 opacity-80">{op.error}</span>
              <button type="button" onClick={() => engine.retry(op.id)} className="underline">{L.retry}</button>
              <button type="button" onClick={() => engine.discard(op.id)} className="underline">{L.discard}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
