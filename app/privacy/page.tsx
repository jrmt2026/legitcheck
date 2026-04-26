import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-paper-2">
      <header className="border-b border-line bg-paper px-4 py-3 flex items-center gap-3 sticky top-0 z-50">
        <Link href="/" className="text-ink-3 hover:text-ink transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-baseline gap-1">
          <span className="text-base font-medium text-ink">LegitCheck</span>
          <span className="text-base font-light text-ink-2">PH</span>
        </div>
      </header>

      <article className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="text-xs font-mono text-ink-3 uppercase tracking-widest mb-2">Legal</div>
          <h1 className="text-3xl font-medium text-ink mb-2">Privacy Policy</h1>
          <p className="text-sm text-ink-3">Last updated: {new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-ink-2">

          <section>
            <h2 className="text-base font-medium text-ink mb-3">1. Who we are</h2>
            <p className="text-sm leading-relaxed">
              LegitCheck PH ("we," "us," or "our") is an anti-scam risk analysis tool designed for Filipino consumers, sellers, and businesses. We are committed to protecting your privacy and handling your data with transparency and care.
            </p>
            <p className="text-sm leading-relaxed mt-2">
              Contact: <a href="mailto:privacy@legitcheck.ph" className="text-brand-blue underline">privacy@legitcheck.ph</a>
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-ink mb-3">2. What we collect</h2>
            <div className="space-y-3">
              {[
                { title: 'Account information', desc: 'Your email address, name, and password when you sign up. If you use Google Sign-In, we receive your email and name from Google.' },
                { title: 'Check inputs', desc: 'Text, messages, or descriptions you submit for risk analysis. We store these to provide your check history and improve our detection engine.' },
                { title: 'Usage data', desc: 'How you interact with the app (screens visited, features used) to improve the product. No behavioral tracking for advertising.' },
                { title: 'Device information', desc: 'Browser type and operating system for technical support and security purposes.' },
              ].map(({ title, desc }) => (
                <div key={title} className="card-sm">
                  <div className="text-sm font-medium text-ink mb-1">{title}</div>
                  <p className="text-xs text-ink-3 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-base font-medium text-ink mb-3">3. What we do NOT collect</h2>
            <ul className="space-y-1.5">
              {[
                'We do not sell your data to advertisers or third parties',
                'We do not collect your bank account numbers or financial credentials',
                'We do not store uploaded photos or screenshots on our servers (OCR is processed and discarded)',
                'We do not track you across other websites',
                'We do not collect government ID numbers',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-ink-2">
                  <span className="text-brand-green mt-0.5 flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-ink mb-3">4. How we use your data</h2>
            <ul className="space-y-1.5">
              {[
                'To provide and improve the risk analysis service',
                'To maintain your check history and account',
                'To send important account and security notifications',
                'To improve our fraud detection models (using anonymized, aggregated data only)',
                'To comply with Philippine laws and regulations (RA 10173 – Data Privacy Act of 2012)',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-ink-2">
                  <span className="w-1 h-1 rounded-full bg-ink-3 flex-shrink-0 mt-2" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-ink mb-3">5. AI and third-party processing</h2>
            <p className="text-sm leading-relaxed">
              LegitCheck PH uses <strong className="font-medium text-ink">Anthropic Claude</strong> (claude.ai) to power AI agents and text analysis. When you submit text for analysis or chat with an AI agent, your input is sent to Anthropic's API. Anthropic processes this under their own privacy policy. We do not send personally identifiable information to Anthropic unless it is part of your check input.
            </p>
            <p className="text-sm leading-relaxed mt-2">
              Authentication and database services are provided by <strong className="font-medium text-ink">Supabase</strong>, which stores your account and check data securely in encrypted databases.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-ink mb-3">6. Data retention</h2>
            <p className="text-sm leading-relaxed">
              We keep your account data while your account is active. Check records are retained for 12 months, after which they are automatically deleted. You may request deletion of your data at any time by emailing <a href="mailto:privacy@legitcheck.ph" className="text-brand-blue underline">privacy@legitcheck.ph</a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-ink mb-3">7. Your rights under RA 10173</h2>
            <p className="text-sm leading-relaxed mb-3">Under the Philippine Data Privacy Act of 2012, you have the right to:</p>
            <ul className="space-y-1.5">
              {[
                'Be informed about how your data is processed',
                'Access your personal data that we hold',
                'Correct inaccurate personal data',
                'Object to processing of your data',
                'Request erasure or blocking of your data',
                'Data portability — receive a copy of your data in a machine-readable format',
                'Lodge a complaint with the National Privacy Commission (NPC)',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-ink-2">
                  <span className="w-1 h-1 rounded-full bg-ink-3 flex-shrink-0 mt-2" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-ink mb-3">8. Cookies</h2>
            <p className="text-sm leading-relaxed">
              We use essential cookies only: session cookies to keep you logged in and security cookies to protect your account. We do not use tracking or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-ink mb-3">9. Children's privacy</h2>
            <p className="text-sm leading-relaxed">
              LegitCheck PH is not intended for users under 13 years of age. We do not knowingly collect data from children. If you believe a child has provided us data, contact us at <a href="mailto:privacy@legitcheck.ph" className="text-brand-blue underline">privacy@legitcheck.ph</a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-ink mb-3">10. Changes to this policy</h2>
            <p className="text-sm leading-relaxed">
              We may update this policy. We will notify you of material changes via email and by posting the new policy on this page. Continued use of LegitCheck PH after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-ink mb-3">11. Contact</h2>
            <div className="card-sm">
              <p className="text-sm text-ink-2 leading-relaxed">
                <strong className="font-medium text-ink">LegitCheck PH — Data Privacy Office</strong><br />
                Email: <a href="mailto:privacy@legitcheck.ph" className="text-brand-blue underline">privacy@legitcheck.ph</a><br />
                For urgent concerns: <a href="mailto:support@legitcheck.ph" className="text-brand-blue underline">support@legitcheck.ph</a>
              </p>
            </div>
          </section>

          <div className="border-t border-line pt-6 text-xs text-ink-3">
            This privacy policy is governed by Republic Act No. 10173, the Data Privacy Act of 2012 of the Philippines, and its Implementing Rules and Regulations.
          </div>
        </div>
      </article>
    </div>
  )
}
