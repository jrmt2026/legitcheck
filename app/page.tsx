import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  ShieldCheck, ArrowRight, Search, TrendingUp, Heart,
  Building2, Home, Plane, MessageSquare, Globe, CreditCard,
  HeartHandshake, FlaskConical, Flag, BookOpen, Users,
  Zap, Lock, CheckCircle,
} from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  const DEMO_PREVIEWS = [
    { emoji: '🚗', title: 'MMDA Fine SMS',         risk: 'SCAM',      riskColor: 'bg-brand-red-light text-brand-red-dark border-brand-red/20',    score: 5,  desc: 'Fake government SMS demanding payment via non-.gov.ph link' },
    { emoji: '💰', title: '30% Monthly Returns',   risk: 'SCAM',      riskColor: 'bg-brand-red-light text-brand-red-dark border-brand-red/20',    score: 8,  desc: 'Investment promising guaranteed impossible returns' },
    { emoji: '✅', title: 'Shopee Order',           risk: 'SAFE',      riskColor: 'bg-brand-green-light text-brand-green-dark border-brand-green/20', score: 91, desc: 'Legitimate marketplace transaction with buyer protection' },
    { emoji: '🛍️', title: 'FB Marketplace Seller',  risk: 'HIGH RISK', riskColor: 'bg-brand-red-light text-brand-red-dark border-brand-red/20',    score: 28, desc: 'GCash-only + rush pressure + no meet-up' },
    { emoji: '✈️', title: 'OFW Job Agency',         risk: 'HIGH RISK', riskColor: 'bg-brand-red-light text-brand-red-dark border-brand-red/20',    score: 12, desc: '₱15,000 processing fee before showing any contract' },
  ]

  const WHAT_WE_CHECK = [
    { icon: Search,         label: 'Online Sellers',   desc: 'FB Marketplace, Shopee, Lazada, OLX' },
    { icon: MessageSquare,  label: 'SMS / Text Scams', desc: 'MMDA, LTO, BIR, GCash smishing' },
    { icon: TrendingUp,     label: 'Investments',      desc: 'Guaranteed returns, Ponzi, OFW funds' },
    { icon: Heart,          label: 'Donations',        desc: 'Calamity campaigns, fake charity' },
    { icon: Plane,          label: 'Job Agencies',     desc: 'Processing fees, deployment scams' },
    { icon: Globe,          label: 'Websites / Links', desc: 'Phishing, fake shops, lookalike URLs' },
    { icon: CreditCard,     label: 'Loan / Lending',   desc: 'Upfront fees, harassment, illegal terms' },
    { icon: HeartHandshake, label: 'Romance Scams',    desc: 'Love bombing, fake relationships' },
    { icon: Building2,      label: 'Vendors',          desc: 'Business payments, fake invoices' },
    { icon: Home,           label: 'Property / Land',  desc: 'Title scams, deposit fraud' },
    { icon: Users,          label: 'Buyer Checks',     desc: 'Verify who is buying from you' },
    { icon: ShieldCheck,    label: 'Account Numbers',  desc: 'GCash, Maya, bank — check reports' },
  ]

  return (
    <div className="min-h-screen bg-paper-2">

      {/* ── Top Nav ───────────────────────────────────────────────────────── */}
      <header className="border-b border-line bg-paper/95 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold text-ink tracking-tight">LegitCheck</span>
            <span className="text-base font-light text-ink-3">PH</span>
            <span className="ml-1.5 text-[10px] font-bold text-brand-green font-mono bg-brand-green-light px-1.5 py-0.5 rounded-full border border-brand-green/20">BETA</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="text-sm text-ink-2 px-3 py-1.5 rounded-lg hover:bg-paper-2 transition-colors hidden sm:block">
              Log in
            </Link>
            <Link
              href="/buyer"
              className="text-sm font-semibold text-white bg-ink px-4 py-2 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <Search size={13} />
              Check now
            </Link>
          </div>
        </div>
      </header>

      <main>

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto px-4 pt-14 pb-12 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-green-light rounded-full text-brand-green-dark text-xs font-semibold font-mono mb-6 border border-brand-green/20">
            <ShieldCheck size={12} />
            #1 Anti-scam tool for Filipinos
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-ink tracking-tight leading-none mb-4">
            Check muna<br />
            <span className="text-ink-3 font-light">bago bayad.</span>
          </h1>

          <p className="text-lg text-ink-3 max-w-md mx-auto leading-relaxed mb-3">
            Paste a message, link, account number, or screenshot.
            Get a <strong className="text-ink font-semibold">trust score</strong> in seconds — before you pay, invest, donate, or hire.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-ink-3 mb-8">
            <span className="flex items-center gap-1"><Lock size={11} /> No OTPs or passwords</span>
            <span className="flex items-center gap-1"><CheckCircle size={11} /> Filipino scam patterns</span>
            <span className="flex items-center gap-1"><Zap size={11} /> Results in seconds</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/buyer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-ink text-white text-base font-semibold px-7 py-4 rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
            >
              <Search size={16} />
              Check something now
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-paper text-ink text-base font-medium px-7 py-4 rounded-2xl border border-line hover:bg-ink hover:text-white hover:border-ink active:scale-[0.98] transition-all"
            >
              <FlaskConical size={16} />
              Try a demo first
            </Link>
          </div>
        </section>

        {/* ── Trust signals strip ─────────────────────────────────────────── */}
        <section className="border-y border-line bg-paper">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-ink-3 font-medium">
              <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-brand-green" /> Risk guidance, not a legal finding</span>
              <span className="flex items-center gap-1.5"><Lock size={13} className="text-brand-blue" /> No OTPs, PINs, or passwords</span>
              <span className="flex items-center gap-1.5"><Users size={13} className="text-brand-purple" /> Community-powered reports</span>
              <span className="flex items-center gap-1.5"><Zap size={13} className="text-brand-yellow" /> Filipino marketplace expertise</span>
            </div>
          </div>
        </section>

        {/* ── Demo previews ───────────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 py-14">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-purple-light rounded-full text-brand-purple-dark text-xs font-semibold font-mono mb-3 border border-brand-purple/20">
              <FlaskConical size={11} />
              Sample checks
            </div>
            <h2 className="text-3xl font-bold text-ink tracking-tight">See it in action</h2>
            <p className="text-base text-ink-3 mt-2 max-w-sm mx-auto">
              Tap any scenario to see how LegitCheck analyzes real Philippine scam situations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {DEMO_PREVIEWS.map((d) => (
              <Link
                key={d.title}
                href="/demo"
                className="group flex flex-col gap-3 bg-paper border border-line rounded-2xl p-4 hover:border-ink-3 hover:shadow-sm active:scale-[0.98] transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{d.emoji}</span>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${d.riskColor}`}>
                    {d.risk}
                    <span className="font-mono opacity-75">{d.score}/100</span>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-ink text-sm">{d.title}</p>
                  <p className="text-xs text-ink-3 mt-0.5 leading-relaxed">{d.desc}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-ink-3 group-hover:text-ink transition-colors mt-auto">
                  Try this demo <ArrowRight size={11} />
                </div>
              </Link>
            ))}

            <Link
              href="/demo"
              className="flex flex-col items-center justify-center gap-2 bg-ink text-white rounded-2xl p-4 hover:opacity-90 active:scale-[0.98] transition-all min-h-[140px]"
            >
              <FlaskConical size={24} className="opacity-80" />
              <span className="font-semibold text-sm">See all 10 demos</span>
              <span className="text-xs text-white/60">No account needed</span>
            </Link>
          </div>
        </section>

        {/* ── How it works ────────────────────────────────────────────────── */}
        <section className="bg-paper border-y border-line">
          <div className="max-w-4xl mx-auto px-4 py-14">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-ink tracking-tight">How it works</h2>
              <p className="text-base text-ink-3 mt-2">Three steps. Under 30 seconds.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: '01', icon: '📋', title: 'Paste or upload', desc: 'Share a chat, screenshot, link, account number, or job offer. The more context you give, the sharper the analysis.' },
                { step: '02', icon: '🔍', title: 'We analyze it',   desc: 'Our engine checks for red flags: name mismatches, urgency pressure, suspicious links, fake government language, and known scam patterns.' },
                { step: '03', icon: '🛡️', title: 'Get your verdict', desc: 'See a trust score, specific red flags explained, and clear next steps — whether to pay, verify, avoid, or report.' },
              ].map(({ step, icon, title, desc }) => (
                <div key={step}>
                  <div className="text-4xl mb-4">{icon}</div>
                  <div className="text-xs font-mono text-ink-3 mb-1 font-semibold">{step}</div>
                  <h3 className="text-lg font-bold text-ink mb-2">{title}</h3>
                  <p className="text-sm text-ink-3 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What we check ───────────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 py-14">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-ink tracking-tight">What we check</h2>
            <p className="text-base text-ink-3 mt-2">Every major scam type in the Philippines.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {WHAT_WE_CHECK.map(({ icon: Icon, label, desc }) => (
              <Link
                key={label}
                href="/buyer"
                className="group flex flex-col gap-2 bg-paper border border-line rounded-2xl p-4 hover:border-ink-3 hover:shadow-sm active:scale-[0.98] transition-all"
              >
                <Icon size={18} className="text-ink-3 group-hover:text-ink transition-colors" />
                <div className="text-sm font-semibold text-ink leading-tight">{label}</div>
                <div className="text-xs text-ink-3 leading-snug">{desc}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Community + reporting ────────────────────────────────────────── */}
        <section className="bg-paper border-y border-line">
          <div className="max-w-4xl mx-auto px-4 py-14">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-red-light rounded-full text-brand-red-dark text-xs font-semibold font-mono mb-4 border border-brand-red/20">
                  <Flag size={11} />
                  Community protection
                </div>
                <h2 className="text-3xl font-bold text-ink tracking-tight mb-3">Seen something suspicious?</h2>
                <p className="text-base text-ink-3 leading-relaxed mb-6">
                  Report a fake seller, phishing link, investment scam, or fraudulent SMS.
                  Your report helps protect other Filipinos from the same pattern.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/report" className="inline-flex items-center justify-center gap-2 bg-brand-red text-white font-semibold px-5 py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all text-sm">
                    <Flag size={14} /> Report suspicious activity
                  </Link>
                  <Link href="/library" className="inline-flex items-center justify-center gap-2 bg-paper text-ink border border-line font-medium px-5 py-3 rounded-xl hover:bg-paper-2 active:scale-[0.98] transition-all text-sm">
                    <BookOpen size={14} /> Browse scam library
                  </Link>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { icon: '🎯', text: 'Reports are reviewed before affecting others — no automatic accusations.' },
                  { icon: '🔒', text: 'Anonymized. We never publish your name or contact info.' },
                  { icon: '📈', text: 'Multiple reports on the same pattern trigger a community scam alert.' },
                  { icon: '🏆', text: 'Earn a Scam Spotter badge for verified helpful reports.' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-start gap-3 bg-paper-2 rounded-xl p-3">
                    <span className="text-xl flex-shrink-0">{icon}</span>
                    <p className="text-sm text-ink-2 leading-snug">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Scam Library preview ────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 py-14">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-teal-light rounded-full text-brand-teal-dark text-xs font-semibold font-mono mb-2 border border-brand-teal/20">
                <BookOpen size={11} />
                Scam Library
              </div>
              <h2 className="text-2xl font-bold text-ink tracking-tight">Know what to look for</h2>
            </div>
            <Link href="/library" className="hidden sm:flex items-center gap-1 text-sm text-ink-3 hover:text-ink transition-colors">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {[
              { cat: 'SMS Scam',  title: 'Government smishing (MMDA / LTO / BIR)', flag: '🚗' },
              { cat: 'Investment',title: 'Guaranteed return Ponzi schemes',          flag: '💰' },
              { cat: 'Marketplace',title: 'GCash-only advance payment sellers',      flag: '🛍️' },
              { cat: 'Job / OFW', title: 'Upfront processing fee recruitment',       flag: '✈️' },
            ].map(({ cat, title, flag }) => (
              <Link
                key={title}
                href="/library"
                className="flex items-center gap-3 bg-paper border border-line rounded-2xl p-4 hover:border-ink-3 hover:shadow-sm active:scale-[0.98] transition-all group"
              >
                <span className="text-2xl flex-shrink-0">{flag}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink-3 font-medium mb-0.5">{cat}</p>
                  <p className="text-sm font-semibold text-ink leading-snug truncate">{title}</p>
                </div>
                <ArrowRight size={13} className="text-ink-3 group-hover:text-ink flex-shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
          <Link href="/library" className="sm:hidden flex items-center justify-center gap-2 text-sm text-ink-3 hover:text-ink transition-colors">
            View full scam library <ArrowRight size={13} />
          </Link>
        </section>

        {/* ── Safety tips ─────────────────────────────────────────────────── */}
        <section className="bg-paper border-y border-line">
          <div className="max-w-4xl mx-auto px-4 py-10">
            <h2 className="text-lg font-bold text-ink mb-5 text-center">Quick safety tips</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                'Always check if payment links are on official .gov.ph domains before clicking.',
                'No legitimate job agency charges processing fees before showing a signed contract.',
                'Guaranteed returns above 12%/year are illegal under SEC regulations in the Philippines.',
                'Use Shopee or Lazada for purchases — they have buyer protection and escrow.',
                'Never share OTPs, PINs, or passwords — no legitimate person will ask for them.',
                'Check if a GCash or bank number has been reported using our Quick Account Lookup.',
              ].map((tip) => (
                <div key={tip} className="flex gap-3 bg-paper-2 rounded-xl p-3">
                  <CheckCircle size={16} className="text-brand-green flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-ink-2 leading-snug">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ───────────────────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="text-5xl mb-4">🛡️</div>
          <h2 className="text-3xl font-bold text-ink tracking-tight mb-3">Ready to check?</h2>
          <p className="text-base text-ink-3 mb-8 leading-relaxed max-w-md mx-auto">
            Paste any suspicious message, link, or account number.
            Get a trust score before you send a single peso.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/buyer" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-ink text-white text-base font-semibold px-8 py-4 rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all">
              <Search size={16} /> Check something now <ArrowRight size={16} />
            </Link>
            <Link href="/auth/signup" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-paper text-ink text-base font-medium px-8 py-4 rounded-2xl border border-line hover:bg-paper-2 active:scale-[0.98] transition-all">
              Create free account
            </Link>
          </div>
          <p className="mt-4 text-xs text-ink-3">No account needed for your first check · No OTPs or passwords required</p>
        </section>

        {/* ── Disclaimer ──────────────────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto px-4 pb-8">
          <div className="bg-paper border border-line rounded-2xl px-5 py-4 text-xs text-ink-3 text-center leading-relaxed">
            LegitCheck PH provides risk guidance only. Results are not final legal, banking, government, or law-enforcement decisions.
            Always verify further before proceeding with any transaction.{' '}
            <Link href="/privacy" className="underline hover:text-ink transition-colors">Privacy Policy</Link>
            {' · '}
            <Link href="/terms" className="underline hover:text-ink transition-colors">Terms of Use</Link>
          </div>
        </div>

      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-line py-8 text-center text-xs text-ink-3">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center flex-wrap gap-x-5 gap-y-2 mb-3">
            {[
              { href: '/buyer',   label: 'Check' },
              { href: '/demo',    label: 'Demo' },
              { href: '/report',  label: 'Report' },
              { href: '/library', label: 'Library' },
              { href: '/sos',     label: 'Scam SOS' },
              { href: '/privacy', label: 'Privacy' },
              { href: '/terms',   label: 'Terms' },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="hover:text-ink transition-colors">{label}</Link>
            ))}
            <a href="mailto:support@legitcheck.ph" className="hover:text-ink transition-colors">Contact</a>
          </div>
          <div className="flex items-center justify-center gap-1 font-medium text-ink-3">
            <span className="font-bold text-ink">LegitCheck PH</span>
            <span>· Check muna bago bayad. · © {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
