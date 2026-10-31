export const COMPANY_CONFIG = {
  name: 'Brightloop Software Technologies Pvt. Ltd.',
  legalName: 'Brightloop Software Technologies Private Limited',
  tagline: 'Enterprise Subscription & Recurring Billing Engine',
  address: {
    line1: 'EcoSpace Business Park, Campus 2B',
    line2: 'Outer Ring Road, Bellandur',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560103',
    country: 'India',
  },
  contact: {
    email: 'billing@brightloop.io',
    supportEmail: 'support@brightloop.io',
    phone: '+91 (080) 4123-8900',
    website: 'https://brightloop.io',
  },
  tax: {
    gstin: '29AABCU9603R1ZJ',
    pan: 'AABCU9603R',
  },
  bankDetails: {
    bankName: 'HDFC Bank Ltd.',
    accountNumber: '50200084729103',
    ifsc: 'HDFC0000240',
    branch: 'Koramangala, Bengaluru',
  },
} as const;
