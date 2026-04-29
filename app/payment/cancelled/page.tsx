import Link from 'next/link'
import { XCircle } from 'lucide-react'

export default function PaymentCancelled() {
  return (
    <div className="min-h-screen bg-paper-2 flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-paper border border-line flex items-center justify-center mb-5">
        <XCircle size={36} className="text-ink-3" strokeWidth={1.5} />
      </div>
      <h1 className="text-2xl font-bold text-ink mb-2">Payment cancelled</h1>
      <p className="text-sm text-ink-3 leading-relaxed max-w-xs mb-8">
        No charges were made. You can try again any time.
      </p>
      <Link
        href="/buyer"
        className="px-6 py-3 bg-ink text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
      >
        Back to LegitCheck
      </Link>
    </div>
  )
}
