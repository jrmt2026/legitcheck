import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'
import { PRICING_PLANS } from '@/lib/pricing'

export default function PricingPage() {
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
              <ul className="space-y-1.5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-ink-3">
                    <Check size={11} className="text-brand-green flex-shrink-0" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <button className={`mt-4 w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
                plan.highlighted
                  ? 'bg-ink text-white hover:opacity-90'
                  : 'border border-line text-ink-2 hover:bg-ink hover:text-white hover:border-ink'
              }`}>
                {plan.id === 'free' ? 'Current plan' : `Get ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        <div className="card text-center py-6">
          <p className="text-xs text-ink-3 leading-relaxed">
            Pricing is in Philippine Peso (₱). All plans include the standard disclaimer:
            LegitCheck PH is a risk analysis guide, not a legal or government decision.
          </p>
        </div>
      </div>
    </div>
  )
}
