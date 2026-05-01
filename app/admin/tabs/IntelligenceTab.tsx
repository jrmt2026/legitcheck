'use client'

import { useEffect, useState } from 'react'
import { Loader2, TrendingUp, AlertTriangle } from 'lucide-react'

export default function IntelligenceTab() {
  const [data, setData]     = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/intelligence').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-ink-3" /></div>
  if (!data)   return <div className="text-center py-10 text-sm text-ink-3">Failed to load</div>

  const maxCount = Math.max(1, ...((data.by_category ?? []).map((c: any) => c.count)))

  return (
    <div className="space-y-5">

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-paper border border-line rounded-2xl p-4">
          <div className="text-2xl font-bold font-mono text-ink">{(data.total_reports ?? 0).toLocaleString()}</div>
          <div className="text-xs text-ink-3 mt-0.5">Total scam reports</div>
        </div>
        <div className="bg-paper border border-line rounded-2xl p-4">
          <div className="text-2xl font-bold font-mono text-ink">{(data.top_identifiers?.length ?? 0).toLocaleString()}</div>
          <div className="text-xs text-ink-3 mt-0.5">Unique identifiers flagged</div>
        </div>
      </div>

      {/* Daily trend */}
      {(data.daily_trend ?? []).length > 0 && (
        <div>
          <p className="sec-label mb-2">Reports — last 7 days</p>
          <div className="bg-paper border border-line rounded-2xl p-4">
            <div className="flex items-end gap-1 h-16">
              {(data.daily_trend ?? []).map((d: any) => {
                const maxDay = Math.max(1, ...(data.daily_trend.map((x: any) => x.count)))
                const pct = Math.max(4, Math.round((d.count / maxDay) * 100))
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-brand-red/20 rounded-sm" style={{ height: `${pct}%` }} />
                    <div className="text-[9px] text-ink-3">{d.date.slice(5)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Top identifiers */}
      <div>
        <p className="sec-label mb-2">Most reported identifiers</p>
        <div className="bg-paper border border-line rounded-2xl overflow-hidden">
          {(data.top_identifiers ?? []).slice(0, 15).map((item: any, i: number) => (
            <div key={item.identifier} className={`flex items-center gap-3 px-4 py-3 ${i !== 0 ? 'border-t border-line' : ''}`}>
              <div className="w-6 h-6 rounded-full bg-paper-2 border border-line flex items-center justify-center flex-shrink-0">
                <span className="text-[9px] font-bold text-ink-3">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-ink font-mono truncate">{item.identifier}</div>
                <div className="text-[10px] text-ink-3">{item.identifier_type} · {item.categories?.join(', ')}</div>
              </div>
              <div className="flex-shrink-0 text-right">
                <span className={`text-xs font-bold font-mono ${item.count >= 5 ? 'text-brand-red-dark' : 'text-ink'}`}>
                  {item.count}×
                </span>
                {item.count >= 3 && <AlertTriangle size={11} className="text-brand-yellow ml-1 inline" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* By category */}
      <div>
        <p className="sec-label mb-2">By scam category</p>
        <div className="bg-paper border border-line rounded-2xl p-4 space-y-3">
          {(data.by_category ?? []).map((cat: any) => (
            <div key={cat.category}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ink capitalize">{cat.category?.replace(/_/g, ' ')}</span>
                <span className="text-ink-3 font-mono">{cat.count}</span>
              </div>
              <div className="h-1.5 bg-paper-2 rounded-full overflow-hidden">
                <div className="h-full bg-brand-red/50 rounded-full" style={{ width: `${Math.round((cat.count / maxCount) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* By type */}
      <div>
        <p className="sec-label mb-2">By identifier type</p>
        <div className="flex flex-wrap gap-2">
          {(data.by_type ?? []).map((t: any) => (
            <div key={t.type} className="bg-paper border border-line rounded-xl px-3 py-2 flex items-center gap-2">
              <span className="text-xs text-ink capitalize">{t.type?.replace(/_/g, ' ')}</span>
              <span className="text-xs font-bold text-ink font-mono bg-paper-2 px-1.5 py-0.5 rounded-md">{t.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
