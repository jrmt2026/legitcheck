'use client'

import { useState } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { moderateReport } from './actions'

interface Props {
  reportId: string
  identifier: string
  identifierType: string
  category: string
  description?: string
  amountLost?: number
  createdAt: string
}

export default function ModerateRow({ reportId, identifier, identifierType, category, description, amountLost, createdAt }: Props) {
  const [loading, setLoading] = useState<'accepted' | 'rejected' | null>(null)
  const [done, setDone] = useState<'accepted' | 'rejected' | null>(null)

  async function act(action: 'accepted' | 'rejected') {
    setLoading(action)
    try {
      await moderateReport(reportId, action)
      setDone(action)
    } catch {
      // ignore
    } finally {
      setLoading(null)
    }
  }

  if (done) {
    return (
      <div className={`px-4 py-3 rounded-xl text-xs font-semibold ${done === 'accepted' ? 'bg-brand-green-light text-brand-green-dark' : 'bg-brand-red-light text-brand-red-dark'}`}>
        {done === 'accepted' ? '✓ Accepted' : '✗ Rejected'}
      </div>
    )
  }

  return (
    <div className="bg-paper border border-line rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-ink-2 bg-paper-2 border border-line px-2 py-0.5 rounded-full">{identifierType}</span>
            <span className="text-xs font-bold text-ink-2 bg-paper-2 border border-line px-2 py-0.5 rounded-full">{category}</span>
            {amountLost && <span className="text-xs text-brand-red-dark font-semibold">₱{amountLost.toLocaleString()} lost</span>}
          </div>
          <p className="text-sm font-semibold text-ink mt-1 truncate">{identifier}</p>
          {description && <p className="text-xs text-ink-3 mt-0.5 line-clamp-2">{description}</p>}
          <p className="text-[11px] text-ink-3 mt-1">{new Date(createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => act('accepted')}
          disabled={!!loading}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-brand-green text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading === 'accepted' ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          Accept
        </button>
        <button
          onClick={() => act('rejected')}
          disabled={!!loading}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-brand-red-light border border-brand-red/20 text-brand-red-dark text-xs font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading === 'rejected' ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
          Reject
        </button>
      </div>
    </div>
  )
}
