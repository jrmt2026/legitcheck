import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ShieldCheck, ArrowRight, Search, TrendingUp, Heart, Building2, Home, Plane } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-paper-2">
      {/* Header */}
      <header className="border-b border-line bg-paper sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-base font-medium text-ink">LegitCheck</span>
            <span className="text-base font-light text-ink-2">PH</span>
            <span className="ml-1 text-xs font-medium text-brand-green font-mono">beta</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="text-sm text-ink-2 px-3 py-1.5 rounded-lg hover:bg-paper-2 transition-colors">
              Log in
            </Link>
            <Link href="/auth/signup" className="text-sm font-medium text-white bg-ink px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-green-light rounded-full text-brand-green-dark text-xs font-medium font-mono mb-6">
            <ShieldCheck size={12} />
            Anti-scam tool for Filipinos
          </div>
          <h1 className="text-5xl font-medium text-ink tracking-tight leading-none mb-4">
            Check muna<br />
            <span className="text-ink-3 font-light">bago bayad.</span>
          </h1>
          <p className="text-base text-ink-3 max-w-md mx-auto leading-relaxed mb-8">
            Paste a chat, screenshot, link, or account number.
            Get a risk result in seconds — before you pay, donate, invest, hire, or sign.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-ink text-white text-sm font-medium px-5 py-3 rounded-xl hover:opacity-90 transition-opacity">
              Check something now
              <ArrowRight size={14} />
            </Link>
            <Link href="#how-it-works" className="text-sm text-ink-2 px-5 py-3 rounded-xl border border-line hover:bg-paper transition-colors">
              How it works
            </Link>
          </div>
        </div>

        {/* What you can check */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-16">
          {[
            { icon: Search, label: 'Online Sellers', desc: 'FB Marketplace, Shopee, GCash' },
            { icon: TrendingUp, label: 'Investments', desc: 'OFW offers, guaranteed returns' },
            { icon: Heart, label: 'Donations', desc: 'Campaigns, charity, relief' },
            { icon: Building2, label: 'Vendors', desc: 'Business payments, invoices' },
            { icon: Home, label: 'Property', desc: 'Land deals, title checks' },
            { icon: Plane, label: 'Job Agencies', desc: 'Processing fees, deployment' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="card hover:border-ink-3/30 transition-colors">
              <Icon size={16} className="text-ink-3 mb-2" />
              <div className="text-sm font-medium text-ink">{label}</div>
              <div className="text-xs text-ink-3 mt-0.5">{desc}</div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div id="how-it-works" className="mb-16">
          <h2 className="text-xl font-medium text-ink mb-6 text-center">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: '01', title: 'Paste or upload', desc: 'Share a chat message, screenshot, link, account number, or QR code.' },
              { step: '02', title: 'We analyze it', desc: 'Our engine scans for red flags: name mismatches, rush pressure, suspicious payment requests.' },
              { step: '03', title: 'Get your verdict', desc: 'Green, Yellow, or Red — with specific reasons and next steps.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="card">
                <div className="text-xs font-mono text-ink-3 mb-2">{step}</div>
                <div className="text-sm font-medium text-ink mb-1">{title}</div>
                <div className="text-xs text-ink-3 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust signals */}
        <div className="card text-center py-8">
          <div className="text-ink-3 text-sm mb-1">Disclaimer</div>
          <div className="text-xs text-ink-3 max-w-lg mx-auto leading-relaxed">
            LegitCheck PH is a risk analysis guide. It is not a final legal, banking, government, or law-enforcement decision.
            Always verify further before proceeding with any transaction.{' '}
            <Link href="/privacy" className="underline hover:text-ink transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-line mt-16 py-8 text-center text-xs text-ink-3">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center gap-4 mb-2">
            <Link href="/privacy" className="hover:text-ink transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-ink transition-colors">Terms of Use</Link>
            <a href="mailto:support@legitcheck.ph" className="hover:text-ink transition-colors">Contact</a>
          </div>
          <div>© {new Date().getFullYear()} LegitCheck PH. Check muna bago bayad.</div>
        </div>
      </footer>
    </div>
  )
}
