'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, User, Mail, Lock, LogOut, Eye, EyeOff,
  CheckCircle, ChevronRight, Shield, Bell, Trash2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Section = 'main' | 'name' | 'email' | 'password'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [section, setSection]   = useState<Section>('main')
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [initializing, setInitializing] = useState(true)

  // Form state
  const [newName, setNewName]           = useState('')
  const [newEmail, setNewEmail]         = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword]   = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent]   = useState(false)
  const [showNew, setShowNew]           = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      setUserEmail(user.email || '')
      setUserName(user.user_metadata?.full_name || '')
      setNewName(user.user_metadata?.full_name || '')
      setNewEmail(user.email || '')
      setInitializing(false)
    })
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  async function updateName(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ data: { full_name: newName.trim() } })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setUserName(newName.trim())
    toast.success('Name updated!')
    setSection('main')
  }

  async function updateEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail.trim() || newEmail === userEmail) return
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Confirmation sent to your new email.')
    setSection('main')
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Password updated!')
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    setSection('main')
  }

  if (initializing) {
    return (
      <div className="min-h-screen bg-paper-2 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-line border-t-ink animate-spin" />
      </div>
    )
  }

  const initials = userName
    ? userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : userEmail[0]?.toUpperCase() || '?'

  // ── Sub-sections ───────────────────────────────────────────────────────────

  if (section === 'name') {
    return (
      <div className="min-h-screen bg-paper-2">
        <header className="border-b border-line bg-paper sticky top-0 z-40 px-4 py-4 flex items-center gap-3">
          <button onClick={() => setSection('main')} className="text-ink-3 hover:text-ink transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-ink tracking-tight">Update name</h1>
        </header>
        <div className="max-w-lg mx-auto px-4 py-6">
          <form onSubmit={updateName} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-2 mb-1.5">Full name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
                className="input-base"
                placeholder="Juan dela Cruz"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || !newName.trim()}
              className="w-full bg-ink text-white font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
            >
              {loading ? 'Saving…' : 'Save name'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (section === 'email') {
    return (
      <div className="min-h-screen bg-paper-2">
        <header className="border-b border-line bg-paper sticky top-0 z-40 px-4 py-4 flex items-center gap-3">
          <button onClick={() => setSection('main')} className="text-ink-3 hover:text-ink transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-ink tracking-tight">Update email</h1>
        </header>
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <div className="bg-brand-yellow-light border border-brand-yellow/20 rounded-xl px-4 py-3 text-xs text-brand-yellow-dark leading-snug">
            A confirmation link will be sent to your new email. Your current email stays active until confirmed.
          </div>
          <form onSubmit={updateEmail} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-2 mb-1.5">New email</label>
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                required
                className="input-base"
                placeholder="new@email.com"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || !newEmail.trim() || newEmail === userEmail}
              className="w-full bg-ink text-white font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
            >
              {loading ? 'Sending…' : 'Send confirmation'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (section === 'password') {
    return (
      <div className="min-h-screen bg-paper-2">
        <header className="border-b border-line bg-paper sticky top-0 z-40 px-4 py-4 flex items-center gap-3">
          <button onClick={() => setSection('main')} className="text-ink-3 hover:text-ink transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-ink tracking-tight">Change password</h1>
        </header>
        <div className="max-w-lg mx-auto px-4 py-6">
          <form onSubmit={updatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-2 mb-1.5">New password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  className="input-base pr-10"
                  placeholder="Min. 8 characters"
                  autoFocus
                />
                <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink">
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-2 mb-1.5">Confirm new password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  className="input-base pr-10"
                  placeholder="Repeat password"
                />
                <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink">
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-brand-red-dark">Passwords do not match</p>
            )}
            <button
              type="submit"
              disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
              className="w-full bg-ink text-white font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
            >
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Main profile screen ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-paper-2">
      <header className="border-b border-line bg-paper sticky top-0 z-40 px-4 py-4 flex items-center gap-3">
        <Link href="/dashboard" className="text-ink-3 hover:text-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-bold text-ink tracking-tight flex-1">Profile & Settings</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Avatar + name */}
        <div className="flex items-center gap-4 bg-paper border border-line rounded-2xl px-5 py-5">
          <div className="w-14 h-14 rounded-full bg-ink flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">{initials}</span>
          </div>
          <div>
            <p className="font-bold text-ink text-base leading-tight">{userName || 'No name set'}</p>
            <p className="text-sm text-ink-3 mt-0.5">{userEmail}</p>
          </div>
        </div>

        {/* Account settings */}
        <div>
          <p className="sec-label">Account</p>
          <div className="bg-paper border border-line rounded-2xl overflow-hidden divide-y divide-line">
            {[
              { icon: User,  label: 'Full name',  value: userName || 'Not set', action: () => setSection('name') },
              { icon: Mail,  label: 'Email',       value: userEmail,             action: () => setSection('email') },
              { icon: Lock,  label: 'Password',    value: '••••••••',            action: () => setSection('password') },
            ].map(({ icon: Icon, label, value, action }) => (
              <button
                key={label}
                onClick={action}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-paper-2 transition-colors text-left"
              >
                <Icon size={16} className="text-ink-3 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink-3">{label}</p>
                  <p className="text-sm text-ink leading-tight mt-0.5 truncate">{value}</p>
                </div>
                <ChevronRight size={14} className="text-ink-3 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* App settings */}
        <div>
          <p className="sec-label">App</p>
          <div className="bg-paper border border-line rounded-2xl overflow-hidden divide-y divide-line">
            <Link href="/dashboard" className="flex items-center gap-4 px-4 py-4 hover:bg-paper-2 transition-colors">
              <Shield size={16} className="text-ink-3" />
              <div className="flex-1">
                <p className="text-sm text-ink font-medium">My checks</p>
                <p className="text-xs text-ink-3 mt-0.5">View your check history</p>
              </div>
              <ChevronRight size={14} className="text-ink-3" />
            </Link>
            <Link href="/dashboard/pricing" className="flex items-center gap-4 px-4 py-4 hover:bg-paper-2 transition-colors">
              <CheckCircle size={16} className="text-ink-3" />
              <div className="flex-1">
                <p className="text-sm text-ink font-medium">Plan & credits</p>
                <p className="text-xs text-ink-3 mt-0.5">Upgrade or manage your plan</p>
              </div>
              <ChevronRight size={14} className="text-ink-3" />
            </Link>
          </div>
        </div>

        {/* Legal */}
        <div>
          <p className="sec-label">Legal</p>
          <div className="bg-paper border border-line rounded-2xl overflow-hidden divide-y divide-line">
            <Link href="/privacy" className="flex items-center gap-4 px-4 py-4 hover:bg-paper-2 transition-colors">
              <Shield size={16} className="text-ink-3" />
              <p className="text-sm text-ink font-medium flex-1">Privacy Policy</p>
              <ChevronRight size={14} className="text-ink-3" />
            </Link>
            <Link href="/terms" className="flex items-center gap-4 px-4 py-4 hover:bg-paper-2 transition-colors">
              <CheckCircle size={16} className="text-ink-3" />
              <p className="text-sm text-ink font-medium flex-1">Terms of Use</p>
              <ChevronRight size={14} className="text-ink-3" />
            </Link>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 bg-paper border border-line rounded-2xl px-4 py-4 text-sm font-semibold text-brand-red-dark hover:bg-brand-red-light hover:border-brand-red/20 transition-all"
        >
          <LogOut size={15} />
          Sign out
        </button>

        <div className="pb-8" />
      </div>
    </div>
  )
}
