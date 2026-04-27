'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, BookOpen, ArrowRight, Flag, Share2, ChevronDown, ChevronUp } from 'lucide-react'

type RiskLevel = 'critical' | 'high' | 'caution' | 'low'
type ScamCategory = 'sms' | 'investment' | 'marketplace' | 'job' | 'donation' | 'website' | 'loan' | 'romance' | 'property'

interface ScamEntry {
  id: string
  category: ScamCategory
  title: string
  emoji: string
  risk: RiskLevel
  reportCount: number
  lastSeen: string
  status: 'pattern_detected' | 'under_review' | 'reported_by_users'
  exampleMessage: string
  redFlags: string[]
  whatToDo: string[]
  officialResource?: string
}

const RISK_BADGE: Record<RiskLevel, string> = {
  critical: 'bg-brand-critical-light text-brand-critical-dark border-brand-critical/20',
  high:     'bg-brand-red-light text-brand-red-dark border-brand-red/20',
  caution:  'bg-brand-orange-light text-brand-orange-dark border-brand-orange/20',
  low:      'bg-brand-yellow-light text-brand-yellow-dark border-brand-yellow/20',
}
const RISK_LABEL: Record<RiskLevel, string> = {
  critical: 'Critical',
  high:     'High Risk',
  caution:  'Caution',
  low:      'Low Risk',
}
const STATUS_BADGE: Record<string, string> = {
  pattern_detected:   'bg-brand-red-light text-brand-red-dark',
  under_review:       'bg-brand-yellow-light text-brand-yellow-dark',
  reported_by_users:  'bg-brand-blue-light text-brand-blue-dark',
}
const STATUS_LABEL: Record<string, string> = {
  pattern_detected:  'Pattern Detected',
  under_review:      'Under Review',
  reported_by_users: 'Reported by Users',
}
const CAT_LABELS: Record<ScamCategory, { emoji: string; label: string }> = {
  sms:         { emoji: '📱', label: 'SMS / Text Scam' },
  investment:  { emoji: '💰', label: 'Investment'       },
  marketplace: { emoji: '🛍️', label: 'Marketplace'     },
  job:         { emoji: '✈️', label: 'Job / OFW'        },
  donation:    { emoji: '❤️', label: 'Donation'         },
  website:     { emoji: '🌐', label: 'Website / Link'   },
  loan:        { emoji: '💸', label: 'Loan / Lending'   },
  romance:     { emoji: '💔', label: 'Romance'           },
  property:    { emoji: '🏠', label: 'Property'          },
}

