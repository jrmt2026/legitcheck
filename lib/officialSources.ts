import type { CategoryId } from '@/types'

export type VerificationStatus =
  | 'official_website'
  | 'manual_verification'
  | 'api_not_connected'
  | 'no_public_checker'

export interface VerificationSource {
  id: string
  agency: string
  title: string
  detected: string
  description: string
  whatToSearch: string
  whatItProves: string
  whatItDoesNotProve: string
  officialUrl: string
  buttonLabel: string
  status: VerificationStatus
  lastVerified: string
  sourceUrl: string
}

export interface DirectoryEntry {
  id: string
  organization: string
  shortName: string
  category: 'cybercrime' | 'financial_regulator' | 'ewallet' | 'bank' | 'verification_source'
  officialWebsite: string
  complaintUrl?: string
  hotline?: string
  email?: string
  inAppSupport?: boolean
  handles: string[]
  evidenceRequired: string[]
  lastVerified: string
  sourceUrl: string
  disclaimer?: string
}

// ─── Verification Sources ──────────────────────────────────────────────────────

const PRC: VerificationSource = {
  id: 'prc',
  agency: 'Professional Regulation Commission (PRC)',
  title: 'Verify Professional License',
  detected: 'Professional license, credential, or identity claim',
  description:
    'Verify if this person holds a valid PRC license for the claimed profession through the PRC Online Verification portal.',
  whatToSearch: 'Search by profession, first name, and last name. Use the license number if provided.',
  whatItProves:
    'Whether the person holds a valid, active PRC license in the stated profession.',
  whatItDoesNotProve:
    'That the person, service, or transaction is safe. A valid license does not prevent fraud or impersonation.',
  officialUrl: 'https://online.prc.gov.ph',
  buttonLabel: 'Open PRC Online Verification',
  status: 'official_website',
  lastVerified: '2025-08-01',
  sourceUrl: 'https://www.prc.gov.ph',
}

const LRA: VerificationSource = {
  id: 'lra',
  agency: 'Land Registration Authority (LRA)',
  title: 'Verify Land Title',
  detected: 'Land title, property, TCT/CCT number, or real estate offer',
  description:
    'Do not rely on screenshots or photos of land titles. Request a Certified True Copy through LRA eSerbisyo or visit the nearest Registry of Deeds.',
  whatToSearch:
    'Title number (TCT/CCT), registered owner name, and property location. Verify seller identity and whether they have authority to sell.',
  whatItProves:
    'The current registered owner and any encumbrances on the title, as of the date of the Certified True Copy.',
  whatItDoesNotProve:
    "That the seller has the right to sell. Also verify the seller is the registered owner or has a valid Special Power of Attorney (SPA). A title photo alone proves nothing.",
  officialUrl: 'https://eserbisyo.lra.gov.ph',
  buttonLabel: 'Open LRA eSerbisyo',
  status: 'official_website',
  lastVerified: '2025-08-01',
  sourceUrl: 'https://www.lra.gov.ph',
}

const DTI: VerificationSource = {
  id: 'dti',
  agency: 'Department of Trade and Industry (DTI) — BNRS',
  title: 'Verify Business Name Registration',
  detected: 'Business name, DTI certificate, sole proprietor, or online shop registration claim',
  description:
    'Search the exact registered business name through DTI BNRS (Business Name Registration System).',
  whatToSearch:
    'Exact registered business name or owner name. Check if the registered name matches the seller, page, and payment account name.',
  whatItProves:
    'Whether a business name is registered with DTI and who the registered owner is.',
  whatItDoesNotProve:
    'That the seller, page, or transaction is safe. DTI registration does not mean the business is legitimate or that the seller can be trusted.',
  officialUrl: 'https://bnrs.dti.gov.ph',
  buttonLabel: 'Open DTI BNRS Search',
  status: 'official_website',
  lastVerified: '2025-08-01',
  sourceUrl: 'https://www.dti.gov.ph',
}

