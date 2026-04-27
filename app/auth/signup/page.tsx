'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { ArrowRight, CheckCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react'

export default function SignupPage() {
  const [step, setStep]         = useState<'form' | 'verify'>('form')
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      setStep('verify')
    }
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-paper-2 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center animate-scale-in">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-brand-green-light border-2 border-brand-green/20 flex items-center justify-center">
              <CheckCircle size={32} className="text-brand-green" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-ink mb-2 tracking-tight">Check your email</h2>
          <p className="text-sm text-ink-3 mb-6 leading-relaxed">
            We sent a confirmation link to{' '}
            <strong className="text-ink">{email}</strong>.
            Click it to activate your account.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-sm text-ink font-semibold hover:underline"
          >
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper-2 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <ShieldCheck size={20} className="text-brand-green" />
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-ink tracking-tight">LegitCheck</span>
              <span className="text-xl font-light text-ink-3">PH</span>
            </div>
          </Link>
          <p className="text-sm text-ink-3 mt-2">Create your free account</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-2 mb-1.5">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                placeholder="Juan dela Cruz"
                className="w-full border border-line rounded-xl px-3.5 py-3 text-sm text-ink bg-paper-2 focus:outline-none focus:border-ink placeholder-ink-3 transition-colors"
              />
            </div>

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

            <div>
              <label className="block text-xs font-semibold text-ink-2 mb-1.5">Password <span className="text-ink-3 font-normal">(min. 8 characters)</span></label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full border border-line rounded-xl px-3.5 py-3 pr-10 text-sm text-ink bg-paper-2 focus:outline-none focus:border-ink placeholder-ink-3 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition-colors"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ink text-white text-sm font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Creating account…' : 'Create free account'}
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>

          <p className="text-xs text-ink-3 text-center mt-4 leading-relaxed">
            By signing up, you agree to our{' '}
            <Link href="/privacy" className="underline hover:text-ink">Privacy Policy</Link>
            {' '}and{' '}
            <Link href="/terms" className="underline hover:text-ink">Terms of Use</Link>.
          </p>
        </div>

        <div className="text-center mt-4 space-y-2">
          <p className="text-xs text-ink-3">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-ink font-semibold hover:underline">Log in</Link>
          </p>
          <div>
            <Link href="/buyer" className="text-xs text-ink-3 hover:text-ink transition-colors">
              Continue without account →
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