const LIBRARY: ScamEntry[] = [
  {
    id: 'gov-smishing',
    category: 'sms',
    title: 'Government smishing — MMDA / LTO / BIR',
    emoji: '🚗',
    risk: 'critical',
    reportCount: 234,
    lastSeen: 'Apr 2026',
    status: 'pattern_detected',
    exampleMessage: '"MMDA: Mahal na motorista, mayroon kang unpaid traffic violation na nagkakahalaga ng ₱5,000. Ang iyong lisensya ay sususpindihin sa loob ng 48 oras kung hindi mababayaran. I-click ang link para bayaran ngayon: http://mmda-fines-ph.com/pay"',
    redFlags: [
      'Link is NOT on a .gov.ph domain',
      'Threatens license suspension within 48 hours',
      'Uses urgent deadline to pressure immediate payment',
      'MMDA / LTO / BIR never send payment links via SMS',
    ],
    whatToDo: [
      'Delete the message immediately',
      'Do not click any link',
      'Verify real fines at myfines.mmda.gov.ph (MMDA) or lto.gov.ph (LTO)',
      'Report the number to NTC at complaints@ntc.gov.ph',
    ],
    officialResource: 'MMDA: myfines.mmda.gov.ph · LTO: lto.gov.ph · BIR: bir.gov.ph · NTC: ntc.gov.ph',
  },
  {
    id: 'investment-ponzi',
    category: 'investment',
    title: 'Guaranteed high-return investment / Ponzi scheme',
    emoji: '💰',
    risk: 'critical',
    reportCount: 189,
    lastSeen: 'Apr 2026',
    status: 'pattern_detected',
    exampleMessage: '"Kumita na ng 30% monthly ang aming mga investors! Guaranteed po ang return. Mag-invite ka pa ng friends, may komisyon ka pa. Withdrawal fee lang ng ₱2,000 para ma-release ang profit mo."',
    redFlags: [
      '"Guaranteed" returns — no legal investment can promise this',
      'High monthly returns (>2%) are a Ponzi red flag',
      'Referral/recruitment commissions = pyramid structure',
      '"Withdrawal fee" to release profit = advance fee fraud',
      'No SEC registration or Certificate of Authority mentioned',
    ],
    whatToDo: [
      'Do not invest',
      'Verify if registered at sec.gov.ph/cas',
      'Report to SEC at (02) 8818-5544 or cad@sec.gov.ph',
      'Report to BSP at consumeraffairs@bsp.gov.ph',
    ],
    officialResource: 'SEC Philippines: sec.gov.ph · Verify at sec.gov.ph/cas · Hotline: (02) 8818-5544',
  },
  {
    id: 'gcash-only-seller',
    category: 'marketplace',
    title: 'GCash-only FB Marketplace advance payment',
    emoji: '🛍️',
    risk: 'high',
    reportCount: 412,
    lastSeen: 'Apr 2026',
    status: 'pattern_detected',
    exampleMessage: '"Hi po! Available pa po yung bag. GCash nalang po tayo para mas mabilis. Account ko: 09171234567 - J. Santos. Rush po kasi maraming nagtatanong. Pag di ka nagbayad ngayon, ibebenta ko na sa isa."',
    redFlags: [
      'GCash only — bypasses all buyer protection',
      'Refuses meet-up, demands full payment first',
      '"Rush" and artificial scarcity pressure',
      'No Shopee/Lazada listing with escrow',
    ],
    whatToDo: [
      'Insist on COD or meet-up with cash',
      'Use Shopee or Lazada with buyer protection',
      'Never pay in full before receiving the item',
      'Report the Facebook profile if you suspect fraud',
    ],
    officialResource: 'DTI Consumer Protection: dti.gov.ph · Shopee buyer protection: shopee.ph/help',
  },
  {
    id: 'ofw-processing-fee',
    category: 'job',
    title: 'OFW job agency upfront processing fee',
    emoji: '✈️',
    risk: 'critical',
    reportCount: 156,
    lastSeen: 'Apr 2026',
    status: 'pattern_detected',
    exampleMessage: '"Congratulations! Qualified ka sa deployment sa Dubai. Processing fee lang: ₱15,000 via GCash bago maibigay ang kontrata. Urgent — kailangan bukas na para ma-slot ka."',
    redFlags: [
      'Demands large fee before showing employment contract',
      'GCash payment only — no official receipt',
      'No POEA license number mentioned',
      'Artificial urgency (24-hour deadline)',
      'Contract shown only after payment',
    ],
    whatToDo: [
      'Do not pay until you see and sign a verified contract',
      'Verify POEA license at poea.gov.ph/agencySearch',
      'Report to POEA at (02) 8722-1144',
      'Contact OWWA at owwa.gov.ph or hotline 1348',
    ],
    officialResource: 'POEA: poea.gov.ph · Hotline: (02) 8722-1144 · OWWA: 1348',
  },
  {
    id: 'fake-donation',
    category: 'donation',
    title: 'Fake calamity or charity donation campaign',
    emoji: '❤️',
    risk: 'high',
    reportCount: 98,
    lastSeen: 'Mar 2026',
    status: 'reported_by_users',
    exampleMessage: '"Please help po! Sunog sa Pampanga, maraming biktima. Donate na po sa: GCash 09221234567 - Maria Santos. Urgent po, walang pagkain ang mga bata."',
    redFlags: [
      'Personal GCash account instead of official org account',
      'No verifiable charity registration',
      'Emotional urgency with vague details',
      'No news coverage or official verification',
    ],
    whatToDo: [
      'Donate through verified channels only (DSWD, Red Cross PH, Caritas)',
      'Search the charity on SEC for registration',
      'Check if the calamity is reported in news',
      'Never donate to a personal GCash for "calamity relief"',
    ],
    officialResource: 'DSWD: dswd.gov.ph · Red Cross PH: redcross.org.ph · PCSO: pcso.gov.ph',
  },
  {
    id: 'phishing-website',
    category: 'website',
    title: 'Phishing / fake shop website',
    emoji: '🌐',
    risk: 'high',
    reportCount: 143,
    lastSeen: 'Apr 2026',
    status: 'under_review',
    exampleMessage: 'URLs like: shopee-promo-ph.com, gcash-rewards.net, bdo-online-banking.xyz, mmda-gov.ph.com',
    redFlags: [
      'Domain mimics a real brand but is NOT the official domain',
      'Uses hyphens or extra words (shopee-promo, gcash-rewards)',
      'No HTTPS or suspicious certificate',
      'Asks for login credentials or card details immediately',
      'Too-good-to-be-true promo or reward',
    ],
    whatToDo: [
      'Always type the official URL directly — do not click links from SMS or DMs',
      'Check for exact domain: Shopee = shopee.ph, GCash = gcash.com',
      'Never enter credentials on a site you reached via an SMS link',
      'Report phishing at dict.gov.ph or ntc.gov.ph',
    ],
    officialResource: 'DICT: dict.gov.ph · NTC Anti-Phishing: ntc.gov.ph · PNP ACG: acg.pnp.gov.ph',
  },
  {
    id: 'loan-upfront-fee',
    category: 'loan',
    title: 'Loan / lending upfront fee or harassment',
    emoji: '💸',
    risk: 'high',
    reportCount: 201,
    lastSeen: 'Apr 2026',
    status: 'pattern_detected',
    exampleMessage: '"Approved ka na po ng ₱50,000 loan! Kailangan lang ng ₱3,000 processing fee via GCash para ma-release ang pera. Bayad ngayon, matatanggap mo bukas."',
    redFlags: [
      'Fee required before loan is released',
      'Not registered with SEC or BSP as lending company',
      'No loan agreement or contract shown',
      'Harassing collection tactics',
      'Personal GCash for "processing fee"',
    ],
    whatToDo: [
      'Never pay processing fees before receiving loan proceeds',
      'Verify lending company at sec.gov.ph or bsp.gov.ph',
      'Report harassment to NPC (privacy.gov.ph) and PNP',
      'Report illegal lending to SEC at (02) 8818-5544',
    ],
    officialResource: 'SEC: sec.gov.ph · BSP: bsp.gov.ph · NPC: privacy.gov.ph · PNP: pnp.gov.ph',
  },
  {
    id: 'romance-scam',
    category: 'romance',
    title: 'Online romance scam / love bombing',
    emoji: '💔',
    risk: 'high',
    reportCount: 77,
    lastSeen: 'Mar 2026',
    status: 'reported_by_users',
    exampleMessage: '"Hi po, I am US soldier stationed abroad. Nalaman ko ang profile mo at instantly na-attract ako. Magpadala po sana ako ng regalo pero na-stuck sa customs, kailangan mo lang bayaran ang customs fee ng $500..."',
    redFlags: [
      'Foreign contact who quickly falls in love online',
      'Refuses video calls or always has excuses not to meet',
      'Claims to be military, doctor, or engineer abroad',
      'Asks for money for customs, emergencies, or travel',
      'Love bombing — excessive affection very quickly',
    ],
    whatToDo: [
      'Never send money to someone you have not met in person',
      'Reverse image search their profile photos',
      'Demand a live video call — scammers usually refuse',
      'Report to NBI Cybercrime at cybercrime.nbi.gov.ph',
    ],
    officialResource: 'NBI Cybercrime: cybercrime.nbi.gov.ph · PNP ACG: acg.pnp.gov.ph',
  },
  {
    id: 'property-deposit-scam',
    category: 'property',
    title: 'Land / property deposit fraud',
    emoji: '🏠',
    risk: 'high',
    reportCount: 65,
    lastSeen: 'Feb 2026',
    status: 'reported_by_users',
    exampleMessage: '"Sir/Ma\'am, yung lote sa Cavite, 300sqm, ₱2M lang. Mag-deposit na po kayo ng ₱100K para ma-hold. Title at docs ipapakita ko pagkatapos ng payment. Bayaran sa personal account."',
    redFlags: [
      'Deposit required before showing title or documents',
      'Payment to personal account — not escrow or developer',
      'Price significantly below market value',
      'Urgency — "other buyers are interested"',
      'Seller not registered with HLURB / DHSUD',
    ],
    whatToDo: [
      'Never pay a deposit before verifying title at the Registry of Deeds',
      'Verify developer with DHSUD at dhsud.gov.ph',
      'Use a licensed real estate broker (verify at prc.gov.ph)',
      'Report to DHSUD at (02) 8234-4000',
    ],
    officialResource: 'DHSUD: dhsud.gov.ph · Registry of Deeds · PRC (brokers): prc.gov.ph',
  },
]

