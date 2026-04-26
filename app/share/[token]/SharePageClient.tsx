'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, Clock, AlertCircle, ChevronRight, Check, X, Loader2 } from 'lucide-react'
import type { DecisionResult, RiskColor } from '@/types'
import toast from 'react-hot-toast'

interface Props {
  token: string
  result: DecisionResult
  categoryId: string
  score: number
  color: RiskColor
  amount: number | null
  expiresAt: string
  checkedAt: string
}

const VERDICT = {
  green:  { bg: 'bg-brand-green-light',  text: 'text-brand-green-dark',  accent: 'bg-brand-green',  border: 'border-brand-green/30',  emoji: '🟢', label: 'Low risk', tl: 'Mababang panganib' },
  yellow: { bg: 'bg-brand-yellow-light', text: 'text-brand-yellow-dark', accent: 'bg-brand-yellow', border: 'border-brand-yellow/30', emoji: '🟡', label: 'Verify first', tl: 'I-verify muna' },
  red:    { bg: 'bg-brand-red-light',    text: 'text-brand-red-dark',    accent: 'bg-brand-red',    border: 'border-brand-red/30',    emoji: '🔴', label: "Don't proceed yet", tl: 'Huwag tumuloy muna' },
}

const DISPUTE_ISSUES = [
  { id: 'wrong_report', label: 'This check is inaccurate', tl: 'Mali ang result na ito' },
  { id: 'name_mismatch', label: 'Name mismatch — I can prove ownership', tl: 'Ako talaga ang may-ari' },
  { id: 'i_am_legit', label: 'I am a legitimate seller / business', tl: 'Legit ako, may proof' },
  { id: 'other', label: 'Other concern', tl: 'Iba pang dahilan' },
]

const CAT_LABELS: Record<string, string> = {
  online_purchase: 'Online Purchase',
  investment: 'Investment / OFW',
  donation: 'Donation',
  vendor: 'Vendor / Business',
  property: 'Property / Land',
  job_agency: 'Job / Agency',
  buyer_check: 'Buyer Check',
}

