'use client'

import { useEffect, useState } from 'react'
import { Loader2, Users, TrendingUp, DollarSign, Flag, ShieldCheck, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function CommandCenter() {
  const [data, setData]     = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-ink-3" /></div>
  if (!data)   return <div className="text-center py-10 text-sm text-ink-3">Failed to load</div>

  const php = (cents: number) => `₱${(cents / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`

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
