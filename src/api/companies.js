import { apiClient } from './client';

// Mirrors backend/src/modules/companies/companies.routes.js

export async function getMyCompany() {
  const { data } = await apiClient.get('/companies/me');
  return data.data;
}

export async function updateMyCompany(payload) {
  // payload keys: name, businessType, currency, phone, address
  const { data } = await apiClient.put('/companies/me', payload);
  return data.data;
}

// 6 Canonical Dashboard Families matching Flutter's kSelectableBusinessTypes
export const SELECTABLE_BUSINESS_TYPES = [
  {
    value: 'grocery',
    label: 'Market / Store',
    description: 'Food, daily items, supermarket, convenience store, fast stock management',
    icon: 'Store',
    tone: 'blue',
  },
  {
    value: 'clothing',
    label: 'Clothing Store',
    description: 'Apparel, footwear, fashion accessories, sizes, colors and brands',
    icon: 'Shirt',
    tone: 'violet',
  },
  {
    value: 'restaurant',
    label: 'Restaurant / Café',
    description: 'Dine-in, fast food, coffee shop, tables, kitchen orders & recipes',
    icon: 'UtensilsCrossed',
    tone: 'amber',
  },
  {
    value: 'clinic',
    label: 'Clinic / Medical',
    description: 'Doctor, dental clinic, health services, patient records & live queue',
    icon: 'Stethoscope',
    tone: 'teal',
  },
  {
    value: 'pharmacy',
    label: 'Pharmacy',
    description: 'Medication, health products, batch tracking & expiry alerts',
    icon: 'Pill',
    tone: 'emerald',
  },
  {
    value: 'company',
    label: 'Enterprise / Company',
    description: 'Projects, client milestones, budgets, employees & billing',
    icon: 'Building2',
    tone: 'indigo',
  },
];

// All 24 DB enum business types supported for backwards compatibility
export const BUSINESS_TYPES = [
  { value: 'restaurant', label: 'Restaurant', icon: 'UtensilsCrossed' },
  { value: 'cafe', label: 'Café', icon: 'Coffee' },
  { value: 'clinic', label: 'Clinic', icon: 'Stethoscope' },
  { value: 'dental_clinic', label: 'Dental clinic', icon: 'Stethoscope' },
  { value: 'pharmacy', label: 'Pharmacy', icon: 'Pill' },
  { value: 'grocery', label: 'Grocery / Store', icon: 'Store' },
  { value: 'supermarket', label: 'Supermarket', icon: 'ShoppingCart' },
  { value: 'clothing', label: 'Clothing store', icon: 'Shirt' },
  { value: 'retail_store', label: 'Retail store', icon: 'Store' },
  { value: 'electronics_store', label: 'Electronics store', icon: 'Monitor' },
  { value: 'bakery', label: 'Bakery', icon: 'Croissant' },
  { value: 'beauty_salon', label: 'Beauty salon', icon: 'Sparkles' },
  { value: 'barbershop', label: 'Barbershop', icon: 'Scissors' },
  { value: 'gym', label: 'Gym', icon: 'Dumbbell' },
  { value: 'hotel', label: 'Hotel', icon: 'Bed' },
  { value: 'medical_laboratory', label: 'Medical laboratory', icon: 'Microscope' },
  { value: 'car_repair', label: 'Car repair', icon: 'Wrench' },
  { value: 'law_office', label: 'Law office', icon: 'Scale' },
  { value: 'accounting_office', label: 'Accounting office', icon: 'Calculator' },
  { value: 'real_estate_agency', label: 'Real estate agency', icon: 'Building2' },
  { value: 'education_center', label: 'Education center', icon: 'GraduationCap' },
  { value: 'workshop', label: 'Workshop', icon: 'Hammer' },
  { value: 'company', label: 'Enterprise / Company', icon: 'Building2' },
  { value: 'other', label: 'Other', icon: 'MoreHorizontal' },
];
