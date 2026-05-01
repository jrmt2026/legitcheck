'use client'

import { useEffect, useState } from 'react'
import { Loader2, ChevronDown, CreditCard, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const php = (cents: number) => `₱${(cents / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`

export default function UsersTab() {
  const [users, setUsers]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort]       = useState('newest')
  const [search, setSearch]   = useState('')
  const [expandId, setExpandId] = useState<string | null>(null)
  const [creditDelta, setCreditDelta] = useState('')
  const [creditNote, setCreditNote]   = useState('')
  const [adjusting, setAdjusting]     = useState(false)

  async function load(s = sort) {
    setLoading(true)
    const res = await fetch(`/api/admin/users?sort=${s}&limit=100`)
    if (res.status === 403) { toast.error('Access denied'); setLoading(false); return }
    const d = await res.json()
    setUsers(d.users || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function adjustCredits(userId: string) {
    const delta = parseInt(creditDelta)
    if (isNaN(delta) || delta === 0) { toast.error('Enter a non-zero number'); return }
    setAdjusting(true)
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, action: 'adjust_credits', credit_delta: delta, note: creditNote }),
    })
    const d = await res.json()
    if (res.ok) {
      toast.success(`Credits adjusted. New balance: ${d.new_balance}`)
      setCreditDelta('')
      setCreditNote('')
      setExpandId(null)
      load(sort)
    } else {
      toast.error(d.error || 'Adjustment failed')
    }
    setAdjusting(false)
  }

  const filtered = users.filter(u =>
    !search || u.email?.toLowerCase().includes(search.toLowerCase()) || u.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">

      {/* Controls */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by email or name…"
            className="w-full pl-8 pr-3 py-2 border border-line rounded-xl text-xs text-ink bg-paper focus:outline-none focus:border-ink" />
        </div>
        <div className="relative">
          <select value={sort} onChange={e => { setSort(e.target.value); load(e.target.value) }}
            className="appearance-none border border-line rounded-xl px-3 py-2 text-xs text-ink bg-paper focus:outline-none pr-7">
            <option value="newest">Newest</option>
            <option value="checks">Most checks</option>
            <option value="spent">Most credits</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-ink-3" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-ink-3 text-sm">No users found</div>
      ) : (
        <div className="bg-paper border border-line rounded-2xl overflow-hidden">
          {filtered.map((u, i) => {
            const isOpen = expandId === u.id
            return (
              <div key={u.id} className={i !== 0 ? 'border-t border-line' : ''}>

                {/* User row */}
                <button onClick={() => setExpandId(isOpen ? null : u.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-paper-2 transition-colors text-left">
                  <div className="w-8 h-8 rounded-full bg-paper-2 border border-line flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-ink-2">
                    {(u.email?.[0] ?? '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-ink truncate">{u.email}</div>
                    {u.full_name && <div className="text-[10px] text-ink-3">{u.full_name}</div>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 text-right">
                    <div>
                      <div className="text-xs font-bold text-ink font-mono">{(u.credits_remaining ?? 0).toLocaleString()}</div>
                      <div className="text-[9px] text-ink-3">credits</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-ink font-mono">{(u.checks_total ?? 0).toLocaleString()}</div>
                      <div className="text-[9px] text-ink-3">checks</div>
                    </div>
                    {u.total_paid_cents > 0 && (
                      <div>
                        <div className="text-xs font-bold text-brand-green font-mono">{php(u.total_paid_cents)}</div>
                        <div className="text-[9px] text-ink-3">spent</div>
                      </div>
                    )}
                  </div>
                </button>

                {/* Expand panel */}
                {isOpen && (
                  <div className="border-t border-line px-4 pb-4 pt-3 bg-paper-2 space-y-3">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-paper border border-line rounded-xl p-2.5">
                        <div className="text-sm font-bold text-ink font-mono">{u.credits_remaining ?? 0}</div>
                        <div className="text-[10px] text-ink-3">credits left</div>
                      </div>
                      <div className="bg-paper border border-line rounded-xl p-2.5">
                        <div className="text-sm font-bold text-ink font-mono">{u.checks_total ?? 0}</div>
                        <div className="text-[10px] text-ink-3">total checks</div>
                      </div>
                      <div className="bg-paper border border-line rounded-xl p-2.5">
                        <div className="text-sm font-bold text-ink font-mono">{u.reports_total ?? 0}</div>
                        <div className="text-[10px] text-ink-3">reports</div>
                      </div>
                    </div>

                    <div className="text-[10px] text-ink-3 flex gap-3 flex-wrap">
                      <span>Plan: <span className="text-ink font-medium">{u.plan || 'free'}</span></span>
                      <span>Joined: <span className="text-ink font-medium">{new Date(u.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span></span>
                      {u.last_check_date && <span>Last check: <span className="text-ink font-medium">{new Date(u.last_check_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</span></span>}
                    </div>

                    {/* Credit adjustment */}
                    <div className="bg-paper border border-line rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-ink">
                        <CreditCard size={12} className="text-ink-3" /> Adjust Credits
                      </div>
                      <div className="flex gap-2">
                        <input value={creditDelta} onChange={e => setCreditDelta(e.target.value)}
                          placeholder="e.g. +5 or -2" type="number"
                          className="w-24 border border-line rounded-lg px-2 py-1.5 text-xs text-ink bg-paper-2 focus:outline-none focus:border-ink" />
                        <input value={creditNote} onChange={e => setCreditNote(e.target.value)}
                          placeholder="Note (optional)"
                          className="flex-1 border border-line rounded-lg px-2 py-1.5 text-xs text-ink bg-paper-2 focus:outline-none focus:border-ink" />
                        <button onClick={() => adjustCredits(u.id)} disabled={adjusting || !creditDelta}
                          className="px-3 py-1.5 bg-ink text-white rounded-lg text-xs font-medium disabled:opacity-40 hover:opacity-90 active:scale-95">
                          {adjusting ? <Loader2 size={11} className="animate-spin" /> : 'Apply'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
