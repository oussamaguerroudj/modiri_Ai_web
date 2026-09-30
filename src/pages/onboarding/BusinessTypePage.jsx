import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { SELECTABLE_BUSINESS_TYPES } from '../../api/companies';
import Alert from '../../components/ui/Alert.jsx';
import LanguageSelector from '../../components/ui/LanguageSelector.jsx';
import ThemeToggle from '../../components/ui/ThemeToggle.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

function iconFor(name) {
  const IconComponent = Icons[name];
  return IconComponent || Icons.Building2;
}

export default function BusinessTypePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  function handleContinue() {
    if (!selected) {
      setError('Please select a business type to continue.');
      return;
    }
    navigate('/onboarding/business-setup', { state: { businessType: selected } });
  }

  const getLocalizedType = (type) => {
    switch (type.value) {
      case 'clothing':
        return { label: t('businessTypeClothing', type.label), description: t('businessTypeClothingDesc', type.description) };
      case 'grocery':
        return { label: t('businessTypeGrocery', type.label), description: t('businessTypeGroceryDesc', type.description) };
      case 'pharmacy':
        return { label: t('businessTypePharmacy', type.label), description: t('businessTypePharmacyDesc', type.description) };
      case 'clinic':
        return { label: t('businessTypeClinic', type.label), description: t('businessTypeClinicDesc', type.description) };
      case 'restaurant':
        return { label: t('businessTypeRestaurant', type.label), description: t('businessTypeRestaurantDesc', type.description) };
      case 'company':
        return { label: t('businessTypeCompany', type.label), description: t('businessTypeCompanyDesc', type.description) };
      case 'workshop':
        return { label: t('businessTypeWorkshop', type.label), description: t('businessTypeWorkshopDesc', type.description) };
      default:
        return { label: type.label, description: type.description };
    }
  };

  return (
    <div className="relative min-h-screen bg-ink-950 px-4 py-12 flex flex-col justify-center items-center">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSelector />
      </div>
      <div className="w-full max-w-3xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/logo.png" alt="Modiri AI" className="h-12 w-12 rounded-2xl object-contain drop-shadow mb-4" />
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{t('selectBusinessType', 'Select your business type')}</h1>
          <p className="mt-2 text-sm text-slate-400 max-w-md">
            {t('chooseBusinessTypeHint', 'Modiri AI tailors your dashboard, workflows, and AI assistant to your exact industry.')}
          </p>
        </div>

        <Alert>{error}</Alert>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          {SELECTABLE_BUSINESS_TYPES.map((type) => {
            const { value, icon, tone } = type;
            const localized = getLocalizedType(type);
            const Icon = iconFor(icon);
            const isSelected = selected === value;

            const toneBorder =
              tone === 'amber'
                ? 'border-amber-500/80 bg-amber-500/10'
                : tone === 'teal'
                ? 'border-teal-500/80 bg-teal-500/10'
                : tone === 'violet'
                ? 'border-violet-500/80 bg-violet-500/10'
                : tone === 'emerald'
                ? 'border-emerald-500/80 bg-emerald-500/10'
                : tone === 'indigo'
                ? 'border-indigo-500/80 bg-indigo-500/10'
                : 'border-brand-blue/80 bg-brand-blue/10';

            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setSelected(value);
                  setError('');
                }}
                className={`relative flex flex-col items-start p-5 rounded-2xl border text-left transition duration-200 group ${
                  isSelected
                    ? `${toneBorder} shadow-glow`
                    : 'border-line bg-ink-900/60 hover:border-slate-600 hover:bg-ink-800/80'
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl mb-4 transition ${
                    isSelected ? 'bg-brand-gradient text-white shadow-md' : 'bg-white/5 text-slate-300 group-hover:text-white'
                  }`}
                >
                  <Icon size={24} />
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">{localized.label}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{localized.description}</p>
                {isSelected ? (
                  <span className="absolute top-4 right-4 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-blue opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-blue" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex justify-center mt-10">
          <button
            type="button"
            onClick={handleContinue}
            className="btn-primary w-full max-w-sm py-3 text-base font-semibold shadow-lg shadow-brand-blue/20"
          >
            {t('continueLabel', 'Continue to Business Details')}
          </button>
        </div>
      </div>
    </div>
  );
}
