'use client'

import { useState } from 'react'
import { Loader2, CheckCircle, XCircle, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

type BadgeLevel = 'pending' | 'id_verified' | 'business_verified' | 'fully_verified' | 'rejected'

const BADGE_OPTIONS: { value: BadgeLevel; label: string }[] = [
  { value: 'id_verified',       label: '🪪 ID Verified' },
  { value: 'business_verified', label: '📋 Business Verified' },
  { value: 'fully_verified',    label: '✅ Fully Verified' },
]

const BADGE_COLORS: Record<string, string> = {
  pending:           'text-ink-3 bg-paper-2 border-line',
  id_verified:       'text-blue-700 bg-blue-50 border-blue-200',
  business_verified: 'text-brand-green-dark bg-brand-green-light border-brand-green/20',
  fully_verified:    'text-brand-green-dark bg-brand-green-light border-brand-green/20',
  rejected:          'text-brand-red-dark bg-brand-red-light border-brand-red/20',
}

export default function SellersTab() {
  const [filter, setFilter]   = useState('pending')
  const [sellers, setSellers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded]   = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectId, setRejectId]     = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  async function load(f = filter) {
    setLoading(true)
    const res = await fetch(`/api/admin/verify-seller?filter=${f}`)
    if (res.status === 403) { toast.error('Access denied'); setLoading(false); return }
    const d = await res.json()
    setSellers(d.verifications || [])
    setLoading(false)
    setLoaded(true)
  }

  if (!loaded && !loading) load()

  async function approve(id: string, badge_level: BadgeLevel) {
    if (badge_level === 'rejected' && !rejectReason.trim()) { toast.error('Enter a rejection reason'); return }
    setActionLoading(id)
    const res = await fetch('/api/admin/verify-seller', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, badge_level, rejection_reason: badge_level === 'rejected' ? rejectReason : null }),
    })
    if (res.ok) {
      toast.success(`Badge updated: ${badge_level}`)
      setRejectId(null)
      setRejectReason('')
      load(filter)
    } else {
      const d = await res.json()
      toast.error(d.error || 'Update failed')
    }
    setActionLoading(null)
  }

  return (
    <div className="space-y-4">

      <div className="flex items-center justify-between">
        <p className="sec-label">Seller Verifications</p>
        <div className="relative">
          <select value={filter} onChange={e => { setFilter(e.target.value); load(e.target.value) }}
            className="appearance-none border border-line rounded-xl px-3 py-2 text-xs text-ink bg-paper focus:outline-none pr-7">
            <option value="pending">Pending</option>
            <option value="id_verified">ID Verified</option>
            <option value="business_verified">Business Verified</option>
            <option value="fully_verified">Fully Verified</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-ink-3" /></div>
      ) : sellers.length === 0 ? (
        <div className="text-center py-16 text-ink-3 text-sm">No verifications for "{filter}"</div>
      ) : sellers.map(s => (
        <div key={s.id} className="bg-paper border border-line rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-ink">{s.seller_name}</p>
              {s.shop_name && <p className="text-sm text-ink-2">{s.shop_name}</p>}
              <p className="text-xs text-ink-3 mt-1">
                {new Date(s.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${BADGE_COLORS[s.badge_level] || BADGE_COLORS.pending}`}>
              {s.badge_level.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {s.contact_number && <div><span className="text-ink-3 text-xs block">Phone</span><p className="text-ink text-sm">{s.contact_number}</p></div>}
            {s.dti_number     && <div><span className="text-ink-3 text-xs block">DTI</span>  <p className="text-ink text-sm">{s.dti_number}</p></div>}
            {s.sec_number     && <div><span className="text-ink-3 text-xs block">SEC</span>  <p className="text-ink text-sm">{s.sec_number}</p></div>}
            {s.platforms?.length > 0 && <div><span className="text-ink-3 text-xs block">Platforms</span><p className="text-ink text-sm">{s.platforms.join(', ')}</p></div>}
          </div>

          {s.platform_handles?.filter(Boolean).length > 0 && (
            <div>
              <span className="text-ink-3 text-xs block mb-0.5">Links</span>
              {s.platform_handles.filter(Boolean).map((h: string, i: number) => (
                <p key={i} className="text-sm text-ink break-all">{h}</p>
              ))}
            </div>
          )}

          {s.description && (
            <p className="text-sm text-ink-2 bg-paper-2 rounded-xl px-3 py-2 border border-line">{s.description}</p>
          )}

          {s.public_slug && (
            <a href={`/verify/${s.public_slug}`} target="_blank" className="text-xs text-ink-3 hover:text-ink underline">
              /verify/{s.public_slug}
            </a>
          )}

          <div className="flex flex-wrap gap-2 pt-1 border-t border-line">
            {BADGE_OPTIONS.map(b => (
              <button key={b.value} onClick={() => approve(s.id, b.value)}
                disabled={actionLoading === s.id || s.badge_level === b.value}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-line text-xs font-medium hover:bg-ink hover:text-white hover:border-ink transition-all disabled:opacity-40 active:scale-95">
                {actionLoading === s.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                {b.label}
              </button>
            ))}
            <button onClick={() => setRejectId(rejectId === s.id ? null : s.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-brand-red/30 bg-brand-red-light text-brand-red-dark text-xs font-medium hover:bg-brand-red hover:text-white transition-all active:scale-95">
              <XCircle size={12} /> Reject
            </button>
          </div>

          {rejectId === s.id && (
            <div className="space-y-2">
              <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Reason for rejection…"
                className="w-full border border-line rounded-xl px-3 py-2.5 text-sm text-ink bg-paper focus:outline-none focus:border-ink" />
              <button onClick={() => approve(s.id, 'rejected')}
                disabled={actionLoading === s.id || !rejectReason.trim()}
                className="w-full py-2.5 bg-brand-red text-white rounded-xl text-sm font-medium disabled:opacity-40 active:scale-95">
                Confirm Rejection
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
