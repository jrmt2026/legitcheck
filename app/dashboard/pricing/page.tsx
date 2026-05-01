'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Loader2, ShieldCheck, Zap, Star } from 'lucide-react'
import { PRICING_PLANS } from '@/lib/pricing'
import toast from 'react-hot-toast'

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)

  async function handlePay(planId: string) {
    setLoading(planId)
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) toast.error('Please log in to continue.')
        else if (res.status === 503) toast.error('Payment not yet configured. Contact us.')
        else toast.error(data.error || 'Payment failed. Try again.')
        return
      }
      window.location.href = data.checkoutUrl
    } catch {
      toast.error('Network error. Try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-paper-2">

      {/* Dark header — matches all other pages */}
      <header className="bg-ink px-4 py-4 flex items-center gap-3 sticky top-0 z-50">
        <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <Link href="/" className="text-lg font-bold text-white tracking-tight hover:opacity-80 transition-opacity">
          LegitCheck <span className="font-light opacity-50">PH</span>
        </Link>
      </header>

      {/* Hero strip */}
      <div className="bg-ink border-b border-white/10 px-4 pb-8 pt-2">
        <div className="max-w-lg mx-auto text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green/10 border border-brand-green/20 text-xs font-semibold text-brand-green mb-1">
            <ShieldCheck size={11} /> Premium Protection
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Simple, honest pricing</h1>
          <p className="text-sm text-white/50 leading-relaxed">
            Pay only for what you need. No subscriptions. Credits never expire.
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-3">

        {PRICING_PLANS.map(plan => {
          const isFree = plan.id === 'free'
          const isHighlighted = plan.highlighted

          return (
            <div
              key={plan.id}
              className={`rounded-2xl border p-4 transition-all ${
                isHighlighted
                  ? 'bg-ink border-brand-green/30 shadow-lg'
                  : isFree
                  ? 'bg-paper border-line opacity-70'
                  : 'bg-paper border-line'
              }`}
            >
              {/* Badge row */}
              {isHighlighted && (
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-green/20 border border-brand-green/30 text-xs font-bold text-brand-green">
                    <Star size={9} fill="currentColor" /> Most popular
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-xs font-medium text-white/60">
                    <Zap size={9} /> Best value
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className={`text-sm font-semibold ${isHighlighted ? 'text-white' : 'text-ink'}`}>
                    {plan.name}
                  </div>
                  {plan.priceNote && (
                    <div className={`text-xs mt-0.5 ${isHighlighted ? 'text-white/50' : 'text-ink-3'}`}>
                      {plan.priceNote}
                    </div>
                  )}
                </div>
                <div className={`text-2xl font-bold font-mono ${isHighlighted ? 'text-white' : 'text-ink'}`}>
                  {plan.price}
                </div>
              </div>

              <ul className="space-y-1.5 mb-4">
                {plan.features.map(f => (
                  <li key={f} className={`flex items-center gap-2 text-xs ${isHighlighted ? 'text-white/70' : 'text-ink-3'}`}>
                    <Check size={11} className="text-brand-green flex-shrink-0" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>

              {isFree ? (
                <div className={`w-full py-2.5 rounded-xl text-sm font-medium text-center border ${
                  isHighlighted ? 'border-white/10 text-white/30' : 'border-line text-ink-3'
                }`}>
                  Your current free plan
                </div>
              ) : (
                <button
                  onClick={() => handlePay(plan.id)}
                  disabled={loading === plan.id}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 ${
                    isHighlighted
                      ? 'bg-brand-green text-white hover:opacity-90'
                      : 'bg-ink text-white hover:opacity-90'
                  }`}
                >
                  {loading === plan.id ? (
                    <><Loader2 size={14} className="animate-spin" /> Redirecting to payment…</>
                  ) : (
                    <>Pay {plan.price}</>
                  )}
                </button>
              )}
            </div>
          )
        })}

        {/* Payment methods + trust */}
        <div className="bg-paper border border-line rounded-2xl px-4 py-4 space-y-3">
          <div className="flex items-center justify-center gap-3 text-xs text-ink-3 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="text-base">💙</span> GCash
            </span>
            <span className="w-px h-3 bg-line" />
            <span className="flex items-center gap-1.5">
              <span className="text-base">💚</span> Maya
            </span>
            <span className="w-px h-3 bg-line" />
            <span className="flex items-center gap-1.5">
              <span className="text-base">💳</span> Credit / Debit Card
            </span>
          </div>
          <p className="text-xs text-ink-3 text-center leading-relaxed">
            Secured by PayMongo · Philippine Peso (₱) · Credits never expire
          </p>
          <p className="text-xs text-ink-3 text-center">
            LegitCheck PH is a risk analysis guide — not a legal or government decision.
          </p>
        </div>

        <div className="pb-8" />
      </div>
    </div>
  )
}