const SEC: VerificationSource = {
  id: 'sec',
  agency: 'Securities and Exchange Commission (SEC)',
  title: 'Verify Company or Investment Authorization',
  detected: 'Corporation, investment offer, lending, financing, securities, or solicitation of funds claim',
  description:
    'Check SEC registration and authorization through the SEC website. Registration is NOT the same as authorization — always verify whether the company is authorized for the specific activity being offered.',
  whatToSearch:
    'Company name or SEC registration number. Also check SEC advisories and cease-and-desist orders.',
  whatItProves:
    'Whether a company is registered with SEC and its basic registration status.',
  whatItDoesNotProve:
    'That the company is authorized to solicit investments, lend money, sell securities, or operate a financing scheme. SEC registration alone does not mean the company is safe or authorized.',
  officialUrl: 'https://www.sec.gov.ph',
  buttonLabel: 'Open SEC Philippines',
  status: 'official_website',
  lastVerified: '2025-08-01',
  sourceUrl: 'https://www.sec.gov.ph',
}

const PAYMENT_ACCOUNT: VerificationSource = {
  id: 'payment_account',
  agency: 'GCash / Maya / Bank',
  title: 'Payment Account — No Public Checker',
  detected: 'GCash number, Maya number, or bank account for payment',
  description:
    'There is no public way to confirm whether a GCash, Maya, or bank account belongs to a legitimate seller. "No reports found" does NOT mean safe.',
  whatToSearch:
    'Verify the seller or person through independent channels — video call, meetup, official page, or COD — not just by account number.',
  whatItProves:
    'Nothing can be confirmed from an account number or account name alone without provider data.',
  whatItDoesNotProve:
    'An account number, account name, or transaction screenshot alone cannot prove legitimacy. Scammers can change accounts at any time.',
  officialUrl: 'https://help.gcash.com',
  buttonLabel: 'Report to GCash',
  status: 'no_public_checker',
  lastVerified: '2025-08-01',
  sourceUrl: 'https://help.gcash.com',
}

const DMW: VerificationSource = {
  id: 'dmw',
  agency: 'Department of Migrant Workers (DMW) / POEA',
  title: 'Verify OFW Recruitment Agency',
  detected: 'OFW job offer, overseas recruitment, processing fee, or deployment claim',
  description:
    'Verify if the recruitment agency is licensed by the DMW/POEA before paying any fees. Licensed agencies cannot charge placement fees for domestic work.',
  whatToSearch:
    'Agency name and license number. Cross-check with DMW list of accredited agencies. Verify if the job order is legitimate.',
  whatItProves:
    'Whether the agency holds a valid DMW/POEA license for recruitment.',
  whatItDoesNotProve:
    'That the specific job offer, deployment, or recruiter is safe. A licensed agency does not prevent individual fraud.',
  officialUrl: 'https://www.dmw.gov.ph',
  buttonLabel: 'Open DMW Website',
  status: 'official_website',
  lastVerified: '2025-08-01',
  sourceUrl: 'https://www.dmw.gov.ph',
}

// ─── Category → Verification Sources ──────────────────────────────────────────

export const CATEGORY_VERIFICATIONS: Partial<Record<CategoryId, VerificationSource[]>> = {
  online_purchase: [PAYMENT_ACCOUNT, DTI],
  investment:      [SEC, PAYMENT_ACCOUNT],
  property:        [LRA, DTI],
  vendor:          [DTI, SEC],
  job_agency:      [DMW, SEC, DTI],
  website_check:   [],
  loan_scam:       [SEC, PAYMENT_ACCOUNT],
  romance_scam:    [],
  sms_text:        [],
  profile_check:   [PRC, DTI],
  buyer_check:     [PAYMENT_ACCOUNT],
  donation:        [SEC, DTI],
}

// ─── Reporting Directory ───────────────────────────────────────────────────────