export default function SharePageClient({
  token, result, categoryId, score, color, amount, expiresAt, checkedAt
}: Props) {
  const [lang, setLang] = useState<'en' | 'tl'>('en')
  const [disputeStep, setDisputeStep] = useState<'hidden' | 'pick' | 'confirm' | 'done'>('hidden')
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const v = VERDICT[color]
  const tl = lang === 'tl'
  const daysLeft = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const cat = CAT_LABELS[categoryId] || categoryId

  const headline = {
    green:  { en: 'OK, stay careful',    tl: 'OK, mag-ingat pa rin' },
    yellow: { en: 'Verify first',         tl: 'I-verify muna' },
    red:    { en: "Don't proceed yet",    tl: 'Huwag tumuloy muna' },
  }[color]

  const action = result?.action ? (tl ? result.action.tl : result.action.en) : ''

  async function submitDispute() {
    if (!selectedIssue) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, issueType: selectedIssue, message }),
      })
      if (!res.ok) throw new Error('Failed')
      setDisputeStep('done')
    } catch {
      toast.error('Could not submit dispute. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper-2">
      {/* Header */}
      <header className="border-b border-line bg-paper px-4 py-3 flex items-center justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-base font-medium text-ink">LegitCheck</span>
          <span className="text-base font-light text-ink-2">PH</span>
          <span className="ml-1 text-xs font-mono text-brand-green">shared result</span>
        </div>
        {/* Lang toggle */}
        <div className="flex bg-paper-2 border border-line rounded-full p-0.5">
          {(['en', 'tl'] as const).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${lang === l ? 'bg-paper text-ink border border-line' : 'text-ink-3'}`}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-sm mx-auto px-4 py-6 space-y-4 animate-slide-up">

        {/* Context strip */}
        <div className="flex items-center gap-2 text-xs text-ink-3">
          <ShieldCheck size={12} className="text-brand-green flex-shrink-0" />
          <span>{tl ? 'Isang buyer ang nag-check ng transaksyon na ito.' : 'A buyer ran a risk check on this transaction.'}</span>
        </div>

        {/* Main verdict card — seller-facing version */}
        <div className={`rounded-2xl overflow-hidden border ${v.border}`}>
          <div className={`${v.bg} px-5 py-8 text-center`}>
            <div className="text-4xl mb-3">{v.emoji}</div>
            <div className={`text-2xl font-medium mb-1 ${v.text}`}>
              {tl ? headline.tl : headline.en}
            </div>
            <div className={`text-xs font-mono font-medium uppercase tracking-widest mb-4 opacity-60 ${v.text}`}>
              {cat}
            </div>
            <div className="inline-flex items-baseline gap-1 mb-4">
              <span className={`text-5xl font-light font-mono tracking-tighter ${v.text}`}>{score}</span>
              <span className="text-sm text-ink-3 font-mono">/100</span>
            </div>
            {action && (
              <div>
                <span className={`inline-block ${v.accent} text-white text-xs font-medium px-4 py-2 rounded-full`}>
                  {action}
                </span>
              </div>
            )}
          </div>

          {/* Meta info */}
          <div className="bg-paper px-4 py-3 border-t border-line divide-y divide-line">
            <div className="flex items-center justify-between py-2.5 text-xs">
              <span className="text-ink-3">{tl ? 'Petsa ng check' : 'Checked on'}</span>
              <span className="text-ink font-medium">
                {new Date(checkedAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
            {amount && amount > 0 && (
              <div className="flex items-center justify-between py-2.5 text-xs">
                <span className="text-ink-3">{tl ? 'Halaga ng transaksyon' : 'Transaction amount'}</span>
                <span className="text-ink font-medium">
                  {amount <= 1000 ? `≤ ₱1,000` : `₱${amount.toLocaleString()}`}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between py-2.5 text-xs">
              <span className="text-ink-3">{tl ? 'Link mag-e-expire' : 'Link expires'}</span>
              <span className="flex items-center gap-1 text-ink-3">
                <Clock size={10} />
                {tl ? `${daysLeft} araw na lang` : `in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}
              </span>
            </div>
          </div>
        </div>

        {/* What this means for seller */}
        <div className="card">
          <div className="sec-label">{tl ? 'Ano ibig sabihin nito?' : 'What this means'}</div>
          <p className="text-sm text-ink-2 leading-relaxed mt-2">
            {color === 'green' && (tl
              ? 'Ang transaksyon na ito ay may mababang risk base sa impormasyong ibinigay ng buyer. Maaari kang magpatuloy — pero mag-ingat pa rin.'
              : 'This transaction shows low risk based on information provided by the buyer. You may proceed — but stay careful.')}
            {color === 'yellow' && (tl
              ? 'May ilang red flags na nakita. Hinihikayat ang buyer na mag-verify muna bago bayad. Ipakita ang iyong mga patunay.'
              : 'Some red flags were detected. The buyer is advised to verify before paying. Provide proof of legitimacy to help clear this.')}
            {color === 'red' && (tl
              ? 'Mataas ang risk na nakita sa transaksyon na ito. Hinihikayat ang buyer na huwag muna magbayad. Kung legit ka, i-dispute ito.'
              : 'High risk was detected in this transaction. The buyer is advised not to proceed. If you are legitimate, dispute this result below.')}
          </p>
        </div>

        {/* Dispute section */}
        {disputeStep === 'hidden' && (
          <button
            onClick={() => setDisputeStep('pick')}
            className="w-full flex items-center justify-between card hover:border-ink-3/40 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={16} className="text-ink-3 flex-shrink-0" />
              <div className="text-left">
                <div className="text-sm font-medium text-ink">
                  {tl ? 'Hindi tama ang result na ito?' : 'Is this result inaccurate?'}
                </div>
                <div className="text-xs text-ink-3 mt-0.5">
                  {tl ? 'I-dispute ito — libre at walang kailangang account.' : 'Dispute it — free, no account needed.'}
                </div>
              </div>
            </div>
            <ChevronRight size={14} className="text-ink-3 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {disputeStep === 'pick' && (
          <div className="card space-y-3 animate-slide-up">
            <div className="flex items-center justify-between">
              <div className="sec-label mb-0">{tl ? 'Ano ang iyong reklamo?' : "What's your concern?"}</div>
              <button onClick={() => setDisputeStep('hidden')} className="text-ink-3 hover:text-ink transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {DISPUTE_ISSUES.map(issue => (
                <button
                  key={issue.id}
                  onClick={() => { setSelectedIssue(issue.id); setDisputeStep('confirm') }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border text-left text-sm transition-all ${
                    selectedIssue === issue.id
                      ? 'border-ink bg-ink text-white'
                      : 'border-line text-ink-2 hover:border-ink-3'
                  }`}
                >
                  <ChevronRight size={13} className="flex-shrink-0 opacity-40" />
                  <div>
                    <div>{tl ? issue.tl : issue.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {disputeStep === 'confirm' && (
          <div className="card space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <div className="sec-label mb-0">{tl ? 'Idagdag ang iyong side' : 'Add your side (optional)'}</div>
              <button onClick={() => setDisputeStep('pick')} className="text-ink-3 hover:text-ink transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="px-3 py-2.5 bg-paper-2 rounded-xl border border-line text-xs text-ink-2">
              {DISPUTE_ISSUES.find(i => i.id === selectedIssue)?.[tl ? 'tl' : 'label']}
            </div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={tl ? 'Ipaliwanag ang iyong side… (optional)' : 'Explain your side… (optional)'}
              rows={3}
              className="w-full border border-line rounded-xl px-3.5 py-3 text-sm text-ink bg-paper-2 focus:outline-none focus:border-ink placeholder-ink-3 resize-none"
            />
            <p className="text-xs text-ink-3 leading-relaxed">
              {tl
                ? 'Ang dispute mo ay ipapaabot sa buyer at sa LegitCheck PH team. Hindi kailangan ng account.'
                : 'Your dispute will be forwarded to the buyer and reviewed by LegitCheck PH. No account required.'}
            </p>
            <button
              onClick={submitDispute}
              disabled={submitting}
              className="w-full bg-ink text-white text-sm font-medium rounded-xl py-3 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
              {submitting
                ? (tl ? 'Isinusumite…' : 'Submitting…')
                : (tl ? 'Isumite ang dispute' : 'Submit dispute')}
            </button>
          </div>
        )}

        {disputeStep === 'done' && (
          <div className="card text-center py-6 animate-slide-up border-brand-green/20 bg-brand-green-light">
            <div className="flex justify-center mb-3">
              <div className="w-10 h-10 bg-brand-green rounded-full flex items-center justify-center">
                <Check size={18} className="text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div className="text-sm font-medium text-brand-green-dark mb-1">
              {tl ? 'Natanggap ang iyong dispute' : 'Dispute submitted'}
            </div>
            <p className="text-xs text-brand-green-dark/70 leading-relaxed">
              {tl
                ? 'Ipinaabot na sa buyer at sa aming team. Kung may proof ka, i-prepare ito para sa review.'
                : 'Forwarded to the buyer and our team. Prepare any supporting proof for review.'}
            </p>
          </div>
        )}

        {/* Seller CTA */}
        <div className="card bg-ink text-white">
          <div className="text-xs font-mono text-white/50 uppercase tracking-wider mb-2">
            {tl ? 'Para sa mga sellers' : 'For sellers'}
          </div>
          <p className="text-sm text-white/80 leading-relaxed mb-3">
            {tl
              ? 'Patunayan na legit ka. Kumuha ng LegitCheck trust badge para sa iyong shop.'
              : 'Prove you\'re legitimate. Get a LegitCheck trust badge for your shop.'}
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors"
          >
            {tl ? 'Mag-sign up bilang seller' : 'Sign up as a seller'}
            <ChevronRight size={12} />
          </Link>
        </div>

        {/* Disclaimer */}
        <div className="border-l-2 border-line pl-3 py-1">
          <p className="text-xs text-ink-3 leading-relaxed">
            {tl
              ? 'Gabay lang ito. Hindi ito final legal, bank, platform, government, o law-enforcement decision.'
              : 'This is a guide only. Not a final legal, bank, platform, government, or law-enforcement decision.'}
            {' '}
            <Link href="/privacy" className="underline hover:text-ink transition-colors">
              {tl ? 'Privacy Policy' : 'Privacy Policy'}
            </Link>
          </p>
        </div>

        <div className="text-center pt-2 pb-8">
          <Link href="/" className="text-xs text-ink-3 hover:text-ink transition-colors">
            {tl ? 'I-check din ang sarili mong transaksyon →' : 'Run your own check at LegitCheck PH →'}
          </Link>
        </div>

      </div>
    </div>
  )
}
