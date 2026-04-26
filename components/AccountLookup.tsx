'use client'

import { useState } from 'react'
import { Search, AlertTriangle, CheckCircle, Loader2, ShieldAlert } from 'lucide-react'

interface LookupResult {
  report_count: number
  categories: string[]
  platforms: string[]
  last_reported: string | null
  is_verified: boolean
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

export default function AccountLookup() {
  const [query, setQuery]   = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<LookupResult | null>(null)
  const [checked, setChecked] = useState('')

  async function lookup() {
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setResult(null)
    try {
      const res  = await fetch(`/api/check-account?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResult(data)
      setChecked(q)
    } catch { /* silent */ }
    setLoading(false)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') lookup()
  }

  return (
    <div className="rounded-2xl border border-line bg-paper overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <p className="text-xs font-semibold tracking-widest uppercase text-ink-3 font-mono mb-2">Quick Account Check</p>
        <p className="text-sm text-ink-2 mb-3 leading-snug">
          Check if a GCash number, bank account, or seller profile has been reported before you send money.
        </p>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="09171234567 · account no. · URL"
            className="flex-1 min-w-0 border border-line rounded-xl px-4 py-3 text-base text-ink bg-paper-2 focus:outline-none focus:border-ink placeholder-ink-3 transition-colors"
            style={{ fontSize: '16px' }}
          />
          <button
            onClick={lookup}
            disabled={!query.trim() || loading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-ink text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition-opacity active:scale-95 whitespace-nowrap"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Check
          </button>
        </div>
      </div>

      {result && (
        <div className={`border-t border-line px-4 py-3 animate-slide-up ${
          result.report_count === 0 ? 'bg-brand-green-light' : result.is_verified ? 'bg-brand-red-light' : 'bg-brand-yellow-light'
        }`}>
          {result.report_count === 0 ? (
            <div className="flex items-start gap-3">
              <CheckCircle size={18} className="text-brand-green-dark flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-brand-green-dark">No reports found</p>
                <p className="text-xs text-brand-green-dark opacity-70 mt-0.5">
                  "{checked}" has no scam reports in our database yet. Still proceed carefully.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              {result.is_verified
                ? <ShieldAlert size={18} className="text-brand-red-dark flex-shrink-0 mt-0.5" />
                : <AlertTriangle size={18} className="text-brand-yellow-dark flex-shrink-0 mt-0.5" />
              }
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${result.is_verified ? 'text-brand-red-dark' : 'text-brand-yellow-dark'}`}>
                  {result.is_verified ? '⚠️ Confirmed scammer' : `Reported ${result.report_count} time${result.report_count > 1 ? 's' : ''}`}
                </p>
                <p className={`text-xs mt-0.5 ${result.is_verified ? 'text-brand-red-dark' : 'text-brand-yellow-dark'} opacity-80`}>
                  {result.categories.join(', ')}
                  {result.last_reported ? ` · Last reported ${timeAgo(result.last_reported)}` : ''}
                  {result.platforms.length > 0 ? ` · via ${result.platforms.join(', ')}` : ''}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
