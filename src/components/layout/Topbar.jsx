import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu, Sparkles, Settings, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { businessTypeLabel } from '../../utils/businessTypes.js';
import { getNotifications } from '../../api/notifications.js';
import LanguageSelector from '../ui/LanguageSelector.jsx';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function Topbar({ onToggleMobileMenu }) {
  const { user, company, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getNotifications()
      .then((data) => {
        if (!cancelled) {
          const unread = Array.isArray(data) ? data.filter((n) => !n.is_read).length : 0;
          setUnreadCount(unread);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const initials = (user?.name || '?')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="flex items-center justify-between border-b border-line bg-ink-900/70 px-4 py-3 sm:px-6 backdrop-blur z-20">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white/5 text-slate-300 lg:hidden hover:bg-white/10"
          aria-label={t('toggleMobileMenu')}
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2.5 text-sm text-slate-200">
          <Building2 size={16} className="text-brand-blue shrink-0" />
          <span className="font-semibold text-white truncate max-w-[120px] sm:max-w-[200px]">
            {company?.name || 'Your business'}
          </span>
          <span className="text-slate-500 hidden sm:inline">·</span>
          <span className="text-xs text-slate-400 hidden sm:inline px-2 py-0.5 rounded-full bg-white/5 border border-line">
            {businessTypeLabel(company?.business_type, t)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Night / Light Mode Toggle */}
        <ThemeToggle />

        {/* Language Selector */}
        <LanguageSelector />

        {/* AI Assistant Quick Launcher */}
        <button
          type="button"
          onClick={() => navigate('/ai/assistant')}
          className="flex items-center gap-1.5 rounded-xl border border-brand-violet/40 bg-brand-violet/10 px-3 py-1.5 text-xs font-semibold text-brand-violet hover:bg-brand-violet/20 transition"
        >
          <Sparkles size={14} className="text-brand-violet" />
          <span className="hidden md:inline">{t('moreAiAssistant') || 'AI Assistant'}</span>
        </button>

        {/* Notifications */}
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white/5 text-slate-300 hover:bg-white/10 transition"
          aria-label={t('notifications')}
        >
          <Bell size={16} />
          {unreadCount > 0 ? (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
          ) : null}
        </button>

        {/* User Account Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-line bg-white/5 py-1 pl-1 pr-2.5 text-sm text-slate-200 hover:bg-white/10 transition"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-gradient text-xs font-bold text-white">
              {initials}
            </span>
            <span className="font-medium hidden sm:inline">{user?.name?.split(' ')[0] || 'Account'}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {menuOpen ? (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-ink-900 py-1 shadow-panel animate-in fade-in">
                <div className="border-b border-line px-3 py-2 text-xs text-slate-400 truncate">
                  {user?.email}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5"
                >
                  <Settings size={15} />
                  {t('settings') || 'Settings'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10"
                >
                  <LogOut size={15} />
                  {t('logout') || 'Log out'}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
