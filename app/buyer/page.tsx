'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, X, Loader2, ImagePlus, Upload, RotateCcw } from 'lucide-react'
import AccountLookup from '@/components/AccountLookup'
import { detectCategory, detectSignals, computeRisk } from '@/lib/decisionEngine'
import { createClient } from '@/lib/supabase/client'
import type { CategoryId, DecisionResult, ReportChannel } from '@/types'
import ResultClient from '@/components/ResultClient'

const EXAMPLES = [
  { key: 'fb',       label: 'FB seller',      text: 'Seller: Hi po! Available pa po yung bag. GCash nalang po tayo para mas mabilis. Account ko: 09171234567 - J. Santos. Rush po kasi maraming nagtatanong. Pag di ka nagbayad ngayon, ibebenta ko na sa iba.' },
  { key: 'invest',   label: 'OFW investment', text: 'Kumita na ng 30% monthly ang aming mga investors! Guaranteed po ang return. Mag-invite ka pa ng friends, may komisyon ka pa. Mag-invest ka na ngayon, last slots na lang. Withdrawal fee lang ng ₱2,000 para ma-release ang profit mo.' },
  { key: 'land',     label: 'Land deal',      text: "Sir/Ma'am, yung lote sa Cavite, 300sqm, ₱2M lang. Mag-deposit na po kayo ng ₱100K para ma-hold. Title at docs ipapakita ko pagkatapos ng payment. Bayaran ninyo sa personal account: BPI - Ramon Dela Torre 1234567890." },
  { key: 'agency',   label: 'Job agency',     text: 'Congratulations! Qualified ka sa deployment sa Dubai. Processing fee lang: ₱15,000 via GCash bago maibigay ang kontrata. Urgent — kailangan bukas na para ma-slot ka.' },
  { key: 'shopee',   label: 'Shopee order',   text: 'Order #SHP-2024-99871 confirmed. Item: Korean Skincare Set ₱499. Seller: BeautyStore_PH (4.8★ 2.3k reviews). Official Shopee checkout. Estimated delivery: 3-5 days.' },
  { key: 'donation', label: 'Donation',       text: 'Please help po! Sunog sa Pampanga, maraming biktima. Donate na po sa: GCash 09221234567 - Maria Santos. Urgent po, walang pagkain ang mga bata.' },
]

const CATEGORIES: { id: CategoryId; icon: string; label: string }[] = [
  { id: 'online_purchase', icon: '🛍',  label: 'Online Purchase' },
  { id: 'investment',      icon: '💰',  label: 'Investment / OFW' },
  { id: 'donation',        icon: '❤️',  label: 'Donation' },
  { id: 'vendor',          icon: '🏢',  label: 'Vendor / Business' },
  { id: 'property',        icon: '🏠',  label: 'Property / Land' },
  { id: 'job_agency',      icon: '✈️',  label: 'Job / Agency' },
  { id: 'buyer_check',     icon: '🔄',  label: 'Checking a Buyer' },
  { id: 'website_check',   icon: '🌐',  label: 'Website / URL' },
  { id: 'sms_text',        icon: '📱',  label: 'SMS / Text Scam' },
  { id: 'profile_check',   icon: '👤',  label: 'Social Media Profile' },
  { id: 'loan_scam',       icon: '💸',  label: 'Loan / Lending' },
  { id: 'romance_scam',    icon: '💔',  label: 'Romance Scam' },
]

const SCAN_STEPS = ['Reading content…', 'Searching the web…', 'Scanning for red flags…', 'Computing risk score…', 'Generating report…']

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

