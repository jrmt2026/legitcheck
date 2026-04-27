'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Flag, Upload, X, CheckCircle, Shield, AlertTriangle, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

type Category =
  | 'online_seller' | 'sms_scam' | 'investment' | 'donation'
  | 'job_agency' | 'website' | 'loan' | 'romance' | 'marketplace'
  | 'property' | 'other'

const CATEGORIES: { id: Category; emoji: string; label: string }[] = [
  { id: 'online_seller', emoji: '🛍️', label: 'Online Seller'         },
  { id: 'sms_scam',      emoji: '📱', label: 'SMS / Text Scam'       },
  { id: 'investment',    emoji: '💰', label: 'Investment Scam'        },
  { id: 'donation',      emoji: '❤️', label: 'Fake Donation'          },
  { id: 'job_agency',    emoji: '✈️', label: 'Job / OFW Agency'       },
  { id: 'website',       emoji: '🌐', label: 'Website / Phishing Link'},
  { id: 'loan',          emoji: '💸', label: 'Loan / Lending'         },
  { id: 'romance',       emoji: '💔', label: 'Romance Scam'           },
  { id: 'marketplace',   emoji: '🏪', label: 'Marketplace Listing'    },
  { id: 'property',      emoji: '🏠', label: 'Property / Land Deal'   },
  { id: 'other',         emoji: '⚠️', label: 'Other'                  },
]

const PLATFORMS = [
  'Facebook / Messenger', 'Instagram', 'Shopee', 'Lazada', 'TikTok Shop',
  'OLX', 'Carousell', 'SMS / Text', 'WhatsApp', 'Viber', 'Twitter / X',
  'Email', 'Website', 'Other',
]

type FormStep = 'category' | 'details' | 'evidence' | 'done'

