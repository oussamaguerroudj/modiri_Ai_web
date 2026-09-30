import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function ThemeToggle({ showLabel = false, className = '' }) {
  const { toggleTheme, isDark } = useTheme();
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative flex items-center justify-center gap-1.5 rounded-xl border border-line bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white ${className}`}
      title={isDark ? (t('lightMode') || 'Switch to Light Mode') : (t('darkMode') || 'Switch to Dark Mode')}
      aria-label={t('toggleTheme')}
    >
      {isDark ? (
        <Sun size={17} className="text-amber-400 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon size={17} className="text-brand-blue transition-transform duration-300 hover:-rotate-12" />
      )}
      {showLabel ? (
        <span className="text-xs font-semibold">
          {isDark ? (t('lightMode') || 'Light Mode') : (t('darkMode') || 'Dark Mode')}
        </span>
      ) : null}
    </button>
  );
}
