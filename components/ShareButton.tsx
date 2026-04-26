'use client'

import { useState } from 'react'
import { Share2, Copy, Check, Lock, ChevronRight, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  checkId: string
  lang?: 'en' | 'tl'
}

type Step = 'idle' | 'amount' | 'paywall' | 'generating' | 'done'

export default function ShareButton({ checkId, lang = 'en' }: Props) {
  const tl = lang === 'tl'
  const [step, setStep] = useState<Step>('idle')
  const [amount, setAmount] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [expiresAt, setExpiresAt] = useState('')

  const amountNum = parseInt(amount.replace(/[^0-9]/g, '')) || 0
  const isFree = amountNum <= 1000 || amount === ''

  async function generateLink() {
    if (!isFree) {
      // Show paywall — in production, trigger payment here
      setStep('paywall')
      return
    }
    await doGenerate()
  }

  async function doGenerate() {
    setStep('generating')
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkId, amount: amountNum }),
      })
      if (!res.ok) throw new Error('Failed to generate link')
      const data = await res.json()
      setShareUrl(data.url)
      setExpiresAt(data.expiresAt)
      setStep('done')
    } catch {
      toast.error('Could not generate share link. Try again.')
      setStep('amount')
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success(tl ? 'Link nakopya!' : 'Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'LegitCheck PH — Risk Result',
          text: tl
            ? 'Nag-check ako ng transaksyon na ito sa LegitCheck PH. Tingnan mo:'
            : 'I ran a risk check on this transaction via LegitCheck PH. See the result:',
          url: shareUrl,
        })
      } catch {}
    } else {
      copyLink()
    }
  }

  if (step === 'idle') {
    return (
      <button
        onClick={() => setStep('amount')}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-line bg-paper text-sm text-ink-2 hover:bg-ink hover:text-white hover:border-ink transition-all"
      >
        <Share2 size={14} />
        {tl ? 'I-share sa seller' : 'Share with seller'}
      </button>
    )
  }

  if (step === 'amount') {
    return (
      <div className="card space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-ink">
            {tl ? 'Magkano ang transaksyon?' : 'How much is this transaction?'}
          </div>
          <button onClick={() => setStep('idle')} className="text-ink-3 hover:text-ink transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-3 font-mono">₱</span>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            className="w-full border border-line rounded-xl pl-8 pr-4 py-3 text-sm text-ink bg-paper-2 focus:outline-none focus:border-ink placeholder-ink-3"
          />
        </div>

        {/* Free vs paid indicator */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
          isFree
            ? 'bg-brand-green-light text-brand-green-dark'
            : 'bg-brand-yellow-light text-brand-yellow-dark'
        }`}>
          {isFree ? <Check size={12} strokeWidth={2.5} /> : <Lock size={12} />}
          {isFree
            ? (tl ? 'Free — ₱1,000 o mas mababa' : 'Free — ₱1,000 or below')
            : (tl ? '₱49 para i-unlock — transaksyon na higit ₱1,000' : '₱49 to unlock — transactions above ₱1,000')}
        </div>

        <button
          onClick={generateLink}
          className="w-full bg-ink text-white text-sm font-medium rounded-xl py-3 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          {isFree
            ? (tl ? 'Gumawa ng share link' : 'Generate share link')
            : (tl ? 'I-unlock para ₱49' : 'Unlock for ₱49')}
          <ChevronRight size={14} />
        </button>

        <p className="text-xs text-ink-3 text-center">
          {tl
            ? 'Mag-e-expire ang link sa loob ng 7 araw.'
            : 'Share link expires in 7 days.'}
        </p>
      </div>
    )
  }

  if (step === 'paywall') {
    return (
      <div className="card space-y-4 animate-slide-up border-brand-yellow/30 bg-brand-yellow-light">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-brand-yellow-dark" />
            <div className="text-sm font-medium text-brand-yellow-dark">
              {tl ? 'Full Check — ₱49' : 'Full Check — ₱49'}
            </div>
          </div>
          <button onClick={() => setStep('amount')} className="text-brand-yellow-dark/60 hover:text-brand-yellow-dark transition-colors">
            <X size={14} />
          </button>
        </div>

        <ul className="space-y-1.5">
          {[
            tl ? 'Shareable link para sa seller' : 'Shareable link for the seller',
            tl ? 'Seller makakita ng verdict card' : 'Seller sees the verdict card',
            tl ? 'Dispute button para sa seller' : 'Dispute button for seller',
            tl ? '7-araw na validity' : '7-day link validity',
          ].map(f => (
            <li key={f} className="flex items-center gap-2 text-xs text-brand-yellow-dark">
              <Check size={11} strokeWidth={2.5} />
              {f}
            </li>
          ))}
        </ul>

        <button
          onClick={doGenerate}
          className="w-full bg-brand-yellow text-white text-sm font-medium rounded-xl py-3 hover:opacity-90 transition-opacity"
        >
          {tl ? 'Bayad ₱49 — I-unlock ngayon' : 'Pay ₱49 — Unlock now'}
        </button>

        <p className="text-xs text-brand-yellow-dark/60 text-center">
          {tl ? '(Payment integration — coming soon)' : '(Payment integration — coming soon)'}
        </p>
      </div>
    )
  }

  if (step === 'generating') {
    return (
      <div className="card flex items-center justify-center gap-3 py-5 animate-slide-up">
        <Loader2 size={16} className="animate-spin text-ink-3" />
        <span className="text-sm text-ink-3">
          {tl ? 'Gumagawa ng link…' : 'Generating link…'}
        </span>
      </div>
    )
  }

  if (step === 'done') {
    const daysLeft = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return (
      <div className="card space-y-3 animate-slide-up">
        <div className="text-xs font-mono text-ink-3 uppercase tracking-wider">
          {tl ? 'Share link handa na' : 'Share link ready'}
        </div>

        {/* URL display */}
        <div className="flex items-center gap-2 bg-paper-2 border border-line rounded-xl px-3 py-2.5">
          <span className="text-xs text-ink-2 truncate flex-1 font-mono">{shareUrl}</span>
          <button onClick={copyLink} className={`flex-shrink-0 transition-all ${copied ? 'text-brand-green' : 'text-ink-3 hover:text-ink'}`}>
            {copied ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={nativeShare}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-ink text-white text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <Share2 size={12} />
            {tl ? 'I-share' : 'Share'}
          </button>
          <button
            onClick={copyLink}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${
              copied
                ? 'bg-brand-green-light border-brand-green/20 text-brand-green-dark'
                : 'border-line text-ink-2 hover:bg-paper-2'
            }`}
          >
            {copied ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} />}
            {copied ? (tl ? 'Nakopya!' : 'Copied!') : (tl ? 'Kopyahin' : 'Copy link')}
          </button>
        </div>

        <p className="text-xs text-ink-3 text-center">
          {tl
            ? `Mag-e-expire sa ${daysLeft} araw · Makikita ng seller ang verdict card`
            : `Expires in ${daysLeft} days · Seller sees the verdict card only`}
        </p>
      </div>
    )
  }

  return null
}
