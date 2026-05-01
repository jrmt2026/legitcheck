'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, X, Loader2, ImagePlus, RotateCcw,
  ShieldCheck, Lock, AlertTriangle, Clock, LogOut, User,
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
  { key: 'fb',     emoji: '🛍️', label: 'Online Seller', text: 'Seller: Hi po! Available pa po yung bag. E-wallet nalang po tayo para mas mabilis. Account ko: 09171234567 - J. Santos. Rush po kasi maraming nagtatanong. Pag di ka nagbayad ngayon, ibebenta ko na sa iba.' },
  { key: 'gov',    emoji: '📱', label: "Gov't SMS",     text: 'Traffic Authority: Mahal na motorista, mayroon kang unpaid traffic violation na nagkakahalaga ng ₱5,000. Ang iyong lisensya ay sususpindihin sa loob ng 48 oras. I-click ang link para bayaran ngayon: http://gov-fines-ph.com/pay' },
  { key: 'invest', emoji: '💰', label: 'Investment',   text: 'Kumita na ng 30% monthly ang aming mga investors! Guaranteed po ang return. Mag-invite ka pa ng friends, may komisyon ka pa. Mag-invest ka na ngayon, last slots na lang. Withdrawal fee lang ng ₱2,000 para ma-release ang profit mo.' },
  { key: 'land',   emoji: '🏠', label: 'Land Deal',    text: "Sir/Ma'am, yung lote sa Cavite, 300sqm, ₱2M lang. Mag-deposit na po kayo ng ₱100K para ma-hold. Title at docs ipapakita ko pagkatapos ng payment." },
  { key: 'agency', emoji: '✈️', label: 'Job Agency',   text: 'Congratulations! Qualified ka sa deployment sa Dubai. Processing fee lang: ₱15,000 via GCash bago maibigay ang kontrata. Urgent — kailangan bukas na para ma-slot ka.' },
  { key: 'online', emoji: '🛒', label: 'Online Order',  text: 'Order #ONL-2024-99871 confirmed. Item: Korean Skincare Set ₱499. Seller: BeautyStore_PH (4.8★ 2.3k reviews). Official in-platform checkout. Estimated delivery: 3-5 days.' },
]

