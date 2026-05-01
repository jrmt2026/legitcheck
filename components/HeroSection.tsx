'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, ArrowRight, Lock, CheckCircle, Zap } from 'lucide-react'

const LIVE_FEED = [
  { emoji: '🛍️', label: 'FB Seller',    result: 'SCAM',     color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20'          },
  { emoji: '📱', label: "Gov't SMS",     result: 'SCAM',     color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20'          },
  { emoji: '✅', label: 'Online Order', result: 'LOW RISK', color: 'text-white/60',   bg: 'bg-white/5 border-white/15'               },
  { emoji: '💰', label: 'Investment',   result: 'SCAM',     color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20'          },
  { emoji: '✈️', label: 'Job Agency',   result: 'SCAM',     color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20'          },
  { emoji: '🌐', label: 'Website Link', result: 'CAUTION',  color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20'    },
]

const SAMPLES = [
  { emoji: '🛍️', label: 'FB Seller',   text: 'Seller: Hi po! Available pa po yung bag. GCash nalang po tayo para mas mabilis. Account ko: 09171234567 - J. Santos. Rush po kasi maraming nagtatanong. Pag di ka nagbayad ngayon, ibebenta ko na sa iba.' },
  { emoji: '📱', label: "Gov't SMS",    text: 'Traffic Authority: Mahal na motorista, mayroon kang unpaid traffic violation na nagkakahalaga ng ₱5,000. Ang iyong lisensya ay sususpindihin sa loob ng 48 oras. I-click ang link para bayaran ngayon: http://gov-fines-ph.com/pay' },
  { emoji: '💰', label: 'Investment',  text: 'Kumita na ng 30% monthly ang aming mga investors! Guaranteed po ang return. Mag-invite ka pa ng friends, may komisyon ka pa. Mag-invest ka na ngayon, last slots na lang. Withdrawal fee lang ng ₱2,000 para ma-release ang profit mo.' },
  { emoji: '✈️', label: 'Job Offer',   text: 'Congratulations! Qualified ka sa deployment sa Dubai. Processing fee lang: ₱15,000 via GCash bago maibigay ang kontrata. Urgent — kailangan bukas na para ma-slot ka.' },
]

export default function HeroSection() {
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [text, setText]         = useState('')
  const [count, setCount]       = useState(2847)
  const [feedIdx, setFeedIdx]   = useState(0)
  const [visible, setVisible]   = useState(true)

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

  function handleAnalyze() {
    if (!text.trim()) return
    router.push(`/buyer?recheck=${encodeURIComponent(text.trim())}`)
  }

  function loadSample(sample: typeof SAMPLES[0]) {
    setText(sample.text)
    textareaRef.current?.focus()
  }

  const live = LIVE_FEED[feedIdx]

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
        Check muna<br />bago bayad.
      </h1>
      <p className="text-base text-white/50 max-w-sm mx-auto leading-relaxed mb-2">
        I-paste ang kahina-hinalang message, link, o account number — makuha ang resulta in seconds.
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

        {/* Sample pills */}
        <div className="px-4 pt-3 pb-2">
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
            disabled={!text.trim()}
            className="w-full bg-brand-green text-white font-bold text-base py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-35 disabled:cursor-not-allowed shadow-lg shadow-brand-green/30"
          >
            <ShieldCheck size={18} /> Analyze Risk <ArrowRight size={18} />
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
