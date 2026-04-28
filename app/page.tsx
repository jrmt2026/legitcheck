import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  ShieldCheck, ArrowRight, Search, TrendingUp, Heart,
  Building2, Home, Plane, MessageSquare, Globe, CreditCard,
  HeartHandshake, Flag, BookOpen, Users,
  Zap, Lock, CheckCircle,
} from 'lucide-react'
import HeroSection from '@/components/HeroSection'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  const WHAT_WE_CHECK = [
    { icon: Search,        label: 'Online Sellers',   desc: 'FB Marketplace, Shopee, Lazada, OLX' },
    { icon: MessageSquare, label: 'SMS / Text Scams', desc: 'MMDA, LTO, BIR, GCash smishing'      },
    { icon: TrendingUp,    label: 'Investments',      desc: 'Guaranteed returns, Ponzi, OFW funds' },
    { icon: Heart,         label: 'Donations',        desc: 'Calamity campaigns, fake charity'     },
    { icon: Plane,         label: 'Job Agencies',     desc: 'Processing fees, deployment scams'    },
    { icon: Globe,         label: 'Websites / Links', desc: 'Phishing, fake shops, lookalike URLs' },
    { icon: CreditCard,    label: 'Loan / Lending',   desc: 'Upfront fees, harassment'             },
    { icon: HeartHandshake,label: 'Romance Scams',    desc: 'Love bombing, fake relationships'     },
    { icon: Building2,     label: 'Vendors',          desc: 'Business payments, fake invoices'     },
    { icon: Home,          label: 'Property / Land',  desc: 'Title scams, deposit fraud'           },
    { icon: Users,         label: 'Buyer Checks',     desc: 'Verify who is buying from you'        },
    { icon: ShieldCheck,   label: 'Account Numbers',  desc: 'GCash, Maya, bank — check reports'    },
  ]

  return (
    <div className="min-h-screen bg-ink">

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <header className="border-b border-white/10 bg-ink/95 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-base font-bold text-white tracking-tight">LegitCheck</span>
            <span className="text-base font-light text-white/40">PH</span>
            <span className="ml-1 text-[10px] font-bold text-brand-green font-mono bg-brand-green/10 px-1.5 py-0.5 rounded-full border border-brand-green/20">BETA</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="text-sm text-white/60 px-3 py-1.5 rounded-lg hover:text-white transition-colors">
              Log in
            </Link>
            <Link href="/auth/signup" className="text-sm font-semibold text-ink bg-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">
              Sign up free
            </Link>
          </div>
        </div>
      </header>

      <main>

        {/* ── Hero ────────────────────────────────────────────────────────────── */}
        <HeroSection />

        {/* ── Stats strip ─────────────────────────────────────────────────────── */}
        <div className="border-y border-white/10 bg-white/5 py-4">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-white/40 font-medium">
              <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-brand-green" /> Risk guidance, not a legal finding</span>
              <span className="flex items-center gap-1.5"><Lock       size={13} className="text-brand-blue"   /> No OTPs, PINs, or passwords</span>
              <span className="flex items-center gap-1.5"><Users      size={13} className="text-brand-purple" /> Community-powered reports</span>
              <span className="flex items-center gap-1.5"><Zap        size={13} className="text-brand-yellow" /> Filipino marketplace expertise</span>
            </div>
          </div>
        </div>

        {/* ── How it works ────────────────────────────────────────────────────── */}
        <section className="bg-paper-2 py-14">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-ink tracking-tight">How it works</h2>
              <p className="text-base text-ink-3 mt-2">Three steps. Under 30 seconds.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { step: '01', icon: '📋', title: 'Paste or upload',  desc: 'Share a chat, screenshot, link, account number, or job offer.' },
                { step: '02', icon: '🔍', title: 'We analyze it',    desc: 'Our engine checks urgency pressure, suspicious links, and known Filipino scam patterns.' },
                { step: '03', icon: '🛡️', title: 'Get your verdict', desc: 'Trust score, red flags explained, and clear next steps — pay, verify, avoid, or report.' },
              ].map(({ step, icon, title, desc }, i) => (
                <div
                  key={step}
                  className="bg-paper border border-line rounded-2xl p-5 animate-pop-in"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="text-3xl mb-3">{icon}</div>
                  <div className="text-xs font-mono text-ink-3 mb-1 font-semibold">{step}</div>
                  <h3 className="text-base font-bold text-ink mb-1.5">{title}</h3>
                  <p className="text-sm text-ink-3 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Real check CTA ──────────────────────────────────────────────────── */}
        <section className="bg-ink py-14 border-y border-white/10">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white tracking-tight">Check something now</h2>
              <p className="text-base text-white/40 mt-2 max-w-sm mx-auto">
                Paste any message, link, or account number — get a risk verdict in seconds.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { emoji: '📱', label: 'Suspicious SMS',     desc: 'Paste a text message or smishing link'        },
                { emoji: '🛍️', label: 'Online Seller',      desc: 'Facebook Marketplace, Shopee, OLX listings'   },
                { emoji: '💰', label: 'Investment Offer',   desc: 'Guaranteed returns, crypto, networking'        },
                { emoji: '✈️', label: 'Job / OFW Offer',   desc: 'Recruitment, processing fees, deployment'      },
                { emoji: '🏦', label: 'Account Number',     desc: 'GCash, Maya, bank — check community reports'  },
                { emoji: '🌐', label: 'Website or Link',    desc: 'Phishing sites, fake shops, lookalike URLs'   },
              ].map((item, i) => (
                <Link
                  key={item.label}
                  href="/buyer"
                  className="group flex flex-col gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-white/20 active:scale-[0.98] transition-all animate-pop-in"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <div>
                    <p className="font-semibold text-white text-sm">{item.label}</p>
                    <p className="text-xs text-white/40 mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/30 group-hover:text-white/60 transition-colors mt-auto">
                    Check now <ArrowRight size={11} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── What we check ───────────────────────────────────────────────────── */}
        <section className="bg-paper py-14">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-ink tracking-tight">What we check</h2>
              <p className="text-base text-ink-3 mt-2">Every major scam type in the Philippines.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {WHAT_WE_CHECK.map(({ icon: Icon, label, desc }, i) => (
                <Link
                  key={label}
                  href="/buyer"
                  className="group flex flex-col gap-2 bg-paper-2 border border-line rounded-2xl p-4 hover:border-ink-3 hover:shadow-sm active:scale-[0.98] transition-all animate-fade-in"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <Icon size={18} className="text-ink-3 group-hover:text-ink transition-colors" />
                  <div className="text-sm font-semibold text-ink leading-tight">{label}</div>
                  <div className="text-xs text-ink-3 leading-snug">{desc}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Community / Report ──────────────────────────────────────────────── */}
        <section className="bg-ink py-14 border-y border-white/10">
          <div className="max-w-4xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-red/10 rounded-full text-red-300 text-xs font-semibold font-mono mb-4 border border-brand-red/20">
                  <Flag size={11} /> Community protection
                </div>
                <h2 className="text-3xl font-bold text-white tracking-tight mb-3">Seen something suspicious?</h2>
                <p className="text-base text-white/50 leading-relaxed mb-6">
                  Report a fake seller, phishing link, investment scam, or fraudulent SMS.
                  Your report helps protect other Filipinos from the same pattern.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/report" className="inline-flex items-center justify-center gap-2 bg-brand-red text-white font-semibold px-5 py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all text-sm">
                    <Flag size={14} /> Report suspicious activity
                  </Link>
                  <Link href="/library" className="inline-flex items-center justify-center gap-2 bg-white/5 text-white/60 border border-white/10 font-medium px-5 py-3 rounded-xl hover:bg-white/10 active:scale-[0.98] transition-all text-sm">
                    <BookOpen size={14} /> Browse scam library
                  </Link>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { icon: '🎯', text: 'Reports are reviewed before affecting others — no automatic accusations.' },
                  { icon: '🔒', text: 'Anonymized. We never publish your name or contact info.'                  },
                  { icon: '📈', text: 'Multiple reports on the same pattern trigger a community scam alert.'     },
                  { icon: '🏆', text: 'Earn a Scam Spotter badge for verified helpful reports.'                  },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                    <span className="text-xl flex-shrink-0">{icon}</span>
                    <p className="text-sm text-white/50 leading-snug">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Scam Library preview ────────────────────────────────────────────── */}
        <section className="bg-paper-2 py-14">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-teal-light rounded-full text-brand-teal-dark text-xs font-semibold font-mono mb-2 border border-brand-teal/20">
                  <BookOpen size={11} /> Scam Library
                </div>
                <h2 className="text-2xl font-bold text-ink tracking-tight">Know what to look for</h2>
              </div>
              <Link href="/library" className="hidden sm:flex items-center gap-1 text-sm text-ink-3 hover:text-ink transition-colors">
                View all <ArrowRight size={13} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { cat: 'SMS Scam',    title: 'Government smishing (MMDA / LTO / BIR)', flag: '🚗' },
                { cat: 'Investment',  title: 'Guaranteed return Ponzi schemes',          flag: '💰' },
                { cat: 'Marketplace', title: 'GCash-only advance payment sellers',       flag: '🛍️' },
                { cat: 'Job / OFW',   title: 'Upfront processing fee recruitment',       flag: '✈️' },
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
          </div>
        </section>

        {/* ── For Suppliers & Businesses ──────────────────────────────────────── */}
        <section className="bg-paper py-10 border-t border-line">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-ink/5 border border-line rounded-2xl px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-ink/10 border border-line flex items-center justify-center flex-shrink-0">
                <Building2 size={20} className="text-ink-3" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-ink mb-0.5">For Suppliers and Businesses</p>
                <p className="text-sm text-ink-3 leading-snug">
                  Need to check buyers, sellers, or suspicious payment accounts?{' '}
                  Supplier and business access is coming soon.{' '}
                  <Link href="/auth/company-signup" className="text-ink underline hover:opacity-70 transition-opacity">
                    Register your business →
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ───────────────────────────────────────────────────────── */}
        <section className="bg-ink py-16 text-center">
          <div className="max-w-2xl mx-auto px-4">
            {/* Small animated shield */}
            <div className="relative inline-flex items-center justify-center mb-6">
              <div className="absolute w-16 h-16 rounded-full border border-white/10 animate-pulse-ring" />
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/20 flex items-center justify-center">
                <ShieldCheck size={26} className="text-white/70 animate-float" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight mb-3">Ready to check?</h2>
            <p className="text-base text-white/50 mb-8 leading-relaxed max-w-md mx-auto">
              Paste any suspicious message, link, or account number.
              Get a trust score before you send a single peso.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/buyer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-ink text-base font-bold px-8 py-4 rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-white/10"
              >
                <Search size={16} /> Check something now <ArrowRight size={16} />
              </Link>
              <Link
                href="/auth/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/5 text-white/60 text-base font-medium px-8 py-4 rounded-2xl border border-white/10 hover:bg-white/10 active:scale-[0.98] transition-all"
              >
                Create free account
              </Link>
            </div>
            <p className="mt-4 text-xs text-white/30">No account needed for your first check · No OTPs or passwords required</p>
          </div>
        </section>

        {/* ── Disclaimer ──────────────────────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs text-white/30 text-center leading-relaxed">
            LegitCheck PH provides risk guidance only. Results are not final legal, banking, government, or law-enforcement decisions.
            Always verify further before proceeding with any transaction.{' '}
            <Link href="/privacy" className="underline hover:text-white/60 transition-colors">Privacy Policy</Link>
            {' · '}
            <Link href="/terms" className="underline hover:text-white/60 transition-colors">Terms of Use</Link>
          </div>
        </div>

      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-8 text-center text-xs text-white/30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center flex-wrap gap-x-5 gap-y-2 mb-3">
            {[
              { href: '/buyer',   label: 'Check'    },
              { href: '/report',  label: 'Report'   },
              { href: '/library', label: 'Library'  },
              { href: '/sos',     label: 'Scam SOS' },
              { href: '/privacy', label: 'Privacy'  },
              { href: '/terms',   label: 'Terms'    },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="hover:text-white/60 transition-colors">{label}</Link>
            ))}
            <a href="mailto:support@legitcheck.ph" className="hover:text-white/60 transition-colors">Contact</a>
          </div>
          <div className="flex items-center justify-center gap-1 font-medium text-white/40">
            <span className="font-bold text-white/70">LegitCheck PH</span>
            <span>· Check muna bago bayad. · © {new Date().getFullYear()}</span>
          </div>
          <p className="text-white/20 text-xs mt-2">Produced by AntLab Academy</p>
        </div>
      </footer>

    </div>
  )
}
