'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, ArrowRight, ArrowLeft, Building2, CheckCircle, BadgeCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

const INDUSTRIES = [
  'Banking & Finance', 'Lending & Credit', 'E-commerce / Retail', 'Real Estate',
  'Recruitment / HR', 'Insurance', 'Logistics', 'Technology', 'Government', 'Other',
]

type Step = 'account' | 'company' | 'done'

interface VerificationStatus {
  status: string
  slug: string
}

export default function CompanySignupPage() {
  const router = useRouter()
  const [step, setStep]           = useState<Step>('account')
  const [loading, setLoading]     = useState(false)

  // Account step
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')

  // Company step
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry]   = useState('')
  const [website, setWebsite]     = useState('')
  const [secNumber, setSecNumber] = useState('')
  const [dtiNumber, setDtiNumber] = useState('')

  // Result
  const [result, setResult]       = useState<VerificationStatus | null>(null)

  async function handleAccountNext(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setStep('company')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!companyName.trim()) { toast.error('Company name is required'); return }
    setLoading(true)

    try {
      const res = await fetch('/api/company/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, companyName, industry, website, secNumber, dtiNumber }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Registration failed')
        setLoading(false)
        return
      }

      // Sign in automatically
      const supabase = createClient()
      await supabase.auth.signInWithPassword({ email, password })

      setResult({ status: data.verificationStatus, slug: data.slug })
      setStep('done')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const STATUS_LABEL: Record<string, { label: string; color: string; desc: string }> = {
    sec_verified:  { label: 'SEC Verified ✓',      color: 'text-brand-green-dark',  desc: 'Your SEC registration was confirmed automatically.' },
    sec_submitted: { label: 'SEC Number on File',   color: 'text-brand-yellow-dark', desc: 'Your SEC number is recorded. Full verification will complete within 24 hours.' },
    dti_submitted: { label: 'DTI Number on File',   color: 'text-brand-yellow-dark', desc: 'Your DTI number is recorded. Status will update automatically.' },
    unverified:    { label: 'Registration Pending', color: 'text-ink-3',             desc: 'Add your SEC or DTI number any time from your dashboard to get verified.' },
  }

  // ── Done screen ────────────────────────────────────────────────────────────
  if (step === 'done' && result) {
    const s = STATUS_LABEL[result.status] ?? STATUS_LABEL.unverified
    return (
      <div className="min-h-screen bg-paper-2 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center animate-scale-in space-y-5">
          <div className="w-16 h-16 rounded-full bg-brand-green-light border-2 border-brand-green/20 flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-brand-green" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink mb-1">Company account created!</h1>
            <p className={`text-sm font-semibold ${s.color}`}>{s.label}</p>
            <p className="text-xs text-ink-3 mt-1 leading-relaxed">{s.desc}</p>
          </div>
          <button
            onClick={() => router.push('/company/dashboard')}
            className="w-full bg-ink text-white font-bold rounded-2xl py-4 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            Go to dashboard <ArrowRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper-2 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <ShieldCheck size={20} className="text-brand-green" />
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-ink tracking-tight">LegitCheck</span>
              <span className="text-xl font-light text-ink-3">PH</span>
            </div>
          </Link>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Building2 size={13} className="text-ink-3" />
            <p className="text-sm text-ink-3">Business account</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {(['account', 'company'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s ? 'bg-ink text-white' :
                (step === 'company' && s === 'account') || step === 'done' ? 'bg-brand-green text-white' :
                'bg-paper-2 border border-line text-ink-3'
              }`}>{i + 1}</div>
              <span className={`text-xs ${step === s ? 'text-ink font-semibold' : 'text-ink-3'}`}>
                {s === 'account' ? 'Account' : 'Company'}
              </span>
              {i < 1 && <div className="flex-1 h-px bg-line" />}
            </div>
          ))}
        </div>

        {/* ── Step 1: Account ─────────────────────────────────────────────── */}
        {step === 'account' && (
          <div className="card p-6">
            <form onSubmit={handleAccountNext} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1.5">Business email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@company.com"
                  className="w-full border border-line rounded-xl px-3.5 py-3 text-sm text-ink bg-paper-2 focus:outline-none focus:border-ink placeholder-ink-3 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1.5">Password <span className="text-ink-3 font-normal">(min. 8 characters)</span></label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full border border-line rounded-xl px-3.5 py-3 text-sm text-ink bg-paper-2 focus:outline-none focus:border-ink placeholder-ink-3 transition-colors"
                />
              </div>
              <button type="submit" className="w-full bg-ink text-white text-sm font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                Next <ArrowRight size={14} />
              </button>
            </form>
          </div>
        )}

        {/* ── Step 2: Company details ──────────────────────────────────────── */}
        {step === 'company' && (
          <div className="card p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1.5">Company name <span className="text-brand-red">*</span></label>
                <input
                  type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} required
                  placeholder="Acme Lending Inc."
                  className="w-full border border-line rounded-xl px-3.5 py-3 text-sm text-ink bg-paper-2 focus:outline-none focus:border-ink placeholder-ink-3 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1.5">Industry</label>
                <select
                  value={industry} onChange={e => setIndustry(e.target.value)}
                  className="w-full border border-line rounded-xl px-3.5 py-3 text-sm text-ink bg-paper-2 focus:outline-none focus:border-ink transition-colors"
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1.5">Website <span className="text-ink-3 font-normal">(optional)</span></label>
                <input
                  type="url" value={website} onChange={e => setWebsite(e.target.value)}
                  placeholder="https://yourcompany.com"
                  className="w-full border border-line rounded-xl px-3.5 py-3 text-sm text-ink bg-paper-2 focus:outline-none focus:border-ink placeholder-ink-3 transition-colors"
                />
              </div>

              {/* Registration — optional but triggers auto-verification */}
              <div className="bg-paper-2 border border-line rounded-xl p-3.5 space-y-3">
                <div className="flex items-center gap-2">
                  <BadgeCheck size={14} className="text-brand-green" />
                  <p className="text-xs font-semibold text-ink">Auto-verification <span className="text-ink-3 font-normal">(optional)</span></p>
                </div>
                <p className="text-xs text-ink-3 leading-relaxed">
                  Provide your SEC or DTI number and we'll verify your business automatically — no manual review.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-ink-2 mb-1.5">SEC Registration No.</label>
                  <input
                    type="text" value={secNumber} onChange={e => setSecNumber(e.target.value)}
                    placeholder="CS2020XXXXXX"
                    className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink bg-paper focus:outline-none focus:border-ink placeholder-ink-3 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-2 mb-1.5">DTI Registration No. <span className="text-ink-3 font-normal">(if sole proprietor)</span></label>
                  <input
                    type="text" value={dtiNumber} onChange={e => setDtiNumber(e.target.value)}
                    placeholder="XXXXXXXXXXXXXXXX"
                    className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink bg-paper focus:outline-none focus:border-ink placeholder-ink-3 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button" onClick={() => setStep('account')}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-line text-sm text-ink-2 hover:bg-paper-2 transition-all"
                >
                  <ArrowLeft size={13} /> Back
                </button>
                <button
                  type="submit" disabled={loading || !companyName.trim()}
                  className="flex-1 bg-ink text-white text-sm font-semibold rounded-xl py-3 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? 'Registering…' : 'Create business account'}
                  {!loading && <ArrowRight size={14} />}
                </button>
              </div>
            </form>
          </div>
        )}

        <p className="text-center text-xs text-ink-3 mt-4">
          Personal account?{' '}
          <Link href="/auth/signup" className="text-ink font-semibold hover:underline">Sign up here</Link>
        </p>

      </div>
    </div>
  )
}
