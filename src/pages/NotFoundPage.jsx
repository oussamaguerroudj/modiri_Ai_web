import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function NotFoundPage() {
  const { t } = useLanguage();
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-ink-950 text-center">
      <p className="text-5xl font-bold text-white">404</p>
      <p className="text-slate-400">{t('notFoundPage')}</p>
      <Link to="/" className="btn-primary mt-2 px-6">
        {t('backToDashboard')}
      </Link>
    </div>
  );
}
