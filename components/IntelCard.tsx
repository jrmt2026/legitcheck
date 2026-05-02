'use client'

import { useState, useEffect } from 'react'
import { Loader2, Zap } from 'lucide-react'

export default function IntelCard() {
  const [bullets, setBullets] = useState<string[]>([])
  const [count, setCount]     = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/intel-report')
      .then(r => r.json())
      .then(d => { setBullets(d.bullets || []); setCount(d.reportCount || 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="bg-paper border border-line rounded-2xl px-4 py-3.5 flex items-center gap-3">
      <Loader2 size={14} className="text-ink-3 animate-spin flex-shrink-0" />
      <span className="text-xs text-ink-3">Loading weekly intel…</span>
    </div>
  )

  if (!bullets.length) return null

  return (
    <div className="bg-paper border border-line rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-line flex items-center gap-2">
        <Zap size={13} className="text-brand-yellow flex-shrink-0" />
        <span className="text-xs font-semibold text-ink">Weekly Scam Intel</span>
        {count > 0 && (
          <span className="ml-auto text-xs text-ink-3">{count} report{count !== 1 ? 's' : ''} this week</span>
        )}
      </div>
      <div className="px-4 py-3 space-y-2.5">
        {bullets.map((b, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-brand-yellow font-bold text-xs flex-shrink-0 mt-0.5">{i + 1}.</span>
            <p className="text-xs text-ink-2 leading-relaxed">{b}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