export const REPORTING_DIRECTORY: DirectoryEntry[] = [
  {
    id: 'pnp_acg',
    organization: 'PNP Anti-Cybercrime Group',
    shortName: 'PNP ACG',
    category: 'cybercrime',
    officialWebsite: 'https://acg.pnp.gov.ph',
    handles: [
      'Online scams and fraud',
      'Phishing and fake websites',
      'Account takeover and hacking',
      'Identity theft and impersonation',
      'Cyber extortion and threats',
      'Investment fraud via online platforms',
    ],
    evidenceRequired: [
      'Screenshots of all conversations',
      'URLs, social media links, and profile pages',
      'Account numbers and account names used',
      'Proof of payment or transaction reference numbers',
      'Dates, times, and timeline of events',
      'Any other communication records',
    ],
    lastVerified: '2025-08-01',
    sourceUrl: 'https://acg.pnp.gov.ph',
    disclaimer: 'Contact details and procedures may change. Verify on the official website before submitting sensitive information.',
  },
  {
    id: 'nbi_cybercrime',
    organization: 'NBI Cybercrime Division',
    shortName: 'NBI Cybercrime',
    category: 'cybercrime',
    officialWebsite: 'https://www.nbi.gov.ph',
    handles: [
      'Cybercrime complaints',
      'Online fraud and estafa',
      'Identity theft',
      'Computer-related offenses under RA 10175',
    ],
    evidenceRequired: [
      'Sworn statement or affidavit',
      'Screenshots and documented evidence',
      'Proof of transaction or payment',
      'Valid government ID',
      'Timeline and narrative of events',
    ],
    lastVerified: '2025-08-01',
    sourceUrl: 'https://www.nbi.gov.ph',
    disclaimer: 'Procedures and requirements may change. Verify on the official website.',
  },
  {
    id: 'bsp_consumer',
    organization: 'Bangko Sentral ng Pilipinas — Consumer Assistance',
    shortName: 'BSP CAM',
    category: 'financial_regulator',
    officialWebsite: 'https://www.bsp.gov.ph',
    hotline: '02-8708-7087',
    handles: [
      'Bank and e-wallet consumer complaints',
      'Disputed transactions not resolved by the provider',
      'Unauthorized bank or e-wallet transactions',
      'Financial consumer protection violations',
    ],
    evidenceRequired: [
      'Prior complaint filed with the bank or e-wallet (BSP requires this first)',
      'Reference number from your prior complaint',
      'Proof of transaction',
      'Account details (never include PINs or passwords)',
      'Timeline of events and bank/provider response',
    ],
    lastVerified: '2025-08-01',
    sourceUrl: 'https://www.bsp.gov.ph',
    disclaimer: 'BSP handles complaints only after the bank or e-wallet fails to resolve within the required time. File with your provider first.',
  },
  {
    id: 'sec_enforcement',
    organization: 'SEC — Enforcement and Investor Protection',
    shortName: 'SEC EIPD',
    category: 'financial_regulator',
    officialWebsite: 'https://www.sec.gov.ph',
    handles: [
      'Investment scams and Ponzi schemes',
      'Unauthorized securities selling or solicitation',
      'Unregistered or unauthorized investment companies',
      'Lending and financing company violations',
      'Crowdfunding and fund solicitation fraud',
    ],
    evidenceRequired: [
      'Name of company or individual',
      'Screenshots of investment offer or solicitation',
      'Payment proofs if money was sent',
      'Receipts, contracts, or agreements',
      'Social media links and profile URLs',
      'Bank or e-wallet account used for payments',
    ],
    lastVerified: '2025-08-01',
    sourceUrl: 'https://www.sec.gov.ph',
    disclaimer: 'Contact details may change. Always confirm on the official SEC website before submitting.',
  },
  {
    id: 'gcash_support',
    organization: 'GCash Customer Support',
    shortName: 'GCash',
    category: 'ewallet',
    officialWebsite: 'https://help.gcash.com',
    inAppSupport: true,
    handles: [
      'GCash scam transfers',
      'Unauthorized GCash transactions',
      'GCash account takeover',
      'Fraud reports and wallet disputes',
      'Wallet blocking requests',
    ],
    evidenceRequired: [
      'Transaction reference number (13-digit GCash ref)',
      'Screenshots of transaction history',
      'Date, time, and amount',
      'Account number or phone number of recipient',
    ],
    lastVerified: '2025-08-01',
    sourceUrl: 'https://help.gcash.com',
    disclaimer: 'Use the in-app GCash Help Center or GCash app report function for fastest response. Report as soon as possible after discovery.',
  },
  {
    id: 'maya_support',
    organization: 'Maya Customer Support',
    shortName: 'Maya',
    category: 'ewallet',
    officialWebsite: 'https://www.maya.ph/support',
    inAppSupport: true,
    handles: [
      'Maya scam transfers',
      'Unauthorized Maya transactions',
      'Maya account disputes',
      'Fraud reports and wallet issues',
    ],
    evidenceRequired: [
      'Transaction reference number',
      'Screenshots of transaction history',
      'Date, time, and amount of transaction',
      'Recipient account details',
    ],
    lastVerified: '2025-08-01',
    sourceUrl: 'https://www.maya.ph',
    disclaimer: 'Use the in-app Maya Help Center for fastest response. Report immediately after discovering fraud.',
  },
  {
    id: 'bdo',
    organization: 'BDO Unibank, Inc.',
    shortName: 'BDO',
    category: 'bank',
    officialWebsite: 'https://www.bdo.com.ph',
    complaintUrl: 'https://www.bdo.com.ph/personal/contact-us',
    hotline: '(02) 8631-8000 / 1-800-10-631-8000',
    email: 'customercare@bdo.com.ph',
    handles: [
      'Unauthorized transactions',
      'Account fraud',
      'Fake BDO impersonation',
      'OTP scams',
      'Phishing via BDO brand',
    ],
    evidenceRequired: [
      'Screenshot of suspicious transaction',
      'Account number involved',
      'Scammer phone/email',
      'Transaction reference number',
      'Date and amount',
    ],
    lastVerified: '2025-08-01',
    sourceUrl: 'https://www.bdo.com.ph',
    disclaimer: 'BDO will never ask for your OTP, full card number, or password via SMS, email, or phone call.',
  },
  {
    id: 'bpi',
    organization: 'Bank of the Philippine Islands (BPI)',
    shortName: 'BPI',
    category: 'bank',
    officialWebsite: 'https://www.bpi.com.ph',
    complaintUrl: 'https://www.bpi.com.ph/contact-us',
    hotline: '(02) 7974-5472 / 1-800-188-89100',
    email: 'bpi.customerservice@bpi.com.ph',
    handles: [
      'Unauthorized transactions',
      'Fraudulent transfers',
      'BPI impersonation',
      'Phishing',
      'Account takeover',
    ],
    evidenceRequired: [
      'Screenshot of transaction',
      'Account or card number (partial)',
      'Suspicious SMS or email',
      'Amount and date',
      'Scammer contact details',
    ],
    lastVerified: '2025-08-01',
    sourceUrl: 'https://www.bpi.com.ph',
    disclaimer: 'BPI will never send payment links via SMS. Report suspicious messages to BPI immediately.',
  },
  {
    id: 'metrobank',
    organization: 'Metropolitan Bank and Trust Company (Metrobank)',
    shortName: 'Metrobank',
    category: 'bank',
    officialWebsite: 'https://www.metrobank.com.ph',
    complaintUrl: 'https://www.metrobank.com.ph/contactus',
    hotline: '(02) 88-700-700 / 1-800-1888-5775',
    email: 'customercare@metrobank.com.ph',
    handles: [
      'Unauthorized transactions',
      'Account fraud',
      'Metrobank impersonation',
      'Phishing',
      'Card fraud',
    ],
    evidenceRequired: [
      'Transaction receipt or screenshot',
      'Account number',
      'Date and amount',
      'Scammer contact',
      'Suspicious message screenshots',
    ],
    lastVerified: '2025-08-01',
    sourceUrl: 'https://www.metrobank.com.ph',
    disclaimer: 'Metrobank will never ask for your PIN, OTP, or full card details via SMS or email.',
  },
  {
    id: 'unionbank',
    organization: 'UnionBank of the Philippines',
    shortName: 'UnionBank',
    category: 'bank',
    officialWebsite: 'https://www.unionbankph.com',
    complaintUrl: 'https://www.unionbankph.com/contact-us',
    hotline: '(02) 8841-8600 / 1-800-1888-2600',
    email: 'customerservice@unionbankph.com',
    handles: [
      'Unauthorized online transactions',
      'Account fraud',
      'UnionBank impersonation',
      'EON card fraud',
      'Phishing',
    ],
    evidenceRequired: [
      'Screenshot of transaction',
      'Account reference number',
      'Scammer phone or email',
      'Amount and date',
      'Suspicious message',
    ],
    lastVerified: '2025-08-01',
    sourceUrl: 'https://www.unionbankph.com',
    disclaimer: 'UnionBank will never send unsolicited links requesting your login credentials.',
  },
  {
    id: 'landbank',
    organization: 'Land Bank of the Philippines (Landbank)',
    shortName: 'Landbank',
    category: 'bank',
    officialWebsite: 'https://www.landbank.com',
    complaintUrl: 'https://www.landbank.com/contact',
    hotline: '(02) 8-405-7000 / 1-800-10-405-7000',
    email: 'customercare@mail.landbank.com',
    handles: [
      'Unauthorized transactions',
      'Fake Landbank impersonation',
      'Agricultural loan scams',
      'Government payment fraud via Landbank',
    ],
    evidenceRequired: [
      'Transaction reference number',
      'Account number',
      'Date and amount',
      'Suspicious message screenshots',
      'Scammer contact details',
    ],
    lastVerified: '2025-08-01',
    sourceUrl: 'https://www.landbank.com',
    disclaimer: 'Report suspicious transactions immediately. Landbank never requests OTPs via SMS or email.',
  },
  {
    id: 'rcbc',
    organization: 'Rizal Commercial Banking Corporation (RCBC)',
    shortName: 'RCBC',
    category: 'bank',
    officialWebsite: 'https://www.rcbc.com',
    complaintUrl: 'https://www.rcbc.com/contact',
    hotline: '(02) 8877-7222 / 1-800-10-877-7222',
    email: 'rcbcustomers@rcbc.com',
    handles: [
      'Unauthorized transactions',
      'RCBC impersonation',
      'Card fraud',
      'Phishing',
      'Account takeover',
    ],
    evidenceRequired: [
      'Transaction receipt',
      'Account reference',
      'Suspicious messages',
      'Scammer details',
      'Amount and date',
    ],
    lastVerified: '2025-08-01',
    sourceUrl: 'https://www.rcbc.com',
    disclaimer: 'RCBC DiskarTech and other RCBC channels will never ask for your password or OTP.',
  },
  {
    id: 'prc_verify',
    organization: 'Professional Regulation Commission (PRC)',
    shortName: 'PRC',
    category: 'verification_source',
    officialWebsite: 'https://online.prc.gov.ph',
    handles: [
      'Professional license verification',
      'Reports against licensed professionals',
      'Fake PRC ID or credential reports',
    ],
    evidenceRequired: [
      'Full name of the professional',
      'Claimed profession',
      'License number if provided',
      'Screenshot of ID or credentials if shared',
    ],
    lastVerified: '2025-08-01',
    sourceUrl: 'https://www.prc.gov.ph',
  },
  {
    id: 'dti_bnrs',
    organization: 'DTI — Business Name Registration System',
    shortName: 'DTI BNRS',
    category: 'verification_source',
    officialWebsite: 'https://bnrs.dti.gov.ph',
    handles: [
      'Business name registration search',
      'Sole proprietor verification',
      'DTI certificate authenticity check',
    ],
    evidenceRequired: [
      'Exact business name (spelling matters)',
      'Screenshot of DTI certificate if provided',
    ],
    lastVerified: '2025-08-01',
    sourceUrl: 'https://www.dti.gov.ph',
  },
  {
    id: 'lra_eservices',
    organization: 'Land Registration Authority (LRA)',
    shortName: 'LRA eSerbisyo',
    category: 'verification_source',
    officialWebsite: 'https://eserbisyo.lra.gov.ph',
    handles: [
      'Land title Certified True Copy requests',
      'Encumbrance verification',
      'Registered owner verification',
    ],
    evidenceRequired: [
      'Title number (TCT or CCT)',
      'Property location (city/municipality)',
    ],
    lastVerified: '2025-08-01',
    sourceUrl: 'https://www.lra.gov.ph',
    disclaimer: 'CTC requests take processing time. For urgent needs, visit the nearest Registry of Deeds in person.',
  },
]

