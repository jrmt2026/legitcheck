'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShieldCheck, Search, ArrowRight, FlaskConical, Lock, CheckCircle, Zap } from 'lucide-react'

const LIVE_FEED = [
  { emoji: '🛍️', label: 'FB Seller',     result: 'SCAM',      color: 'text-red-400',   bg: 'bg-red-500/10 border-red-500/20'   },
  { emoji: '📱', label: "Gov't SMS",      result: 'SCAM',      color: 'text-red-400',   bg: 'bg-red-500/10 border-red-500/20'   },
  { emoji: '✅', label: 'Online Order',  result: 'SAFE',      color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  { emoji: '💰', label: 'Investment',    result: 'SCAM',      color: 'text-red-400',   bg: 'bg-red-500/10 border-red-500/20'   },
  { emoji: '✈️', label: 'Job Agency',    result: 'SCAM',      color: 'text-red-400',   bg: 'bg-red-500/10 border-red-500/20'   },
  { emoji: '🌐', label: 'Website Link',  result: 'CAUTION',   color: 'text-yellow-400',bg: 'bg-yellow-500/10 border-yellow-500/20' },
]

export default function HeroSection() {
  const [count, setCount]       = useState(2847)
  const [feedIdx, setFeedIdx]   = useState(0)
  const [visible, setVisible]   = useState(true)

  // Slowly increment check counter
  useEffect(() => {
    const t = setInterval(() => {
      setCount(c => c + Math.floor(Math.random() * 3 + 1))
    }, 2800)
    return () => clearInterval(t)
  }, [])

  // Rotate live feed ticker
  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setFeedIdx(i => (i + 1) % LIVE_FEED.length)
        setVisible(true)
      }, 350)
    }, 2600)
    return () => clearInterval(t)
  }, [])

  const live = LIVE_FEED[feedIdx]

  return (
    <section className="relative overflow-hidden max-w-2xl mx-auto px-4 pt-14 pb-12 text-center">

      {/* Subtle radial glow behind shield */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(26,153,104,0.12) 0%, transparent 70%)' }}
      />

      {/* Animated scanner shield */}
      <div className="relative flex items-center justify-center mb-8 h-36">
        <div className="absolute w-36 h-36 rounded-full border border-brand-green/40 animate-pulse-ring" />
        <div className="absolute w-36 h-36 rounded-full border border-brand-green/25 animate-pulse-ring" style={{ animationDelay: '0.7s' }} />
        <div className="absolute w-36 h-36 rounded-full border border-brand-green/12 animate-pulse-ring" style={{ animationDelay: '1.4s' }} />
        <div
          className="relative z-10 w-24 h-24 rounded-full bg-brand-green/10 border-2 border-brand-green/40 flex items-center justify-center"
          style={{ boxShadow: '0 0 48px rgba(26,153,104,0.25), 0 0 16px rgba(26,153,104,0.15)' }}
        >
          <ShieldCheck size={42} className="text-brand-green animate-float" />
        </div>
      </div>

      {/* Live activity ticker */}
      <div className="flex justify-center mb-5">
        <div
          className={`flex items-center gap-2.5 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-300 ${live.bg} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
        >
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

      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full text-white/50 text-xs font-semibold font-mono mb-5 border border-white/10">
        <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-throb" />
        #1 Anti-scam tool for Filipinos
      </div>

      {/* Headline */}
      <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight leading-none mb-4">
        Check muna<br />
        <span className="text-white/25 font-light">bago bayad.</span>
      </h1>

      <p className="text-lg text-white/50 max-w-md mx-auto leading-relaxed mb-2">
        Paste a message, link, account number, or screenshot.
        Get a <strong className="text-white font-semibold">trust score</strong> in seconds.
      </p>

      {/* Live counter */}
      <p className="text-sm text-white/30 font-mono mb-8">
        <span className="text-brand-green font-bold text-lg tabular-nums">{count.toLocaleString()}</span>
        {' '}checks done today
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
        <Link
          href="/buyer"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-ink text-base font-bold px-7 py-4 rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all"
          style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 8px 32px rgba(255,255,255,0.12)' }}
        >
          <Search size={16} /> Check something now <ArrowRight size={16} />
        </Link>
        <Link
          href="/demo"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/5 text-white/70 text-base font-medium px-7 py-4 rounded-2xl border border-white/10 hover:bg-white/10 active:scale-[0.98] transition-all"
        >
          <FlaskConical size={16} /> Try a demo first
        </Link>
      </div>

      {/* Trust pills */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {[
          { icon: <Lock size={11} />,        text: 'No OTPs or passwords'   },
          { icon: <CheckCircle size={11} />, text: 'Filipino scam patterns' },
          { icon: <Zap size={11} />,         text: 'Results in seconds'     },
        ].map(({ icon, text }) => (
          <span key={text} className="flex items-center gap-1.5 text-xs text-white/40 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            {icon} {text}
          </span>
        ))}
      </div>
    </section>
  )
}
