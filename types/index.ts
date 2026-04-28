// ─── Report Channel ────────────────────────────────────────────────────────────

export interface ReportChannel { name: string; url?: string; contact?: string }

// ─── Risk Engine ───────────────────────────────────────────────────────────────

export type RiskColor = 'green' | 'yellow' | 'red'
export type SignalSeverity = 'positive' | 'low' | 'medium' | 'high' | 'hard_red'

export type CategoryId =
  | 'online_purchase'
  | 'investment'
  | 'donation'
  | 'vendor'
  | 'property'
  | 'job_agency'
  | 'buyer_check'
  | 'website_check'
  | 'sms_text'
  | 'profile_check'
  | 'loan_scam'
  | 'romance_scam'

export interface Signal {
  id: string
  en: string
  tl: string
  riskPoints: number
  severity: SignalSeverity
}

export interface DecisionResult {
  score: number
  color: RiskColor
  headline: { en: string; tl: string }
  subheadline: { en: string; tl: string }
  action: { en: string; tl: string }
  reasons: Signal[]
  aiInsights?: string[]
  notification: {
    sms: { en: string; tl: string }
    chat: { en: string; tl: string }
    push: { en: string; tl: string }
  }
  reportChannels: ReportChannel[]
  evidenceItems: { en: string; tl: string }[]
  recommendedPlan: PricingPlanId
  categoryId: CategoryId
  isHardRed: boolean
}

// ─── Pricing ───────────────────────────────────────────────────────────────────

export type PricingPlanId =
  | 'free'
  | 'trust_credits'
  | 'full_check'
  | 'case_pack'
  | 'seller_pass'
  | 'business_check'
  | 'property_check'

export interface PricingPlan {
  id: PricingPlanId
  name: string
  price: string
  priceNote?: string
  features: string[]
  highlighted?: boolean
}

// ─── Database ──────────────────────────────────────────────────────────────────

export interface CheckRecord {
  id: string
  user_id: string
  category_id: CategoryId
  input_text: string
  score: number
  color: RiskColor
  result: DecisionResult
  created_at: string
  updated_at: string
  is_flagged: boolean
  notes?: string
}

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  plan: PricingPlanId
  credits_remaining: number
  created_at: string
}

// ─── Agents ────────────────────────────────────────────────────────────────────

export type AgentRole = 'bantay'

export interface AgentMessage {
  role: 'user' | 'assistant'
  content: string
  agentRole?: AgentRole
  timestamp: string
}

export interface AgentSession {
  id: string
  agentRole: AgentRole
  checkId?: string
  messages: AgentMessage[]
  createdAt: string
}

// ─── Scam Reports ──────────────────────────────────────────────────────────────

export type IdentifierType = 'phone' | 'gcash' | 'maya' | 'bank' | 'url' | 'email' | 'facebook' | 'shopee' | 'other'
export type Platform = 'gcash' | 'maya' | 'bpi' | 'bdo' | 'metrobank' | 'unionbank' | 'facebook' | 'shopee' | 'lazada' | 'other'
export type BadgeLevel = 'pending' | 'id_verified' | 'business_verified' | 'fully_verified' | 'rejected'

export interface ScamReport {
  id: string
  identifier: string
  identifier_type: IdentifierType
  account_name?: string
  platform?: Platform
  category: CategoryId
  description?: string
  amount_lost?: number
  is_verified: boolean
  created_at: string
}

export interface ScamReportSummary {
  identifier: string
  report_count: number
  categories: CategoryId[]
  platforms: string[]
  last_reported: string
  is_verified: boolean
}

// ─── Seller Verification ───────────────────────────────────────────────────────

export interface SellerVerification {
  id: string
  user_id: string
  seller_name: string
  shop_name?: string
  platforms: string[]
  platform_handles: string[]
  contact_number?: string
  dti_number?: string
  sec_number?: string
  description?: string
  badge_level: BadgeLevel
  rejection_reason?: string
  public_slug: string
  created_at: string
  updated_at: string
}

// ─── UI ────────────────────────────────────────────────────────────────────────

export type Lang = 'en' | 'tl'

export interface NavItem {
  label: string
  href: string
  icon?: string
}
