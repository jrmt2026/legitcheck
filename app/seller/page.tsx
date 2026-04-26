'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, Check, ChevronRight, BadgeCheck, Loader2, ExternalLink, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

// ── Seller Appeals (existing) ─────────────────────────────────────────────────

const ISSUES = [
  {
    icon: '🚫', en: 'I was wrongly reported', tl: 'Maling-mali ang report sa akin',
    proof: ['Government-issued ID', 'Official shop or page link', 'Chat history proving legitimate transaction'],
    appeal: 'I am formally disputing a report I believe is inaccurate. My shop is legitimate and all transactions are documented. I respectfully request a formal review and removal of the incorrect flag.',
  },
  {
    icon: '🪪', en: 'Name mismatch issue', tl: 'Hindi tugma ang aking pangalan',
    proof: ['Government ID matching payment account', 'Bank account ownership proof', 'Business registration (if applicable)'],
    appeal: 'There appears to be a name discrepancy on my account. I can provide government-issued ID and bank documentation proving my identity matches my payment account and shop profile.',
  },
  {
    icon: '📦', en: 'Delayed delivery dispute', tl: 'Naantala ang delivery',
    proof: ['Shipping receipt and tracking number', 'Proof of dispatch date', 'Courier communication records', 'Buyer chat history'],
    appeal: 'The delivery was delayed due to logistics issues beyond my control. I have dispatch proof and courier tracking records attached. I am committed to full resolution for the buyer.',
  },
  {
    icon: '⚠️', en: 'Someone copied my page', tl: 'May gumaya sa aking page/shop',
    proof: ['Original shop creation date proof', 'Official receipts predating fake page', 'Screenshots of the fraudulent page'],
    appeal: 'A fraudulent page is impersonating my shop, using my name, photos, and content to scam buyers. I request urgent takedown of the impersonating page and a flag on the fraudulent account.',
  },
  {
    icon: '💳', en: 'Buyer sent fake payment proof', tl: 'Peke ang payment proof ng buyer',
    proof: ['Actual bank statement showing no deposit', 'Screenshot of fake or uncleared payment', 'Full chat history with buyer'],
    appeal: 'The buyer submitted a falsified payment proof. My actual bank record shows no corresponding deposit. I request the buyer account be flagged and investigated for fraud.',
  },
  {
    icon: '🔍', en: 'Client asking suspicious terms', tl: 'Kahina-hinalang tuntunin ng kliyente',
    proof: ['Screenshots of suspicious client requests', 'Client identity details provided', 'Any agreements or contracts offered'],
    appeal: 'A client approached me with terms I believe are suspicious or potentially fraudulent. I am documenting this interaction for record and possible escalation to authorities.',
  },
]

const BADGE_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  pending:           { label: 'Pending Review',          color: 'text-ink-3',           desc: 'We received your application. Our team will review it within 3–5 business days.' },
  id_verified:       { label: 'ID Verified',             color: 'text-blue-600',        desc: 'Your identity has been confirmed. Apply for Business Verification to unlock the full badge.' },
  business_verified: { label: 'Business Verified',       color: 'text-brand-green-dark', desc: 'Your DTI/SEC registration is confirmed. Share your badge link with buyers!' },
  fully_verified:    { label: 'LegitCheck Verified ✓',   color: 'text-brand-green-dark', desc: 'Full verification complete. You are listed as a trusted seller on LegitCheck PH.' },
  rejected:          { label: 'Application Rejected',    color: 'text-brand-red-dark',  desc: 'Your application was not approved. See reason below.' },
}

const PLATFORM_OPTIONS = ['Facebook', 'Shopee', 'Lazada', 'Instagram', 'TikTok', 'Carousell', 'Other']

// ── Component ──────────────────────────────────────────────────────────────────

type Tab = 'appeals' | 'verify'

