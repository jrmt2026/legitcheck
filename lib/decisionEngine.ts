import type { CategoryId, DecisionResult, RiskColor, Signal, PricingPlanId } from '@/types'

// ─── Signal Definitions ────────────────────────────────────────────────────────

export const SIGNALS: Record<string, Signal> = {
  // Online Purchase
  official_checkout:    { id: 'official_checkout',    en: 'Official checkout used',             tl: 'Ginamit ang official checkout',           riskPoints: -30, severity: 'positive' },
  low_value:            { id: 'low_value',             en: 'Low-value purchase',                 tl: 'Maliit na halaga',                        riskPoints: -10, severity: 'positive' },
  verified_page:        { id: 'verified_page',         en: 'Verified business page',             tl: 'Verified na business page',               riskPoints: -20, severity: 'positive' },
  specific_specs:       { id: 'specific_specs',        en: 'Seller confirmed specific specs',    tl: 'Specific na specs ang kinumpirma',        riskPoints: -10, severity: 'positive' },
  no_rush_pressure:     { id: 'no_rush_pressure',      en: 'No urgency or rush pressure',        tl: 'Walang urgency o rush pressure',          riskPoints: -10, severity: 'positive' }, // kept for scoring, not shown in reasons
  payment_outside:      { id: 'payment_outside',       en: 'Payment outside platform requested', tl: 'Bayad sa labas ng platform',              riskPoints: 35,  severity: 'high' },
  name_mismatch:        { id: 'name_mismatch',         en: 'Account name mismatch',              tl: 'Hindi tugma ang account name',            riskPoints: 28,  severity: 'high' },
  rush_payment:         { id: 'rush_payment',          en: 'Rush / urgency pressure',            tl: 'Rush o urgency pressure',                 riskPoints: 18,  severity: 'medium' },
  no_item_proof:        { id: 'no_item_proof',         en: 'No item or listing proof',           tl: 'Walang patunay ng produkto',              riskPoints: 20,  severity: 'medium' },
  new_profile:          { id: 'new_profile',           en: 'New or empty profile',               tl: 'Bagong o walang laman na profile',        riskPoints: 14,  severity: 'low' },
  payment_terms_missing:{ id: 'payment_terms_missing', en: 'Payment details not yet shown',      tl: 'Hindi pa lumalabas ang payment details',  riskPoints: 10,  severity: 'low' },
  long_lead_time:       { id: 'long_lead_time',        en: 'Long lead time before delivery',     tl: 'Matagal bago maideliver',                 riskPoints: 8,   severity: 'low' },

  // Investment / OFW
  guaranteed_return:    { id: 'guaranteed_return',     en: 'Guaranteed return promised',         tl: 'Garantisadong kita',                      riskPoints: 40,  severity: 'hard_red' },
  referral_focus:       { id: 'referral_focus',        en: 'Referral / recruit commission focus',tl: 'Pag-aanyaya na mag-recruit',              riskPoints: 35,  severity: 'hard_red' },
  pressure_now:         { id: 'pressure_now',          en: 'Pressure to invest immediately',     tl: 'Pinipilit mag-invest agad',               riskPoints: 20,  severity: 'high' },
  withdrawal_fee:       { id: 'withdrawal_fee',        en: 'Fee required to unlock/release funds',tl: 'Bayad bago makuha ang pera',             riskPoints: 45,  severity: 'hard_red' },
  no_sec_license:       { id: 'no_sec_license',        en: 'No SEC license or registration',     tl: 'Walang SEC license',                      riskPoints: 30,  severity: 'high' },
  fake_screenshots:     { id: 'fake_screenshots',      en: 'Profit screenshots shown as proof',  tl: 'Nagpapakita ng profit screenshots',       riskPoints: 25,  severity: 'high' },

  // Donation
  known_org:            { id: 'known_org',             en: 'Known / official organization',      tl: 'Kilalang organisasyon',                   riskPoints: -25, severity: 'positive' },
  transparent_updates:  { id: 'transparent_updates',   en: 'Regular updates provided',           tl: 'Regular na updates',                      riskPoints: -10, severity: 'positive' },
  acct_mismatch:        { id: 'acct_mismatch',         en: 'Account name mismatch',              tl: 'Hindi tugma ang account name',            riskPoints: 25,  severity: 'high' },
  no_beneficiary:       { id: 'no_beneficiary',        en: 'No beneficiary proof',               tl: 'Walang patunay ng benepisyaryo',          riskPoints: 22,  severity: 'medium' },
  emotional_pressure:   { id: 'emotional_pressure',    en: 'Emotional pressure tactic',          tl: 'Emosyonal na pressure',                   riskPoints: 15,  severity: 'medium' },

  // Vendor / Business
  verified_biz:         { id: 'verified_biz',          en: 'Verified business registration',     tl: 'Napatunayan ang business registration',   riskPoints: -20, severity: 'positive' },
  invoice_matches:      { id: 'invoice_matches',       en: 'Invoice name matches bank account',  tl: 'Tugma ang invoice at bank account',       riskPoints: -20, severity: 'positive' },
  bank_mismatch:        { id: 'bank_mismatch',         en: 'Bank account name mismatch',         tl: 'Hindi tugma ang bank account',            riskPoints: 35,  severity: 'high' },
  sudden_bank_change:   { id: 'sudden_bank_change',    en: 'Sudden bank detail change',          tl: 'Biglang nagbago ang bank details',        riskPoints: 40,  severity: 'hard_red' },
  no_contract:          { id: 'no_contract',           en: 'No contract or proposal',            tl: 'Walang kontrata o proposal',              riskPoints: 20,  severity: 'medium' },

  // Property
  title_available:      { id: 'title_available',       en: 'Title copy available for verification', tl: 'May kopya ng title',                   riskPoints: -10, severity: 'positive' },
  seller_matches_title: { id: 'seller_matches_title',  en: 'Seller name matches title',          tl: 'Tugma ang pangalan sa title',             riskPoints: -25, severity: 'positive' },
  dhsud_accredited:     { id: 'dhsud_accredited',      en: 'Developer is DHSUD/HLURB accredited',tl: 'DHSUD/HLURB accredited ang developer',   riskPoints: -25, severity: 'positive' },
  prc_licensed_broker:  { id: 'prc_licensed_broker',   en: 'Broker holds valid PRC license',     tl: 'May PRC license ang broker',             riskPoints: -15, severity: 'positive' },
  title_mismatch:       { id: 'title_mismatch',        en: 'Seller / title name mismatch',       tl: 'Hindi tugma ang seller at title',         riskPoints: 40,  severity: 'hard_red' },
  no_authority:         { id: 'no_authority',          en: 'No authority to sell shown',         tl: 'Walang karapatang magbenta',              riskPoints: 35,  severity: 'hard_red' },
  deposit_first:        { id: 'deposit_first',         en: 'Deposit/reservation required before documents', tl: 'Bayad bago makita ang docs',   riskPoints: 40,  severity: 'hard_red' },
  personal_acct:        { id: 'personal_acct',         en: 'Payment to personal account (not company)', tl: 'Bayad sa personal na account',      riskPoints: 40,  severity: 'hard_red' },
  gcash_for_property:   { id: 'gcash_for_property',    en: 'GCash used for property reservation/payment', tl: 'GCash ang paraan ng bayad sa lupa', riskPoints: 45, severity: 'hard_red' },
  price_too_cheap:      { id: 'price_too_cheap',       en: 'Property price unrealistically low', tl: 'Napakamura ng presyo ng lupa',            riskPoints: 30,  severity: 'high' },
  no_dhsud_mention:     { id: 'no_dhsud_mention',      en: 'No developer accreditation (DHSUD/HLURB) mentioned', tl: 'Walang DHSUD/HLURB accreditation', riskPoints: 25, severity: 'high' },

  // Job / Agency
  processing_fee:       { id: 'processing_fee',        en: 'Processing fee before contract',     tl: 'Bayad bago ang kontrata',                 riskPoints: 35,  severity: 'hard_red' },
  no_dole_license:      { id: 'no_dole_license',       en: 'No DOLE/POEA license',               tl: 'Walang DOLE/POEA license',                riskPoints: 25,  severity: 'high' },
  pay_to_earn:          { id: 'pay_to_earn',           en: 'Pay money to earn money',            tl: 'Magbayad para kumita',                    riskPoints: 45,  severity: 'hard_red' },
  verified_employer:    { id: 'verified_employer',     en: 'Verified employer / agency',         tl: 'Verified na employer o agency',           riskPoints: -25, severity: 'positive' },
  formal_contract:      { id: 'formal_contract',       en: 'Formal contract or offer letter',    tl: 'Pormal na kontrata o offer letter',       riskPoints: -15, severity: 'positive' },

  // Buyer Check
  payment_cleared:      { id: 'payment_cleared',       en: 'Payment confirmed cleared',          tl: 'Nakumpirma na cleared ang bayad',         riskPoints: -30, severity: 'positive' },
  fake_payment:         { id: 'fake_payment',          en: 'Fake payment proof suspected',       tl: 'Mukhang peke ang payment proof',          riskPoints: 35,  severity: 'hard_red' },
  ship_before_clear:    { id: 'ship_before_clear',     en: 'Ship before payment clears',         tl: 'Padalahin bago ma-clear ang bayad',       riskPoints: 35,  severity: 'hard_red' },
  overpayment:          { id: 'overpayment',           en: 'Overpayment + refund request',       tl: 'Sobrang bayad + hinihinging ibalik',      riskPoints: 40,  severity: 'hard_red' },

  // Website Check
  no_https:             { id: 'no_https',              en: 'No HTTPS / unsecured connection',    tl: 'Walang HTTPS',                            riskPoints: 30,  severity: 'high' },
  domain_lookalike:     { id: 'domain_lookalike',      en: 'Domain mimics a known brand',        tl: 'Mukhang copycat ang domain',              riskPoints: 40,  severity: 'hard_red' },
  new_domain:           { id: 'new_domain',            en: 'Very new domain (< 6 months)',       tl: 'Bagong domain',                           riskPoints: 20,  severity: 'medium' },
  no_contact_info:      { id: 'no_contact_info',       en: 'No verifiable contact information',  tl: 'Walang contact info',                     riskPoints: 20,  severity: 'medium' },
  has_contact_info:     { id: 'has_contact_info',      en: 'Verifiable contact info present',    tl: 'May contact info',                        riskPoints: -15, severity: 'positive' },
  legit_domain:         { id: 'legit_domain',          en: 'Known/established domain',           tl: 'Kilalang domain',                         riskPoints: -20, severity: 'positive' },
  too_good_prices:      { id: 'too_good_prices',       en: 'Prices too good to be true',         tl: 'Masyadong mura — parang peke',            riskPoints: 25,  severity: 'high' },
  no_sec_dti_reg:       { id: 'no_sec_dti_reg',        en: 'No SEC/DTI registration found',      tl: 'Walang nahanap na SEC/DTI registration',  riskPoints: 25,  severity: 'high' },

  // SMS / Text Scam
  link_in_sms:          { id: 'link_in_sms',           en: 'Suspicious link sent via SMS',       tl: 'May link sa SMS',                         riskPoints: 30,  severity: 'high' },
  unknown_sender:       { id: 'unknown_sender',        en: 'Unknown sender number',              tl: 'Di kilalang numero',                      riskPoints: 15,  severity: 'medium' },
  bank_impersonation:   { id: 'bank_impersonation',    en: 'Pretends to be a bank or GCash',     tl: 'Nagpapanggap na bangko o GCash',          riskPoints: 40,  severity: 'hard_red' },
  asks_for_otp:         { id: 'asks_for_otp',          en: 'Asking for OTP or password',         tl: 'Humihingi ng OTP o password',             riskPoints: 50,  severity: 'hard_red' },
  prize_winner:         { id: 'prize_winner',          en: 'Claims you won a prize',             tl: 'Sinasabing nanalo ka ng premyo',          riskPoints: 35,  severity: 'hard_red' },
  official_sender:      { id: 'official_sender',       en: 'Verified sender / official number',  tl: 'Verified na sender',                      riskPoints: -20, severity: 'positive' },

  // Profile Check
  no_post_history:      { id: 'no_post_history',       en: 'No post history or very new account',tl: 'Walang post history o bagong account',    riskPoints: 20,  severity: 'medium' },
  photos_stock:         { id: 'photos_stock',          en: 'Profile photos look like stock images',tl: 'Mukhang stock photos ang profile',      riskPoints: 25,  severity: 'high' },
  inconsistent_info:    { id: 'inconsistent_info',     en: 'Inconsistent personal info',         tl: 'Hindi magkakaayon ang impormasyon',       riskPoints: 25,  severity: 'high' },
  established_profile:  { id: 'established_profile',   en: 'Long-standing active profile',       tl: 'Matagal nang aktibong profile',           riskPoints: -20, severity: 'positive' },
  many_complaints:      { id: 'many_complaints',       en: 'Complaints found against this account',tl: 'May mga reklamo laban dito',            riskPoints: 35,  severity: 'hard_red' },

  // Loan / Lending Scam
  upfront_loan_fee:     { id: 'upfront_loan_fee',      en: 'Upfront fee before loan release',    tl: 'Bayad muna bago mailabas ang utang',      riskPoints: 45,  severity: 'hard_red' },
  no_credit_check:      { id: 'no_credit_check',       en: 'No credit check required',           tl: 'Walang credit check',                     riskPoints: 30,  severity: 'high' },
  unrealistic_rate:     { id: 'unrealistic_rate',      en: 'Unrealistically low interest rate',  tl: 'Napakababang interest — parang peke',     riskPoints: 25,  severity: 'high' },
  no_lending_license:   { id: 'no_lending_license',    en: 'No SEC lending license',             tl: 'Walang SEC lending license',              riskPoints: 30,  severity: 'high' },
  licensed_lender:      { id: 'licensed_lender',       en: 'SEC-licensed lending company',       tl: 'SEC-licensed na lender',                  riskPoints: -25, severity: 'positive' },

  // Romance Scam
  met_online_only:      { id: 'met_online_only',       en: 'Met only online, never video called',tl: 'Nagkita lang sa online, hindi pa naka-videocall', riskPoints: 20, severity: 'medium' },
  too_fast_romance:     { id: 'too_fast_romance',      en: 'Very fast emotional attachment',     tl: 'Mabilis na pag-ibig — parang peke',      riskPoints: 25,  severity: 'high' },
  money_request:        { id: 'money_request',         en: 'Asking for money / remittance',      tl: 'Humihingi ng pera',                       riskPoints: 40,  severity: 'hard_red' },
  foreign_military:     { id: 'foreign_military',      en: 'Claims to be foreign military/doctor',tl: 'Nagpapanggap na foreign military/doktor', riskPoints: 35,  severity: 'hard_red' },
  cancelled_visit:      { id: 'cancelled_visit',       en: 'Repeated cancelled meet-ups',        tl: 'Paulit-ulit na nagkaka-cancel ng pagkikita', riskPoints: 20, severity: 'medium' },
}

