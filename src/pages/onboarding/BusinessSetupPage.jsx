import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Building2, Phone, MapPin, Coins, ArrowRight } from 'lucide-react';
import { updateMyCompany, SELECTABLE_BUSINESS_TYPES } from '../../api/companies';
import { useAuth } from '../../context/AuthContext.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import LanguageSelector from '../../components/ui/LanguageSelector.jsx';
import ThemeToggle from '../../components/ui/ThemeToggle.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

const CURRENCIES = [
  { code: 'DZD', label: 'DZD - Algerian Dinar' },
  { code: 'USD', label: 'USD - US Dollar' },
  { code: 'EUR', label: 'EUR - Euro' },
  { code: 'SAR', label: 'SAR - Saudi Riyal' },
  { code: 'AED', label: 'AED - UAE Dirham' },
  { code: 'MAD', label: 'MAD - Moroccan Dirham' },
  { code: 'TND', label: 'TND - Tunisian Dinar' },
];

export default function BusinessSetupPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshCompany } = useAuth();

  const businessType = location.state?.businessType || 'company';
  const typeObj = SELECTABLE_BUSINESS_TYPES.find((t) => t.value === businessType);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('DZD');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Business name is required.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await updateMyCompany({
        name: name.trim(),
        businessType,
        currency,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });
      await refreshCompany();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not save company profile.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-ink-950 px-4 py-12 flex flex-col justify-center items-center">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSelector />
      </div>
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/logo.png" alt="Modiri AI" className="h-12 w-12 rounded-2xl object-contain drop-shadow mb-4" />
          <h1 className="text-2xl font-bold text-white tracking-tight">{t('businessSetupTitle', 'Complete your business profile')}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {t('businessTypeLabel', 'Selected type')}: <span className="font-semibold text-brand-blue">{typeObj?.label || businessType}</span>
          </p>
        </div>

        <div className="panel shadow-panel p-8">
          <Alert>{error}</Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {t('businessName', 'Business Name')} *
              </label>
              <div className="relative">
                <Building2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('businessNameHint', 'e.g. Café Bounab, Pharmacie Centrale')}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {t('currency', 'Currency')}
              </label>
              <div className="relative">
                <Coins size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="input-field pl-10 cursor-pointer"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-ink-900 text-white">
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {t('phoneNumber', 'Phone Number')}
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+213 555 12 34 56"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {t('address', 'Address')}
              </label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t('addressHint', 'e.g. 12 Rue Didouche Mourad, Alger')}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-4 text-sm font-semibold flex items-center justify-center gap-2"
            >
              {loading ? <Spinner size={18} /> : null}
              <span>{t('finishSetup', 'Finish Setup & Launch')}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
