'use client'

export const dynamic = 'force-dynamic'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      router.push(redirectTo)
      router.refresh()
    }
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
          <p className="text-sm text-ink-3 mt-2">Welcome back — log in to your account</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleLogin} className="space-y-4">
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-ink-2">Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-ink-3 hover:text-ink transition-colors">
                  Forgot password?
                </Link>
              </div>
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
              {loading ? 'Logging in…' : 'Log in'}
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>
        </div>

        <div className="text-center mt-4 space-y-2">
          <p className="text-xs text-ink-3">
            No account yet?{' '}
            <Link href="/auth/signup" className="text-ink font-semibold hover:underline">Sign up free</Link>
          </p>
          <div>
            <Link href="/auth/company-signup" className="text-xs text-ink-3 hover:text-ink transition-colors">
              Business account? Sign up here →
            </Link>
          </div>
          <p className="text-xs text-ink-3">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            {' · '}
            <Link href="/terms" className="hover:underline">Terms</Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link href="/buyer" className="text-xs text-ink-3 hover:text-ink transition-colors">
            Continue without account →
          </Link>
        </div>

      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