// ─── Category Signal Maps ──────────────────────────────────────────────────────

const CATEGORY_SIGNALS: Record<CategoryId, { signals: string[]; hardRedPairs: string[][] }> = {
  online_purchase: {
    signals: ['payment_outside', 'name_mismatch', 'rush_payment', 'no_item_proof', 'new_profile', 'official_checkout', 'verified_page'],
    hardRedPairs: [['payment_outside', 'name_mismatch']],
  },
  investment: {
    signals: ['guaranteed_return', 'referral_focus', 'pressure_now', 'withdrawal_fee', 'no_sec_license', 'fake_screenshots'],
    hardRedPairs: [['guaranteed_return', 'referral_focus'], ['withdrawal_fee']],
  },
  donation: {
    signals: ['acct_mismatch', 'no_beneficiary', 'emotional_pressure', 'known_org', 'transparent_updates'],
    hardRedPairs: [['acct_mismatch', 'no_beneficiary']],
  },
  vendor: {
    signals: ['bank_mismatch', 'sudden_bank_change', 'no_contract', 'verified_biz', 'invoice_matches'],
    hardRedPairs: [['sudden_bank_change']],
  },
  property: {
    signals: ['title_mismatch', 'no_authority', 'deposit_first', 'personal_acct', 'gcash_for_property', 'price_too_cheap', 'no_dhsud_mention', 'title_available', 'seller_matches_title', 'dhsud_accredited', 'prc_licensed_broker'],
    hardRedPairs: [['deposit_first', 'no_authority'], ['title_mismatch'], ['gcash_for_property'], ['personal_acct', 'deposit_first']],
  },
  job_agency: {
    signals: ['processing_fee', 'no_dole_license', 'pay_to_earn', 'personal_acct', 'verified_employer', 'formal_contract'],
    hardRedPairs: [['pay_to_earn'], ['processing_fee', 'no_dole_license']],
  },
  buyer_check: {
    signals: ['fake_payment', 'ship_before_clear', 'overpayment', 'payment_cleared'],
    hardRedPairs: [['overpayment'], ['ship_before_clear']],
  },
  website_check: {
    signals: ['no_https', 'domain_lookalike', 'new_domain', 'no_contact_info', 'has_contact_info', 'legit_domain', 'too_good_prices', 'no_sec_dti_reg'],
    hardRedPairs: [['domain_lookalike'], ['no_https', 'no_contact_info']],
  },
  sms_text: {
    signals: ['link_in_sms', 'unknown_sender', 'bank_impersonation', 'asks_for_otp', 'prize_winner', 'official_sender'],
    hardRedPairs: [['asks_for_otp'], ['bank_impersonation', 'link_in_sms'], ['prize_winner']],
  },
  profile_check: {
    signals: ['no_post_history', 'photos_stock', 'inconsistent_info', 'established_profile', 'many_complaints', 'rush_payment'],
    hardRedPairs: [['many_complaints'], ['photos_stock', 'no_post_history']],
  },
  loan_scam: {
    signals: ['upfront_loan_fee', 'no_credit_check', 'unrealistic_rate', 'no_lending_license', 'licensed_lender', 'rush_payment'],
    hardRedPairs: [['upfront_loan_fee'], ['no_credit_check', 'no_lending_license']],
  },
  romance_scam: {
    signals: ['met_online_only', 'too_fast_romance', 'money_request', 'foreign_military', 'cancelled_visit'],
    hardRedPairs: [['money_request', 'met_online_only'], ['foreign_military']],
  },
}

