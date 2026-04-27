'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Flag, Upload, X, CheckCircle, Shield, AlertTriangle, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

type Category =
  | 'online_seller' | 'sms_scam' | 'investment' | 'donation'
  | 'job_agency' | 'website' | 'loan' | 'romance' | 'marketplace'
  | 'property' | 'other'

const CATEGORIES: { id: Category; emoji: string; label: string; desc: string }[] = [
  { id: 'online_seller', emoji: '🛍️', label: 'Online Seller',        desc: 'Facebook, Shopee, or marketplace sellers'  },
  { id: 'sms_scam',      emoji: '📱', label: 'SMS / Text Scam',      desc: 'Suspicious text messages'                  },
  { id: 'investment',    emoji: '💰', label: 'Investment Scam',       desc: 'Fake high-return investments'              },
  { id: 'donation',      emoji: '❤️', label: 'Fake Donation',         desc: 'Fraudulent charity or relief drives'       },
  { id: 'job_agency',    emoji: '✈️', label: 'Job / OFW Agency',      desc: 'Overseas job scams'                        },
  { id: 'website',       emoji: '🌐', label: 'Phishing Website',      desc: 'Fake websites or links'                    },
  { id: 'loan',          emoji: '💸', label: 'Loan / Lending Scam',   desc: 'Predatory or fake lenders'                 },
  { id: 'romance',       emoji: '💔', label: 'Romance Scam',          desc: 'Online relationship scams'                 },
  { id: 'marketplace',   emoji: '🏪', label: 'Marketplace Listing',   desc: 'OLX, Carousell listings'                   },
  { id: 'property',      emoji: '🏠', label: 'Property / Land Deal',  desc: 'Real estate fraud'                         },
  { id: 'other',         emoji: '⚠️', label: 'Other',                 desc: 'Something else'                            },
]

const PLATFORMS = [
  'Facebook / Messenger', 'Instagram', 'Shopee', 'Lazada', 'TikTok Shop',
  'OLX', 'Carousell', 'SMS / Text', 'WhatsApp', 'Viber', 'Twitter / X',
  'Email', 'Website', 'Other',
]

type FormStep = 'category' | 'details' | 'evidence' | 'done'

const WIZARD_STEPS: { id: FormStep; label: string }[] = [
  { id: 'category', label: 'What'     },
  { id: 'details',  label: 'Details'  },
  { id: 'evidence', label: 'Evidence' },
]

