import { BUSINESS_TYPES } from '../api/companies';

export function businessTypeLabel(value, t) {
  if (t) {
    if (value === 'restaurant') return t('businessTypeRestaurant') || 'Restaurant';
    if (value === 'clinic') return t('businessTypeClinic') || 'Clinic';
    if (value === 'pharmacy') return t('businessTypePharmacy') || 'Pharmacy';
    if (value === 'grocery') return t('businessTypeGrocery') || 'Market / Store';
    if (value === 'clothing') return t('businessTypeClothing') || 'Clothing Store';
    if (value === 'services' || value === 'company') return t('businessTypeCompany') || 'Enterprise';
  }
  const match = BUSINESS_TYPES.find((t) => t.value === value);
  return match ? match.label : 'Business';
}
