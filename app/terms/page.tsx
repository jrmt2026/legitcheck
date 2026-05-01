import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-paper-2">
      <header className="bg-ink px-4 py-4 flex items-center gap-3 sticky top-0 z-40">
        <Link href="/" className="text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <span className="text-lg font-bold text-white tracking-tight flex-1">
          LegitCheck <span className="font-light opacity-50">PH</span>
        </span>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Terms of Use</h1>
          <p className="text-sm text-ink-3 mt-1">Last updated: {new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        {[
          {
            title: '1. What LegitCheck PH Does',
            body: 'LegitCheck PH is a scam detection tool that analyzes messages, links, account numbers, and screenshots for potential fraud indicators. It provides a risk score and guidance to help you make informed decisions before sending money or sharing personal information.',
          },
          {
            title: '2. Not Legal or Financial Advice',
            body: 'LegitCheck PH provides risk guidance only. Our results are not final legal, banking, government, or law enforcement decisions. Always verify independently before proceeding with any transaction. We are not liable for any losses arising from reliance on our results.',
          },
          {
            title: '3. Your Responsibility',
            body: 'You are responsible for the content you submit. Do not submit OTPs, PINs, full passwords, or complete credit/debit card numbers. Only submit content you have the right to share. Do not submit false reports or use the service to harass others.',
          },
          {
            title: '4. Community Reports',
            body: 'Reports submitted by users are reviewed by our team before affecting any public record. We use anonymized patterns — we never publish your personal information or automatically accuse any individual or business. False reports may be removed.',
          },
          {
            title: '5. Free Use and Accounts',
            body: 'You may use LegitCheck PH without an account for limited basic checks. Creating a free account gives you access to check history and 3 free basic checks per month. We reserve the right to modify or discontinue any feature at any time.',
          },
          {
            title: '6. Payment Terms and No-Refund Policy',
            body: 'All payments are final and non-refundable, except where required by Philippine law or in cases of a verified duplicate or erroneous charge caused by a confirmed system or payment error. There are no refunds for disagreement with the AI-assisted result. Credits are non-transferable, are not convertible to cash, and are consumed upon use. By proceeding with any payment, you agree that the transaction is final and that credits purchased or used are non-refundable. Paid credits are valid for 12 months from purchase date. Earned credits are valid for 60 days from award date. Earliest-expiring credits are used first.',
          },
          {
            title: '7. Privacy',
            body: 'Your use of LegitCheck PH is also governed by our Privacy Policy. By using this service, you agree to the collection and use of information as described therein.',
          },
          {
            title: '8. Changes to These Terms',
            body: 'We may update these Terms from time to time. Continued use of the service after changes means you accept the updated Terms.',
          },
          {
            title: '9. Contact',
            body: 'For questions about these Terms, contact us at support@legitcheck.ph.',
          },
        ].map(({ title, body }) => (
          <div key={title} className="bg-paper border border-line rounded-2xl p-5">
            <h2 className="text-sm font-bold text-ink mb-2">{title}</h2>
            <p className="text-sm text-ink-3 leading-relaxed">{body}</p>
          </div>
        ))}

        <div className="flex gap-3 pb-8">
          <Link href="/privacy" className="text-sm text-ink-3 hover:text-ink transition-colors">Privacy Policy →</Link>
          <Link href="/" className="text-sm text-ink-3 hover:text-ink transition-colors">Back to home →</Link>
        </div>
      </div>
    </div>
  )
}
