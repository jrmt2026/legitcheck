'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Upload, X, Shield, AlertTriangle, CheckCircle,
  Loader2, ShieldAlert, HelpCircle,
} from 'lucide-react'

const PLATFORMS = [
  { id: 'gcash',     label: 'GCash',     emoji: '💚' },
  { id: 'maya',      label: 'Maya',      emoji: '💛' },
  { id: 'bdo',       label: 'BDO',       emoji: '🏦' },
  { id: 'bpi',       label: 'BPI',       emoji: '🏦' },
  { id: 'unionbank', label: 'UnionBank', emoji: '🏦' },
  { id: 'other',     label: 'Other',     emoji: '💳' },
]

type Verdict = 'authentic' | 'suspicious' | 'likely_fake' | 'inconclusive'

const VERDICT_CONFIG: Record<Verdict, {
  label: string; labelTl: string; color: string; bg: string; border: string; icon: any; emoji: string
}> = {
  authentic:    { label: 'Looks Authentic',  labelTl: 'Mukhang Tunay',   color: 'text-brand-green-dark',  bg: 'bg-brand-green-light',  border: 'border-brand-green/25',  icon: CheckCircle,   emoji: '✅' },
  suspicious:   { label: 'Suspicious',       labelTl: 'Kahina-hinala',   color: 'text-brand-yellow-dark', bg: 'bg-brand-yellow-light', border: 'border-brand-yellow/25', icon: AlertTriangle, emoji: '⚠️' },
  likely_fake:  { label: 'Likely Fake',      labelTl: 'Malamang Peke',   color: 'text-brand-red-dark',    bg: 'bg-brand-red-light',    border: 'border-brand-red/25',    icon: ShieldAlert,   emoji: '🚨' },
  inconclusive: { label: 'Inconclusive',     labelTl: 'Hindi Matukoy',   color: 'text-ink-2',             bg: 'bg-paper-2',            border: 'border-line',            icon: HelpCircle,    emoji: '❓' },
}

