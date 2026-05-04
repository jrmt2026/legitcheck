'use client'

import { useEffect, useState } from 'react'
import { Loader2, Users, TrendingUp, DollarSign, Flag, ShieldCheck, Zap, AlertTriangle, Check } from 'lucide-react'

export default function CommandCenter() {
  const [data, setData]           = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [budget, setBudget]       = useState<any>(null)
  const [limitInput, setLimitInput] = useState('')
  const [savingLimit, setSavingLimit] = useState(false)
  const [limitSaved, setLimitSaved]   = useState(false)

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => { setData(d); setLoading(false) })
    fetch('/api/admin/ai-budget').then(r => r.json()).then(d => {
      setBudget(d)
      setLimitInput(String(d.today?.dailyLimitUsd ?? 10))
    })
  }, [])

  async function saveLimit() {
    const val = parseFloat(limitInput)
    if (isNaN(val)) return
    setSavingLimit(true)
    const res = await fetch('/api/admin/ai-budget', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dailyLimitUsd: val }),
    })
    if (res.ok) {
      const fresh = await fetch('/api/admin/ai-budget').then(r => r.json())
      setBudget(fresh)
      setLimitSaved(true)
      setTimeout(() => setLimitSaved(false), 2000)
    }
    setSavingLimit(false)
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-ink-3" /></div>
  if (!data)   return <div className="text-center py-10 text-sm text-ink-3">Failed to load</div>

  const php = (cents: number) => `₱${(cents / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`

  const today         = budget?.today
  const pct           = Math.min(100, today?.percentUsed ?? 0)
  const isWarning     = pct >= 80 && pct < 100
  const isOver        = pct >= 100
  const barColor      = isOver ? 'bg-brand-red' : isWarning ? 'bg-brand-yellow' : 'bg-brand-green'
  const history: any[] = budget?.history?.slice(0, 7) ?? []

  return (
    <div className="space-y-5">

      {/* North Star */}
      <div className="bg-ink rounded-2xl p-5 text-center space-y-2">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">North Star Metric</p>
        <p className="text-4xl font-bold text-white font-mono">{(data.checksThisMonth ?? 0).toLocaleString()}</p>
        <p className="text-sm text-white/60">Transactions checked before money was sent — this month</p>
        <div className="flex items-center justify-center gap-2 pt-1">
          <ShieldCheck size={13} className="text-brand-green" />
          <span className="text-xs text-brand-green font-semibold">Each check = one potential loss prevented</span>
        </div>
      </div>

      {/* ── Claude API Budget ───────────────────────────────────────────────── */}
      <div className={`rounded-2xl border p-5 space-y-4 ${isOver ? 'bg-brand-red-light border-brand-red/30' : isWarning ? 'bg-brand-yellow-light border-brand-yellow/30' : 'bg-paper border-line'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={14} className={isOver ? 'text-brand-red-dark' : isWarning ? 'text-brand-yellow-dark' : 'text-ink-3'} />
            <p className="text-xs font-semibold tracking-widest uppercase text-ink-3 font-mono">Claude API Budget</p>
          </div>
          {isOver && (
            <span className="text-[10px] font-bold text-white bg-brand-red px-2 py-0.5 rounded-full">LIMIT REACHED</span>
          )}
          {isWarning && (
            <span className="text-[10px] font-bold text-brand-yellow-dark bg-brand-yellow/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle size={8} /> {Math.round(pct)}% used
            </span>
          )}
        </div>

        {/* Cost + progress */}
        <div>
          <div className="flex items-end justify-between mb-2">
            <div>
              <span className="text-2xl font-bold font-mono text-ink">
                ${today?.estimatedCostUsd?.toFixed(3) ?? '0.000'}
              </span>
              <span className="text-sm text-ink-3 ml-1">/ ${today?.dailyLimitUsd?.toFixed(2) ?? '10.00'} today</span>
            </div>
            <span className="text-sm font-semibold text-ink-3 font-mono">{Math.round(pct)}%</span>
          </div>
          <div className="w-full h-2 bg-line rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Endpoint breakdown */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Analyze', calls: today?.analyzeCalls ?? 0, cost: (today?.analyzeCalls ?? 0) * 0.023 },
            { label: 'Verify',  calls: today?.verifyCalls  ?? 0, cost: (today?.verifyCalls  ?? 0) * 0.008 },
            { label: 'Bantay',  calls: today?.agentCalls   ?? 0, cost: (today?.agentCalls   ?? 0) * 0.006 },
          ].map(({ label, calls, cost }) => (
            <div key={label} className="bg-paper-2 rounded-xl border border-line p-3 text-center">
              <div className="text-lg font-bold font-mono text-ink">{calls}</div>
              <div className="text-[10px] text-ink-3 font-semibold">{label}</div>
              <div className="text-[10px] text-ink-3 font-mono">${cost.toFixed(3)}</div>
            </div>
          ))}
        </div>

        {/* Set limit */}
        <div>
          <p className="text-[10px] font-semibold text-ink-3 uppercase tracking-widest font-mono mb-2">Daily limit (USD)</p>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center bg-paper border border-line rounded-xl px-3 gap-1">
              <span className="text-sm text-ink-3">$</span>
              <input
                type="number"
                min="0.5"
                max="500"
                step="0.5"
                value={limitInput}
                onChange={e => setLimitInput(e.target.value)}
                className="flex-1 py-2.5 text-sm text-ink bg-transparent focus:outline-none font-mono"
              />
            </div>
            <button
              onClick={saveLimit}
              disabled={savingLimit}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                limitSaved
                  ? 'bg-brand-green text-white'
                  : 'bg-ink text-white hover:opacity-90'
              }`}
            >
              {savingLimit ? <Loader2 size={13} className="animate-spin" /> : limitSaved ? <><Check size={13} /> Saved</> : 'Save'}
            </button>
          </div>
          <p className="text-[10px] text-ink-3 mt-1.5">AI calls stop when limit is hit — keyword analysis still works.</p>
        </div>

        {/* 7-day history */}
        {history.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-ink-3 uppercase tracking-widest font-mono mb-2">Last 7 days</p>
            <div className="rounded-xl border border-line overflow-hidden">
              <div className="grid grid-cols-4 px-3 py-1.5 bg-paper-2 border-b border-line">
                {['Date', 'Calls', 'Cost', 'Limit %'].map(h => (
                  <span key={h} className="text-[10px] font-semibold text-ink-3 uppercase tracking-wider font-mono">{h}</span>
                ))}
              </div>
              {history.map((row: any, i: number) => {
                const rowPct  = Math.min(100, row.dailyLimitUsd > 0 ? (row.estimatedCostUsd / row.dailyLimitUsd) * 100 : 0)
                const total   = (row.analyzeCalls ?? 0) + (row.verifyCalls ?? 0) + (row.agentCalls ?? 0)
                return (
                  <div key={row.date} className={`grid grid-cols-4 px-3 py-2 items-center ${i !== 0 ? 'border-t border-line' : ''} ${rowPct >= 100 ? 'bg-brand-red-light/40' : ''}`}>
                    <span className="text-xs text-ink-2 font-mono">{row.date?.slice(5)}</span>
                    <span className="text-xs text-ink font-mono font-semibold">{total}</span>
                    <span className="text-xs text-ink font-mono">${Number(row.estimatedCostUsd ?? 0).toFixed(3)}</span>
                    <span className={`text-xs font-mono font-semibold ${rowPct >= 100 ? 'text-brand-red-dark' : rowPct >= 80 ? 'text-brand-yellow-dark' : 'text-brand-green-dark'}`}>
                      {Math.round(rowPct)}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Users,       label: 'Total users',        value: (data.totalUsers ?? 0).toLocaleString(),      sub: 'all time' },
          { icon: TrendingUp,  label: 'Checks today',       value: (data.checksToday ?? 0).toLocaleString(),     sub: 'since midnight' },
          { icon: TrendingUp,  label: 'Checks this month',  value: (data.checksThisMonth ?? 0).toLocaleString(), sub: 'month to date' },
          { icon: Flag,        label: 'Pending reports',    value: (data.pendingReports ?? 0).toLocaleString(),  sub: 'need review',
            alert: (data.pendingReports ?? 0) > 0 },
          { icon: DollarSign,  label: 'Revenue today',      value: php(data.revenueToday ?? 0),    sub: 'today' },
          { icon: DollarSign,  label: 'Revenue MTD',        value: php(data.revenueThisMonth ?? 0), sub: 'month to date' },
        ].map(({ icon: Icon, label, value, sub, alert }) => (
          <div key={label} className={`rounded-2xl border p-4 ${alert ? 'bg-brand-red-light border-brand-red/20' : 'bg-paper border-line'}`}>
            <Icon size={14} className={`mb-2 ${alert ? 'text-brand-red-dark' : 'text-ink-3'}`} />
            <div className={`text-xl font-bold font-mono leading-tight ${alert ? 'text-brand-red-dark' : 'text-ink'}`}>{value}</div>
            <div className={`text-xs mt-0.5 ${alert ? 'text-brand-red-dark/70' : 'text-ink-3'}`}>{label}</div>
            <div className="text-[10px] text-ink-3 opacity-60">{sub}</div>
          </div>
        ))}
      </div>

      {/* Recent signups */}
      <div>
        <p className="sec-label mb-2">Recent signups</p>
        <div className="bg-paper border border-line rounded-2xl overflow-hidden">
          {(data.recentUsers ?? []).map((u: any, i: number) => (
            <div key={u.id} className={`flex items-center gap-3 px-4 py-3 ${i !== 0 ? 'border-t border-line' : ''}`}>
              <div className="w-7 h-7 rounded-full bg-paper-2 border border-line flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-ink-2">
                {(u.email?.[0] ?? '?').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-ink truncate">{u.email}</div>
                {u.full_name && <div className="text-[10px] text-ink-3">{u.full_name}</div>}
              </div>
              <div className="text-right flex-shrink-0 space-y-0.5">
                <div className="text-[10px] text-ink-3">{new Date(u.created_at).toLocaleDateString('en-PH',{month:'short',day:'numeric'})}</div>
                {(u.credits_remaining ?? 0) > 0 && <div className="text-[10px] font-semibold text-brand-green">{u.credits_remaining} cr</div>}
                {(u.free_checks_this_month ?? 0) > 0 && <div className="text-[10px] text-ink-3">{u.free_checks_this_month} free</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent payments */}
      <div>
        <p className="sec-label mb-2">Recent payments</p>
        <div className="bg-paper border border-line rounded-2xl overflow-hidden">
          {(data.recentPayments ?? []).length === 0
            ? <div className="px-4 py-6 text-center text-sm text-ink-3">No payments yet</div>
            : (data.recentPayments ?? []).map((p: any, i: number) => (
              <div key={p.id} className={`flex items-center gap-3 px-4 py-3 ${i !== 0 ? 'border-t border-line' : ''}`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.status==='paid'?'bg-brand-green':p.status==='pending'?'bg-brand-yellow':'bg-brand-red'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-ink">{p.plan_id}</div>
                  <div className="text-[10px] text-ink-3 font-mono truncate">{p.reference_no}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-ink font-mono">₱{((p.amount_cents??0)/100).toFixed(2)}</div>
                  <div className="text-[10px] text-ink-3">{new Date(p.created_at).toLocaleDateString('en-PH',{month:'short',day:'numeric'})}</div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
