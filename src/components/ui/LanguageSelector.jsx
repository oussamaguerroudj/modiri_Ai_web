import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function LanguageSelector({ compact = false }) {
  const { language, setLanguage, supportedLanguages, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = supportedLanguages.find((l) => l.code === language) || supportedLanguages[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-xl border border-line bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10 transition"
        aria-label={t('selectLanguage')}
        aria-expanded={open}
        aria-haspopup="listbox"
        onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false); }}
      >
        <Globe size={14} className="text-brand-blue shrink-0" />
        <span className="text-base leading-none">{currentLang.flag}</span>
        {!compact && (
          <span className="font-semibold text-white uppercase text-[11px] tracking-wide">
            {currentLang.code}
          </span>
        )}
        <ChevronDown size={13} className="text-slate-400" />
      </button>

      {open && (
        <div role="listbox" aria-label={t('selectLanguage')} className="absolute right-0 z-50 mt-1.5 w-40 overflow-hidden rounded-xl border border-line bg-ink-900 py-1 shadow-panel animate-in fade-in ltr:right-0 rtl:left-0 rtl:right-auto">
          {supportedLanguages.map((l) => {
            const isSelected = l.code === language;
            return (
              <button
                key={l.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setLanguage(l.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-xs transition ${
                  isSelected
                    ? 'bg-brand-blue/15 text-brand-blue font-semibold'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{l.flag}</span>
                  <span>{l.label}</span>
                </div>
                {isSelected && <Check size={14} className="text-brand-blue" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