// ─── Category → Directory IDs ──────────────────────────────────────────────────

export const CATEGORY_DIRECTORY_IDS: Partial<Record<CategoryId, string[]>> = {
  online_purchase: ['gcash_support', 'maya_support', 'pnp_acg', 'nbi_cybercrime', 'bsp_consumer'],
  investment:      ['sec_enforcement', 'pnp_acg', 'nbi_cybercrime'],
  property:        ['lra_eservices', 'pnp_acg', 'nbi_cybercrime'],
  vendor:          ['dti_bnrs', 'sec_enforcement', 'pnp_acg'],
  job_agency:      ['pnp_acg', 'nbi_cybercrime', 'sec_enforcement'],
  website_check:   ['pnp_acg', 'nbi_cybercrime'],
  loan_scam:       ['sec_enforcement', 'bsp_consumer', 'pnp_acg'],
  romance_scam:    ['pnp_acg', 'nbi_cybercrime'],
  sms_text:        ['pnp_acg', 'nbi_cybercrime'],
  profile_check:   ['prc_verify', 'pnp_acg', 'nbi_cybercrime'],
  buyer_check:     ['gcash_support', 'maya_support', 'bsp_consumer', 'pnp_acg'],
  donation:        ['sec_enforcement', 'pnp_acg'],
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function getVerificationSources(categoryId: CategoryId): VerificationSource[] {
  return CATEGORY_VERIFICATIONS[categoryId] ?? []
}

export function getDirectoryEntries(categoryId: CategoryId): DirectoryEntry[] {
  const ids = CATEGORY_DIRECTORY_IDS[categoryId] ?? []
  return ids
    .map(id => REPORTING_DIRECTORY.find(e => e.id === id))
    .filter(Boolean) as DirectoryEntry[]
}

export const ALL_CATEGORY_LABELS: Record<CategoryId, string> = {
  online_purchase: 'Online Seller / Marketplace',
  sms_text:        'SMS / Text Scam',
  job_agency:      'Job / OFW Scam',
  investment:      'Investment / Crypto / Forex',
  donation:        'Donation / Charity',
  website_check:   'Phishing / Fake Website',
  loan_scam:       'Loan / Lending Scam',
  romance_scam:    'Romance / Impersonation',
  property:        'Property / Land',
  buyer_check:     'Buyer Check',
  profile_check:   'Social Profile / Fake Page',
  vendor:          'Business / Vendor',
}

// Scam-specific tags per category for result display
export const CATEGORY_TAGS: Partial<Record<CategoryId, string[]>> = {
  online_purchase: ['Online Seller', 'Marketplace Risk', 'Payment Risk'],
  investment:      ['Investment Offer', 'SEC Check Needed', 'Guaranteed Returns Risk'],
  property:        ['Property / Land', 'Title Verification Needed', 'Document Risk'],
  vendor:          ['Business Registration', 'DTI / SEC Check Needed'],
  job_agency:      ['Job / OFW Scam', 'Recruitment Risk', 'Upfront Fee Risk'],
  website_check:   ['Phishing Risk', 'Suspicious Domain', 'Account Takeover Risk'],
  loan_scam:       ['Loan Scam', 'Upfront Fee Risk', 'SEC Check Needed'],
  romance_scam:    ['Romance Scam', 'Impersonation Risk', 'Emergency Money Request'],
  sms_text:        ['SMS Scam', 'Smishing Risk', 'Fake Government Message'],
  profile_check:   ['Identity Risk', 'Credential Risk', 'PRC Check Needed'],
  buyer_check:     ['Buyer Risk', 'Payment Account', 'Needs Manual Verification'],
  donation:        ['Donation Risk', 'Charity Fraud Risk', 'SEC Check Needed'],
}

export const EVIDENCE_CHECKLIST = [
  'Screenshots of all conversations',
  'Links or profile/page URLs',
  'Account number and account name used for payment',
  'Proof of payment or transaction reference number',
  'Date and time of transaction',
  'Name used by the suspected scammer',
  'Phone number, email, or social media account',
  'Product listing, offer screenshot, or advertisement',
  'Government ID or certificate screenshot (if shared by them)',
  'Written timeline of what happened',
]
