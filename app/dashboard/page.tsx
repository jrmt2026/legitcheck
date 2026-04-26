import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Search, Shield, Clock, TrendingUp, ChevronRight } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: recentChecks } = await supabase
    .from('checks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const colorMap = {
    green: { bg: 'bg-brand-green-light', text: 'text-brand-green-dark', label: 'Low risk' },
    yellow: { bg: 'bg-brand-yellow-light', text: 'text-brand-yellow-dark', label: 'Verify first' },
    red: { bg: 'bg-brand-red-light', text: 'text-brand-red-dark', label: "Don't proceed" },
  }

  const firstName = profile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'there'

  return (
    <div className="min-h-screen bg-paper-2">
      {/* Nav */}
      <header className="border-b border-line bg-paper sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-base font-medium text-ink">LegitCheck</span>
            <span className="text-base font-light text-ink-2">PH</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-3 hidden sm:block">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button type="submit" className="flex items-center gap-1.5 text-xs text-ink-3 hover:text-ink transition-colors">
                <LogOut size={13} />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Greeting */}
        <div>
          <h1 className="text-xl font-medium text-ink">Hi, {firstName} 👋</h1>
          <p className="text-sm text-ink-3 mt-0.5">
            {profile?.credits_remaining ?? 3} free checks remaining
          </p>
        </div>

        {/* Main CTA */}
        <Link href="/buyer" className="block card hover:border-ink-3/40 transition-colors group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-ink rounded-xl flex items-center justify-center flex-shrink-0">
                <Search size={18} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-ink">Check something now</div>
                <div className="text-xs text-ink-3 mt-0.5">Paste a chat, link, or account number</div>
              </div>
            </div>
            <ChevronRight size={16} className="text-ink-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/seller" className="card hover:border-ink-3/40 transition-colors group">
            <Shield size={16} className="text-ink-3 mb-2" />
            <div className="text-sm font-medium text-ink">Seller Help</div>
            <div className="text-xs text-ink-3 mt-0.5">Prove you're legit</div>
          </Link>
          <Link href="/dashboard/agents" className="card hover:border-ink-3/40 transition-colors group">
            <TrendingUp size={16} className="text-ink-3 mb-2" />
            <div className="text-sm font-medium text-ink">AI Agents</div>
            <div className="text-xs text-ink-3 mt-0.5">Talk to experts</div>
          </Link>
        </div>

        {/* Recent checks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="sec-label mb-0">Recent checks</div>
            {recentChecks && recentChecks.length > 0 && (
              <Link href="/dashboard/history" className="text-xs text-ink-3 hover:text-ink transition-colors">View all</Link>
            )}
          </div>

          {!recentChecks || recentChecks.length === 0 ? (
            <div className="card text-center py-8">
              <Clock size={24} className="text-ink-3 mx-auto mb-2" />
              <div className="text-sm text-ink-3">No checks yet</div>
              <div className="text-xs text-ink-3 mt-1">Your check history will appear here</div>
            </div>
          ) : (
            <div className="space-y-2">
              {recentChecks.map(check => {
                const colors = colorMap[check.color as keyof typeof colorMap]
                return (
                  <Link key={check.id} href={`/result/${check.id}`} className="card flex items-center gap-3 hover:border-ink-3/40 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                      <span className={`text-xs font-mono font-medium ${colors.text}`}>{check.score}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-medium ${colors.text}`}>{colors.label}</div>
                      <div className="text-xs text-ink-3 truncate mt-0.5">
                        {check.input_text?.slice(0, 60)}…
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-ink-3 flex-shrink-0" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Plan info */}
        <div className="card bg-ink text-white">
          <div className="text-xs font-mono text-white/50 mb-1 uppercase tracking-wider">Current plan</div>
          <div className="text-sm font-medium capitalize mb-2">{profile?.plan || 'Free'}</div>
          <p className="text-xs text-white/60 leading-relaxed mb-3">
            Upgrade for deeper checks, case packs, evidence guides, and agent access.
          </p>
          <Link href="/dashboard/pricing" className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors">
            View plans
            <ChevronRight size={12} />
          </Link>
        </div>
      </main>
    </div>
  )
}
