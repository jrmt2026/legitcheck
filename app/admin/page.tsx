'use client'

import { useEffect, useState } from 'react'
import { BadgeCheck, Flag, CheckCircle, XCircle, Clock, ChevronDown, ShieldAlert, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

type Tab = 'sellers' | 'reports'
type BadgeLevel = 'pending' | 'id_verified' | 'business_verified' | 'fully_verified' | 'rejected'

const BADGE_OPTIONS: { value: BadgeLevel; label: string }[] = [
  { value: 'id_verified',       label: '🪪 ID Verified' },
  { value: 'business_verified', label: '📋 Business Verified' },
  { value: 'fully_verified',    label: '✅ Fully Verified' },
  { value: 'rejected',          label: '❌ Reject' },
]

const BADGE_COLORS: Record<string, string> = {
  pending:           'text-ink-3 bg-paper-2',
  id_verified:       'text-blue-700 bg-blue-50',
  business_verified: 'text-brand-green-dark bg-brand-green-light',
  fully_verified:    'text-brand-green-dark bg-brand-green-light',
  rejected:          'text-brand-red-dark bg-brand-red-light',
}

export default function AdminPage() {
  const [tab, setTab]           = useState<Tab>('sellers')
  const [sellers, setSellers]   = useState<any[]>([])
  const [reports, setReports]   = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('pending')
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function loadSellers(f = filter) {
    setLoading(true)
    const res = await fetch(`/api/admin/verify-seller?filter=${f}`)
    if (res.status === 403) { toast.error('Access denied'); setLoading(false); return }
    const d = await res.json()
    setSellers(d.verifications || [])
    setLoading(false)
  }

  async function loadReports() {
    setLoading(true)
    const res = await fetch('/api/admin/scam-reports')
    if (res.status === 403) { toast.error('Access denied'); setLoading(false); return }
    const d = await res.json()
    setReports(d.reports || [])
    setLoading(false)
  }

  useEffect(() => { tab === 'sellers' ? loadSellers() : loadReports() }, [tab])

  async function approveSeller(id: string, badge_level: BadgeLevel) {
    if (badge_level === 'rejected' && !rejectReason.trim()) {
      toast.error('Please enter a rejection reason')
      return
    }
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
      loadSellers(filter)
    } else {
      const d = await res.json()
      toast.error(d.error || 'Update failed')
    }
    setActionLoading(null)
  }

  async function toggleReportVerified(id: string, current: boolean) {
    setActionLoading(id)
    await fetch('/api/admin/scam-reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_verified: !current }),
    })
    toast.success(current ? 'Unmarked' : 'Marked as confirmed scammer')
    loadReports()
    setActionLoading(null)
  }

  return (
    <div className="min-h-screen bg-paper-2">
      <header className="border-b border-line bg-paper px-4 py-3 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-base font-semibold text-ink">LegitCheck Admin</span>
            <span className="ml-2 text-xs text-ink-3 font-mono">Internal only</span>
          </div>
          <div className="flex gap-1 bg-paper-2 border border-line rounded-full p-0.5">
            {(['sellers', 'reports'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${tab === t ? 'bg-paper text-ink shadow-sm border border-line' : 'text-ink-3'}`}>
                {t === 'sellers' ? '🏅 Sellers' : '🚩 Reports'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* ── SELLERS TAB ─────────────────────────────────────────────────── */}
        {tab === 'sellers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-ink">Seller Verifications</h1>
              <div className="relative">
                <select value={filter} onChange={e => { setFilter(e.target.value); loadSellers(e.target.value) }}
                  className="appearance-none border border-line rounded-xl px-3 py-2 text-sm text-ink bg-paper focus:outline-none pr-8">
                  <option value="pending">Pending</option>
                  <option value="id_verified">ID Verified</option>
                  <option value="business_verified">Business Verified</option>
                  <option value="fully_verified">Fully Verified</option>
                  <option value="rejected">Rejected</option>
                  <option value="all">All</option>
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-16 text-ink-3"><Loader2 size={24} className="animate-spin" /></div>
            ) : sellers.length === 0 ? (
              <div className="text-center py-16 text-ink-3 text-sm">No verifications found for "{filter}"</div>
            ) : sellers.map(s => (
              <div key={s.id} className="bg-paper border border-line rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-ink">{s.seller_name}</p>
                    {s.shop_name && <p className="text-sm text-ink-2">{s.shop_name}</p>}
                    <p className="text-xs text-ink-3 mt-1">{new Date(s.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${BADGE_COLORS[s.badge_level] || BADGE_COLORS.pending}`}>
                    {s.badge_level.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {s.contact_number && <div><span className="text-ink-3 text-xs">Phone:</span><p className="text-ink">{s.contact_number}</p></div>}
                  {s.dti_number && <div><span className="text-ink-3 text-xs">DTI:</span><p className="text-ink">{s.dti_number}</p></div>}
                  {s.sec_number && <div><span className="text-ink-3 text-xs">SEC:</span><p className="text-ink">{s.sec_number}</p></div>}
                  {s.platforms?.length > 0 && <div><span className="text-ink-3 text-xs">Platforms:</span><p className="text-ink">{s.platforms.join(', ')}</p></div>}
                </div>

                {s.platform_handles?.filter(Boolean).length > 0 && (
                  <div className="text-sm"><span className="text-ink-3 text-xs block">Links:</span>
                    {s.platform_handles.filter(Boolean).map((h: string, i: number) => <p key={i} className="text-ink break-all">{h}</p>)}
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

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 pt-1 border-t border-line">
                  {BADGE_OPTIONS.filter(b => b.value !== 'rejected').map(b => (
                    <button key={b.value}
                      onClick={() => approveSeller(s.id, b.value)}
                      disabled={actionLoading === s.id || s.badge_level === b.value}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-line text-xs font-medium hover:bg-ink hover:text-white hover:border-ink transition-all disabled:opacity-40 active:scale-95">
                      {actionLoading === s.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                      {b.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setRejectId(rejectId === s.id ? null : s.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-brand-red/30 bg-brand-red-light text-brand-red-dark text-xs font-medium hover:bg-brand-red hover:text-white transition-all active:scale-95">
                    <XCircle size={12} />
                    Reject
                  </button>
                </div>

                {rejectId === s.id && (
                  <div className="space-y-2 animate-slide-up">
                    <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection…"
                      className="w-full border border-line rounded-xl px-3 py-2.5 text-sm text-ink bg-paper focus:outline-none focus:border-ink" />
                    <button onClick={() => approveSeller(s.id, 'rejected')}
                      disabled={actionLoading === s.id || !rejectReason.trim()}
                      className="w-full py-2.5 bg-brand-red text-white rounded-xl text-sm font-medium disabled:opacity-40 active:scale-95">
                      Confirm Rejection
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── REPORTS TAB ─────────────────────────────────────────────────── */}
        {tab === 'reports' && (
          <div className="space-y-4">
            <h1 className="text-lg font-semibold text-ink">Scam Reports <span className="text-ink-3 font-normal text-sm">({reports.length})</span></h1>
            {loading ? (
              <div className="flex justify-center py-16 text-ink-3"><Loader2 size={24} className="animate-spin" /></div>
            ) : reports.length === 0 ? (
              <div className="text-center py-16 text-ink-3 text-sm">No scam reports yet.</div>
            ) : reports.map(r => (
              <div key={r.id} className={`bg-paper border rounded-2xl p-4 space-y-2 ${r.is_verified ? 'border-brand-red/30 bg-brand-red-light' : 'border-line'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {r.is_verified && <ShieldAlert size={14} className="text-brand-red-dark flex-shrink-0" />}
                      <p className="text-sm font-semibold text-ink">{r.identifier}</p>
                      <span className="text-xs text-ink-3 px-2 py-0.5 bg-paper-2 rounded-full border border-line">{r.identifier_type}</span>
                    </div>
                    {r.account_name && <p className="text-xs text-ink-2 mt-0.5">Name: {r.account_name}</p>}
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-ink-3">{r.category}</span>
                      {r.platform && <span className="text-xs text-ink-3">· {r.platform}</span>}
                      {r.amount_lost && <span className="text-xs text-brand-red-dark font-medium">· ₱{r.amount_lost.toLocaleString()} lost</span>}
                    </div>
                  </div>
                  <p className="text-xs text-ink-3 flex-shrink-0">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>

                {r.description && (
                  <p className="text-xs text-ink-2 bg-paper-2 rounded-lg px-3 py-2 border border-line">{r.description}</p>
                )}

                <button
                  onClick={() => toggleReportVerified(r.id, r.is_verified)}
                  disabled={actionLoading === r.id}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                    r.is_verified
                      ? 'border border-line bg-paper text-ink-2 hover:bg-paper-2'
                      : 'bg-brand-red text-white hover:opacity-90'
                  }`}>
                  {actionLoading === r.id ? <Loader2 size={12} className="animate-spin" /> : <Flag size={12} />}
                  {r.is_verified ? 'Unmark as confirmed' : 'Mark as confirmed scammer'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
