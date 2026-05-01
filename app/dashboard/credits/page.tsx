import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck, TrendingDown, TrendingUp, Clock, Plus } from 'lucide-react'

export default async function CreditsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [
    { data: premiumCredits },
    { data: batches },
    { data: ledger },
    { data: myReports },
  ] = await Promise.all([
    supabase.rpc('get_premium_credits', { p_user_id: user.id }),
    supabase.from('credit_batches').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
    supabase.from('credit_ledger').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(40),
    supabase.from('scam_reports')
      .select('id, identifier, identifier_type, category, status, created_at')
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const activeBatches = (batches ?? []).filter(b => (b.total_credits - b.used_credits) > 0)
  const soonestExpiry = activeBatches.reduce<Date | null>((min, b) => {
    if (!b.expires_at) return min
    const d = new Date(b.expires_at)
    return !min || d < min ? d : min
  }, null)

  // Community reward progress
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const acceptedThisMonth = (myReports ?? []).filter(
    r => r.status === 'accepted' && new Date(r.created_at) >= startOfMonth
  ).length
  const progressToCredit = acceptedThisMonth % 3
  const creditsEarnedThisMonth = (batches ?? []).filter(
    b => b.source === 'earned_report_reward' && new Date(b.created_at) >= startOfMonth
  ).length

  const statusStyle: Record<string, string> = {
    pending:  'text-brand-yellow-dark bg-brand-yellow-light border-brand-yellow/30',
    accepted: 'text-brand-green-dark bg-brand-green-light border-brand-green/20',
    rejected: 'text-ink-3 bg-paper-2 border-line',
  }
  const statusLabel: Record<string, string> = {
    pending:  'Under review',
    accepted: 'Accepted',
    rejected: 'Dismissed',
  }

  return (
    <div className="min-h-screen bg-paper-2">
      <header className="bg-ink px-4 py-4 flex items-center gap-3 sticky top-0 z-50">
        <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <span className="text-lg font-bold text-white tracking-tight flex-1">Credits & Reports</span>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Balance card */}
        <div className="bg-ink rounded-2xl px-5 py-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-brand-green/20 border border-brand-green/30 flex items-center justify-center mx-auto">
            <ShieldCheck size={24} className="text-brand-green" />
          </div>
          <div>
            <div className="text-5xl font-bold text-white font-mono">{premiumCredits ?? 0}</div>
            <div className="text-sm text-white/50 mt-1">Premium checks available</div>
          </div>
          {soonestExpiry && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full text-xs text-white/60">
              <Clock size={11} />
              Earliest expiry: {soonestExpiry.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          )}
          <Link href="/dashboard/pricing" className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-green rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity">
            <Plus size={14} /> Top up credits
          </Link>
        </div>

        {/* Community reward progress */}
        <div className="card space-y-3">
          <p className="sec-label">Earn free premium checks</p>
          <p className="text-xs text-ink-3 leading-relaxed">
            Submit 3 helpful scam reports and earn 1 free premium check. Max 2 earned checks per month.
          </p>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-ink">{progressToCredit} of 3 accepted reports</span>
              {creditsEarnedThisMonth >= 2 ? (
                <span className="text-xs text-ink-3">Monthly limit reached</span>
              ) : (
                <span className="text-xs text-brand-green font-semibold">{creditsEarnedThisMonth} earned this month</span>
              )}
            </div>
            <div className="w-full h-2 bg-paper-2 border border-line rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-green rounded-full transition-all duration-500"
                style={{ width: `${(progressToCredit / 3) * 100}%` }}
              />
            </div>
          </div>
          <Link href="/report" className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-brand-green/30 bg-brand-green/10 text-brand-green-dark text-sm font-semibold hover:bg-brand-green/20 transition-all">
            Submit a report
          </Link>
        </div>

        {/* Active credit packs */}
        {activeBatches.length > 0 && (
          <div className="card space-y-1">
            <p className="sec-label mb-3">Active credit packs</p>
            {activeBatches.map(b => (
              <div key={b.id} className="flex items-center justify-between py-3 border-b border-line last:border-0">
                <div>
                  <div className="text-sm font-medium text-ink">
                    {b.source === 'purchase' ? 'Purchased pack' : 'Earned from reports'}
                  </div>
                  <div className="text-xs text-ink-3 mt-0.5">
                    {b.expires_at
                      ? `Expires ${new Date(b.expires_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}`
                      : 'No expiry'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-ink">{b.total_credits - b.used_credits} left</div>
                  <div className="text-xs text-ink-3">of {b.total_credits}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Transaction history */}
        {ledger && ledger.length > 0 ? (
          <div className="card space-y-1">
            <p className="sec-label mb-3">Transaction history</p>
            {ledger.map(entry => {
              const isDebit = entry.delta < 0
              return (
                <div key={entry.id} className="flex items-center gap-3 py-3 border-b border-line last:border-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDebit ? 'bg-brand-red-light' : 'bg-brand-green-light'}`}>
                    {isDebit
                      ? <TrendingDown size={14} className="text-brand-red-dark" />
                      : <TrendingUp size={14} className="text-brand-green-dark" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink truncate">
                      {entry.description || (isDebit ? 'Premium check used' : 'Credits added')}
                    </div>
                    <div className="text-xs text-ink-3">
                      {new Date(entry.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div className={`text-sm font-bold font-mono flex-shrink-0 ${isDebit ? 'text-brand-red-dark' : 'text-brand-green-dark'}`}>
                    {entry.delta > 0 ? '+' : ''}{entry.delta}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="card text-center py-8">
            <Clock size={24} className="text-ink-3 mx-auto mb-2" />
            <p className="text-sm text-ink-2 font-medium">No transactions yet</p>
            <p className="text-xs text-ink-3 mt-1">Your credit history will appear here after your first purchase or earned reward.</p>
          </div>
        )}

        {/* My submitted reports */}
        {myReports && myReports.length > 0 && (
          <div className="card space-y-1">
            <p className="sec-label mb-3">My submitted reports</p>
            {myReports.map(r => (
              <div key={r.id} className="flex items-center gap-3 py-3 border-b border-line last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink truncate">{r.identifier}</div>
                  <div className="text-xs text-ink-3 mt-0.5">
                    {r.identifier_type} · {r.category?.replace(/_/g, ' ')} ·{' '}
                    {new Date(r.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${statusStyle[r.status] ?? statusStyle.pending}`}>
                  {statusLabel[r.status] ?? r.status}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="pb-8" />
      </div>
    </div>
  )
}
