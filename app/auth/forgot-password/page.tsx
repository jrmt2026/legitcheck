'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]     = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/reset-password`,
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-paper-2 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <ShieldCheck size={20} className="text-brand-green" />
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-ink tracking-tight">LegitCheck</span>
              <span className="text-xl font-light text-ink-3">PH</span>
            </div>
          </Link>
          <p className="text-sm text-ink-3 mt-2">Reset your password</p>
        </div>

        {sent ? (
          <div className="card p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-brand-green-light border border-brand-green/20 flex items-center justify-center mx-auto">
              <CheckCircle size={28} className="text-brand-green" />
            </div>
            <div>
              <p className="text-base font-semibold text-ink">Check your email</p>
              <p className="text-sm text-ink-3 mt-1 leading-relaxed">
                We sent a reset link to <strong className="text-ink">{email}</strong>. Click the link to set a new password.
              </p>
            </div>
            <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink transition-colors">
              <ArrowLeft size={13} /> Back to login
            </Link>
          </div>
        ) : (
          <div className="card p-6">
            <p className="text-sm text-ink-2 mb-4 leading-relaxed">
              Enter your email and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@email.com"
                  className="w-full border border-line rounded-xl px-3.5 py-3 text-sm text-ink bg-paper-2 focus:outline-none focus:border-ink placeholder-ink-3 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-ink text-white text-sm font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Sending…' : 'Send reset link'}
                {!loading && <ArrowRight size={14} />}
              </button>
            </form>
          </div>
        )}

        <div className="text-center mt-4">
          <Link href="/auth/login" className="text-xs text-ink-3 hover:text-ink transition-colors flex items-center justify-center gap-1">
            <ArrowLeft size={11} /> Back to login
          </Link>
        </div>

      </div>
    </div>
  )
}