export default function SellerPage() {
  const [tab, setTab]           = useState<Tab>('verify')
  const [selected, setSelected] = useState<number | null>(null)
  const [copied, setCopied]     = useState(false)

  // Verification form state
  const [vStatus, setVStatus]           = useState<'loading' | 'none' | 'exists'>('loading')
  const [existingBadge, setExistingBadge] = useState<any>(null)
  const [submitting, setSubmitting]     = useState(false)

  const [sellerName,      setSellerName]      = useState('')
  const [shopName,        setShopName]        = useState('')
  const [selectedPlats,   setSelectedPlats]   = useState<string[]>([])
  const [handles,         setHandles]         = useState('')
  const [contactNumber,   setContactNumber]   = useState('')
  const [dtiNumber,       setDtiNumber]       = useState('')
  const [secNumber,       setSecNumber]       = useState('')
  const [description,     setDescription]     = useState('')

  useEffect(() => {
    fetch('/api/seller/apply')
      .then(r => r.json())
      .then(d => {
        if (d.status === 'exists') { setVStatus('exists'); setExistingBadge(d.verification) }
        else setVStatus('none')
      })
      .catch(() => setVStatus('none'))
  }, [])

  function togglePlatform(p: string) {
    setSelectedPlats(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  async function submitVerification() {
    if (!sellerName.trim()) { toast.error('Please enter your name'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/seller/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_name:      sellerName,
          shop_name:        shopName || undefined,
          platforms:        selectedPlats.map(p => p.toLowerCase()),
          platform_handles: handles.split('\n').map(h => h.trim()).filter(Boolean),
          contact_number:   contactNumber || undefined,
          dti_number:       dtiNumber    || undefined,
          sec_number:       secNumber    || undefined,
          description:      description  || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Application submitted!')
        setVStatus('exists')
        setExistingBadge({ badge_level: 'pending', public_slug: data.public_slug })
      } else if (res.status === 401) {
        toast.error('Please log in to apply for verification.')
      } else {
        toast.error(data.error || 'Submission failed')
      }
    } catch { toast.error('Network error') }
    setSubmitting(false)
  }

  async function copyAppeal(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Appeal copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Appeal detail ──────────────────────────────────────────────────────────
  if (selected !== null && tab === 'appeals') {
    const issue = ISSUES[selected]
    return (
      <div className="min-h-screen bg-paper-2">
        <header className="border-b border-line bg-paper px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
          <button onClick={() => setSelected(null)} className="text-ink-3 hover:text-ink transition-colors p-1 -ml-1">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-medium text-ink">LegitCheck</span>
            <span className="text-base font-light text-ink-2">PH</span>
          </div>
        </header>
        <div className="max-w-lg mx-auto px-4 py-6 space-y-5 animate-slide-up">
          <div>
            <div className="text-xs font-mono text-ink-3 uppercase tracking-widest mb-1">How to fix</div>
            <h1 className="text-xl font-medium text-ink">{issue.icon} {issue.en}</h1>
          </div>
          <div className="card">
            <div className="sec-label">Prepare these</div>
            <div className="space-y-2 mt-2">
              {issue.proof.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-md bg-brand-green-light border border-brand-green/20 flex items-center justify-center flex-shrink-0">
                    <Check size={10} className="text-brand-green-dark" strokeWidth={3} />
                  </div>
                  <span className="text-sm text-ink-2">{p}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="sec-label">Appeal draft</div>
            <p className="text-sm text-ink-2 leading-relaxed bg-paper-2 rounded-xl p-3 border border-line mt-2">{issue.appeal}</p>
          </div>
          <button
            onClick={() => copyAppeal(issue.appeal)}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border text-sm font-medium transition-all active:scale-95 ${
              copied ? 'bg-brand-green-light border-brand-green/20 text-brand-green-dark' : 'bg-paper border-line text-ink-2 hover:bg-ink hover:text-white hover:border-ink'
            }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy appeal'}
          </button>
          <div className="border-l-2 border-line pl-3 py-1">
            <p className="text-xs text-ink-3 leading-relaxed">
              This is a guide only. Not a final legal, bank, platform, government, or law-enforcement decision.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper-2">
      <header className="border-b border-line bg-paper px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <Link href="/dashboard" className="text-ink-3 hover:text-ink transition-colors p-1 -ml-1">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-baseline gap-1">
          <span className="text-base font-medium text-ink">LegitCheck</span>
          <span className="text-base font-light text-ink-2">PH</span>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-line bg-paper px-4">
        <div className="flex max-w-lg mx-auto">
          {(['verify', 'appeals'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? 'border-ink text-ink' : 'border-transparent text-ink-3 hover:text-ink-2'
              }`}
            >
              {t === 'verify' ? '🏅 Get Verified' : '🛡 Seller Appeals'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">

        {/* ── VERIFY TAB ──────────────────────────────────────────────────── */}
        {tab === 'verify' && (
          <div className="space-y-5 animate-slide-up">
            <div>
              <h1 className="text-xl font-semibold text-ink">Get Verified as a Legit Seller</h1>
              <p className="text-sm text-ink-3 mt-1 leading-relaxed">
                A LegitCheck badge tells buyers your shop is real. Share your badge link in your bio, listings, or chat.
              </p>
            </div>

            {/* Badge levels explainer */}
            <div className="bg-paper border border-line rounded-2xl divide-y divide-line">
              {[
                { icon: '🪪', label: 'ID Verified',           desc: 'Submit a valid government ID' },
                { icon: '📋', label: 'Business Verified',     desc: 'Add your DTI or SEC registration number' },
                { icon: '✅', label: 'LegitCheck Verified',   desc: 'Full review by our team — highest trust badge' },
              ].map((b, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3.5">
                  <span className="text-xl flex-shrink-0">{b.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-ink">{b.label}</p>
                    <p className="text-xs text-ink-3 mt-0.5">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Status / Form */}
            {vStatus === 'loading' && (
              <div className="flex items-center justify-center py-10 text-ink-3">
                <Loader2 size={20} className="animate-spin" />
              </div>
            )}

            {vStatus === 'exists' && existingBadge && (() => {
              const b = BADGE_LABELS[existingBadge.badge_level] || BADGE_LABELS.pending
              return (
                <div className="card space-y-3">
                  <div className="flex items-center gap-3">
                    <BadgeCheck size={22} className={b.color} />
                    <div>
                      <p className={`text-base font-semibold ${b.color}`}>{b.label}</p>
                      <p className="text-xs text-ink-3 mt-0.5">{b.desc}</p>
                    </div>
                  </div>
                  {existingBadge.rejection_reason && (
                    <p className="text-sm text-brand-red-dark bg-brand-red-light rounded-xl px-3 py-2">
                      {existingBadge.rejection_reason}
                    </p>
                  )}
                  {existingBadge.public_slug && existingBadge.badge_level !== 'pending' && existingBadge.badge_level !== 'rejected' && (
                    <Link
                      href={`/verify/${existingBadge.public_slug}`}
                      target="_blank"
                      className="flex items-center gap-2 text-sm text-ink-2 hover:text-ink transition-colors"
                    >
                      <ExternalLink size={14} />
                      View your badge page
                    </Link>
                  )}
                  {existingBadge.public_slug && (
                    <div className="bg-paper-2 border border-line rounded-xl px-3 py-2">
                      <p className="text-xs text-ink-3 mb-1">Share this link with buyers:</p>
                      <p className="text-sm text-ink font-mono break-all">
                        {typeof window !== 'undefined' ? window.location.origin : 'https://legitcheck-ph.vercel.app'}/verify/{existingBadge.public_slug}
                      </p>
                    </div>
                  )}
                </div>
              )
            })()}

            {vStatus === 'none' && (
              <div className="space-y-4">
                <div className="card space-y-4">
                  <div>
                    <label className="sec-label">Your Full Name *</label>
                    <input value={sellerName} onChange={e => setSellerName(e.target.value)}
                      placeholder="As it appears on your ID"
                      className="input-base" style={{ fontSize: '16px' }} />
                  </div>
                  <div>
                    <label className="sec-label">Shop / Brand Name</label>
                    <input value={shopName} onChange={e => setShopName(e.target.value)}
                      placeholder="e.g. BeautyStore PH"
                      className="input-base" style={{ fontSize: '16px' }} />
                  </div>
                  <div>
                    <label className="sec-label">Where do you sell?</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {PLATFORM_OPTIONS.map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => togglePlatform(p)}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                            selectedPlats.includes(p)
                              ? 'bg-ink text-white border-ink'
                              : 'bg-paper border-line text-ink-2 hover:border-ink-3'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="sec-label">Shop Links / Handles (one per line)</label>
                    <textarea value={handles} onChange={e => setHandles(e.target.value)}
                      placeholder={"facebook.com/myshop\n@myshop on Shopee"}
                      rows={3}
                      className="input-base resize-none" style={{ fontSize: '16px' }} />
                  </div>
                  <div>
                    <label className="sec-label">Contact Number</label>
                    <input value={contactNumber} onChange={e => setContactNumber(e.target.value)}
                      placeholder="09XXXXXXXXX"
                      className="input-base" style={{ fontSize: '16px' }} />
                  </div>
                </div>

                <div className="card space-y-4">
                  <p className="text-sm font-medium text-ink">Business Registration (optional but speeds up review)</p>
                  <div>
                    <label className="sec-label">DTI Registration Number</label>
                    <input value={dtiNumber} onChange={e => setDtiNumber(e.target.value)}
                      placeholder="DTI-XXXXXXXXXX"
                      className="input-base" style={{ fontSize: '16px' }} />
                  </div>
                  <div>
                    <label className="sec-label">SEC Registration Number</label>
                    <input value={secNumber} onChange={e => setSecNumber(e.target.value)}
                      placeholder="CS-XXXXXXXXXX"
                      className="input-base" style={{ fontSize: '16px' }} />
                  </div>
                  <div>
                    <label className="sec-label">Brief description of what you sell</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)}
                      placeholder="e.g. Legit Korean skincare reseller, 3 years in business"
                      rows={3}
                      className="input-base resize-none" style={{ fontSize: '16px' }} />
                  </div>
                </div>

                <button
                  onClick={submitVerification}
                  disabled={submitting || !sellerName.trim()}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-ink text-white rounded-2xl text-base font-semibold disabled:opacity-40 active:scale-[0.98] transition-all"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <BadgeCheck size={16} />}
                  {submitting ? 'Submitting…' : 'Apply for Verification'}
                </button>
                <p className="text-xs text-ink-3 text-center">
                  Our team will review your application within 3–5 business days.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── APPEALS TAB ─────────────────────────────────────────────────── */}
        {tab === 'appeals' && (
          <div className="space-y-4 animate-slide-up">
            <div>
              <h1 className="text-xl font-medium text-ink">Seller Help</h1>
              <p className="text-sm text-ink-3 mt-1">What's your situation?</p>
            </div>
            <div className="space-y-2">
              {ISSUES.map((issue, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className="w-full card flex items-center gap-3 hover:border-ink-3/40 transition-colors group text-left active:scale-[0.99]"
                >
                  <span className="text-xl flex-shrink-0">{issue.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink">{issue.en}</div>
                    <div className="text-xs text-ink-3 mt-0.5">{issue.tl}</div>
                  </div>
                  <ChevronRight size={14} className="text-ink-3 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
