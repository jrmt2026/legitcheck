'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Building2, BadgeCheck, Clock, ShieldAlert, Copy, Check,
  RefreshCw, ArrowLeft, Zap, Code, ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react'

interface CompanyProfile {
  id: string
  company_name: string
  slug: string
  industry: string | null
  website: string | null
  sec_number: string | null
  dti_number: string | null
  verification_status: string
  verified_at: string | null
  created_at: string
}

interface ApiKey {
  id: string
  key_prefix: string
  label: string
  is_active: boolean
  monthly_limit: number
  requests_this_month: number
  created_at: string
  last_used_at: string | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any; desc: string }> = {
  sec_verified:  { label: 'SEC Verified',        color: 'text-brand-green-dark',  bg: 'bg-brand-green-light',  border: 'border-brand-green/20',  icon: BadgeCheck,  desc: 'Your SEC registration has been confirmed.' },
  dti_verified:  { label: 'DTI Verified',         color: 'text-brand-green-dark',  bg: 'bg-brand-green-light',  border: 'border-brand-green/20',  icon: BadgeCheck,  desc: 'Your DTI registration has been confirmed.' },
  sec_submitted: { label: 'SEC — Under Review',   color: 'text-brand-yellow-dark', bg: 'bg-brand-yellow-light', border: 'border-brand-yellow/20', icon: Clock,       desc: 'Your SEC number is recorded. Verification auto-completes within 24 hours.' },
  dti_submitted: { label: 'DTI — Under Review',   color: 'text-brand-yellow-dark', bg: 'bg-brand-yellow-light', border: 'border-brand-yellow/20', icon: Clock,       desc: 'Your DTI number is recorded. Verification auto-completes within 24 hours.' },
  unverified:    { label: 'Not yet verified',      color: 'text-ink-3',             bg: 'bg-paper-2',            border: 'border-line',            icon: ShieldAlert, desc: 'Add your SEC or DTI number below to get verified automatically.' },
  failed:        { label: 'Verification failed',   color: 'text-brand-red-dark',    bg: 'bg-brand-red-light',    border: 'border-brand-red/20',    icon: ShieldAlert, desc: 'We could not confirm your registration number. Check it and try again.' },
}