// ─── Report Channels ───────────────────────────────────────────────────────────

export interface ReportChannel { name: string; url?: string; contact?: string }

const REPORT_CHANNELS: Record<CategoryId, ReportChannel[]> = {
  online_purchase: [
    { name: 'Shopee / Lazada Help Center',        url: 'https://help.shopee.ph' },
    { name: 'DTI Consumer Care',                  url: 'https://www.dti.gov.ph', contact: '1-384' },
    { name: 'NBI Cybercrime Division',             url: 'https://cybercrime.nbi.gov.ph' },
    { name: 'PNP Anti-Cybercrime Group',           url: 'https://acg.pnp.gov.ph', contact: '(02) 8414-1560' },
  ],
  investment: [
    { name: 'SEC Enforcement & Investor Protection', url: 'https://www.sec.gov.ph', contact: '(02) 8818-6337' },
    { name: 'BSP Consumer Assistance',             url: 'https://www.bsp.gov.ph', contact: '(02) 8708-7087' },
    { name: 'NBI Cybercrime Division',             url: 'https://cybercrime.nbi.gov.ph' },
  ],
  donation: [
    { name: 'GCash Support',                      url: 'https://help.gcash.com' },
    { name: 'DTI Consumer Care',                  url: 'https://www.dti.gov.ph', contact: '1-384' },
    { name: 'NBI Cybercrime Division',             url: 'https://cybercrime.nbi.gov.ph' },
  ],
  vendor: [
    { name: 'SEC Company Registration',           url: 'https://www.sec.gov.ph' },
    { name: 'DTI Business Registry',              url: 'https://www.dti.gov.ph' },
    { name: 'NBI Cybercrime Division',             url: 'https://cybercrime.nbi.gov.ph' },
  ],
  property: [
    { name: 'LRA – Land Registration Authority',  url: 'https://www.lra.gov.ph', contact: '(02) 8439-8086' },
    { name: 'HLURB / DHSUD',                      url: 'https://www.dhsud.gov.ph' },
    { name: 'PRC (if licensed broker)',            url: 'https://www.prc.gov.ph' },
  ],
  job_agency: [
    { name: 'DOLE / DMW',                         url: 'https://www.dmw.gov.ph', contact: '(02) 1348' },
    { name: 'POEA OFW Deployment Check',          url: 'https://www.poea.gov.ph' },
    { name: 'NBI Cybercrime Division',             url: 'https://cybercrime.nbi.gov.ph' },
  ],
  buyer_check: [
    { name: 'Your selling platform support' },
    { name: 'NBI Cybercrime Division',             url: 'https://cybercrime.nbi.gov.ph' },
    { name: 'PNP Anti-Cybercrime Group',           url: 'https://acg.pnp.gov.ph' },
  ],
  website_check: [
    { name: 'DTI Consumer Care',                  url: 'https://www.dti.gov.ph', contact: '1-384' },
    { name: 'DICT Cybercrime',                    url: 'https://dict.gov.ph' },
    { name: 'Google Safe Browsing Report',        url: 'https://safebrowsing.google.com/safebrowsing/report_phish' },
    { name: 'NBI Cybercrime Division',             url: 'https://cybercrime.nbi.gov.ph' },
  ],
  sms_text: [
    { name: 'NTC Text Scam Report',               url: 'https://www.ntc.gov.ph', contact: '(02) 8921-3651' },
    { name: 'Globe Report Spam',                  url: 'https://www.globe.com.ph/help', contact: 'Text REPORT to 7374' },
    { name: 'Smart Report Spam',                  contact: 'Text SPAM to 5858' },
    { name: 'NBI Cybercrime Division',             url: 'https://cybercrime.nbi.gov.ph' },
  ],
  profile_check: [
    { name: 'Report on Facebook/Instagram/TikTok (use in-app report button)' },
    { name: 'NBI Cybercrime Division',             url: 'https://cybercrime.nbi.gov.ph' },
    { name: 'PNP Anti-Cybercrime Group',           url: 'https://acg.pnp.gov.ph' },
  ],
  loan_scam: [
    { name: 'SEC Lending License Check',          url: 'https://www.sec.gov.ph', contact: '(02) 8818-6337' },
    { name: 'BSP Consumer Assistance',            url: 'https://www.bsp.gov.ph', contact: '(02) 8708-7087' },
    { name: 'NBI Cybercrime Division',             url: 'https://cybercrime.nbi.gov.ph' },
  ],
  romance_scam: [
    { name: 'NBI Cybercrime Division',             url: 'https://cybercrime.nbi.gov.ph' },
    { name: 'PNP Anti-Cybercrime Group',           url: 'https://acg.pnp.gov.ph', contact: '(02) 8414-1560' },
    { name: 'IC3 (for foreign suspects)',          url: 'https://www.ic3.gov' },
  ],
}

