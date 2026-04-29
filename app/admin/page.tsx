'use client'

import { useEffect, useState } from 'react'
import {
  CheckCircle, XCircle, ChevronDown, ShieldAlert, Loader2,
  Flag, Clock, MessageSquare, RotateCcw,
} from 'lucide-react'
import toast from 'react-hot-toast'

type MainTab   = 'sellers' | 'reports'
type BadgeLevel = 'pending' | 'id_verified' | 'business_verified' | 'fully_verified' | 'rejected'
type ReportStatus = 'pending' | 'approved' | 'rejected'
type ReportFilter = 'pending' | 'approved' | 'rejected' | 'all'

interface ReportCounts { pending: number; approved: number; rejected: number; all: number }

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

const STATUS_STYLES: Record<ReportStatus, string> = {
  pending:  'text-brand-yellow-dark bg-brand-yellow-light border-brand-yellow/30',
  approved: 'text-brand-red-dark bg-brand-red-light border-brand-red/20',
  rejected: 'text-ink-3 bg-paper-2 border-line',
}

const STATUS_LABEL: Record<ReportStatus, string> = {
  pending:  '⏳ Pending',
  approved: '🚨 Confirmed scam',
  rejected: '✗ Dismissed',
}

export default function AdminPage() {
  const [tab, setTab]                   = useState<MainTab>('reports')
  const [sellers, setSellers]           = useState<any[]>([])
  const [reports, setReports]           = useState<any[]>([])
  const [counts, setCounts]             = useState<ReportCounts>({ pending: 0, approved: 0, rejected: 0, all: 0 })
  const [loading, setLoading]           = useState(true)
  const [sellerFilter, setSellerFilter] = useState('pending')
  const [reportFilter, setReportFilter] = useState<ReportFilter>('pending')
  const [rejectSellerId, setRejectSellerId] = useState<string | null>(null)
  const [rejectSellerReason, setRejectSellerReason] = useState('')
  const [noteId, setNoteId]             = useState<string | null>(null)
  const [noteText, setNoteText]         = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function loadSellers(f = sellerFilter) {
    setLoading(true)
    const res = await fetch(`/api/admin/verify-seller?filter=${f}`)
    if (res.status === 403) { toast.error('Access denied'); setLoading(false); return }
    const d = await res.json()
    setSellers(d.verifications || [])
    setLoading(false)
  }

  async function loadReports(f: ReportFilter = reportFilter) {
    setLoading(true)
    const res = await fetch(`/api/admin/scam-reports?status=${f}`)
    if (res.status === 403) { toast.error('Access denied'); setLoading(false); return }
    const d = await res.json()
    setReports(d.reports || [])
    setCounts(d.counts || { pending: 0, approved: 0, rejected: 0, all: 0 })
    setLoading(false)
  }

  useEffect(() => {
    if (tab === 'sellers') loadSellers()
    else loadReports()
  }, [tab])

  async function approveSeller(id: string, badge_level: BadgeLevel) {
    if (badge_level === 'rejected' && !rejectSellerReason.trim()) {
      toast.error('Enter a rejection reason')
      return
    }
    setActionLoading(id)
    const res = await fetch('/api/admin/verify-seller', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, badge_level, rejection_reason: badge_level === 'rejected' ? rejectSellerReason : null }),
    })
    if (res.ok) {
      toast.success(`Badge updated: ${badge_level}`)
      setRejectSellerId(null)
      setRejectSellerReason('')
      loadSellers(sellerFilter)
    } else {
      const d = await res.json()
      toast.error(d.error || 'Update failed')
    }
    setActionLoading(null)
  }

  async function moderateReport(id: string, status: ReportStatus, note?: string) {
    setActionLoading(id)
    const res = await fetch('/api/admin/scam-reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, admin_note: note }),
    })
    if (res.ok) {
      const label = status === 'approved' ? 'Confirmed scam' : status === 'rejected' ? 'Dismissed' : 'Reset to pending'
      toast.success(label)
      setNoteId(null)
      setNoteText('')
      loadReports(reportFilter)
    } else {
      toast.error('Action failed')
    }
    setActionLoading(null)
  }

  function switchReportFilter(f: ReportFilter) {
    setReportFilter(f)
    loadReports(f)
  }

  const REPORT_FILTER_TABS: { id: ReportFilter; label: string; count: number; dot?: string }[] = [
    { id: 'pending',  label: 'Pending',  count: counts.pending,  dot: counts.pending  > 0 ? 'bg-brand-yellow' : '' },
    { id: 'approved', label: 'Confirmed', count: counts.approved, dot: counts.approved > 0 ? 'bg-brand-red'    : '' },
    { id: 'rejected', label: 'Dismissed', count: counts.rejected },
    { id: 'all',      label: 'All',       count: counts.all },
  ]

  return (
    <div className="min-h-screen bg-paper-2">

      {/* Header */}
      <header className="border-b border-line bg-paper px-4 py-3 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-ink">LegitCheck Admin</span>
            <span className="text-xs text-ink-3 font-mono bg-paper-2 px-2 py-0.5 rounded-full border border-line">Internal</span>
            {tab === 'reports' && counts.pending > 0 && (
              <span className="text-xs font-bold text-white bg-brand-yellow px-2 py-0.5 rounded-full">
                {counts.pending} pending
              </span>
            )}
          </div>
          <div className="flex gap-1 bg-paper-2 border border-line rounded-full p-0.5">
            {(['reports', 'sellers'] as MainTab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  tab === t ? 'bg-paper text-ink shadow-sm border border-line' : 'text-ink-3'
                }`}>
                {t === 'sellers' ? '🏅 Sellers' : '🚩 Reports'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* ── REPORTS TAB ─────────────────────────────────────────────────── */}
        {tab === 'reports' && (
          <div className="space-y-4">

            {/* Status filter tabs */}
            <div className="flex gap-1 bg-paper border border-line rounded-2xl p-1">
              {REPORT_FILTER_TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => switchReportFilter(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    reportFilter === t.id
                      ? 'bg-ink text-white shadow-sm'
                      : 'text-ink-3 hover:text-ink'
                  }`}
                >
                  {t.dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.dot}`} />}
                  {t.label}
                  <span className={`font-mono ${reportFilter === t.id ? 'text-white/60' : 'text-ink-3'}`}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Report list */}
            {loading ? (
              <div className="flex justify-center py-16 text-ink-3">
                <Loader2 size={24} className="animate-spin" />
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-16 text-ink-3 text-sm">
                {reportFilter === 'pending' ? '✅ All caught up — no pending reports.' : `No ${reportFilter} reports.`}
              </div>
            ) : reports.map(r => {
              const status: ReportStatus = r.status || (r.is_verified ? 'approved' : 'pending')
              const isExpanded = noteId === r.id

              return (
                <div key={r.id} className={`bg-paper border rounded-2xl overflow-hidden ${
                  status === 'approved' ? 'border-brand-red/25' : 'border-line'
                }`}>

                  {/* Top bar */}
                  <div className="px-4 pt-4 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {status === 'approved' && <ShieldAlert size={14} className="text-brand-red-dark flex-shrink-0" />}
                          <p className="text-sm font-bold text-ink font-mono">{r.identifier}</p>
                          <span className="text-[11px] text-ink-3 px-2 py-0.5 bg-paper-2 rounded-full border border-line">{r.identifier_type}</span>
                        </div>
                        {r.account_name && (
                          <p className="text-xs text-ink-2 mt-0.5 font-medium">{r.account_name}</p>
                        )}
                        <div className="flex gap-2 mt-1.5 flex-wrap">
                          <span className="text-xs text-ink-3">{r.category?.replace('_', ' ')}</span>
                          {r.platform && <span className="text-xs text-ink-3">· {r.platform}</span>}
                          {r.amount_lost && (
                            <span className="text-xs text-brand-red-dark font-semibold">· ₱{Number(r.amount_lost).toLocaleString()} lost</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[status]}`}>
                          {STATUS_LABEL[status]}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-ink-3">
                          <Clock size={10} />
                          {new Date(r.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    {r.description && (
                      <p className="mt-3 text-xs text-ink-2 bg-paper-2 rounded-xl px-3 py-2.5 border border-line leading-relaxed">
                        {r.description}
                      </p>
                    )}

                    {r.admin_note && (
                      <div className="mt-2 flex items-start gap-2 bg-brand-blue-light border border-brand-blue/20 rounded-xl px-3 py-2">
                        <MessageSquare size={11} className="text-brand-blue-dark mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-brand-blue-dark leading-snug">{r.admin_note}</p>
                      </div>
                    )}
                  </div>

                  {/* Action bar */}
                  <div className="border-t border-line px-4 py-3 flex items-center gap-2 flex-wrap bg-paper-2">
                    {status !== 'approved' && (
                      <button
                        onClick={() => moderateReport(r.id, 'approved', noteId === r.id ? noteText : undefined)}
                        disabled={actionLoading === r.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-red text-white text-xs font-semibold hover:opacity-90 transition-all active:scale-95 disabled:opacity-40"
                      >
                        {actionLoading === r.id ? <Loader2 size={11} className="animate-spin" /> : <ShieldAlert size={11} />}
                        Confirm scam
                      </button>
                    )}
                    {status !== 'rejected' && (
                      <button
                        onClick={() => moderateReport(r.id, 'rejected', noteId === r.id ? noteText : undefined)}
                        disabled={actionLoading === r.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-line bg-paper text-ink-2 text-xs font-medium hover:bg-ink hover:text-white hover:border-ink transition-all active:scale-95 disabled:opacity-40"
                      >
                        {actionLoading === r.id ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
                        Dismiss
                      </button>
                    )}
                    {status !== 'pending' && (
                      <button
                        onClick={() => moderateReport(r.id, 'pending')}
                        disabled={actionLoading === r.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-line bg-paper text-ink-3 text-xs font-medium hover:bg-paper-2 transition-all active:scale-95 disabled:opacity-40"
                      >
                        <RotateCcw size={11} /> Reset
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setNoteId(isExpanded ? null : r.id)
                        setNoteText(r.admin_note || '')
                      }}
                      className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl border border-line bg-paper text-ink-3 text-xs font-medium hover:bg-paper-2 transition-all"
                    >
                      <MessageSquare size={11} />
                      {r.admin_note ? 'Edit note' : 'Add note'}
                    </button>
                  </div>

                  {/* Note input */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 space-y-2 border-t border-line animate-slide-down">
                      <textarea
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        placeholder="Internal note (not shown to users)…"
                        rows={2}
                        className="w-full border border-line rounded-xl px-3 py-2.5 text-sm text-ink bg-paper focus:outline-none focus:border-ink resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => moderateReport(r.id, status, noteText)}
                          disabled={actionLoading === r.id}
                          className="px-4 py-2 bg-ink text-white rounded-xl text-xs font-semibold hover:opacity-90 disabled:opacity-40 active:scale-95"
                        >
                          Save note
                        </button>
                        <button
                          onClick={() => { setNoteId(null); setNoteText('') }}
                          className="px-4 py-2 border border-line rounded-xl text-xs text-ink-3 hover:bg-paper-2"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── SELLERS TAB ─────────────────────────────────────────────────── */}
        {tab === 'sellers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-ink">Seller Verifications</h1>
              <div className="relative">
                <select
                  value={sellerFilter}
                  onChange={e => { setSellerFilter(e.target.value); loadSellers(e.target.value) }}
                  className="appearance-none border border-line rounded-xl px-3 py-2 text-sm text-ink bg-paper focus:outline-none pr-8"
                >
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
              <div className="text-center py-16 text-ink-3 text-sm">No verifications for "{sellerFilter}"</div>
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
                  {s.contact_number && <div><span className="text-ink-3 text-xs">Phone</span><p className="text-ink">{s.contact_number}</p></div>}
                  {s.dti_number     && <div><span className="text-ink-3 text-xs">DTI</span>  <p className="text-ink">{s.dti_number}</p></div>}
                  {s.sec_number     && <div><span className="text-ink-3 text-xs">SEC</span>  <p className="text-ink">{s.sec_number}</p></div>}
                  {s.platforms?.length > 0 && <div><span className="text-ink-3 text-xs">Platforms</span><p className="text-ink">{s.platforms.join(', ')}</p></div>}
                </div>

                {s.platform_handles?.filter(Boolean).length > 0 && (
                  <div className="text-sm">
                    <span className="text-ink-3 text-xs block mb-0.5">Links</span>
                    {s.platform_handles.filter(Boolean).map((h: string, i: number) => (
                      <p key={i} className="text-ink break-all">{h}</p>
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
                    <button key={b.value}
                      onClick={() => approveSeller(s.id, b.value)}
                      disabled={actionLoading === s.id || s.badge_level === b.value}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-line text-xs font-medium hover:bg-ink hover:text-white hover:border-ink transition-all disabled:opacity-40 active:scale-95">
                      {actionLoading === s.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                      {b.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setRejectSellerId(rejectSellerId === s.id ? null : s.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-brand-red/30 bg-brand-red-light text-brand-red-dark text-xs font-medium hover:bg-brand-red hover:text-white transition-all active:scale-95">
                    <XCircle size={12} /> Reject
                  </button>
                </div>

                {rejectSellerId === s.id && (
                  <div className="space-y-2 animate-slide-up">
                    <input
                      value={rejectSellerReason}
                      onChange={e => setRejectSellerReason(e.target.value)}
                      placeholder="Reason for rejection…"
                      className="w-full border border-line rounded-xl px-3 py-2.5 text-sm text-ink bg-paper focus:outline-none focus:border-ink"
                    />
                    <button
                      onClick={() => approveSeller(s.id, 'rejected')}
                      disabled={actionLoading === s.id || !rejectSellerReason.trim()}
                      className="w-full py-2.5 bg-brand-red text-white rounded-xl text-sm font-medium disabled:opacity-40 active:scale-95"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
