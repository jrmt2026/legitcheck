'use client'

import { useState } from 'react'
import { Loader2, ShieldAlert, XCircle, RotateCcw, MessageSquare, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

type ReportStatus = 'pending' | 'approved' | 'rejected'
type Filter = 'pending' | 'approved' | 'rejected' | 'all'

interface Counts { pending: number; approved: number; rejected: number; all: number }

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

export default function ReportsTab() {
  const [filter, setFilter]         = useState<Filter>('pending')
  const [catFilter, setCatFilter]   = useState<string>('all')
  const [reports, setReports]       = useState<any[]>([])
  const [counts, setCounts]         = useState<Counts>({ pending: 0, approved: 0, rejected: 0, all: 0 })
  const [loading, setLoading]       = useState(false)
  const [loaded, setLoaded]         = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [noteId, setNoteId]         = useState<string | null>(null)
  const [noteText, setNoteText]     = useState('')

  async function load(f: Filter = filter, cat: string = catFilter) {
    setLoading(true)
    const params = new URLSearchParams({ status: f })
    if (cat !== 'all') params.set('category', cat)
    const res = await fetch(`/api/admin/scam-reports?${params}`)
    if (res.status === 403) { toast.error('Access denied'); setLoading(false); return }
    const d = await res.json()
    setReports(d.reports || [])
    setCounts(d.counts || { pending: 0, approved: 0, rejected: 0, all: 0 })
    setLoading(false)
    setLoaded(true)
  }

  // Load on first render
  if (!loaded && !loading) load()

  async function moderate(id: string, status: ReportStatus, note?: string) {
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
      load(filter)
    } else {
      toast.error('Action failed')
    }
    setActionLoading(null)
  }

  function switchFilter(f: Filter) {
    setFilter(f)
    load(f, catFilter)
  }

  function switchCat(cat: string) {
    setCatFilter(cat)
    load(filter, cat)
  }

  const FILTER_TABS: { id: Filter; label: string; count: number; dot?: string }[] = [
    { id: 'pending',  label: 'Pending',   count: counts.pending,  dot: counts.pending  > 0 ? 'bg-brand-yellow' : '' },
    { id: 'approved', label: 'Confirmed', count: counts.approved, dot: counts.approved > 0 ? 'bg-brand-red'    : '' },
    { id: 'rejected', label: 'Dismissed', count: counts.rejected },
    { id: 'all',      label: 'All',       count: counts.all },
  ]

  const CAT_FILTERS = [
    { id: 'all',          label: 'All categories' },
    { id: 'bad_buyer',    label: '🚩 Bad Buyers' },
    { id: 'online_seller',label: '🛍️ Sellers' },
    { id: 'sms_scam',     label: '📱 SMS Scam' },
    { id: 'investment',   label: '💰 Investment' },
    { id: 'job_agency',   label: '✈️ Job / OFW' },
  ]

  return (
    <div className="space-y-4">

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {CAT_FILTERS.map(c => (
          <button key={c.id} onClick={() => switchCat(c.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              catFilter === c.id ? 'bg-ink text-white border-ink' : 'bg-paper border-line text-ink-3 hover:text-ink'
            }`}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 bg-paper border border-line rounded-2xl p-1">
        {FILTER_TABS.map(t => (
          <button key={t.id} onClick={() => switchFilter(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              filter === t.id ? 'bg-ink text-white shadow-sm' : 'text-ink-3 hover:text-ink'
            }`}
          >
            {t.dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.dot}`} />}
            {t.label}
            <span className={`font-mono ${filter === t.id ? 'text-white/60' : 'text-ink-3'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-ink-3" /></div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-ink-3 text-sm">
          {filter === 'pending' ? '✅ All caught up — no pending reports.' : `No ${filter} reports.`}
        </div>
      ) : reports.map(r => {
        const status: ReportStatus = r.status || 'pending'
        const isExpanded = noteId === r.id
        return (
          <div key={r.id} className={`bg-paper border rounded-2xl overflow-hidden ${status === 'approved' ? 'border-brand-red/25' : 'border-line'}`}>

            <div className="px-4 pt-4 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {status === 'approved' && <ShieldAlert size={14} className="text-brand-red-dark flex-shrink-0" />}
                    <p className="text-sm font-bold text-ink font-mono">{r.identifier}</p>
                    <span className="text-[11px] text-ink-3 px-2 py-0.5 bg-paper-2 rounded-full border border-line">{r.identifier_type}</span>
                  </div>
                  {r.account_name && <p className="text-xs text-ink-2 mt-0.5 font-medium">{r.account_name}</p>}
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    <span className="text-xs text-ink-3">{r.category?.replace('_', ' ')}</span>
                    {r.platform && <span className="text-xs text-ink-3">· {r.platform}</span>}
                    {r.amount_lost && <span className="text-xs text-brand-red-dark font-semibold">· ₱{Number(r.amount_lost).toLocaleString()} lost</span>}
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
                <p className="mt-3 text-xs text-ink-2 bg-paper-2 rounded-xl px-3 py-2.5 border border-line leading-relaxed">{r.description}</p>
              )}
              {r.admin_note && (
                <div className="mt-2 flex items-start gap-2 bg-brand-blue-light border border-brand-blue/20 rounded-xl px-3 py-2">
                  <MessageSquare size={11} className="text-brand-blue-dark mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-brand-blue-dark leading-snug">{r.admin_note}</p>
                </div>
              )}
            </div>

            <div className="border-t border-line px-4 py-3 flex items-center gap-2 flex-wrap bg-paper-2">
              {status !== 'approved' && (
                <button onClick={() => moderate(r.id, 'approved', isExpanded ? noteText : undefined)}
                  disabled={actionLoading === r.id}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-red text-white text-xs font-semibold hover:opacity-90 transition-all active:scale-95 disabled:opacity-40">
                  {actionLoading === r.id ? <Loader2 size={11} className="animate-spin" /> : <ShieldAlert size={11} />}
                  Confirm scam
                </button>
              )}
              {status !== 'rejected' && (
                <button onClick={() => moderate(r.id, 'rejected', isExpanded ? noteText : undefined)}
                  disabled={actionLoading === r.id}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-line bg-paper text-ink-2 text-xs font-medium hover:bg-ink hover:text-white hover:border-ink transition-all active:scale-95 disabled:opacity-40">
                  {actionLoading === r.id ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
                  Dismiss
                </button>
              )}
              {status !== 'pending' && (
                <button onClick={() => moderate(r.id, 'pending')}
                  disabled={actionLoading === r.id}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-line bg-paper text-ink-3 text-xs font-medium hover:bg-paper-2 transition-all active:scale-95 disabled:opacity-40">
                  <RotateCcw size={11} /> Reset
                </button>
              )}
              <button
                onClick={() => { setNoteId(isExpanded ? null : r.id); setNoteText(r.admin_note || '') }}
                className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl border border-line bg-paper text-ink-3 text-xs font-medium hover:bg-paper-2 transition-all">
                <MessageSquare size={11} />
                {r.admin_note ? 'Edit note' : 'Add note'}
              </button>
            </div>

            {isExpanded && (
              <div className="px-4 pb-4 pt-1 space-y-2 border-t border-line">
                <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                  placeholder="Internal note (not shown to users)…" rows={2}
                  className="w-full border border-line rounded-xl px-3 py-2.5 text-sm text-ink bg-paper focus:outline-none focus:border-ink resize-none" />
                <div className="flex gap-2">
                  <button onClick={() => moderate(r.id, status, noteText)} disabled={actionLoading === r.id}
                    className="px-4 py-2 bg-ink text-white rounded-xl text-xs font-semibold hover:opacity-90 disabled:opacity-40 active:scale-95">
                    Save note
                  </button>
                  <button onClick={() => { setNoteId(null); setNoteText('') }}
                    className="px-4 py-2 border border-line rounded-xl text-xs text-ink-3 hover:bg-paper-2">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