const SCAN_STEPS = [
  'Analyzing scam signals…',
  'Checking links, claims, and payment details…',
  'Looking for urgency and pressure tactics…',
  'Comparing with known Filipino scam patterns…',
  'Cross-referencing available report history…',
  'Generating your safety report…',
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

type Step = 'input' | 'analyzing' | 'result'
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
const COLOR_BORDER: Record<string, string> = {
  green:  'border-l-brand-green',
  yellow: 'border-l-brand-yellow',
  orange: 'border-l-[#F97316]',
  red:    'border-l-brand-red',
}

export default function BuyerPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [tab, setTab]                             = useState<Tab>('check')
  const [userInitials, setUserInitials]           = useState('')
  const [step, setStep]                           = useState<Step>('input')
  const [input, setInput]                         = useState('')
  const [selectedCategory, setSelectedCategory]   = useState<CategoryId | null>(null)
  const [uploadedFiles, setUploadedFiles]         = useState<File[]>([])
  const [uploadedPreviews, setUploadedPreviews]   = useState<string[]>([])
  const [scanStep, setScanStep]                   = useState(0)
  const [scanDone, setScanDone]                   = useState(false)
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
    const shared  = [params.get('text'), params.get('url'), params.get('title')].filter(Boolean).join('\n')
    const recheck = params.get('recheck')
    if (shared)  setInput(shared)
    if (recheck) setInput(decodeURIComponent(recheck))
    if (params.get('tab') === 'history') setTab('history')

    createClient().auth.getUser().then(({ data: { user } }) => {
      setIsAuth(!!user)
      if (user) {
        const name = user.user_metadata?.full_name || user.email || ''
        setUserInitials(name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?')
      }
    })
  }, [])

  useEffect(() => {
    if (tab === 'history') loadHistory()
  }, [tab])

  async function handleSignOut() {
    await createClient().auth.signOut()
    window.location.href = '/'
  }

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
    setScanDone(false)
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
      if (res.status === 429 && data.limitReached) {
        // Limit reached — show a neutral unverified result so we never show a
        // false "safe" from the keyword engine (which doesn't analyze images or
        // use AI). The user must upgrade for an accurate verdict.
        resultTier  = data.tier as 'guest' | 'basic'
        finalResult = {
          score: 50,
          color: 'yellow',
          isHardRed: false,
          headline:    { en: 'Not Analyzed — Free Limit Reached', tl: 'Hindi Na-analyze — Naubos na ang Libreng Check' },
          subheadline: { en: 'Your free checks for this period are used up. Upgrade for a full AI-powered result on this item.', tl: 'Naubos na ang iyong libreng check ngayong buwan. Mag-upgrade para sa kumpletong resulta.' },
          action:      { en: 'Upgrade for accurate result.', tl: 'Mag-upgrade para sa tamang resulta.' },
          reasons: [{
            id: 'limit_reached',
            en: 'OBSERVATION: Free analysis limit reached — REASON: The result above is not an assessment of this item. We have not analyzed it yet. A premium check runs full Claude AI analysis, image reading, web search, and scam database lookup to give you an accurate verdict.',
            tl: 'OBSERVATION: Naubos na ang libreng check — REASON: Hindi pa ito na-analyze. Ang premium check ay gumagamit ng buong AI analysis para sa tamang resulta.',
            riskPoints: 0,
            severity: 'medium' as const,
          }],
          aiInsights: [],
          notification: { sms: { en: '', tl: '' }, chat: { en: '', tl: '' }, push: { en: '', tl: '' } },
          reportChannels: [],
          evidenceItems: [],
          recommendedPlan: 'single' as const,
          categoryId: detectCategory(analysisText),
          confidenceScore: 0,
        }
      } else if (res.ok) {
        finalResult    = data.result
        analysisText   = data.extractedText || input
        if (data.scoreSteps) setScoreSteps(data.scoreSteps)
        if (data.tier) resultTier = data.tier
        if (data.aiInsightsTl && finalResult) finalResult.aiInsightsTl = data.aiInsightsTl
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
    setScanStep(SCAN_STEPS.length) // mark all steps completed
    setScanDone(true)              // show "Check complete" briefly
    await new Promise(r => setTimeout(r, 700))
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

  // ── Result screen ──────────────────────────────────────────────────────────
  if (step === 'result' && result) {
    return (
      <div className="min-h-screen bg-paper-2 animate-fade-in">
        <header className="bg-ink px-4 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <button onClick={reset} className="text-white/60 hover:text-white transition-colors" aria-label="Back">
              <ArrowLeft size={20} />
            </button>
            <Link href="/buyer" className="text-lg font-bold text-white tracking-tight hover:opacity-80 transition-opacity">
              LegitCheck <span className="font-light opacity-50">PH</span>
            </Link>
          </div>
          <button onClick={reset} className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors">
            <RotateCcw size={14} /> New check
          </button>
        </header>
        <ResultClient result={result} checkId={savedCheckId} inputText={input} scoreSteps={scoreSteps} tier={tier} isLoggedIn={isAuth} />
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
          {scanDone ? (
            <div className="flex flex-col items-center gap-4 animate-scale-in text-center">
              <div className="w-20 h-20 rounded-full bg-brand-green/20 border-2 border-brand-green/30 flex items-center justify-center">
                <ShieldCheck size={32} className="text-brand-green" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-1">Check complete</p>
                <p className="text-sm text-white/50">Your result is ready.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="relative flex items-center justify-center">
                {/* Outer pulse rings */}
                <div className="absolute w-40 h-40 rounded-full border border-brand-green/15 animate-pulse-ring" />
                <div className="absolute w-40 h-40 rounded-full border border-brand-green/10 animate-pulse-ring" style={{ animationDelay: '0.9s' }} />
                {/* Rotating scan sweep */}
                <div
                  className="absolute w-28 h-28 rounded-full animate-spin-slow"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0%, rgba(26,153,104,0.0) 60%, rgba(26,153,104,0.25) 85%, rgba(26,153,104,0.5) 100%)',
                    animationDuration: '3s',
                  }}
                />
                {/* Inner shield */}
                <div className="relative z-10 w-24 h-24 rounded-full bg-brand-green/10 border-2 border-brand-green/40 flex items-center justify-center"
                  style={{ boxShadow: '0 0 32px rgba(26,153,104,0.2), 0 0 8px rgba(26,153,104,0.1)' }}>
                  <ShieldCheck size={34} className="text-brand-green animate-float" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white mb-2 tracking-tight">Scanning for scam signals…</p>
                <p className="text-sm text-white/40 max-w-xs leading-relaxed">Analyzing patterns, links, and report history. Usually under 10 seconds.</p>
              </div>
            </>
          )}
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
          <Link href="/buyer" className="text-lg font-bold text-white tracking-tight flex-1 hover:opacity-80 transition-opacity">
            LegitCheck <span className="font-light opacity-50">PH</span>
          </Link>
          {isAuth ? (
            <div className="flex items-center gap-2">
              <Link href="/sos" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-red/20 text-red-300 text-sm font-medium hover:bg-brand-red/30 transition-all">
                🚨 SOS
              </Link>
              <Link href="/profile" className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0">
                <span className="text-[11px] font-bold text-white">{userInitials || <User size={13} />}</span>
              </Link>
              <button onClick={handleSignOut} className="text-white/30 hover:text-white/70 transition-colors" aria-label="Sign out">
                <LogOut size={16} />
              </button>
            </div>
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
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">Safe ba 'to? Check muna.</h1>
            <p className="text-sm text-ink-3 mt-1">
              Paste a suspicious message, link, account number, seller profile, or upload a screenshot.
            </p>
          </div>

          {error && (
            <div className="bg-brand-red-light border border-brand-red/20 text-brand-red-dark text-sm rounded-2xl px-4 py-3 flex items-start gap-2">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Main input card — white with shadow so it lifts off the bg */}
          <div className="bg-white rounded-3xl border border-ink/10 shadow-sm overflow-hidden">

            {/* Textarea */}
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="I-paste dito ang message, URL, number, profile link, o kahit anong kahina-hinala.&#10;&#10;Examples: suspicious SMS · seller profile · investment offer · website link · job offer"
              rows={7}
              className="w-full px-5 pt-5 pb-3 text-base text-ink bg-transparent focus:outline-none placeholder-ink-3 resize-none leading-relaxed"
            />

            {/* Divider */}
            <div className="border-t border-ink/8 mx-4" />

            {/* Upload row */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              multiple
              className="hidden"
              onChange={handleFilesSelected}
            />
            <div className="px-4 py-3 flex items-center justify-between">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-sm font-medium text-ink-3 hover:text-ink transition-colors"
              >
                <ImagePlus size={16} className="text-brand-green" />
                {uploadedFiles.length === 0
                  ? 'Add screenshots'
                  : `${uploadedFiles.length} screenshot${uploadedFiles.length > 1 ? 's' : ''} added`}
              </button>
              <div className="flex items-center gap-1.5">
                <Lock size={11} className="text-ink-3" />
                <span className="text-xs text-ink-3">No OTPs or PINs</span>
              </div>
            </div>

            {/* Uploaded previews */}
            {uploadedFiles.length > 0 && (
              <div className="grid grid-cols-4 gap-2 px-4 pb-3">
                {uploadedFiles.map((file, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden border border-line group animate-pop-in aspect-square">
                    {file.type.startsWith('image/') ? (
                      <img src={uploadedPreviews[i]} alt={file.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-paper-2">
                        <Loader2 size={16} className="text-ink-3" />
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-ink/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={9} />
                    </button>
                  </div>
                ))}
                {uploadedFiles.length < 4 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-line flex items-center justify-center hover:border-ink-3 transition-colors"
                  >
                    <ImagePlus size={16} className="text-ink-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Category selector */}
          <div>
            <p className="text-xs text-ink-3 font-medium mb-2 flex items-center gap-1.5">
              <span className="bg-line text-ink-3 px-1.5 py-0.5 rounded text-[10px] font-bold">OPTIONAL</span>
              What type is this? (auto-detected if blank)
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide"
              style={{ maskImage: 'linear-gradient(to right, transparent 0px, black 16px, black calc(100% - 40px), transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0px, black 16px, black calc(100% - 40px), transparent 100%)' }}>
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(prev => prev === c.id ? null : c.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full border transition-all text-xs font-medium whitespace-nowrap ${
                    selectedCategory === c.id
                      ? 'border-ink bg-ink text-white'
                      : 'border-line bg-white shadow-sm hover:border-ink-3 text-ink-2'
                  }`}
                >
                  <span>{c.icon}</span> {c.label}
                </button>
              ))}
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
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-line bg-white shadow-sm text-sm text-ink-2 hover:bg-ink hover:text-white hover:border-ink transition-all"
                >
                  <span>{ex.emoji}</span> {ex.label}
                </button>
              ))}
            </div>
          </div>

          {/* Analyze button */}
          <div className="sm:static fixed bottom-[calc(72px+env(safe-area-inset-bottom,0px))] left-0 right-0 sm:p-0 p-4 bg-paper-2/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none border-t border-line sm:border-0 z-40">
            <button
              onClick={handleAnalyze}
              disabled={!input.trim() && uploadedFiles.length === 0}
              className="w-full bg-brand-green text-white text-base font-bold rounded-2xl py-4 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-brand-green/20"
            >
              <ShieldCheck size={18} /> Analyze Risk <ArrowRight size={18} />
            </button>
          </div>
          <div className="h-44 sm:hidden" />
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
                <Link key={check.id} href={`/result/${check.id}`}
                  className={`block bg-paper border border-line border-l-4 rounded-2xl overflow-hidden hover:shadow-sm transition-shadow ${COLOR_BORDER[check.color] ?? 'border-l-line'}`}>
                  <div className="flex items-start gap-3 px-4 pt-3.5 pb-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex-shrink-0 mt-0.5 ${COLOR_BADGE[check.color] ?? 'bg-paper-2 text-ink-2'}`}>
                      {COLOR_LABEL[check.color] ?? check.color}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink leading-snug line-clamp-2">{check.input_text.slice(0, 80)}{check.input_text.length > 80 ? '…' : ''}</p>
                      <p className="text-xs text-ink-3 mt-0.5">
                        {new Date(check.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <ArrowRight size={16} className="text-ink-3 flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="flex border-t border-line divide-x divide-line" onClick={e => e.preventDefault()}>
                    <Link
                      href={`/result/${check.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-ink-3 hover:bg-paper-2 hover:text-ink transition-all"
                    >
                      View Report
                    </Link>
                    <Link
                      href={`/buyer?recheck=${encodeURIComponent(check.input_text.slice(0, 500))}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-ink-3 hover:bg-paper-2 hover:text-ink transition-all"
                    >
                      <RotateCcw size={11} /> Recheck
                    </Link>
                  </div>
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
