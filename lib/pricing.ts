import type { PricingPlan } from '@/types'

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free Check',
    price: '₱0',
    features: [
      'Basic automated risk result',
      'Small, low-risk checks only',
      'Traffic-light verdict',
    ],
  },
  {
    id: 'trust_credits',
    name: 'Trust Credits',
    price: '₱99',
    priceNote: '5 checks',
    features: [
      'Repeated checks',
      'Saved result history',
      'Share result link',
    ],
    highlighted: true,
  },
  {
    id: 'full_check',
    name: 'Full Check',
    price: '₱49',
    priceNote: 'per check',
    features: [
      'Deep category checklist',
      'Risky payment analysis',
      'Alert preview (SMS/Chat/Push)',
      'Save case record',
    ],
  },
  {
    id: 'case_pack',
    name: 'Case Pack',
    price: '₱299',
    priceNote: 'per case',
    features: [
      'Already paid scenario',
      'Evidence collection guide',
      'Report export (PDF)',
      'Escalation guide per agency',
      'FraudGuard AI agent access',
    ],
  },
  {
    id: 'seller_pass',
    name: 'Seller Pass',
    price: '₱199',
    priceNote: '/month',
    features: [
      'Verified shop profile',
      'LegitCheck trust badge',
      'Record correction requests',
      'Dispute resolution support',
    ],
  },
  {
    id: 'business_check',
    name: 'Business Check',
    price: '₱499',
    priceNote: 'per check',
    features: [
      'Company / vendor verification',
      'Business registration check',
      'Bank account verification',
      'Full due diligence report',
    ],
  },
  {
    id: 'property_check',
    name: 'Property Check',
    price: '₱999',
    priceNote: 'per check',
    features: [
      'Land / property pre-check',
      'Title verification guide',
      'Authority to sell checklist',
      'Legal due diligence steps',
    ],
  },
]