export default function ReportPage() {
  const [formStep, setFormStep]               = useState<FormStep>('category')
  const [category, setCategory]               = useState<Category | null>(null)
  const [identifier, setIdentifier]           = useState('')
  const [platform, setPlatform]               = useState('')
  const [description, setDescription]         = useState('')
  const [moneySent, setMoneySent]             = useState<boolean | null>(null)
  const [amountLost, setAmountLost]           = useState('')
  const [dateEncountered, setDateEncountered] = useState('')
  const [contactEmail, setContactEmail]       = useState('')
  const [consent, setConsent]                 = useState(false)
  const [screenshots, setScreenshots]         = useState<File[]>([])
  const [previews, setPreviews]               = useState<string[]>([])
  const [submitting, setSubmitting]           = useState(false)

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const toAdd = files.slice(0, 4 - screenshots.length)
    setScreenshots(prev => [...prev, ...toAdd])
    setPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))])
    e.target.value = ''
  }

  function removeScreenshot(i: number) {
    URL.revokeObjectURL(previews[i])
    setScreenshots(prev => prev.filter((_, idx) => idx !== i))
    setPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit() {
    if (!category || !description.trim() || !consent) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/report-scam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category, identifier, platform, description,
          moneySent,
          amountLost: amountLost ? Number(amountLost) : undefined,
          dateEncountered, contactEmail, consent,
        }),
      })
      if (res.ok) {
        setFormStep('done')
      } else {
        toast.error('Submission failed. Please try again.')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const stepIndex = WIZARD_STEPS.findIndex(s => s.id === formStep)

  function goBack() {
    if (formStep === 'details')  setFormStep('category')
    if (formStep === 'evidence') setFormStep('details')
  }

  // ── Done screen ────────────────────────────────────────────────────────────
  if (formStep === 'done') {
    return (
      <div className="min-h-screen bg-ink flex flex-col">
        <header className="px-4 py-4">
          <span className="text-lg font-bold text-white tracking-tight">
            LegitCheck <span className="font-light opacity-50">PH</span>
          </span>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center max-w-md mx-auto py-12 animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-brand-green/20 border-2 border-brand-green/30 flex items-center justify-center mb-6">
            <CheckCircle size={40} className="text-brand-green" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">Report received. Salamat!</h1>
          <p className="text-base text-white/60 leading-relaxed mb-2">
            Your report is now <strong className="text-white">Pending Review</strong> by our team.
          </p>
          <p className="text-sm text-white/40 leading-relaxed mb-8">
            We review every report before it affects anyone. Anonymized patterns warn others — your personal info is never published.
          </p>
          <div className="bg-white/10 border border-white/10 rounded-2xl p-4 mb-8 text-left w-full">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Report status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-yellow" />
              <span className="text-sm font-medium text-white">Pending Review</span>
            </div>
            <p className="text-xs text-white/40 pl-4 mt-1">Our team will review within 24–48 hours.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Link href="/buyer" className="flex-1 inline-flex items-center justify-center gap-2 bg-white text-ink font-semibold px-5 py-3.5 rounded-2xl hover:opacity-90 transition-all text-sm">
              Check something else
            </Link>
            <Link href="/library" className="flex-1 inline-flex items-center justify-center gap-2 bg-white/10 text-white font-medium px-5 py-3.5 rounded-2xl hover:bg-white/20 transition-all text-sm">
              Browse scam library
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Wizard ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-paper-2">

      {/* Header + step progress — single sticky block */}
      <div className="sticky top-0 z-40">
        <header className="bg-ink px-4 py-4 flex items-center gap-3">
          {formStep === 'category' ? (
            <Link href="/" className="text-white/60 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
          ) : (
            <button onClick={goBack} className="text-white/60 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </button>
          )}
          <span className="text-lg font-bold text-white tracking-tight flex-1">
            LegitCheck <span className="font-light opacity-50">PH</span>
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-red/20 text-red-300 text-xs font-bold">
            <Flag size={10} /> Report
          </span>
        </header>

        {/* Step indicator */}
        <div className="bg-ink border-b border-white/10 px-4 pb-4 pt-1">
          <div className="flex items-center max-w-xs">
            {WIZARD_STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <button
                  className="flex items-center gap-2"
                  onClick={() => i < stepIndex && setFormStep(s.id)}
                  disabled={i >= stepIndex}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                    i < stepIndex  ? 'bg-brand-green text-white' :
                    i === stepIndex ? 'bg-white text-ink' :
                    'bg-white/10 text-white/40'
                  }`}>
                    {i < stepIndex ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs font-medium transition-all ${
                    i === stepIndex ? 'text-white' : 'text-white/40'
                  }`}>{s.label}</span>
                </button>
                {i < WIZARD_STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-3 transition-all ${i < stepIndex ? 'bg-brand-green/50' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* ── Step 1: Category ──────────────────────────────────────────── */}
        {formStep === 'category' && (
          <div className="animate-fade-in space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-ink tracking-tight">What are you reporting?</h1>
              <p className="text-sm text-ink-3 mt-1">Choose the type of scam or suspicious activity.</p>
            </div>

            <div className="space-y-2">
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCategory(prev => prev === c.id ? null : c.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border text-left transition-all ${
                    category === c.id
                      ? 'border-brand-red bg-brand-red-light'
                      : 'border-line bg-paper hover:border-ink-3 hover:bg-paper-2'
                  }`}
                >
                  <span className="text-2xl flex-shrink-0">{c.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${category === c.id ? 'text-brand-red-dark' : 'text-ink'}`}>{c.label}</p>
                    <p className={`text-xs mt-0.5 ${category === c.id ? 'text-brand-red-dark/70' : 'text-ink-3'}`}>{c.desc}</p>
                  </div>
                  {category === c.id && <CheckCircle size={18} className="text-brand-red flex-shrink-0" />}
                </button>
              ))}
            </div>

            <button
              onClick={() => category && setFormStep('details')}
              disabled={!category}
              className="w-full bg-ink text-white text-base font-bold rounded-2xl py-4 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* ── Step 2: Details ───────────────────────────────────────────── */}
        {formStep === 'details' && (
          <div className="animate-fade-in space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-ink tracking-tight">Tell us what happened</h1>
              <p className="text-sm text-ink-3 mt-1">The more detail, the better we can protect others.</p>
            </div>

            <div className="bg-brand-blue-light border border-brand-blue/20 rounded-2xl px-4 py-3 flex items-start gap-3">
              <Shield size={16} className="text-brand-blue flex-shrink-0 mt-0.5" />
              <p className="text-sm text-brand-blue-dark leading-snug">
                <strong>Moderated</strong> — held as Pending Review until verified. We never auto-accuse anyone.
              </p>
            </div>

            <div>
              <label className="sec-label">Suspicious link, profile, account, or phone number</label>
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="e.g. facebook.com/fakeseller, 09171234567"
                className="input-base"
              />
            </div>

            <div>
              <label className="sec-label">Platform</label>
              <select value={platform} onChange={e => setPlatform(e.target.value)} className="input-base">
                <option value="">Select platform…</option>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="sec-label">Describe what happened <span className="text-brand-red">*</span></label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What did the scammer say or do? Include the message, offer, or threat."
                rows={5}
                className="input-base resize-none"
              />
              <div className="mt-1.5 flex items-center gap-1.5">
                <Lock size={11} className="text-ink-3" />
                <p className="text-xs text-ink-3">Do not include OTPs, PINs, passwords, or card numbers.</p>
              </div>
            </div>

            <div>
              <label className="sec-label">When did this happen?</label>
              <input
                type="date"
                value={dateEncountered}
                onChange={e => setDateEncountered(e.target.value)}
                className="input-base"
              />
            </div>

            <div>
              <label className="sec-label">Was money sent?</label>
              <div className="flex gap-3">
                {[
                  { val: true,  label: 'Yes, I sent money'  },
                  { val: false, label: 'No, I did not send' },
                ].map(({ val, label }) => (
                  <button
                    key={label}
                    onClick={() => setMoneySent(val)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      moneySent === val
                        ? val
                          ? 'border-brand-red bg-brand-red-light text-brand-red-dark'
                          : 'border-brand-green bg-brand-green-light text-brand-green-dark'
                        : 'border-line bg-paper text-ink-2 hover:bg-paper-2'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {moneySent && (
              <div className="animate-slide-down">
                <label className="sec-label">Amount lost (₱)</label>
                <input
                  type="number"
                  value={amountLost}
                  onChange={e => setAmountLost(e.target.value)}
                  placeholder="e.g. 5000"
                  className="input-base"
                />
              </div>
            )}

            <button
              onClick={() => description.trim() && setFormStep('evidence')}
              disabled={!description.trim()}
              className="w-full bg-ink text-white text-base font-bold rounded-2xl py-4 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* ── Step 3: Evidence ──────────────────────────────────────────── */}
        {formStep === 'evidence' && (
          <div className="animate-fade-in space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-ink tracking-tight">Add evidence</h1>
              <p className="text-sm text-ink-3 mt-1">Screenshots help our team verify reports faster.</p>
            </div>

            <div>
              <label className="sec-label">Screenshots (optional, up to 4)</label>
              <input type="file" accept="image/*" multiple className="hidden" id="report-upload" onChange={handleFiles} />
              {screenshots.length < 4 && (
                <label
                  htmlFor="report-upload"
                  className="w-full flex items-center justify-center gap-3 border-2 border-dashed border-line rounded-2xl py-6 text-ink-3 hover:border-ink-3 hover:bg-paper transition-all cursor-pointer"
                >
                  <Upload size={18} />
                  <span className="text-sm font-medium">Upload screenshots</span>
                </label>
              )}
              {screenshots.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {screenshots.map((_, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden border border-line group">
                      <img src={previews[i]} alt={`Screenshot ${i + 1}`} className="w-full h-28 object-cover" />
                      <button
                        onClick={() => removeScreenshot(i)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-ink/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="sec-label">Your email (optional)</label>
              <input
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="For follow-up only — never published"
                className="input-base"
              />
            </div>

            <button onClick={() => setConsent(v => !v)} className="flex items-start gap-3 w-full text-left group">
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                consent ? 'bg-brand-green border-brand-green' : 'border-line bg-paper-2 group-hover:border-ink-3'
              }`}>
                {consent && <CheckCircle size={12} className="text-white" />}
              </div>
              <p className="text-sm text-ink-2 leading-snug">
                I consent to LegitCheck PH using my anonymized report for scam pattern detection.
                I understand this will be reviewed before any action is taken.{' '}
                <span className="text-brand-red">*</span>
              </p>
            </button>

            <div className="bg-brand-yellow-light border border-brand-yellow/20 rounded-2xl px-4 py-3 flex items-start gap-3">
              <AlertTriangle size={14} className="text-brand-yellow-dark flex-shrink-0 mt-0.5" />
              <p className="text-xs text-brand-yellow-dark leading-snug">
                <strong>Important:</strong> False reports are harmful and may be removed. Only report what you genuinely believe to be suspicious.
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!consent || submitting}
              className="w-full bg-brand-red text-white text-base font-bold rounded-2xl py-4 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Flag size={16} />
              {submitting ? 'Submitting…' : 'Submit report'}
            </button>
          </div>
        )}

        <div className="pb-8" />
      </div>
    </div>
  )
}