const ALL_CATEGORIES = Object.entries(CAT_LABELS) as [ScamCategory, { emoji: string; label: string }][]

export default function LibraryPage() {
  const [search, setSearch]           = useState('')
  const [filterCat, setFilterCat]     = useState<ScamCategory | 'all'>('all')
  const [filterRisk, setFilterRisk]   = useState<RiskLevel | 'all'>('all')
  const [expandedId, setExpandedId]   = useState<string | null>(null)

  const filtered = LIBRARY.filter(entry => {
    const matchSearch = !search.trim() ||
      entry.title.toLowerCase().includes(search.toLowerCase()) ||
      entry.exampleMessage.toLowerCase().includes(search.toLowerCase())
    const matchCat  = filterCat  === 'all' || entry.category === filterCat
    const matchRisk = filterRisk === 'all' || entry.risk === filterRisk
    return matchSearch && matchCat && matchRisk
  })

  function toggleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id)
  }

  async function share(entry: ScamEntry) {
    const text = `⚠️ ${entry.title}\n\nRisk: ${RISK_LABEL[entry.risk]}\n${entry.redFlags.map(f => `• ${f}`).join('\n')}\n\nStay safe — LegitCheck PH: https://legitcheck.ph/library`
    if (navigator.share) {
      await navigator.share({ title: entry.title, text })
    } else {
      await navigator.clipboard.writeText(text)
    }
  }

  return (
    <div className="min-h-screen bg-paper-2">
      <header className="border-b border-line bg-paper sticky top-0 z-40 px-4 py-4 flex items-center gap-3">
        <Link href="/" className="text-ink-3 hover:text-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-baseline gap-1 flex-1">
          <span className="text-lg font-bold text-ink tracking-tight">LegitCheck</span>
          <span className="text-lg font-light text-ink-3">PH</span>
        </div>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-teal-light border border-brand-teal/20 text-brand-teal-dark text-xs font-bold">
          <BookOpen size={10} /> Library
        </span>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Intro */}
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Scam Library</h1>
          <p className="text-sm text-ink-3 mt-1 leading-relaxed">
            Common Philippine scam patterns — what they look like, what the red flags are, and what to do.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search scam types…"
            className="input-base pl-10"
          />
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div>
            <p className="micro-label mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterCat('all')}
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                  filterCat === 'all' ? 'bg-ink text-white border-ink' : 'bg-paper border-line text-ink-2 hover:bg-paper-2'
                }`}
              >
                All
              </button>
              {ALL_CATEGORIES.map(([id, { emoji, label }]) => (
                <button
                  key={id}
                  onClick={() => setFilterCat(filterCat === id ? 'all' : id)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                    filterCat === id ? 'bg-ink text-white border-ink' : 'bg-paper border-line text-ink-2 hover:bg-paper-2'
                  }`}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="micro-label mb-2">Risk level</p>
            <div className="flex flex-wrap gap-2">
              {[
                { val: 'all' as const,      label: 'All' },
                { val: 'critical' as const, label: 'Critical' },
                { val: 'high' as const,     label: 'High Risk' },
                { val: 'caution' as const,  label: 'Caution' },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  onClick={() => setFilterRisk(filterRisk === val ? 'all' : val)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                    filterRisk === val ? 'bg-ink text-white border-ink' : 'bg-paper border-line text-ink-2 hover:bg-paper-2'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results count */}
        <p className="text-xs text-ink-3 font-medium">{filtered.length} pattern{filtered.length !== 1 ? 's' : ''} found</p>

        {/* Library entries */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="card text-center py-10">
              <p className="text-ink-3 text-sm">No patterns match your search.</p>
              <button onClick={() => { setSearch(''); setFilterCat('all'); setFilterRisk('all') }} className="mt-3 text-sm text-ink-3 underline hover:text-ink">
                Clear filters
              </button>
            </div>
          )}

          {filtered.map(entry => {
            const expanded = expandedId === entry.id
            return (
              <div key={entry.id} className="bg-paper border border-line rounded-2xl overflow-hidden">
                {/* Header row */}
                <button
                  onClick={() => toggleExpand(entry.id)}
                  className="w-full flex items-start gap-3 px-4 py-4 text-left hover:bg-paper-2 transition-colors"
                >
                  <span className="text-2xl flex-shrink-0">{entry.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${RISK_BADGE[entry.risk]}`}>
                        {RISK_LABEL[entry.risk]}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[entry.status]}`}>
                        {STATUS_LABEL[entry.status]}
                      </span>
                      <span className="text-[10px] text-ink-3">{CAT_LABELS[entry.category].label}</span>
                    </div>
                    <p className="font-semibold text-ink text-sm leading-snug">{entry.title}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-ink-3">
                      <span>🚨 {entry.reportCount} reports</span>
                      <span>🕐 Last seen {entry.lastSeen}</span>
                    </div>
                  </div>
                  {expanded ? <ChevronUp size={16} className="text-ink-3 flex-shrink-0 mt-1" /> : <ChevronDown size={16} className="text-ink-3 flex-shrink-0 mt-1" />}
                </button>

                {/* Expanded details */}
                {expanded && (
                  <div className="border-t border-line px-4 py-4 space-y-4 animate-slide-down">

                    {/* Example message */}
                    <div>
                      <p className="micro-label mb-2">Example message</p>
                      <div className="bg-paper-2 border border-line rounded-xl px-3.5 py-3">
                        <p className="text-sm text-ink-2 leading-relaxed italic">{entry.exampleMessage}</p>
                      </div>
                    </div>

                    {/* Red flags */}
                    <div>
                      <p className="micro-label mb-2 text-brand-red-dark">Red flags</p>
                      <div className="space-y-1.5">
                        {entry.redFlags.map((flag, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-red mt-2 flex-shrink-0" />
                            <p className="text-sm text-ink-2 leading-snug">{flag}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* What to do */}
                    <div>
                      <p className="micro-label mb-2 text-brand-green-dark">What to do</p>
                      <div className="space-y-1.5">
                        {entry.whatToDo.map((step, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className="w-5 h-5 rounded-full bg-brand-green-light border border-brand-green/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-[9px] font-bold text-brand-green-dark">{i + 1}</span>
                            </div>
                            <p className="text-sm text-ink-2 leading-snug">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Official resource */}
                    {entry.officialResource && (
                      <div className="bg-brand-teal-light border border-brand-teal/20 rounded-xl px-3.5 py-3">
                        <p className="micro-label mb-1 text-brand-teal-dark">Official resources</p>
                        <p className="text-xs text-brand-teal-dark leading-relaxed">{entry.officialResource}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <Link
                        href="/buyer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-ink text-white text-xs font-semibold px-3 py-2.5 rounded-xl hover:opacity-90 transition-all"
                      >
                        Check something <ArrowRight size={11} />
                      </Link>
                      <Link
                        href="/report"
                        className="flex items-center justify-center gap-1.5 bg-brand-red-light border border-brand-red/20 text-brand-red-dark text-xs font-semibold px-3 py-2.5 rounded-xl hover:bg-brand-red hover:text-white transition-all"
                      >
                        <Flag size={11} /> Report
                      </Link>
                      <button
                        onClick={() => share(entry)}
                        className="flex items-center justify-center gap-1.5 bg-paper-2 border border-line text-ink-2 text-xs font-medium px-3 py-2.5 rounded-xl hover:bg-paper-3 transition-all"
                      >
                        <Share2 size={11} /> Share
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="card text-center py-6 space-y-3">
          <p className="text-sm font-semibold text-ink">See something we missed?</p>
          <p className="text-sm text-ink-3 leading-relaxed">Help grow the library by reporting a new scam pattern.</p>
          <Link href="/report" className="inline-flex items-center gap-2 bg-brand-red text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all text-sm">
            <Flag size={13} /> Submit a report
          </Link>
        </div>

        <div className="pb-8" />
      </div>
    </div>
  )
}
