'use client'

import { useState, useEffect, useRef } from 'react'
import { ShieldCheck, ArrowRight, Lock, CheckCircle, Zap, ImagePlus, X } from 'lucide-react'

const LIVE_FEED = [
  { emoji: '🛍️', label: 'Online Seller', result: 'SCAM',     color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20'          },
  { emoji: '📱', label: "Gov't SMS",      result: 'SCAM',     color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20'          },
  { emoji: '✅', label: 'Online Order',  result: 'LOW RISK', color: 'text-white/60',   bg: 'bg-white/5 border-white/15'               },
  { emoji: '💰', label: 'Investment',    result: 'SCAM',     color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20'          },
  { emoji: '✈️', label: 'Job Agency',    result: 'SCAM',     color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20'          },
  { emoji: '🌐', label: 'Website Link',  result: 'CAUTION',  color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20'    },
]

const SAMPLES = [
  { emoji: '🛍️', label: 'Online Seller', text: 'Seller: Hi po! Available pa po yung bag. E-wallet nalang po tayo para mas mabilis. Account ko: 09171234567 - J. Santos. Rush po kasi maraming nagtatanong. Pag di ka nagbayad ngayon, ibebenta ko na sa iba.' },
  { emoji: '📱', label: "Gov't SMS",      text: 'Traffic Authority: Mahal na motorista, mayroon kang unpaid traffic violation na nagkakahalaga ng ₱5,000. Ang iyong lisensya ay sususpindihin sa loob ng 48 oras. I-click ang link para bayaran ngayon: http://gov-fines-ph.com/pay' },
  { emoji: '💰', label: 'Investment',    text: 'Kumita na ng 30% monthly ang aming mga investors! Guaranteed po ang return. Mag-invite ka pa ng friends, may komisyon ka pa. Mag-invest ka na ngayon, last slots na lang. Withdrawal fee lang ng ₱2,000 para ma-release ang profit mo.' },
  { emoji: '✈️', label: 'Job Offer',     text: 'Congratulations! Qualified ka sa deployment sa Dubai. Processing fee lang: ₱15,000 bago maibigay ang kontrata. Urgent — kailangan bukas na para ma-slot ka.' },
]

export default function HeroSection() {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [text, setText]                         = useState('')
  const [count, setCount]                       = useState(2847)
  const [feedIdx, setFeedIdx]                   = useState(0)
  const [visible, setVisible]                   = useState(true)
  const [uploadedFiles, setUploadedFiles]       = useState<File[]>([])
  const [uploadedPreviews, setUploadedPreviews] = useState<string[]>([])

  useEffect(() => {
    const t = setInterval(() => {
      setCount(c => c + Math.floor(Math.random() * 3 + 1))
    }, 2800)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false)
      setTimeout(() => { setFeedIdx(i => (i + 1) % LIVE_FEED.length); setVisible(true) }, 350)
    }, 2600)
    return () => clearInterval(t)
  }, [])

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

  async function handleAnalyze() {
    if (!text.trim() && uploadedFiles.length === 0) return

    if (uploadedFiles.length > 0) {
      // Convert images to base64 and hand off via sessionStorage, then hard-navigate
      // (window.location instead of router.push prevents the client router from
      // re-evaluating the / server component which would flash the dashboard redirect)
      const images = await Promise.all(
        uploadedFiles.map(file => new Promise<{ data: string; mimeType: string; name: string }>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const r = reader.result as string
            resolve({ data: r.split(',')[1], mimeType: file.type || 'image/jpeg', name: file.name })
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        }))
      )
      sessionStorage.setItem('pending_hero_analysis', JSON.stringify({ text: text.trim(), images }))
      window.location.href = '/buyer'
    } else {
      window.location.href = `/buyer?recheck=${encodeURIComponent(text.trim())}`
    }
  }

  function loadSample(sample: typeof SAMPLES[0]) {
    setText(sample.text)
    textareaRef.current?.focus()
  }

  const live = LIVE_FEED[feedIdx]
  const canAnalyze = text.trim().length > 0 || uploadedFiles.length > 0

  return (
    <section className="relative overflow-hidden max-w-2xl mx-auto px-4 pt-12 pb-10 text-center">

      {/* Radial glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(26,153,104,0.12) 0%, transparent 70%)' }}
      />

      {/* Animated scanner shield */}
      <div className="relative flex items-center justify-center mb-6 h-28">
        <div className="absolute w-28 h-28 rounded-full border border-brand-green/40 animate-pulse-ring" />
        <div className="absolute w-28 h-28 rounded-full border border-brand-green/25 animate-pulse-ring" style={{ animationDelay: '0.7s' }} />
        <div className="absolute w-28 h-28 rounded-full border border-brand-green/12 animate-pulse-ring" style={{ animationDelay: '1.4s' }} />
        <div
          className="relative z-10 w-20 h-20 rounded-full bg-brand-green/10 border-2 border-brand-green/40 flex items-center justify-center"
          style={{ boxShadow: '0 0 48px rgba(26,153,104,0.25), 0 0 16px rgba(26,153,104,0.15)' }}
        >
          <ShieldCheck size={36} className="text-brand-green animate-float" />
        </div>
      </div>

      {/* Live ticker */}
      <div className="flex justify-center mb-4">
        <div className={`flex items-center gap-2.5 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-300 ${live.bg} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green" />
          </span>
          <span className="text-white/50">Just checked:</span>
          <span>{live.emoji}</span>
          <span className="text-white/70">{live.label}</span>
          <span className="w-px h-3 bg-white/20" />
          <span className={`font-bold text-xs tracking-wide ${live.color}`}>{live.result}</span>
        </div>
      </div>

      {/* Headline */}
      <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight leading-none mb-3">
        Legit ba 'to?
      </h1>
      <p className="text-base text-white/50 max-w-sm mx-auto leading-relaxed mb-2">
        Para sa mga bumibili, nagbebenta, at OFW. I-check ang kahina-hinalang message, account, link, o payment screenshot.
      </p>
      <p className="text-sm text-white/30 font-mono mb-6">
        <span className="text-brand-green font-bold text-lg tabular-nums">{count.toLocaleString()}</span>
        {' '}checks done today
      </p>

      {/* ── Inline check box ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl overflow-hidden text-left shadow-2xl shadow-black/40 mb-5">

        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAnalyze() }}
          placeholder="I-paste dito ang message, link, number, o kahit anong kahina-hinala…"
          rows={4}
          className="w-full px-5 pt-5 pb-3 text-base text-ink bg-transparent focus:outline-none placeholder-ink-3 resize-none leading-relaxed"
        />

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

        {/* Uploaded image thumbnails */}
        {uploadedFiles.length > 0 && (
          <div className="grid grid-cols-4 gap-2 px-4 pb-3">
            {uploadedFiles.map((file, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden border border-line group aspect-square">
                <img src={uploadedPreviews[i]} alt={file.name} className="w-full h-full object-cover" />
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

        {/* Sample pills */}
        <div className="px-4 pt-1 pb-2">
          <p className="text-[10px] font-semibold text-ink-3 uppercase tracking-widest mb-2">Try a sample</p>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLES.map(s => (
              <button
                key={s.label}
                onClick={() => loadSample(s)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-line bg-paper-2 text-xs text-ink-2 hover:bg-ink hover:text-white hover:border-ink transition-all active:scale-95"
              >
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Analyze button */}
        <div className="px-4 pb-4 pt-2">
          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze}
            className="w-full bg-brand-green text-white font-bold text-base py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-35 disabled:cursor-not-allowed shadow-lg shadow-brand-green/30"
          >
            <ShieldCheck size={18} /> Check It Now — It&apos;s Free <ArrowRight size={18} />
          </button>
          <p className="text-center text-[10px] text-ink-3 mt-2">No account needed · No OTPs or passwords</p>
        </div>
      </div>

      {/* Trust pills */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {[
          { icon: <Lock size={11} />,        text: 'No OTPs or passwords'   },
          { icon: <CheckCircle size={11} />, text: 'Filipino scam patterns' },
          { icon: <Zap size={11} />,         text: 'Results in seconds'     },
        ].map(({ icon, text: label }) => (
          <span key={label} className="flex items-center gap-1.5 text-xs text-white/40 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            {icon} {label}
          </span>
        ))}
      </div>
    </section>
  )
}
