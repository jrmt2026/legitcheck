import Link from 'next/link'
import { XCircle } from 'lucide-react'

export default function PaymentFailed() {
  return (
    <div className="min-h-screen bg-paper-2 flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-brand-red-light flex items-center justify-center mb-5">
        <XCircle size={40} className="text-brand-red-dark" strokeWidth={1.5} />
      </div>
      <h1 className="text-2xl font-semibold text-ink mb-2">Payment Not Completed</h1>
      <p className="text-sm text-ink-3 leading-relaxed max-w-xs mb-8">
        Your payment was not processed. No charge was made. You can try again anytime.
      </p>
      <Link
        href="/dashboard/pricing"
        className="px-6 py-3 bg-ink text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
      >
        Back to pricing
      </Link>
    </div>
  )
}
