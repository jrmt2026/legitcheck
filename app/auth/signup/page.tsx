'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { ArrowRight, CheckCircle } from 'lucide-react'

export default function SignupPage() {
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

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

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-paper-2 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle size={48} className="text-brand-green" />
          </div>
          <h2 className="text-xl font-medium text-ink mb-2">Check your email</h2>
          <p className="text-sm text-ink-3 mb-6 leading-relaxed">
            We sent a confirmation link to <strong className="text-ink">{email}</strong>.
            Click it to activate your account.
          </p>
          <Link href="/auth/login" className="text-sm text-ink font-medium hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper-2 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-baseline gap-1">
            <span className="text-xl font-medium text-ink">LegitCheck</span>
            <span className="text-xl font-light text-ink-2">PH</span>
          </Link>
          <p className="text-sm text-ink-3 mt-2">Create your free account</p>
        </div>

        <div className="card p-6">
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 border border-line rounded-xl py-3 text-sm font-medium text-ink hover:bg-paper-2 transition-colors mb-5"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-line" />
            <span className="text-xs text-ink-3">or</span>
            <div className="flex-1 h-px bg-line" />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1.5">Full name</label>
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
              <label className="block text-xs font-medium text-ink-2 mb-1.5">Email</label>
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
              <label className="block text-xs font-medium text-ink-2 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Min. 8 characters"
                className="w-full border border-line rounded-xl px-3.5 py-3 text-sm text-ink bg-paper-2 focus:outline-none focus:border-ink placeholder-ink-3 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ink text-white text-sm font-medium rounded-xl py-3 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Creating account…' : 'Create account'}
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

        <p className="text-center text-xs text-ink-3 mt-4">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-ink font-medium hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  )
}
