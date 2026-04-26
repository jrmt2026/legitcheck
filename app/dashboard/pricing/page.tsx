'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
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
        if (res.status === 503) toast.error('Online payment coming soon. Contact us to pay manually.')
        else toast.error(data.error || 'Payment failed')
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
      <header className="border-b border-line bg-paper px-4 py-3 flex items-center gap-3 sticky top-0 z-50">
        <Link href="/dashboard" className="text-ink-3 hover:text-ink transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-baseline gap-1">
          <span className="text-base font-medium text-ink">LegitCheck</span>
          <span className="text-base font-light text-ink-2">PH</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div>
          <div className="text-xs font-mono text-ink-3 uppercase tracking-widest mb-2">Pricing</div>
          <h1 className="text-2xl font-medium text-ink">Simple, honest pricing</h1>
          <p className="text-sm text-ink-3 mt-1 leading-relaxed">
            Pay for the depth of check you need. No subscriptions forced.
          </p>
        </div>

        <div className="space-y-3">
          {PRICING_PLANS.map(plan => (
            <div key={plan.id} className={`card ${plan.highlighted ? 'border-2 border-ink' : ''}`}>
              {plan.highlighted && (
                <div className="text-xs font-mono font-medium text-ink uppercase tracking-wider mb-2">Most popular</div>
              )}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-ink">{plan.name}</div>
                  {plan.priceNote && <div className="text-xs text-ink-3 mt-0.5">{plan.priceNote}</div>}
                </div>
                <div className="text-xl font-light font-mono text-ink">{plan.price}</div>
              </div>
              <ul className="space-y-1.5 mb-4">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-ink-3">
                    <Check size={11} className="text-brand-green flex-shrink-0" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>

              {plan.id === 'free' ? (
                <div className="w-full py-2.5 rounded-xl text-sm font-medium text-center border border-line text-ink-3">
                  Current plan
                </div>
              ) : (
                <button
                  onClick={() => handlePay(plan.id)}
                  disabled={loading === plan.id}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60 ${
                    plan.highlighted
                      ? 'bg-ink text-white hover:opacity-90'
                      : 'border border-line text-ink-2 hover:bg-ink hover:text-white hover:border-ink'
                  }`}
                >
                  {loading === plan.id ? (
                    <><Loader2 size={14} className="animate-spin" /> Processing…</>
                  ) : (
                    <>Pay with Maya · {plan.price}</>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="card text-center py-5 space-y-1">
          <p className="text-xs text-ink-3 leading-relaxed">
            Payments are processed securely via Maya. Pricing is in Philippine Peso (₱).
          </p>
          <p className="text-xs text-ink-3">
            LegitCheck PH is a risk analysis guide — not a legal or government decision.
          </p>
        </div>
      </div>
    </div>
  )
}
