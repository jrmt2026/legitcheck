'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, X, Loader2, ImagePlus, RotateCcw,
  ShieldCheck, Lock, AlertTriangle, Clock, Check, UserPlus,
} from 'lucide-react'
import AccountLookup from '@/components/AccountLookup'
import { detectCategory, detectSignals, computeRisk } from '@/lib/decisionEngine'
import { createClient } from '@/lib/supabase/client'
import type { CategoryId, DecisionResult } from '@/types'
import ResultClient from '@/components/ResultClient'

const CATEGORIES: { id: CategoryId; icon: string; label: string }[] = [
  { id: 'online_purchase', icon: '🛍️', label: 'Online Seller'  },
  { id: 'sms_text',        icon: '📱', label: 'SMS / Text'     },
  { id: 'job_agency',      icon: '✈️', label: 'Job / OFW'      },
  { id: 'investment',      icon: '💰', label: 'Investment'      },
  { id: 'donation',        icon: '❤️', label: 'Donation'        },
  { id: 'website_check',   icon: '🌐', label: 'Website'         },
  { id: 'loan_scam',       icon: '💸', label: 'Loan'            },
  { id: 'romance_scam',    icon: '💔', label: 'Romance'         },
  { id: 'property',        icon: '🏠', label: 'Property'        },
  { id: 'buyer_check',     icon: '🔄', label: 'Buyer'           },
  { id: 'profile_check',   icon: '👤', label: 'Social'          },
  { id: 'vendor',          icon: '🏢', label: 'Other'           },
]

const EXAMPLES = [
  { key: 'fb',     emoji: '🛍️', label: 'FB Seller',    text: 'Seller: Hi po! Available pa po yung bag. GCash nalang po tayo para mas mabilis. Account ko: 09171234567 - J. Santos. Rush po kasi maraming nagtatanong. Pag di ka nagbayad ngayon, ibebenta ko na sa iba.' },
  { key: 'gov',    emoji: '📱', label: "Gov't SMS",     text: 'Traffic Authority: Mahal na motorista, mayroon kang unpaid traffic violation na nagkakahalaga ng ₱5,000. Ang iyong lisensya ay sususpindihin sa loob ng 48 oras. I-click ang link para bayaran ngayon: http://gov-fines-ph.com/pay' },
  { key: 'invest', emoji: '💰', label: 'Investment',   text: 'Kumita na ng 30% monthly ang aming mga investors! Guaranteed po ang return. Mag-invite ka pa ng friends, may komisyon ka pa. Mag-invest ka na ngayon, last slots na lang. Withdrawal fee lang ng ₱2,000 para ma-release ang profit mo.' },
  { key: 'land',   emoji: '🏠', label: 'Land Deal',    text: "Sir/Ma'am, yung lote sa Cavite, 300sqm, ₱2M lang. Mag-deposit na po kayo ng ₱100K para ma-hold. Title at docs ipapakita ko pagkatapos ng payment." },
  { key: 'agency', emoji: '✈️', label: 'Job Agency',   text: 'Congratulations! Qualified ka sa deployment sa Dubai. Processing fee lang: ₱15,000 via GCash bago maibigay ang kontrata. Urgent — kailangan bukas na para ma-slot ka.' },
  { key: 'online', emoji: '🛒', label: 'Online Order',  text: 'Order #ONL-2024-99871 confirmed. Item: Korean Skincare Set ₱499. Seller: BeautyStore_PH (4.8★ 2.3k reviews). Official in-platform checkout. Estimated delivery: 3-5 days.' },
]

const SCAN_STEPS = [
  'Reading content…',
  'Checking links and payment accounts…',
  'Looking for urgency pressure…',
  'Comparing with known scam patterns…',
  'Computing trust score…',
  'Preparing your report…',
]

function fileToBase64(file: File): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const r = reader.result as string
      resolve({ data: r.split(',')[1], mimeType: file.type || 'image/jpeg' })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

type Step = 'input' | 'analyzing' | 'result' | 'signup_wall' | 'upgrade_wall'
type Tab  = 'check' | 'history'

interface HistoryCheck {
  id: string
  created_at: string
  category_id: string
  input_text: string
  score: number
  color: string
}

