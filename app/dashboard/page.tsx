import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Search, Clock, ChevronRight, Settings, ShieldCheck, Plus, Flag } from 'lucide-react'
import SignOutButton from '@/components/SignOutButton'
import ScamShieldScore from '@/components/ScamShieldScore'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Company accounts go to their own dashboard
  const { data: companyProfile } = await supabase
    .from('company_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (companyProfile) redirect('/company/dashboard')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, shield_score, checks_total, reports_total, streak_days, badges_earned')
    .eq('id', user.id)
    .single()

  const { data: recentChecks } = await supabase
    .from('checks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const [
    { data: premiumCredits },
    { data: myReports },
  ] = await Promise.all([
    supabase.rpc('get_premium_credits', { p_user_id: user.id }),
    supabase.from('scam_reports')
      .select('id, status, created_at')
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const acceptedThisMonth = (myReports ?? []).filter(
    r => r.status === 'accepted' && new Date(r.created_at) >= startOfMonth
  ).length
  const reportProgressToCredit = acceptedThisMonth % 3

  const colorMap: Record<string, { bg: string; text: string; label: string }> = {
    green:  { bg: 'bg-brand-green-light',  text: 'text-brand-green-dark',  label: 'Low risk'     },
    yellow: { bg: 'bg-brand-yellow-light', text: 'text-brand-yellow-dark', label: 'Verify first' },
    orange: { bg: 'bg-[#FFF0E6]',          text: 'text-brand-orange-dark', label: 'Caution'      },
    red:    { bg: 'bg-brand-red-light',    text: 'text-brand-red-dark',    label: "Don't proceed" },
  }

  const firstName = profile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'there'
  const initials  = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : (user.email?.[0] ?? '?').toUpperCase()

  return (
    <div className="min-h-screen bg-paper-2">

      {/* Header */}
      <header className="bg-ink sticky top-0 z-50 px-4 py-4 flex items-center justify-between">
        <Link href="/buyer" className="text-lg font-bold text-white tracking-tight hover:opacity-80 transition-opacity">
          LegitCheck <span className="font-light opacity-50">PH</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/profile" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <Settings size={15} className="text-white/40 group-hover:text-white transition-colors" />
          </Link>
          <SignOutButton />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Hi, {firstName}.</h1>
          <p className="text-sm text-ink-3 mt-1">Check muna bago bayad. Safe ba 'to?</p>
        </div>

        {/* Premium credits */}
        {(premiumCredits ?? 0) > 0 ? (
          <div className="bg-ink rounded-2xl px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-green/20 flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={16} className="text-brand-green" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  {premiumCredits} premium check{(premiumCredits ?? 0) > 1 ? 's' : ''} remaining
                </div>
                <div className="text-xs text-white/40">Full AI analysis · all red flags</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/credits" className="text-xs text-white/40 hover:text-white/60 transition-colors">
                History
              </Link>
              <Link href="/dashboard/pricing" className="text-xs font-semibold text-white/60 hover:text-white transition-colors flex items-center gap-1">
                <Plus size={12} /> Top up
              </Link>
            </div>
          </div>
        ) : (
          <Link
            href="/dashboard/pricing"
            className="bg-ink rounded-2xl px-4 py-3.5 flex items-center justify-between group hover:opacity-90 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={16} className="text-white/50" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Get premium checks</div>
                <div className="text-xs text-white/40">From ₱79 · GCash · Maya · Card</div>
              </div>
            </div>
            <ChevronRight size={16} className="text-white/30 group-hover:text-white/60 transition-colors" />
          </Link>
        )}

        {/* Community reward progress */}
        {(myReports ?? []).length > 0 && (
          <Link href="/dashboard/credits" className="block bg-paper border border-line rounded-2xl px-4 py-3.5 hover:bg-paper-2 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Flag size={13} className="text-brand-green" />
                <span className="text-xs font-semibold text-ink">Earn free premium checks</span>
              </div>
              <span className="text-xs text-ink-3">{reportProgressToCredit}/3 accepted</span>
            </div>
            <div className="w-full h-1.5 bg-paper-2 border border-line rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-green rounded-full transition-all duration-500"
                style={{ width: `${(reportProgressToCredit / 3) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-ink-3 mt-1.5">
              {3 - reportProgressToCredit === 0
                ? 'Credit being processed…'
                : `${3 - reportProgressToCredit} more accepted report${3 - reportProgressToCredit !== 1 ? 's' : ''} needed`}
            </p>
          </Link>
        )}

        {/* Scam Shield Score */}
        <ScamShieldScore
          shieldScore={profile?.shield_score  ?? 0}
          checksTotal={profile?.checks_total  ?? 0}
          streakDays={profile?.streak_days    ?? 0}
          badgesEarned={profile?.badges_earned ?? []}
          reportsTotal={profile?.reports_total ?? 0}
        />

        {/* Main CTA */}
        <Link href="/buyer" className="block bg-ink text-white rounded-2xl p-5 hover:opacity-90 active:scale-[0.98] transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Search size={18} className="text-white" />
              </div>
              <div>
                <div className="text-base font-bold text-white">Check something now</div>
                <div className="text-xs text-white/50 mt-0.5">Paste a chat, link, or account number</div>
              </div>
            </div>
            <ChevronRight size={18} className="text-white/40 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Recent checks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="sec-label mb-0">Your recent checks</p>
            {recentChecks && recentChecks.length > 0 && (
              <Link href="/buyer" className="text-xs text-ink-3 hover:text-ink transition-colors flex items-center gap-1">
                View all <ChevronRight size={11} />
              </Link>
            )}
          </div>

          {!recentChecks || recentChecks.length === 0 ? (
            <div className="bg-paper border border-line rounded-2xl text-center py-10">
              <Clock size={24} className="text-ink-3 mx-auto mb-2" />
              <div className="text-sm font-medium text-ink-2">No checks yet</div>
              <div className="text-xs text-ink-3 mt-1">Your check history will appear here</div>
            </div>
          ) : (
            <div className="space-y-2">
              {recentChecks.map(check => {
                const colors = colorMap[check.color] ?? colorMap.red
                return (
                  <Link
                    key={check.id}
                    href={`/result/${check.id}`}
                    className="flex items-center gap-3 bg-paper border border-line rounded-2xl px-4 py-3.5 hover:bg-paper-2 transition-all group"
                  >
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${colors.bg} ${colors.text}`}>
                      {colors.label}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-ink truncate">{check.input_text?.slice(0, 60)}…</div>
                      <div className="text-xs text-ink-3 mt-0.5">
                        {new Date(check.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-ink-3 flex-shrink-0 group-hover:text-ink transition-colors" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div>
          <p className="sec-label mb-3">Quick actions</p>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/report" className="flex flex-col gap-1.5 bg-paper border border-line rounded-2xl p-4 hover:border-ink-3 hover:bg-paper-2 transition-all">
              <span className="text-2xl">🚩</span>
              <div className="text-sm font-semibold text-ink">Report a scam</div>
              <div className="text-xs text-ink-3">Help protect others</div>
            </Link>
            <Link href="/library" className="flex flex-col gap-1.5 bg-paper border border-line rounded-2xl p-4 hover:border-ink-3 hover:bg-paper-2 transition-all">
              <span className="text-2xl">📚</span>
              <div className="text-sm font-semibold text-ink">Scam library</div>
              <div className="text-xs text-ink-3">Learn what to watch for</div>
            </Link>
            <Link href="/dashboard/agents" className="flex flex-col gap-1.5 bg-paper border border-line rounded-2xl p-4 hover:border-ink-3 hover:bg-paper-2 transition-all col-span-2">
              <span className="text-2xl">🛡️</span>
              <div className="text-sm font-semibold text-ink">Ask Bantay</div>
              <div className="text-xs text-ink-3">Get scam safety advice from your AI guide</div>
            </Link>
          </div>
        </div>

        <div className="pb-8" />
      </main>
    </div>
  )
}