// ─── Evidence Items ────────────────────────────────────────────────────────────

export const EVIDENCE_ITEMS = [
  { en: 'Chat screenshots', tl: 'Screenshots ng chat' },
  { en: 'Profile / listing / website link', tl: 'Link ng profile o listing' },
  { en: 'Proof of payment', tl: 'Patunay ng bayad' },
  { en: 'Account name / number / QR code', tl: 'Account name / number / QR' },
  { en: 'Timeline of events', tl: 'Timeline ng mga pangyayari' },
  { en: 'Receipts / invoices / contracts', tl: 'Resibo / invoice / kontrata' },
]

// ─── Pricing Recommendation ────────────────────────────────────────────────────

function recommendPlan(score: number, categoryId: CategoryId): PricingPlanId {
  if (categoryId === 'property') return 'property_check'
  if (categoryId === 'vendor' || categoryId === 'website_check') return 'business_check'
  if (score >= 70) return 'case_pack'
  if (score >= 40) return 'full_check'
  return 'free'
}

// ─── Core Engine ───────────────────────────────────────────────────────────────

export function computeRisk(
  categoryId: CategoryId,
  activeSignalIds: string[],
  forceHardRed = false
): DecisionResult {
  const catDef = CATEGORY_SIGNALS[categoryId]
  let score = 50  // neutral baseline — must earn green, not default to it
  let isHardRed = forceHardRed
  const reasons: Signal[] = []

  for (const sid of activeSignalIds) {
    const sig = SIGNALS[sid]
    if (!sig) continue
    score += sig.riskPoints
    if (sig.severity === 'hard_red') isHardRed = true
    reasons.push(sig)
  }

  for (const pair of catDef.hardRedPairs) {
    if (pair.every(id => activeSignalIds.includes(id))) isHardRed = true
  }

  score = Math.max(0, Math.min(100, score))
  if (isHardRed && score < 70) score = Math.max(score, 73)

  let color: RiskColor
  let headline: { en: string; tl: string }
  let subheadline: { en: string; tl: string }
  let action: { en: string; tl: string }
  let notification: DecisionResult['notification']

  if (isHardRed || score >= 70) {
    color = 'red'
    headline    = { en: 'Scam Warning — Stop',                      tl: 'Babala: Scam — Tigil' }
    subheadline = { en: 'High risk. Do not send money or details.',  tl: 'Mataas ang panganib. Huwag magpadala ng pera.' }
    action      = { en: 'Stop. Do not pay or share any info.',       tl: 'Tigil. Huwag magbayad o magbigay ng impormasyon.' }
    notification = {
      sms:  { en: "SCAM WARNING. Do not proceed.",           tl: 'BABALA: SCAM. Huwag ituloy.' },
      chat: { en: 'High risk detected. Do not proceed.',     tl: 'Mataas na panganib. Huwag ituloy.' },
      push: { en: 'LegitCheck: Scam Warning — Stop',         tl: 'LegitCheck: Babala — Huwag Ituloy' },
    }
  } else if (score >= 40) {
    color = 'yellow'
    headline    = { en: 'Verify Before Paying',              tl: 'I-verify Bago Magbayad' }
    subheadline = { en: 'Red flags found — ask for proof.',  tl: 'May red flags — humingi ng patunay.' }
    action      = { en: 'Ask for proof. Use official channels only.', tl: 'Humingi ng patunay. Official channels lang.' }
    notification = {
      sms:  { en: 'VERIFY FIRST. Red flags found.',          tl: 'I-VERIFY MUNA. May red flags.' },
      chat: { en: 'Verify first. Red flags detected.',       tl: 'I-verify muna. May nakitang red flags.' },
      push: { en: 'LegitCheck: Verify Before Paying',        tl: 'LegitCheck: I-verify Bago Magbayad' },
    }
  } else {
    color = 'green'
    headline    = { en: 'No Red Flags Found',        tl: 'Walang Nakitang Red Flag' }
    subheadline = { en: 'Low risk based on what was provided. Still proceed carefully.', tl: 'Mababang panganib base sa ibinigay. Mag-ingat pa rin.' }
    action      = { en: 'Proceed carefully. Always use official channels.', tl: 'Mag-ingat pa rin. Gamitin ang official channels.' }
    notification = {
      sms:  { en: 'LOOKS LEGIT. Proceed with care.', tl: 'MUKHANG LEGIT. Mag-ingat pa rin.' },
      chat: { en: 'Low risk. Proceed carefully.',    tl: 'Mababang panganib. Mag-ingat pa rin.' },
      push: { en: 'LegitCheck: Looks Legit',         tl: 'LegitCheck: Mukhang Legit' },
    }
  }

  return {
    score, color, headline, subheadline, action, reasons,
    notification,
    reportChannels: REPORT_CHANNELS[categoryId],
    evidenceItems: EVIDENCE_ITEMS,
    recommendedPlan: recommendPlan(score, categoryId),
    categoryId,
    isHardRed,
  }
}

