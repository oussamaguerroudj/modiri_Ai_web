import { useLanguage } from '../../context/LanguageContext.jsx';

export default function Spinner({ size = 24 }) {
  const { t } = useLanguage();
  return (
    <div
      className="animate-spin rounded-full border-2 border-white/15 border-t-brand-blue"
      style={{ width: size, height: size }}
      role="status"
      aria-label={t('loading')}
    />
  );
}
