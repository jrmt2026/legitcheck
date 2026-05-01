'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, ShieldCheck, ArrowRight, Sparkles, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const PLAN_LABELS: Record<string, { name: string; credits: number }> = {
  single:  { name: 'Full Protection Check', credits: 1 },
  pack5:   { name: 'Protect More',           credits: 5 },
  pack15:  { name: 'Family / Small Seller Pack', credits: 15 },
  pack50:  { name: 'Power Protection Pack',  credits: 50 },
}

export default function PaymentSuccess() {
  const [plan, setPlan]         = useState<string | null>(null)
  const [ref, setRef]           = useState<string | null>(null)
  const [liveCredits, setLiveCredits] = useState<number | null>(null)
  const [polling, setPolling]   = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const p = params.get('plan')
    const r = params.get('ref')
    setPlan(p)
    setRef(r)

    // Poll for credit balance — webhook fires async after redirect
    const expected = p ? (PLAN_LABELS[p]?.credits ?? 0) : 0
    const supabase = createClient()
    let attempts = 0
    const maxAttempts = 12 // poll up to ~24s

    async function pollCredits() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setPolling(false); return }

      const { data } = await supabase
        .rpc('get_premium_credits', { p_user_id: user.id })

      const balance = data ?? 0
      if (balance >= expected || attempts >= maxAttempts) {
        setLiveCredits(balance >= expected ? balance : expected)
        setPolling(false)
      } else {
        attempts++
        setTimeout(pollCredits, 2000)
      }
    }

    pollCredits()
  }, [])

  const planInfo = plan ? PLAN_LABELS[plan] : null
  const displayCredits = liveCredits ?? planInfo?.credits ?? null

  return (
    <div className="min-h-screen bg-paper-2 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">

        {/* Success icon */}
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-brand-green/10 animate-ping opacity-30" />
          <div className="relative w-24 h-24 rounded-full bg-brand-green-light border-2 border-brand-green/30 flex items-center justify-center">
            <CheckCircle2 size={44} className="text-brand-green" strokeWidth={1.5} />
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green-light border border-brand-green/20 text-xs font-semibold text-brand-green-dark mb-2">
            <Sparkles size={10} />
            Payment confirmed
          </div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Credits added!</h1>
          {planInfo && (
            <p className="text-sm text-ink-3">
              {planInfo.name} — <span className="font-semibold text-ink">{planInfo.credits} premium check{planInfo.credits > 1 ? 's' : ''}</span> added to your account
            </p>
          )}
        </div>

        {/* Credit balance card */}
        <div className="bg-ink rounded-2xl px-5 py-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/60">Your credit balance</p>
            <ShieldCheck size={16} className="text-brand-green" />
          </div>
          <div className="flex items-center justify-center gap-3">
            <p className="text-4xl font-bold text-white font-mono">
              {displayCredits !== null ? displayCredits : '—'}
            </p>
            {polling && <Loader2 size={18} className="text-white/40 animate-spin" />}
          </div>
          <p className="text-xs text-white/40">premium checks remaining</p>
        </div>

        {/* What credits unlock */}
        <div className="bg-paper rounded-2xl border border-line px-5 py-4 text-left space-y-2.5">
          <p className="text-xs font-semibold text-ink-3 uppercase tracking-wide">Each credit unlocks</p>
          {[
            'Full AI analysis with all red flags',
            'Score breakdown — how we got the number',
            'Evidence checklist to verify for yourself',
            'Official resources to report or verify',
          ].map(f => (
            <div key={f} className="flex items-center gap-2 text-sm text-ink-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-green flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>

        {/* Transaction ref */}
        {ref && (
          <p className="text-xs text-ink-3">
            Reference: <span className="font-mono text-ink-2">{ref.slice(0, 8).toUpperCase()}…</span>
          </p>
        )}

        {/* CTA */}
        <Link
          href="/buyer"
          className="flex items-center justify-center gap-2 w-full bg-brand-green text-white font-bold rounded-2xl py-4 text-sm hover:opacity-90 transition-opacity"
        >
          <ShieldCheck size={16} />
          Run a premium check
          <ArrowRight size={14} />
        </Link>

        <Link href="/dashboard" className="text-sm text-ink-3 hover:text-ink transition-colors">
          View dashboard →
        </Link>
      </div>
    </div>
  )
}