export default function VerifyPaymentPage() {
  const fileInputRef               = useRef<HTMLInputElement>(null)
  const [platform, setPlatform]    = useState('gcash')
  const [image, setImage]          = useState<File | null>(null)
  const [preview, setPreview]      = useState<string | null>(null)
  const [loading, setLoading]      = useState(false)
  const [result, setResult]        = useState<any | null>(null)
  const [lang, setLang]            = useState<'en' | 'tl'>('en')

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
    setResult(null)
    e.target.value = ''
  }

  function removeImage() {
    if (preview) URL.revokeObjectURL(preview)
    setImage(null)
    setPreview(null)
    setResult(null)
  }

  async function analyze() {
    if (!image) return
    setLoading(true)
    try {
      const base64 = await new Promise<string>((res, rej) => {
        const reader = new FileReader()
        reader.onload = () => res((reader.result as string).split(',')[1])
        reader.onerror = rej
        reader.readAsDataURL(image)
      })
      const resp = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: { data: base64, mimeType: image.type }, platform }),
      })
      setResult(await resp.json())
    } catch {
      setResult({ verdict: 'inconclusive', confidence: 0, flags: [], summary: 'Analysis failed. Please try again.', summaryTl: 'Hindi na-analyze. Subukan ulit.' })
    }
    setLoading(false)
  }

  const verdict = result?.verdict as Verdict | undefined
  const config  = verdict ? VERDICT_CONFIG[verdict] : null
  const VIcon   = config?.icon

  return (
    <div className="min-h-screen bg-paper-2">
      <header className="border-b border-line bg-paper px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <Link href="/" className="text-ink-3 hover:text-ink transition-colors p-1 -ml-1">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-baseline gap-1">
          <span className="text-base font-medium text-ink">LegitCheck</span>
          <span className="text-base font-light text-ink-2">PH</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-yellow-light border border-brand-yellow/20 rounded-full text-brand-yellow-dark text-xs font-semibold mb-3">
            <Shield size={11} /> Fake Payment Detector
          </div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Verify a payment screenshot</h1>
          <p className="text-sm text-ink-3 mt-1 leading-relaxed">
            Upload a GCash, Maya, or bank receipt. Our AI checks if the amount was edited or fabricated.
          </p>
        </div>

        {/* Platform selector */}
        <div>
          <p className="sec-label">What platform is the receipt from?</p>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {PLATFORMS.map(p => (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                  platform === p.id
                    ? 'bg-ink text-white border-ink'
                    : 'bg-paper border-line text-ink-2 hover:border-ink-3'
                }`}
              >
                {p.emoji} {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Upload area */}
        <div>
          <p className="sec-label">Upload the receipt screenshot</p>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          {!image ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-3 border-2 border-dashed border-line rounded-2xl py-10 text-ink-3 hover:border-ink-3 hover:bg-paper transition-all cursor-pointer mt-1.5"
            >
              <Upload size={24} />
              <span className="text-sm font-medium">Tap to upload screenshot</span>
              <span className="text-xs text-ink-3">JPG, PNG, or WEBP · Max 10MB</span>
            </button>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-line group mt-1.5">
              <img src={preview!} alt="Receipt" className="w-full max-h-80 object-contain bg-paper-2" />
              <button
                onClick={removeImage}
                className="absolute top-3 right-3 w-8 h-8 bg-ink/80 text-white rounded-full flex items-center justify-center hover:bg-ink transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Analyze button */}
        <button
          onClick={analyze}
          disabled={!image || loading}
          className="w-full flex items-center justify-center gap-2 py-4 bg-ink text-white rounded-2xl text-base font-bold disabled:opacity-40 active:scale-[0.98] transition-all shadow-lg shadow-ink/20"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
          {loading ? 'Analyzing receipt…' : 'Check if receipt is real'}
        </button>

        {/* Result */}
        {result && config && VIcon && (
          <div className={`rounded-2xl border ${config.border} ${config.bg} p-5 space-y-4 animate-slide-up`}>
            <div className="flex items-center gap-3">
              <VIcon size={22} className={config.color} />
              <div>
                <p className={`text-lg font-bold ${config.color}`}>{config.emoji} {lang === 'tl' ? config.labelTl : config.label}</p>
                <p className="text-xs text-ink-3 mt-0.5">Confidence: {result.confidence}%</p>
              </div>
              <div className="ml-auto flex rounded-full p-0.5 border border-line bg-paper">
                {(['en', 'tl'] as const).map(l => (
                  <button key={l} onClick={() => setLang(l)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${lang === l ? 'bg-ink text-white' : 'text-ink-3'}`}>
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-sm text-ink-2 leading-relaxed">
              {lang === 'tl' ? (result.summaryTl || result.summary) : result.summary}
            </p>

            {result.flags?.length > 0 && (
              <div>
                <p className="sec-label mb-2">Forensic findings</p>
                <ul className="space-y-2">
                  {result.flags.map((flag: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink-2">
                      <span className="text-ink-3 flex-shrink-0 mt-0.5">•</span>
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="border-t border-line pt-3">
              <p className="text-xs text-ink-3 leading-relaxed">
                Forensic guide only. Not a final legal or bank determination.
                Always verify payment in your own bank app or GCash before releasing goods.
              </p>
            </div>
          </div>
        )}

        {/* Tips panel (before analysis) */}
        {!result && (
          <div className="bg-paper border border-line rounded-2xl p-4 space-y-3">
            <p className="text-sm font-semibold text-ink">Common signs of a fake receipt</p>
            {[
              'Blurry or pixelated numbers — the amount was likely edited in a photo editor',
              'Different font style or size on the amount vs. surrounding text',
              'Reference number missing or in the wrong format for the platform',
              'Balance doesn\'t subtract correctly (e.g., ₱10,000 − ₱5,000 ≠ ₱5,000 shown)',
              'Logo looks slightly stretched, blurry, or off-color',
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle size={13} className="text-brand-yellow-dark flex-shrink-0 mt-0.5" />
                <p className="text-xs text-ink-2 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        )}

        {/* New check / try again */}
        {result && (
          <button
            onClick={() => { removeImage(); setResult(null) }}
            className="w-full py-3.5 border border-line rounded-2xl text-sm text-ink-2 font-medium hover:bg-ink hover:text-white hover:border-ink transition-all active:scale-[0.98]"
          >
            Check another receipt
          </button>
        )}

        <div className="pb-8" />
      </div>
    </div>
  )
}
