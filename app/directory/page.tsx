import Link from 'next/link'
import { ArrowLeft, BookOpen, Info } from 'lucide-react'
import { REPORTING_DIRECTORY, type DirectoryEntry } from '@/lib/officialSources'
import ReportingDirectoryCard from '@/components/ReportingDirectoryCard'

const CATEGORY_ORDER: DirectoryEntry['category'][] = [
  'cybercrime',
  'financial_regulator',
  'ewallet',
  'bank',
  'verification_source',
]

const CATEGORY_HEADINGS: Record<DirectoryEntry['category'], { title: string; desc: string }> = {
  cybercrime:          { title: 'Cybercrime & Law Enforcement', desc: 'For reporting online scams, fraud, identity theft, and cyber threats.' },
  financial_regulator: { title: 'Financial Regulators',          desc: 'For investment scams, unauthorized lending, e-wallet disputes, and bank fraud.' },
  ewallet:             { title: 'E-Wallets',                     desc: 'Official support channels for GCash, Maya, and other e-wallets.' },
  bank:                { title: 'Banks',                         desc: 'Official fraud and dispute reporting for major Philippine banks.' },
  verification_source: { title: 'Government Verification Sources', desc: 'Official portals for verifying professionals, businesses, land titles, and companies.' },
}

export default function DirectoryPage() {
  const grouped = CATEGORY_ORDER.reduce<Record<string, DirectoryEntry[]>>((acc, cat) => {
    acc[cat] = REPORTING_DIRECTORY.filter(e => e.category === cat)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-paper-2">

      {/* Header */}
      <header className="bg-ink px-4 py-4 sticky top-0 z-40 flex items-center gap-3">
        <Link href="/" className="text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <Link href="/" className="text-lg font-bold text-white tracking-tight hover:opacity-80 transition-opacity">
            LegitCheck <span className="font-light opacity-50">PH</span>
          </Link>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white/60 text-xs font-medium">
          <BookOpen size={11} />
          Directory
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">

        {/* Intro */}
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Official Reporting & Verification</h1>
          <p className="text-sm text-ink-3 mt-2 leading-relaxed">
            If you or someone you know was victimized, use the official channels below.
            Contact details may change — always confirm on the official website before submitting sensitive information.
          </p>
        </div>

        {/* Disclaimer banner */}
        <div className="bg-brand-yellow-light border border-brand-yellow/25 rounded-2xl px-4 py-3 flex gap-3 items-start">
          <Info size={14} className="text-brand-yellow-dark flex-shrink-0 mt-0.5" />
          <p className="text-xs text-brand-yellow-dark leading-relaxed">
            <strong>Important:</strong> Contact details, URLs, and procedures may change without notice.
            LegitCheck PH does not maintain or operate these channels.
            Always verify on the official website before submitting.
            Last directory review: August 2025.
          </p>
        </div>

        {/* Directory sections */}
        {CATEGORY_ORDER.map(cat => {
          const entries = grouped[cat]
          if (!entries?.length) return null
          const { title, desc } = CATEGORY_HEADINGS[cat]
          return (
            <section key={cat} className="space-y-3">
              <div>
                <h2 className="text-base font-bold text-ink">{title}</h2>
                <p className="text-xs text-ink-3 mt-0.5">{desc}</p>
              </div>
              {entries.map(entry => (
                <ReportingDirectoryCard key={entry.id} entry={entry} />
              ))}
            </section>
          )
        })}

        {/* Evidence checklist CTA */}
        <div className="bg-ink rounded-2xl px-5 py-5 space-y-3">
          <p className="text-base font-bold text-white">Before you report — gather evidence first</p>
          <ul className="space-y-1.5 text-sm text-white/70">
            {[
              'Screenshots of all conversations',
              'Links, URLs, and social media profiles',
              'Account number and account name',
              'Proof of payment or transaction reference',
              'Date, time, and timeline of events',
              'Name, phone number, and email used by the scammer',
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white/30 flex-shrink-0 mt-1.5" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs text-white/40 leading-snug">
            For financial scams: report to your bank or e-wallet first, then preserve all screenshots and reference numbers before escalating.
          </p>
        </div>

        {/* Footer note */}
        <div className="text-center pb-8">
          <p className="text-xs text-ink-3 leading-relaxed">
            LegitCheck PH provides this directory as a public service reference only.
            We do not represent, operate, or speak for any of the listed agencies.
          </p>
          <p className="text-xs text-ink-3 mt-1 opacity-60">Produced by AntLab Academy</p>
        </div>

      </div>
    </div>
  )
}
