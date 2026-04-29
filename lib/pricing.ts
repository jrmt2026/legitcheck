import type { PricingPlan } from '@/types'

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '₱0',
    features: [
      '1 anonymous check (no sign-up)',
      '3 basic checks/month when registered',
      'Risk level + 1 red flag preview',
    ],
  },
  {
    id: 'single',
    name: '1 Premium Check',
    price: '₱79',
    priceNote: 'per check',
    features: [
      'Full AI analysis',
      'All red flags & score breakdown',
      'Evidence checklist',
      'Official verification resources',
    ],
  },
  {
    id: 'pack5',
    name: '5 Premium Checks',
    price: '₱99',
    priceNote: '₱20/check',
    features: [
      'Everything in 1 check × 5',
      'Best value for regular use',
      'Credits never expire',
    ],
    highlighted: true,
  },
  {
    id: 'pack15',
    name: '15 Premium Checks',
    price: '₱199',
    priceNote: '₱13/check',
    features: [
      'Everything in 5 pack × 15',
      'Great for families & small sellers',
      'Share with household',
    ],
  },
  {
    id: 'pack50',
    name: '50 Premium Checks',
    price: '₱499',
    priceNote: '₱10/check',
    features: [
      'Power user pack',
      'Best per-check rate',
      'Credits never expire',
    ],
  },
]