export default function BuyerPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep]               = useState<Step>('input')
  const [input, setInput]             = useState('')
  const [uploadedFiles, setUploadedFiles]     = useState<File[]>([])
  const [uploadedPreviews, setUploadedPreviews] = useState<string[]>([])
  const [scanStep, setScanStep]       = useState(0)
  const [result, setResult]           = useState<DecisionResult | null>(null)
  const [scoreSteps, setScoreSteps]   = useState<Array<{ label: string; delta: number }>>([])
  const [savedCheckId, setSavedCheckId] = useState<string | undefined>()
  const [error, setError]             = useState('')

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
    setUploadedFiles([])
    setUploadedPreviews([])
    setScanStep(0)
    setResult(null)
    setScoreSteps([])
    setSavedCheckId(undefined)
    setError('')
  }

  async function handleAnalyze() {
    if (!input.trim() && uploadedFiles.length === 0) return

    setStep('analyzing')
    setError('')

    // Animate scan steps
    for (let i = 0; i < SCAN_STEPS.length; i++) {
      setScanStep(i)
      await new Promise(r => setTimeout(r, 700))
    }

    let finalResult: DecisionResult | null = null
    let analysisText = input

    try {
      const imageFiles = uploadedFiles.filter(f => f.type.startsWith('image/'))
      const images = imageFiles.length > 0 ? await Promise.all(imageFiles.map(fileToBase64)) : []
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, images }),
      })
      const data = await res.json()
      if (res.ok) {
        finalResult = data.result
        analysisText = data.extractedText || input
        if (data.scoreSteps) setScoreSteps(data.scoreSteps)
      }
    } catch {
      // fall through to local engine
    }

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

    setResult(finalResult)
    setStep('result')

    // Save to DB in background
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: check } = await supabase.from('checks').insert({
          user_id: user.id,
          category_id: finalResult.categoryId,
          input_text: analysisText,
          score: finalResult.score,
          color: finalResult.color,
          result: finalResult,
        }).select('id').single()
        if (check) setSavedCheckId(check.id)
      }
    } catch {
      // silent — result is already shown
    }
  }

  // ── Result screen ──────────────────────────────────────────────────────────
  if (step === 'result' && result) {
    return (
      <div className="min-h-screen bg-paper-2 animate-fade-in">
        <header className="border-b border-line bg-paper sticky top-0 z-50 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={reset} className="text-ink-3 hover:text-ink transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-semibold text-ink">LegitCheck</span>
              <span className="text-lg font-light text-ink-2">PH</span>
            </div>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink transition-colors"
          >
            <RotateCcw size={14} />
            New check
          </button>
        </header>
        <ResultClient result={result} checkId={savedCheckId} inputText={input} scoreSteps={scoreSteps} />
      </div>
    )
  }

  // ── Analyzing screen ───────────────────────────────────────────────────────
  if (step === 'analyzing') {
    return (
      <div className="min-h-screen bg-paper-2 flex flex-col">
        <header className="border-b border-line bg-paper px-4 py-4">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-ink">LegitCheck</span>
            <span className="text-lg font-light text-ink-2">PH</span>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-8 animate-fade-in">
          <div className="w-16 h-16 rounded-full border-2 border-line flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-ink animate-throb" />
          </div>
          <div className="text-xl font-semibold text-ink">Analyzing…</div>
          <div className="w-full max-w-xs space-y-2">
            {SCAN_STEPS.map((s, i) => (
              <div key={s} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all duration-300 ${
                i < scanStep  ? 'bg-brand-green-light border-brand-green/20 text-brand-green-dark' :
                i === scanStep ? 'bg-paper border-ink text-ink font-semibold shadow-sm' :
                'bg-paper-2 border-line text-ink-3'
              }`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${
                  i < scanStep ? 'bg-brand-green' : i === scanStep ? 'bg-ink animate-throb' : 'bg-line'
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
      <header className="border-b border-line bg-paper px-4 py-4 flex items-center gap-3">
        <Link href="/dashboard" className="text-ink-3 hover:text-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-baseline gap-1 flex-1">
          <span className="text-lg font-semibold text-ink">LegitCheck</span>
          <span className="text-lg font-light text-ink-2">PH</span>
        </div>
        <Link
          href="/sos"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-red-light border border-brand-red/20 text-brand-red-dark text-sm font-medium hover:bg-brand-red hover:text-white transition-all"
        >
          🚨 Scam SOS
        </Link>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Check something</h1>
          <p className="text-base text-ink-3 mt-1 leading-relaxed">
            Paste a message, share a link, upload screenshots — or all of the above.
          </p>
        </div>

        {/* Quick number lookup */}
        <AccountLookup />

        {error && (
          <div className="bg-brand-red-light border border-brand-red/20 text-brand-red-dark text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Category selector */}
        <div>
          <label className="sec-label">What are you checking?</label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => {}}
                className="flex flex-col items-center gap-1 px-2 py-3 rounded-xl border border-line bg-paper text-center hover:border-ink-3 hover:bg-paper-2 transition-all"
              >
                <span className="text-xl">{c.icon}</span>
                <span className="text-xs text-ink-2 leading-tight">{c.label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-ink-3 mt-2">Category auto-detected — or tap to set manually.</p>
        </div>

        {/* Text input */}
        <div>
          <label className="sec-label">Paste text, link, or account number</label>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Paste a chat conversation, seller message, investment offer, suspicious SMS, website URL, or account number…"
            rows={6}
            className="w-full border border-line rounded-2xl px-4 py-3.5 text-base text-ink bg-paper focus:outline-none focus:border-ink placeholder-ink-3 transition-colors resize-none leading-relaxed"
          />
        </div>

        {/* File upload */}
        <div>
          <label className="sec-label">Upload screenshots, photos, or documents (up to 4)</label>
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
              className="w-full flex items-center justify-center gap-3 border-2 border-dashed border-line rounded-2xl py-5 text-ink-3 hover:border-ink-3 hover:text-ink-2 hover:bg-paper transition-all"
            >
              <ImagePlus size={20} />
              <span className="text-base font-medium">
                {uploadedFiles.length === 0 ? 'Upload screenshots or photos' : `Add more (${uploadedFiles.length}/4)`}
              </span>
            </button>
          )}
          {uploadedFiles.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              {uploadedFiles.map((file, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden border border-line bg-paper group animate-pop-in">
                  {file.type.startsWith('image/') ? (
                    <img src={uploadedPreviews[i]} alt={file.name} className="w-full h-32 object-cover" />
                  ) : (
                    <div className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-paper-2">
                      <Upload size={24} className="text-ink-3" />
                      <span className="text-xs text-ink-3 px-2 text-center truncate w-full">{file.name}</span>
                    </div>
                  )}
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-2 right-2 w-6 h-6 bg-ink/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ink/70 px-2 py-1.5">
                    <span className="text-xs text-white truncate block">{file.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit — sticky on mobile */}
        <div className="sm:static fixed bottom-0 left-0 right-0 sm:p-0 p-4 bg-paper-2/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none border-t border-line sm:border-0 z-40 pb-safe">
          <button
            onClick={handleAnalyze}
            disabled={!input.trim() && uploadedFiles.length === 0}
            className="w-full bg-ink text-white text-base font-semibold rounded-2xl py-4 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Analyze now
            <ArrowRight size={18} />
          </button>
        </div>
        {/* Spacer so content doesn't hide behind sticky button on mobile */}
        <div className="h-20 sm:hidden" />

        {/* Examples */}
        <div>
          <label className="sec-label">Try an example</label>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map(ex => (
              <button
                key={ex.key}
                onClick={() => setInput(ex.text)}
                className="px-3 py-2 rounded-full border border-line bg-paper text-sm text-ink-2 hover:bg-ink hover:text-white hover:border-ink transition-all"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pb-8" />
      </div>
    </div>
  )
}
