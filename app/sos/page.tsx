import Link from 'next/link'

export const metadata = {
  title: 'Scam SOS — LegitCheck PH',
  description: 'You may have been scammed. Here is what to do right now.',
}

export default function SosPage() {
  return (
    <div className="min-h-screen bg-paper-2">
      <header className="bg-brand-red px-4 py-8 text-center">
        <div className="text-4xl mb-2">🚨</div>
        <h1 className="text-3xl font-bold text-white tracking-tight">SCAM SOS</h1>
        <p className="text-base text-white/80 mt-2 font-medium">
          You may have been scammed. Do this RIGHT NOW.
        </p>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-ink uppercase tracking-wide">Steps to take immediately</h2>

          {[
            {
              n: 1,
              title: 'Stop all contact',
              body: 'Do not reply, do not send more money, block the sender on all platforms.',
            },
            {
              n: 2,
              title: 'Screenshot everything',
              body: 'Conversations, payment receipts, profile photos, phone numbers — capture all of it now before it disappears.',
            },
            {
              n: 3,
              title: 'Call your bank immediately',
              body: 'Ask them to freeze or recall the transaction. Time is critical — the sooner you call, the better the chance of recovery.',
            },
            {
              n: 4,
              title: 'File a report',
              body: 'With NBI Cybercrime or PNP Anti-Cybercrime Group. See links below.',
            },
          ].map(step => (
            <div key={step.n} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white font-bold text-sm">{step.n}</span>
              </div>
              <div>
                <div className="font-semibold text-ink text-base">{step.title}</div>
                <div className="text-sm text-ink-3 mt-0.5 leading-relaxed">{step.body}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card space-y-3">
          <h2 className="text-base font-semibold text-ink uppercase tracking-wide">Bank hotlines — tap to call</h2>
          <p className="text-xs text-ink-3">Call these numbers immediately to report fraud and request a transaction freeze or recall.</p>

          {[
            { name: 'BDO',       number: '8-631-8000',  href: 'tel:86318000' },
            { name: 'BPI',       number: '89-100',       href: 'tel:89100' },
            { name: 'Metrobank', number: '8-700-700',    href: 'tel:8700700' },
            { name: 'UnionBank', number: '8-650-8080',   href: 'tel:86508080' },
            { name: 'GCash',     number: '2882 (Globe/TM)', href: 'tel:2882' },
            { name: 'Maya',      number: '8845-7788',    href: 'tel:88457788' },
          ].map(bank => (
            <a
              key={bank.name}
              href={bank.href}
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-line bg-paper hover:bg-brand-red-light hover:border-brand-red/30 transition-all group"
            >
              <div>
                <div className="font-semibold text-ink text-sm">{bank.name}</div>
                <div className="text-xs text-ink-3 mt-0.5">{bank.number}</div>
              </div>
              <div className="text-brand-red text-sm font-medium group-hover:underline">Call now →</div>
            </a>
          ))}

          <a
            href="https://helpdesk.gcash.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-3 rounded-xl border border-line bg-paper hover:bg-brand-red-light hover:border-brand-red/30 transition-all group"
          >
            <div>
              <div className="font-semibold text-ink text-sm">GCash Help Center</div>
              <div className="text-xs text-ink-3 mt-0.5">helpdesk.gcash.com</div>
            </div>
            <div className="text-brand-red text-sm font-medium group-hover:underline">Open →</div>
          </a>
        </div>

        <div className="card space-y-3">
          <h2 className="text-base font-semibold text-ink uppercase tracking-wide">Report to authorities</h2>
          <p className="text-xs text-ink-3">Filing a report creates an official record and helps authorities track scammer networks.</p>

          {[
            {
              name: 'NBI Cybercrime Division',
              desc: 'For online fraud, identity theft, and scams',
              href: 'https://cybercrime.nbi.gov.ph',
            },
            {
              name: 'PNP Anti-Cybercrime Group',
              desc: 'For cybercrime complaints and digital fraud',
              href: 'https://acg.pnp.gov.ph',
            },
            {
              name: 'NTC',
              desc: 'For SMS/text-based scams',
              href: 'https://ntc.gov.ph',
            },
          ].map(agency => (
            <a
              key={agency.name}
              href={agency.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-line bg-paper hover:bg-paper-2 transition-all group"
            >
              <div>
                <div className="font-semibold text-ink text-sm">{agency.name}</div>
                <div className="text-xs text-ink-3 mt-0.5">{agency.desc}</div>
              </div>
              <div className="text-ink-3 text-sm font-medium group-hover:text-ink">File →</div>
            </a>
          ))}
        </div>

        <div className="card text-center py-6 space-y-3">
          <p className="text-sm text-ink-2 leading-relaxed">
            Once you&apos;re safe and have taken the steps above, you can review what was submitted or run a new check.
          </p>
          <Link
            href="/buyer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-ink text-white text-sm font-semibold hover:opacity-90 transition-all"
          >
            Check what was submitted →
          </Link>
        </div>

        <div className="pb-8" />
      </div>
    </div>
  )
}