// ─── Auto Detect Category ──────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<CategoryId, string[]> = {
  online_purchase: ['gcash', 'bayad', 'shopee', 'lazada', 'facebook', 'seller', 'checkout', 'order', 'payment', 'bayaran', 'available', 'item', 'product', 'fb marketplace'],
  investment:      ['invest', 'return', 'profit', 'monthly', 'komisyon', 'commission', 'withdrawal', 'kumita', 'guaranteed', 'earn', 'crypto', 'trading', 'wallet', 'ROI'],
  donation:        ['donate', 'donasyon', 'tulong', 'relief', 'charity', 'campaign', 'biktima', 'sunog', 'calamity', 'fund', 'help', 'share', 'god bless'],
  vendor:          ['invoice', 'supplier', 'vendor', 'proposal', 'contract', 'business', 'company', 'delivery', 'payment terms', 'purchase order', 'PO'],
  property:        ['lote', 'lot', 'lupa', 'house', 'property', 'sqm', 'title', 'deposit', 'real estate', 'deed', 'TCT', 'OCT', 'hectare', 'condo'],
  job_agency:      ['deployment', 'dubai', 'ofw', 'agency', 'processing fee', 'kontrata', 'slot', 'qualified', 'abroad', 'hiring', 'apply', 'POEA', 'DOLE'],
  buyer_check:     ['buyer', 'customer', 'paid already', 'ship first', 'overpay', 'refund', 'fake receipt', 'napadala na'],
  website_check:   ['website', 'url', 'http', 'www.', '.com', '.ph', 'online store', 'web', 'domain', 'link', 'shop'],
  sms_text:        ['text message', 'sms', 'you have won', 'claim your', 'click here', 'verify your account', 'otp', 'one time pin', 'nagrehistro', 'nanalo ka'],
  profile_check:   ['profile', 'facebook account', 'instagram', 'tiktok', 'account', 'seller profile', 'online seller check'],
  loan_scam:       ['loan', 'utang', 'lending', 'borrow', 'interest', 'pautang', 'personal loan', 'salary loan', 'quick cash'],
  romance_scam:    ['meet online', 'dating', 'nagkakilala online', 'send money', 'padala pera', 'love', 'mahal kita', 'military', 'doctor abroad'],
}