export default function ReportPage() {
  const [formStep, setFormStep] = useState<FormStep>('category')
  const [category, setCategory] = useState<Category | null>(null)
  const [identifier, setIdentifier]     = useState('')
  const [platform, setPlatform]         = useState('')
  const [description, setDescription]  = useState('')
  const [moneySent, setMoneySent]       = useState<boolean | null>(null)
  const [amountLost, setAmountLost]     = useState('')
  const [dateEncountered, setDateEncountered] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [consent, setConsent]           = useState(false)
  const [screenshots, setScreenshots]  = useState<File[]>([])
  const [previews, setPreviews]         = useState<string[]>([])
  const [submitting, setSubmitting]     = useState(false)

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
          category,
          identifier,
          platform,
          description,
          moneySent,
          amountLost: amountLost ? Number(amountLost) : undefined,
          dateEncountered,
          contactEmail,
          consent,
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

  if (formStep === 'done') {
    return (
      <div className="min-h-screen bg-paper-2 flex flex-col">
        <header className="border-b border-line bg-paper px-4 py-4">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-ink tracking-tight">LegitCheck</span>
            <span className="text-lg font-light text-ink-3">PH</span>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center max-w-md mx-auto py-12 animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-brand-green-light border-2 border-brand-green/20 flex items-center justify-center mb-6">
            <CheckCircle size={40} className="text-brand-green" />
          </div>
          <h1 className="text-2xl font-bold text-ink mb-3 tracking-tight">Report received. Salamat!</h1>
          <p className="text-base text-ink-3 leading-relaxed mb-2">
            Your report is now <strong className="text-ink">Pending Review</strong> by our moderation team.
          </p>
          <p className="text-sm text-ink-3 leading-relaxed mb-8">
            We review every report before it affects anyone. We use anonymized patterns to warn others — we never publish your personal information or automatically accuse anyone.
          </p>
          <div className="bg-paper border border-line rounded-2xl p-4 mb-8 text-left space-y-2 w-full">
            <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-2">Report status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-yellow" />
              <span className="text-sm font-medium text-ink">Pending Review</span>
            </div>
            <p className="text-xs text-ink-3 pl-4">Our team will review and verify within 24–48 hours.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Link href="/buyer" className="flex-1 inline-flex items-center justify-center gap-2 bg-ink text-white font-semibold px-5 py-3.5 rounded-2xl hover:opacity-90 transition-all text-sm">
              Check something else
            </Link>
            <Link href="/library" className="flex-1 inline-flex items-center justify-center gap-2 bg-paper border border-line text-ink font-medium px-5 py-3.5 rounded-2xl hover:bg-paper-2 transition-all text-sm">
              Browse scam library
            </Link>
          </div>
        </div>
      </div>
    )
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
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-red-light border border-brand-red/20 text-brand-red-dark text-xs font-bold">
          <Flag size={10} /> Report
        </span>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* Intro */}
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Report suspicious activity</h1>
          <p className="text-sm text-ink-3 mt-1 leading-relaxed">
            Help protect other Filipinos. Your report is reviewed before it affects anyone.
          </p>
        </div>

        {/* Moderation notice */}
        <div className="bg-brand-blue-light border border-brand-blue/20 rounded-2xl px-4 py-3 flex items-start gap-3">
          <Shield size={16} className="text-brand-blue flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-brand-blue-dark">Moderated — not auto-published</p>
            <p className="text-xs text-brand-blue-dark/70 mt-0.5 leading-snug">
              Reports are held as <em>Pending Review</em> until verified. We never automatically accuse anyone. Anonymized patterns help warn others.
            </p>
          </div>
        </div>

        {/* Step 1: Category */}
        <div>
          <label className="sec-label">What are you reporting?</label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setCategory(prev => prev === c.id ? null : c.id)}
                className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-2xl border text-center transition-all ${
                  category === c.id
                    ? 'border-brand-red bg-brand-red text-white'
                    : 'border-line bg-paper hover:border-ink-3 hover:bg-paper-2'
                }`}
              >
                <span className="text-xl">{c.emoji}</span>
                <span className={`text-xs leading-tight font-medium ${category === c.id ? 'text-white' : 'text-ink-2'}`}>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Details */}
        <div className="space-y-4">
          <div>
            <label className="sec-label">Suspicious link, profile, account, or phone number</label>
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="e.g. facebook.com/fakeseller, 09171234567, mmda-fines.com"
              className="input-base"
            />
          </div>

          <div>
            <label className="sec-label">Platform</label>
            <select
              value={platform}
              onChange={e => setPlatform(e.target.value)}
              className="input-base"
            >
              <option value="">Select platform…</option>
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="sec-label">Describe what happened <span className="text-brand-red">*</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What did the scammer say or do? Include the message, offer, or threat. Do not include your OTPs, PINs, or passwords."
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
                { val: true,  label: 'Yes, I sent money' },
                { val: false, label: 'No, I did not send' },
              ].map(({ val, label }) => (
                <button
                  key={label}
                  onClick={() => setMoneySent(val)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    moneySent === val
                      ? val ? 'border-brand-red bg-brand-red-light text-brand-red-dark' : 'border-brand-green bg-brand-green-light text-brand-green-dark'
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
        </div>

        {/* Step 3: Screenshots */}
        <div>
          <label className="sec-label">Upload screenshots (optional, up to 4)</label>
          <input type="file" accept="image/*" multiple className="hidden" id="report-upload" onChange={handleFiles} />
          {screenshots.length < 4 && (
            <label htmlFor="report-upload" className="w-full flex items-center justify-center gap-3 border-2 border-dashed border-line rounded-2xl py-5 text-ink-3 hover:border-ink-3 hover:text-ink-2 hover:bg-paper transition-all cursor-pointer">
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
          <p className="mt-1.5 text-xs text-ink-3 flex items-center gap-1">
            <Shield size={11} className="text-brand-green" />
            Screenshots help our team verify reports faster.
          </p>
        </div>

        {/* Contact email (optional) */}
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

        {/* Consent */}
        <div>
          <button
            onClick={() => setConsent(v => !v)}
            className="flex items-start gap-3 w-full text-left group"
          >
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
              consent ? 'bg-brand-green border-brand-green' : 'border-line bg-paper-2 group-hover:border-ink-3'
            }`}>
              {consent && <CheckCircle size={12} className="text-white" />}
            </div>
            <p className="text-sm text-ink-2 leading-snug">
              I consent to LegitCheck PH using my anonymized report for scam pattern detection and community warnings.
              I understand this will be reviewed before any action is taken.{' '}
              <span className="text-brand-red">*</span>
            </p>
          </button>
        </div>

        {/* Warning */}
        <div className="bg-brand-yellow-light border border-brand-yellow/20 rounded-2xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={14} className="text-brand-yellow-dark flex-shrink-0 mt-0.5" />
          <p className="text-xs text-brand-yellow-dark leading-snug">
            <strong>Important:</strong> False reports are harmful and may be removed. Only report what you genuinely believe to be suspicious.
            Reports use cautious language ("reported by users," "pattern detected") — not "confirmed scammer" or "criminal."
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!category || !description.trim() || !consent || submitting}
          className="w-full bg-brand-red text-white text-base font-bold rounded-2xl py-4 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Flag size={16} />
          {submitting ? 'Submitting…' : 'Submit report'}
        </button>

        <div className="pb-8" />
      </div>
    </div>
  )
}