export default function CompanyDashboardPage() {
  const router = useRouter()
  const [company, setCompany]     = useState<CompanyProfile | null>(null)
  const [apiKey, setApiKey]       = useState<ApiKey | null>(null)
  const [loading, setLoading]     = useState(true)

  const [newKey, setNewKey]       = useState<string | null>(null)
  const [generatingKey, setGeneratingKey] = useState(false)
  const [copied, setCopied]       = useState(false)
  const [showDocs, setShowDocs]   = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: comp } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!comp) { router.push('/dashboard'); return }
    setCompany(comp)

    const { data: keys } = await supabase
      .from('api_keys')
      .select('*')
      .eq('company_id', comp.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)

    if (keys && keys.length > 0) setApiKey(keys[0])
    setLoading(false)
  }

  async function generateKey() {
    setGeneratingKey(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch('/api/company/keys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ label: 'Default' }),
    })

    const data = await res.json()
    if (res.ok) {
      setNewKey(data.key)
      setApiKey({ id: '', key_prefix: data.prefix, label: 'Default', is_active: true, monthly_limit: 500, requests_this_month: 0, created_at: new Date().toISOString(), last_used_at: null })
    }
    setGeneratingKey(false)
  }

  async function copyKey(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-paper-2 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-ink animate-throb" />
      </div>
    )
  }

  if (!company) return null

  const statusConf = STATUS_CONFIG[company.verification_status] ?? STATUS_CONFIG.unverified
  const StatusIcon = statusConf.icon
  const isVerified = company.verification_status.includes('verified')
  const usagePct   = apiKey ? Math.round((apiKey.requests_this_month / apiKey.monthly_limit) * 100) : 0

  const sampleCode = `curl -X POST https://legitcheck-ph.vercel.app/api/v1/bulk-analyze \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "items": [
      { "id": "tx_001", "text": "GCash payment first then delivery..." },
      { "id": "tx_002", "text": "Processing fee of ₱2,000 required..." }
    ]
  }'`

  return (
    <div className="min-h-screen bg-paper-2">
      <header className="bg-ink px-4 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <span className="text-base font-bold text-white tracking-tight">{company.company_name}</span>
            <span className="text-white/40 text-xs ml-2">Business</span>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${statusConf.bg} ${statusConf.border} ${statusConf.color}`}>
          <StatusIcon size={11} />
          {statusConf.label}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Verification card */}
        <div className={`rounded-2xl border p-4 ${statusConf.bg} ${statusConf.border}`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isVerified ? 'bg-brand-green/20' : 'bg-white/60'}`}>
              <StatusIcon size={20} className={statusConf.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${statusConf.color}`}>{statusConf.label}</p>
              <p className="text-xs text-ink-3 leading-relaxed mt-0.5">{statusConf.desc}</p>
              {isVerified && company.verified_at && (
                <p className="text-xs text-ink-3 mt-1">
                  Verified {new Date(company.verified_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
              {isVerified && (
                <a
                  href={`/verify/${company.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-brand-green-dark font-semibold mt-2 hover:underline"
                >
                  View public verification page <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* API Key card */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <p className="sec-label mb-0">API Key</p>
            {apiKey && (
              <div className="text-xs text-ink-3">
                {apiKey.requests_this_month} / {apiKey.monthly_limit} this month
              </div>
            )}
          </div>

          {newKey ? (
            <div className="bg-ink rounded-xl p-3.5 space-y-2">
              <p className="text-xs text-white/50">Your new API key — copy it now. It won't be shown again.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-brand-green font-mono break-all">{newKey}</code>
                <button onClick={() => copyKey(newKey)} className="flex-shrink-0 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all">
                  {copied ? <Check size={13} className="text-brand-green" /> : <Copy size={13} className="text-white/60" />}
                </button>
              </div>
            </div>
          ) : apiKey ? (
            <div className="bg-paper-2 border border-line rounded-xl p-3.5 flex items-center justify-between gap-2">
              <code className="text-sm text-ink-2 font-mono">{apiKey.key_prefix}••••••••••••••••</code>
              <span className="text-xs text-ink-3">Active</span>
            </div>
          ) : (
            <p className="text-sm text-ink-3">No API key yet. Generate one to start using the bulk API.</p>
          )}

          {apiKey && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-ink-3">
                <span>Monthly usage</span>
                <span>{usagePct}%</span>
              </div>
              <div className="w-full h-1.5 bg-paper-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${usagePct > 90 ? 'bg-brand-red' : usagePct > 70 ? 'bg-brand-yellow' : 'bg-brand-green'}`}
                  style={{ width: `${Math.min(usagePct, 100)}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={generateKey}
            disabled={generatingKey}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-line bg-paper-2 text-sm text-ink-2 font-medium hover:bg-ink hover:text-white hover:border-ink transition-all disabled:opacity-50"
          >
            <RefreshCw size={13} className={generatingKey ? 'animate-spin' : ''} />
            {apiKey ? 'Rotate key' : 'Generate API key'}
          </button>
        </div>

        {/* Quick start docs */}
        <div className="card">
          <button
            onClick={() => setShowDocs(v => !v)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Code size={14} className="text-ink-3" />
              <p className="sec-label mb-0">Quick start</p>
            </div>
            {showDocs ? <ChevronUp size={14} className="text-ink-3" /> : <ChevronDown size={14} className="text-ink-3" />}
          </button>

          {showDocs && (
            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-ink-2">Endpoint</p>
                <code className="block text-xs text-brand-green bg-ink rounded-lg px-3 py-2 font-mono">
                  POST /api/v1/bulk-analyze
                </code>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-ink-2">Request</p>
                <pre className="text-xs text-white/80 bg-ink rounded-lg px-3 py-3 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap break-words">
                  {sampleCode}
                </pre>
              </div>

              <div className="space-y-2 text-xs text-ink-3">
                <p><strong className="text-ink-2">items</strong> — array of up to 50 items, each with <code className="bg-paper-2 px-1 rounded">id</code> and <code className="bg-paper-2 px-1 rounded">text</code></p>
                <p><strong className="text-ink-2">Response</strong> — each item gets <code className="bg-paper-2 px-1 rounded">risk</code> (critical/high/caution/low/safe), <code className="bg-paper-2 px-1 rounded">score</code>, and <code className="bg-paper-2 px-1 rounded">flags[]</code></p>
                <p><strong className="text-ink-2">Rate limit</strong> — {apiKey?.monthly_limit ?? 500} items/month on your current plan</p>
              </div>
            </div>
          )}
        </div>

        {/* Company info */}
        <div className="card">
          <p className="sec-label">Company details</p>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Name',     value: company.company_name },
              { label: 'Industry', value: company.industry },
              { label: 'Website',  value: company.website },
              { label: 'SEC No.',  value: company.sec_number },
              { label: 'DTI No.',  value: company.dti_number },
            ].filter(r => r.value).map(row => (
              <div key={row.label} className="flex items-start gap-3">
                <span className="text-ink-3 w-20 flex-shrink-0 text-xs pt-0.5">{row.label}</span>
                <span className="text-ink-2 break-all">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pb-8" />
      </main>
    </div>
  )
}