export function detectCategory(text: string): CategoryId {
  const lower = text.toLowerCase()

  if ((lower.includes('shopee') || lower.includes('lazada')) &&
      (lower.includes('official') || lower.includes('confirmed') || lower.includes('order #'))) {
    return 'online_purchase'
  }

  // URL/website detection
  if (/https?:\/\//.test(lower) || /www\.\S+\.\w+/.test(lower)) {
    if (!lower.includes('gcash') && !lower.includes('payment')) return 'website_check'
  }

  // OTP/SMS scam detection
  if (lower.includes('otp') || lower.includes('one time') || lower.includes('nanalo ka') || lower.includes('you have won')) {
    return 'sms_text'
  }

  let best: CategoryId = 'online_purchase'
  let bestScore = 0

  for (const [catId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter(kw => lower.includes(kw.toLowerCase())).length
    if (score > bestScore) {
      bestScore = score
      best = catId as CategoryId
    }
  }

  return best
}

// ─── Auto Signal Detection ─────────────────────────────────────────────────────

export function detectSignals(text: string, categoryId: CategoryId): string[] {
  const lower = text.toLowerCase()
  const detected: string[] = []

  const checks: Array<[string, () => boolean]> = [
    // Online purchase
    ['official_checkout',    () => (lower.includes('shopee') || lower.includes('lazada')) && lower.includes('checkout')],
    ['payment_outside',      () => (lower.includes('gcash') || lower.includes('maya') || lower.includes('bank')) && !lower.includes('checkout')],
    ['name_mismatch',        () => lower.includes('mismatch') || lower.includes('hindi tugma') || lower.includes('ibang pangalan')],
    ['rush_payment',         () => lower.includes('rush') || lower.includes('urgent') || lower.includes('now na') || lower.includes('ngayon na') || lower.includes('last slot')],
    ['new_profile',          () => lower.includes('new account') || lower.includes('bagong account')],
    // Investment
    ['guaranteed_return',    () => lower.includes('guaranteed') || lower.includes('garantisado') || lower.includes('sure return')],
    ['referral_focus',       () => lower.includes('referral') || lower.includes('recruit') || lower.includes('komisyon') || lower.includes('commission')],
    ['withdrawal_fee',       () => lower.includes('withdrawal fee') || lower.includes('release fee') || lower.includes('unlock')],
    ['pressure_now',         () => lower.includes('last slot') || lower.includes('limited') || lower.includes('invest now')],
    // Job agency
    ['processing_fee',       () => lower.includes('processing fee') || lower.includes('placement fee')],
    ['pay_to_earn',          () => lower.includes('pay to earn') || lower.includes('bayad muna para kumita')],
    // Property
    ['deposit_first',        () => (lower.includes('reservation') || lower.includes('deposit')) && (lower.includes('bago') || lower.includes('before') || lower.includes('muna') || lower.includes('first'))],
    ['personal_acct',        () => lower.includes('personal account') || lower.includes('personal na account')],
    ['gcash_for_property',   () => (lower.includes('lote') || lower.includes('lot') || lower.includes('lupa') || lower.includes('property') || lower.includes('condo') || lower.includes('house')) && (lower.includes('gcash') || lower.includes('maya') || lower.includes('gcash number'))],
    ['price_too_cheap',      () => (lower.includes('lote') || lower.includes('lot') || lower.includes('lupa')) && (lower.includes('libre') || lower.includes('presyo') || /\b[1-9]\d{3}\s*(per|\/)\s*(sqm|sq\.m)/.test(lower))],
    ['no_dhsud_mention',     () => (lower.includes('developer') || lower.includes('subdivision') || lower.includes('condo')) && !lower.includes('dhsud') && !lower.includes('hlurb')],
    ['dhsud_accredited',     () => lower.includes('dhsud') || lower.includes('hlurb')],
    ['prc_licensed_broker',  () => lower.includes('prc') && (lower.includes('broker') || lower.includes('license'))],
    ['title_available',      () => lower.includes('tct') || lower.includes('oct') || lower.includes('title') && lower.includes('available')],
    // Donation
    ['emotional_pressure',   () => lower.includes('please') || lower.includes('biktima') || lower.includes('sunog') || lower.includes('calamity')],
    ['acct_mismatch',        () => lower.includes('ibang account') || lower.includes('different account')],
    // Vendor
    ['sudden_bank_change',   () => lower.includes('new account') && lower.includes('bank')],
    // Buyer check
    ['fake_payment',         () => lower.includes('fake') || lower.includes('peke') || lower.includes('screenshot lang')],
    ['ship_before_clear',    () => lower.includes('ship') && (lower.includes('before') || lower.includes('bago'))],
    ['overpayment',          () => lower.includes('overpay') || lower.includes('sobrang bayad') || lower.includes('ibalik')],
    // Website
    ['no_https',             () => categoryId === 'website_check' && lower.includes('http://') && !lower.includes('https://')],
    ['domain_lookalike',     () => /\b(g00gle|faceb00k|pay-?pal|shopee-?\w|lazada-?\w|gcash-?\w)\b/.test(lower)],
    ['too_good_prices',      () => lower.includes('% off') && (lower.includes('90') || lower.includes('80') || lower.includes('70'))],
    // SMS
    ['bank_impersonation',   () => lower.includes('bdo') || lower.includes('bpi') || lower.includes('metrobank') || lower.includes('gcash') && lower.includes('verify')],
    ['asks_for_otp',         () => lower.includes('otp') || lower.includes('one time pin') || lower.includes('verification code')],
    ['prize_winner',         () => lower.includes('nanalo') || lower.includes('you have won') || lower.includes('claim your prize')],
    ['link_in_sms',          () => categoryId === 'sms_text' && (lower.includes('http') || lower.includes('click'))],
    // Profile
    ['photos_stock',         () => lower.includes('stock photo') || lower.includes('reverse image')],
    ['many_complaints',      () => lower.includes('scammer') || lower.includes('scam report') || lower.includes('nandaya')],
    // Loan
    ['upfront_loan_fee',     () => (lower.includes('loan') || lower.includes('utang')) && (lower.includes('fee') || lower.includes('bayad muna'))],
    ['no_credit_check',      () => lower.includes('no credit check') || lower.includes('walang credit')],
    ['unrealistic_rate',     () => /\b0(\.\d+)?%\s*(interest|rate)\b/.test(lower) || lower.includes('0% interest')],
    // Romance
    ['money_request',        () => (lower.includes('send') || lower.includes('padala')) && (lower.includes('money') || lower.includes('pera'))],
    ['foreign_military',     () => lower.includes('military') || lower.includes('soldier') || lower.includes('US army')],
    ['cancelled_visit',      () => lower.includes('cancelled') && lower.includes('visit')],
    ['too_fast_romance',     () => lower.includes('love you') || lower.includes('mahal kita') && (lower.includes('online') || lower.includes('met'))],
    // Positive signals
    ['verified_page',        () => lower.includes('verified') || lower.includes('✓') || lower.includes('checkmark')],
    // NOTE: no_rush_pressure and payment_terms_missing intentionally excluded —
    // they fire from keyword absence (not confirmed facts) and pollute the report.
    ['specific_specs',       () => /\d+\s*(sq|sqm|sqft|g|kg|mm|cm|inches|inch)/.test(lower)],
    ['has_contact_info',     () => categoryId === 'website_check' && (lower.includes('contact') || lower.includes('email') || lower.includes('phone'))],
    ['legit_domain',         () => categoryId === 'website_check' && /\.(gov\.ph|com\.ph|org\.ph|edu\.ph)/.test(lower)],
    ['official_sender',      () => categoryId === 'sms_text' && (lower.includes('globe') || lower.includes('smart') || lower.includes('official'))],
  ]

  for (const [signalId, check] of checks) {
    if (check()) detected.push(signalId)
  }

  return detected
}