const COLOR_BADGE: Record<string, string> = {
  green:  'bg-brand-green-light text-brand-green-dark',
  yellow: 'bg-brand-yellow-light text-brand-yellow-dark',
  orange: 'bg-[#FFF0E6] text-brand-orange-dark',
  red:    'bg-brand-red-light text-brand-red-dark',
}
const COLOR_LABEL: Record<string, string> = {
  green: 'Safe', yellow: 'Low Risk', orange: 'Caution', red: 'High Risk',
}

export default function BuyerPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [tab, setTab]                             = useState<Tab>('check')
  const [step, setStep]                           = useState<Step>('input')
  const [input, setInput]                         = useState('')
  const [selectedCategory, setSelectedCategory]   = useState<CategoryId | null>(null)
  const [uploadedFiles, setUploadedFiles]         = useState<File[]>([])
  const [uploadedPreviews, setUploadedPreviews]   = useState<string[]>([])
  const [scanStep, setScanStep]                   = useState(0)
  const [result, setResult]                       = useState<DecisionResult | null>(null)
  const [scoreSteps, setScoreSteps]               = useState<Array<{ label: string; delta: number }>>([])
  const [savedCheckId, setSavedCheckId]           = useState<string | undefined>()
  const [tier, setTier]                           = useState<'guest' | 'basic' | 'full'>('guest')
  const [error, setError]                         = useState('')
  const [history, setHistory]                     = useState<HistoryCheck[]>([])
  const [loadingHistory, setLoadingHistory]       = useState(false)
  const [isAuth, setIsAuth]                       = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shared = [params.get('text'), params.get('url'), params.get('title')].filter(Boolean).join('\n')
    if (shared) setInput(shared)

    createClient().auth.getUser().then(({ data: { user } }) => setIsAuth(!!user))
  }, [])

  useEffect(() => {
    if (tab === 'history') loadHistory()
  }, [tab])

  async function loadHistory() {
    setLoadingHistory(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('checks')
        .select('id, created_at, category_id, input_text, score, color')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      if (data) setHistory(data)
    } finally {
      setLoadingHistory(false)
    }
  }

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const toAdd = files.slice(0, 4 - uploadedFiles.length)
    setUploadedFiles(prev => [...prev, ...toAdd])
    setUploadedPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))])
    e.target.value = ''
  }

  function removeFile(i: number) {
    URL.revokeObjectURL(uploadedPreviews[i])
    setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))
    setUploadedPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  function reset() {
    setStep('input')
    setInput('')
    setSelectedCategory(null)
    setUploadedFiles([])
    setUploadedPreviews([])
    setScanStep(0)
    setResult(null)
    setScoreSteps([])
    setSavedCheckId(undefined)
    setTier('guest')
    setError('')
  }

  async function handleAnalyze() {
    if (!input.trim() && uploadedFiles.length === 0) return

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null

    setStep('analyzing')
    setError('')

    for (let i = 0; i < SCAN_STEPS.length; i++) {
      setScanStep(i)
      await new Promise(r => setTimeout(r, 650))
    }

    let finalResult: DecisionResult | null = null
    let analysisText = input
    let resultTier: 'guest' | 'basic' | 'full' = user ? 'basic' : 'guest'

    try {
      const imageFiles = uploadedFiles.filter(f => f.type.startsWith('image/'))
      const images = imageFiles.length > 0 ? await Promise.all(imageFiles.map(fileToBase64)) : []
      const reqHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) reqHeaders['Authorization'] = `Bearer ${session.access_token}`
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify({ text: input, images, categoryHint: selectedCategory }),
      })
      const data = await res.json()
      if (res.ok) {
        finalResult    = data.result
        analysisText   = data.extractedText || input
        if (data.scoreSteps) setScoreSteps(data.scoreSteps)
        if (data.tier) resultTier = data.tier
      }
    } catch { /* fall through to local engine */ }

    if (!finalResult) {
      try {
        const cat     = detectCategory(analysisText)
        const signals = detectSignals(analysisText, cat)
        finalResult   = computeRisk(cat, signals)
      } catch {
        setError('Analysis failed. Please try again.')
        setStep('input')
        return
      }
    }

    setTier(resultTier)
    setResult(finalResult)
    setStep('result')

    if (user) {
      try {
        const { data: check } = await supabase.from('checks').insert({
          user_id:     user.id,
          category_id: finalResult.categoryId,
          input_text:  analysisText,
          score:       finalResult.score,
          color:       finalResult.color,
          result:      finalResult,
        }).select('id').single()
        if (check) setSavedCheckId(check.id)
      } catch { /* silent — result already shown */ }

      // Award points + badges (non-blocking)
      try {
        const session = await supabase.auth.getSession()
        const token   = session.data.session?.access_token
        if (token) {
          const res = await fetch('/api/user/award-points', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body:    JSON.stringify({ categoryId: finalResult.categoryId, color: finalResult.color }),
          })
          if (res.ok) {
            const gam = await res.json()
            if (gam.newBadges?.length) {
              const { default: toast } = await import('react-hot-toast')
              gam.newBadges.forEach((id: string) => {
                const labels: Record<string, string> = {
                  first_check: '🛡️ Badge: First Check', scam_spotter: '🔍 Badge: Scam Spotter',
                  phishing_defender: '📵 Badge: Phishing Defender', marketplace_guardian: '🛍️ Badge: Marketplace Guardian',
                  ofw_ally: '✈️ Badge: OFW Safety Ally', donation_defender: '❤️ Badge: Donation Defender',
                  investment_skeptic: '💰 Badge: Investment Skeptic', red_flag_master: '🏆 Badge: Red Flag Master',
                  community_reporter: '🚩 Badge: Community Reporter', family_protector: '👨‍👩‍👧 Badge: Family Protector',
                  verified_helper: '✅ Badge: Verified Helper',
                }
                toast.success(labels[id] ?? '🏅 New badge unlocked!', { duration: 4000 })
              })
            }
          }
        }
      } catch { /* silent */ }
    }
  }

  // ── Signup wall ────────────────────────────────────────────────────────────
  if (step === 'signup_wall') {
    return (
      <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-brand-green/20 border border-brand-green/30 flex items-center justify-center mb-5">
          <ShieldCheck size={28} className="text-brand-green" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">See the full report</h1>
        <p className="text-white/60 text-sm mb-8 max-w-xs leading-relaxed">
          You've used your free guest check. Sign up free to get 1 more check with a detailed analysis.
        </p>
        <div className="w-full max-w-xs space-y-3">
          <Link href="/auth/signup" className="w-full bg-brand-green text-white font-bold rounded-2xl py-4 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
            <UserPlus size={16} /> Create free account
          </Link>
          <Link href="/auth/login" className="w-full bg-white/10 text-white font-semibold rounded-2xl py-3.5 flex items-center justify-center hover:bg-white/20 transition-all text-sm">
            Log in to existing account
          </Link>
        </div>
        <button onClick={reset} className="mt-8 text-xs text-white/30 hover:text-white/60 transition-colors">
          ← Try a different check
        </button>
      </div>
    )
  }

  // ── Upgrade wall ───────────────────────────────────────────────────────────
  if (step === 'upgrade_wall') {
    return (
      <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-5">
          <Lock size={24} className="text-white/60" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Free check used</h1>
        <p className="text-white/60 text-sm mb-6 max-w-xs leading-relaxed">
          You've used your free account check. Upgrade to Pro for unlimited checks with full reports.
        </p>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 max-w-xs w-full text-left space-y-2.5">
          {['Unlimited checks', 'Full AI analysis', 'Score breakdown', 'History & reports', 'Priority support'].map(f => (
            <div key={f} className="flex items-center gap-2.5 text-sm text-white/70">
              <Check size={13} className="text-brand-green flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>
        <button disabled className="w-full max-w-xs bg-brand-green/40 text-white/50 font-bold rounded-2xl py-4 mb-3 cursor-not-allowed text-sm">
          Upgrade to Pro — coming soon
        </button>
        <button onClick={reset} className="text-sm text-white/40 hover:text-white/70 transition-colors">
          ← Back
        </button>
      </div>
    )
  }

  // ── Result screen ──────────────────────────────────────────────────────────
  if (step === 'result' && result) {
    return (
      <div className="min-h-screen bg-paper-2 animate-fade-in">
        <header className="bg-ink px-4 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <button onClick={reset} className="text-white/60 hover:text-white transition-colors" aria-label="Back">
              <ArrowLeft size={20} />
            </button>
            <Link href="/" className="text-lg font-bold text-white tracking-tight hover:opacity-80 transition-opacity">
              LegitCheck <span className="font-light opacity-50">PH</span>
            </Link>
          </div>
          <button onClick={reset} className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors">
            <RotateCcw size={14} /> New check
          </button>
        </header>
        <ResultClient result={result} checkId={savedCheckId} inputText={input} scoreSteps={scoreSteps} tier={tier} />
      </div>
    )
  }

  // ── Analyzing screen ───────────────────────────────────────────────────────
  if (step === 'analyzing') {
    return (
      <div className="min-h-screen bg-ink flex flex-col">
        <header className="px-4 py-4">
          <Link href="/" className="text-lg font-bold text-white tracking-tight hover:opacity-80 transition-opacity">
            LegitCheck <span className="font-light opacity-50">PH</span>
          </Link>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-8 animate-fade-in">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-2 border-white/20 flex items-center justify-center">
              <ShieldCheck size={32} className="text-white/60 animate-float" />
            </div>
            <div className="absolute -inset-2 rounded-full border border-white/20 animate-ping opacity-30" />
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-white mb-1">Analyzing…</p>
            <p className="text-sm text-white/50">Checking for red flags</p>
          </div>
          <div className="w-full max-w-xs space-y-2">
            {SCAN_STEPS.map((s, i) => (
              <div key={s} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm transition-all duration-300 ${
                i < scanStep  ? 'bg-brand-green/20 border-brand-green/30 text-brand-green' :
                i === scanStep ? 'bg-white/10 border-white/20 text-white font-semibold' :
                'bg-white/5 border-white/10 text-white/30'
              }`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${
                  i < scanStep ? 'bg-brand-green' : i === scanStep ? 'bg-white animate-throb' : 'bg-white/20'
                }`} />
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Input screen ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-paper-2">

      {/* Header + Tab bar — single sticky block */}
      <div className="sticky top-0 z-40">
        <header className="bg-ink px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <Link href="/" className="text-lg font-bold text-white tracking-tight flex-1 hover:opacity-80 transition-opacity">
            LegitCheck <span className="font-light opacity-50">PH</span>
          </Link>
          {isAuth ? (
            <Link
              href="/sos"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-red/20 text-red-300 text-sm font-medium hover:bg-brand-red/30 transition-all"
            >
              🚨 SOS
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login" className="text-sm text-white/60 hover:text-white transition-colors px-2 py-1.5">
                Log in
              </Link>
              <Link href="/auth/signup" className="text-sm font-semibold text-ink bg-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
                Sign up
              </Link>
            </div>
          )}
        </header>

        {/* Tab bar */}
        <div className="bg-ink border-b border-white/10 px-4 flex gap-1">
          {([
            { id: 'check'   as Tab, icon: <ShieldCheck size={14} />, label: 'Check'   },
            { id: 'history' as Tab, icon: <Clock       size={14} />, label: 'History' },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                tab === t.id
                  ? 'border-white text-white'
                  : 'border-transparent text-white/40 hover:text-white/70'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Check tab ─────────────────────────────────────────────────────── */}
      {tab === 'check' && (
        <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">Safe ba 'to? Check muna.</h1>
            <p className="text-sm text-ink-3 mt-1">
              Paste a message, link, account number, seller profile, or upload a screenshot.
            </p>
          </div>

          <AccountLookup />

          {error && (
            <div className="bg-brand-red-light border border-brand-red/20 text-brand-red-dark text-sm rounded-2xl px-4 py-3 flex items-start gap-2">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Category pills — horizontal scroll */}
          <div>
            <p className="sec-label">What are you checking?</p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(prev => prev === c.id ? null : c.id)}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl border transition-all min-w-[68px] ${
                    selectedCategory === c.id
                      ? 'border-ink bg-ink text-white'
                      : 'border-line bg-paper hover:border-ink-3 hover:bg-paper-2'
                  }`}
                >
                  <span className="text-lg">{c.icon}</span>
                  <span className={`text-[10px] leading-tight font-medium text-center ${
                    selectedCategory === c.id ? 'text-white' : 'text-ink-2'
                  }`}>{c.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-ink-3 mt-1.5">Auto-detected — tap to set manually.</p>
          </div>

          {/* Text input */}
          <div>
            <p className="sec-label">Paste message, link, or account number</p>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Paste a chat conversation, seller message, investment offer, suspicious SMS, website URL, or account number…"
              rows={6}
              className="w-full border border-line rounded-2xl px-4 py-3.5 text-base text-ink bg-paper focus:outline-none focus:border-ink placeholder-ink-3 transition-colors resize-none leading-relaxed"
            />
            <div className="mt-2 flex items-start gap-2 bg-paper-2 border border-line rounded-xl px-3 py-2.5">
              <Lock size={12} className="text-ink-3 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-ink-3 leading-snug">
                <strong className="text-ink-2">Do not paste OTPs, wallet PINs, bank passwords, or full card numbers.</strong>
              </p>
            </div>
          </div>

          {/* File upload */}
          <div>
            <p className="sec-label">Screenshots (optional, up to 4)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              multiple
              className="hidden"
              onChange={handleFilesSelected}
            />
            {uploadedFiles.length < 4 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 border-2 border-dashed border-line rounded-2xl py-5 text-ink-3 hover:border-ink-3 hover:bg-paper transition-all"
              >
                <ImagePlus size={18} />
                <span className="text-sm font-medium">
                  {uploadedFiles.length === 0 ? 'Upload screenshots' : `Add more (${uploadedFiles.length}/4)`}
                </span>
              </button>
            )}
            {uploadedFiles.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                {uploadedFiles.map((file, i) => (
                  <div key={i} className="relative rounded-2xl overflow-hidden border border-line bg-paper group animate-pop-in">
                    {file.type.startsWith('image/') ? (
                      <img src={uploadedPreviews[i]} alt={file.name} className="w-full h-32 object-cover" />
                    ) : (
                      <div className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-paper-2">
                        <Loader2 size={24} className="text-ink-3" />
                        <span className="text-xs text-ink-3 px-2 text-center truncate w-full">{file.name}</span>
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute top-2 right-2 w-6 h-6 bg-ink/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-2 flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-brand-green" />
              <p className="text-xs text-ink-3">Screenshots are analyzed for risk signals only — not stored permanently.</p>
            </div>
          </div>

          {/* Try an example */}
          <div>
            <p className="sec-label">Try an example</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map(ex => (
                <button
                  key={ex.key}
                  onClick={() => setInput(ex.text)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-line bg-paper text-sm text-ink-2 hover:bg-ink hover:text-white hover:border-ink transition-all"
                >
                  <span>{ex.emoji}</span> {ex.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sticky analyze button */}
          <div className="sm:static fixed bottom-[72px] left-0 right-0 sm:p-0 p-4 bg-paper-2/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none border-t border-line sm:border-0 z-40">
            <button
              onClick={handleAnalyze}
              disabled={!input.trim() && uploadedFiles.length === 0}
              className="w-full bg-ink text-white text-base font-bold rounded-2xl py-4 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Analyze Risk <ArrowRight size={18} />
            </button>
          </div>
          <div className="h-36 sm:hidden" />
        </div>
      )}

      {/* ── History tab ───────────────────────────────────────────────────── */}
      {tab === 'history' && (
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-ink tracking-tight">Your checks</h1>
            <p className="text-sm text-ink-3 mt-1">Recent analyses you've done.</p>
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="text-ink-3 animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-paper border border-line flex items-center justify-center mb-4">
                <Clock size={24} className="text-ink-3" />
              </div>
              <p className="text-base font-semibold text-ink mb-1">No checks yet</p>
              <p className="text-sm text-ink-3 mb-6">Your analysis history will appear here.</p>
              <button
                onClick={() => setTab('check')}
                className="px-5 py-2.5 bg-ink text-white rounded-2xl text-sm font-semibold hover:opacity-90 transition-all"
              >
                Start a check
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(check => (
                <Link
                  key={check.id}
                  href={`/result/${check.id}`}
                  className="flex items-center gap-3 bg-paper border border-line rounded-2xl px-4 py-3.5 hover:bg-paper-2 transition-all group"
                >
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${COLOR_BADGE[check.color] ?? 'bg-paper-2 text-ink-2'}`}>
                    {COLOR_LABEL[check.color] ?? check.color}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{check.input_text.slice(0, 60)}…</p>
                    <p className="text-xs text-ink-3 mt-0.5">
                      {new Date(check.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-ink-3 flex-shrink-0 group-hover:text-ink transition-colors" />
                </Link>
              ))}
            </div>
          )}
          <div className="pb-8" />
        </div>
      )}
    </div>
  )
}
