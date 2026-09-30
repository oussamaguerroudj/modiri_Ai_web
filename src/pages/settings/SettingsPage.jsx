import { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Phone,
  MapPin,
  Coins,
  Check,
  User,
  Shield,
  Globe,
  Moon,
  Sun,
} from 'lucide-react';
import { updateMyCompany, SELECTABLE_BUSINESS_TYPES } from '../../api/companies';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Alert from '../../components/ui/Alert.jsx';

const CURRENCIES = ['DZD', 'USD', 'EUR', 'SAR', 'AED', 'MAD', 'TND'];

export default function SettingsPage() {
  const { user, company, refreshCompany } = useAuth();
  const { language, setLanguage, supportedLanguages, t } = useLanguage();
  const { theme, setTheme, isDark } = useTheme();

  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [currency, setCurrency] = useState('DZD');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (company) {
      setName(company.name || '');
      setBusinessType(company.business_type || 'grocery');
      setCurrency(company.currency || 'DZD');
      setPhone(company.phone || '');
      setAddress(company.address || '');
    }
  }, [company]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError(t('businessNameRequired') || 'Business name cannot be empty.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await updateMyCompany({
        name: name.trim(),
        businessType,
        currency,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });
      await refreshCompany();
      setSuccess(t('companySettingsUpdated') || 'Company settings successfully updated.');
    } catch (err) {
      setError(err.message || 'Failed to update company settings');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="text-brand-blue" />
          {t('businessSettingsProfile') || 'Business Settings & Profile'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {t('businessSettingsDesc') || 'Configure your enterprise branding, default currency, and operational business industry.'}
        </p>
      </div>

      {success ? (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm flex items-center gap-2">
          <Check size={18} /> {success}
        </div>
      ) : null}
      <Alert>{error}</Alert>

      {/* User Account Info Panel */}
      <div className="panel p-6 border-line space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <User size={16} className="text-brand-blue" /> {t('ownerAccountDetails') || 'Owner Account Details'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-slate-400">{t('accountName') || 'Account Name'}</p>
            <p className="font-semibold text-white mt-0.5">{user?.name || 'Owner'}</p>
          </div>
          <div>
            <p className="text-slate-400">{t('email') || 'Email Address'}</p>
            <p className="font-semibold text-white mt-0.5">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Language Preferences Panel */}
      <div className="panel p-6 border-line space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Globe size={16} className="text-brand-blue" /> {t('language') || 'Language & Display'}
        </h2>
        <p className="text-xs text-slate-400">
          {t('chooseLanguageDesc') || 'Choose your interface language. Arabic automatically configures Right-to-Left (RTL) mode.'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {supportedLanguages.map((l) => {
            const isSelected = language === l.code;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => setLanguage(l.code)}
                className={`flex items-center justify-between p-3.5 rounded-xl border text-sm transition ${
                  isSelected
                    ? 'border-brand-blue bg-brand-blue/15 text-white font-semibold shadow-glow'
                    : 'border-line bg-ink-900/60 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl leading-none">{l.flag}</span>
                  <span>{l.label}</span>
                </div>
                {isSelected && <Check size={16} className="text-brand-blue" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme Appearance Panel */}
      <div className="panel p-6 border-line space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          {isDark ? <Moon size={16} className="text-brand-blue" /> : <Sun size={16} className="text-amber-400" />}
          {t('theme') || 'Appearance & Display Mode'}
        </h2>
        <p className="text-xs text-slate-400">
          {t('themeDesc') || 'Choose between Night (Dark) Mode and Day (Light) Mode for optimal viewing comfort.'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center justify-between p-4 rounded-xl border text-sm transition ${
              theme === 'dark'
                ? 'border-brand-blue bg-brand-blue/15 text-white font-semibold shadow-glow'
                : 'border-line bg-ink-900/60 text-slate-300 hover:border-slate-500 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-950 border border-line text-slate-200">
                <Moon size={18} className="text-brand-blue" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-white">{t('darkMode') || 'Night Mode'}</p>
                <p className="text-[11px] text-slate-400">{t('deepInkNavyTheme') || 'Deep ink navy theme'}</p>
              </div>
            </div>
            {theme === 'dark' && <Check size={16} className="text-brand-blue" />}
          </button>

          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center justify-between p-4 rounded-xl border text-sm transition ${
              theme === 'light'
                ? 'border-brand-blue bg-brand-blue/15 text-white font-semibold shadow-glow'
                : 'border-line bg-ink-900/60 text-slate-300 hover:border-slate-500 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-800 shadow-sm">
                <Sun size={18} className="text-amber-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-white">{t('lightMode') || 'Day / Light Mode'}</p>
                <p className="text-[11px] text-slate-400">{t('cleanCrispWhiteTheme') || 'Clean crisp white theme'}</p>
              </div>
            </div>
            {theme === 'light' && <Check size={16} className="text-brand-blue" />}
          </button>
        </div>
      </div>

      {/* Company Form Panel */}
      <div className="panel p-6 border-line">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
          <Building2 size={16} className="text-brand-violet" /> {t('businessConfiguration') || 'Business Configuration'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              {t('companyName') || 'Company Name'} *
            </label>
            <div className="relative">
              <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field pl-10 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                {t('businessType') || 'Business Type'} / {t('industry') || 'Industry'}
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="input-field py-2 text-sm cursor-pointer"
              >
                {SELECTABLE_BUSINESS_TYPES.map((b) => (
                  <option key={b.value} value={b.value} className="bg-ink-900 text-white">
                    {t('businessType' + b.value.charAt(0).toUpperCase() + b.value.slice(1)) || t(b.value) || b.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                {t('primaryCurrency') || 'Primary Currency'}
              </label>
              <div className="relative">
                <Coins size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="input-field pl-10 py-2 text-sm cursor-pointer"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c} className="bg-ink-900 text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                {t('phone') || 'Contact Phone'}
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+213 555 00 00 00"
                  className="input-field pl-10 py-2 text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                {t('address') || 'Official Address'}
              </label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t('streetAddressCity')}
                  className="input-field pl-10 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-line flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary py-2.5 px-6 text-sm font-semibold flex items-center gap-2 shadow-lg shadow-brand-blue/20"
            >
              {submitting ? <Spinner size={16} /> : <Check size={16} />}
              {t('saveConfiguration') || t('save') || 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
