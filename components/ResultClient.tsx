'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Copy, Check, MessageCircle, ExternalLink,
  AlertTriangle, CheckCircle2, Search, Flag, TrendingDown,
  TrendingUp, Minus, ShieldCheck, Share2, RotateCcw,
  ChevronDown, ChevronUp, Zap, Lock, UserPlus,
} from 'lucide-react'
import type { DecisionResult } from '@/types'
import toast from 'react-hot-toast'
import ShareButton from './ShareButton'
import ReportScamModal from './ReportScamModal'

interface Props {
  result: DecisionResult
  checkId?: string
  inputText?: string
  scoreSteps?: Array<{ label: string; delta: number }>
  tier?: 'guest' | 'basic' | 'full'
}

type RiskLevel = 'critical' | 'high' | 'caution' | 'low' | 'safe'

function getRiskLevel(trustScore: number, isHardRed: boolean): RiskLevel {
  if (isHardRed || trustScore < 20) return 'critical'
  if (trustScore < 40)              return 'high'
  if (trustScore < 60)              return 'caution'
  if (trustScore < 80)              return 'low'
  return 'safe'
}

interface RiskTheme {
  bg: string
  border: string
  scoreColor: string
  accentBg: string
  accentText: string
  flagBg: string
  flagBorder: string
  label: string
  emoji: string
  recommendation: string
  recommendationTl: string
  headlinePrefix: string
}

const RISK_THEMES: Record<RiskLevel, RiskTheme> = {
  critical: {
    bg: 'risk-hero-critical',
    border: 'border-brand-critical/30',
    scoreColor: 'text-white',
    accentBg: 'bg-white/20',
    accentText: 'text-white',
    flagBg: 'bg-white/10',
    flagBorder: 'border-white/20',
    label: 'Critical Risk',
    emoji: '🚨',
    recommendation: 'Stop. Critical risk detected.',
    recommendationTl: 'Tigil. Critical risk na ito.',
    headlinePrefix: '',
  },
  high: {
    bg: 'risk-hero-red',
    border: 'border-brand-red/20',
    scoreColor: 'text-brand-red-dark',
    accentBg: 'bg-brand-red',
    accentText: 'text-white',
    flagBg: 'bg-brand-red-light',
    flagBorder: 'border-brand-red/20',
    label: 'High Risk',
    emoji: '⚠️',
    recommendation: 'Do not pay yet.',
    recommendationTl: 'Huwag muna magbayad.',
    headlinePrefix: '',
  },
  caution: {
    bg: 'risk-hero-orange',
    border: 'border-brand-orange/20',
    scoreColor: 'text-brand-orange-dark',
    accentBg: 'bg-brand-orange',
    accentText: 'text-white',
    flagBg: 'bg-brand-orange-light',
    flagBorder: 'border-brand-orange/20',
    label: 'High Caution',
    emoji: '🔶',
    recommendation: 'High caution. Verify muna.',
    recommendationTl: 'Mataas na babala. Mag-verify muna.',
    headlinePrefix: '',
  },
  low: {
    bg: 'risk-hero-yellow',
    border: 'border-brand-yellow/20',
    scoreColor: 'text-brand-yellow-dark',
    accentBg: 'bg-brand-yellow',
    accentText: 'text-white',
    flagBg: 'bg-brand-yellow-light',
    flagBorder: 'border-brand-yellow/20',
    label: 'Caution',
    emoji: '🔔',
    recommendation: 'Some warning signs found. Verify muna.',
    recommendationTl: 'May mga babala. Mag-verify bago mag-send.',
    headlinePrefix: '',
  },
  safe: {
    bg: 'risk-hero-green',
    border: 'border-brand-green/20',
    scoreColor: 'text-brand-green-dark',
    accentBg: 'bg-brand-green',
    accentText: 'text-white',
    flagBg: 'bg-brand-green-light',
    flagBorder: 'border-brand-green/20',
    label: 'Low Risk',
    emoji: '✅',
    recommendation: 'No major red flags found.',
    recommendationTl: 'Walang nakitang malaking red flag.',
    headlinePrefix: '',
  },
}

function extractPhones(text: string): string[] {
  const matches = text.match(/(\+?63|0)9\d{9}/g) || []
  return [...new Set(matches.map(m => {
    if (m.startsWith('+639')) return '0' + m.slice(3)
    if (m.startsWith('639'))  return '0' + m.slice(2)
    return m
  }))]
}

function parseFinding(text: string): { observation: string; reason: string } | null {
  const idx = text.indexOf(' — REASON: ')
  if (idx === -1) {
    const alt = text.indexOf(' - REASON: ')
    if (alt === -1) return null
    return {
      observation: text.slice(0, alt).replace(/^OBSERVATION:\s*/i, '').trim(),
      reason: text.slice(alt + ' - REASON: '.length).trim(),
    }
  }
  return {
    observation: text.slice(0, idx).replace(/^OBSERVATION:\s*/i, '').trim(),
    reason: text.slice(idx + ' — REASON: '.length).trim(),
  }
}

function ScoreRing({ score, riskLevel }: { score: number; riskLevel: RiskLevel }) {
  const [displayed, setDisplayed] = useState(0)
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  useEffect(() => {
    let frame: number
    const start = performance.now()
    const duration = 1200
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(score * eased))
      if (progress < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [score])

  const isCritical = riskLevel === 'critical'
  const strokeColor = {
    critical: '#ef4444',
    high:     '#C0312C',
    caution:  '#D4650A',
    low:      '#C47B0A',
    safe:     '#1A9968',
  }[riskLevel]

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
        <circle
          cx="64" cy="64" r={radius}
          fill="none"
          stroke={isCritical ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'}
          strokeWidth="8"
        />
        <circle
          cx="64" cy="64" r={radius}
          fill="none"
          stroke={isCritical ? 'rgba(255,255,255,0.9)' : strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold font-mono leading-none ${isCritical ? 'text-white' : RISK_THEMES[riskLevel].scoreColor}`}>
          {displayed}
        </span>
        <span className={`text-xs font-mono ${isCritical ? 'text-white/60' : 'text-ink-3'}`}>/100</span>
      </div>
    </div>
  )
}

export default function ResultClient({ result, checkId, inputText = '', scoreSteps = [], tier = 'full' }: Props) {
  const [lang, setLang]                           = useState<'en' | 'tl'>('en')
  const [copied, setCopied]                       = useState(false)
  const [checkedEvidence, setCheckedEvidence]     = useState<Set<number>>(new Set())
  const [showReportFromChecklist, setShowReportFromChecklist] = useState(false)
  const [showBreakdown, setShowBreakdown]         = useState(false)

  const trustScore  = 100 - result.score
  const riskLevel   = getRiskLevel(trustScore, result.isHardRed)
  const theme       = RISK_THEMES[riskLevel]
  const isCritical  = riskLevel === 'critical'
  const L           = (obj: { en: string; tl: string }) => obj[lang]

  const detectedPhones   = extractPhones(inputText)
  const entitySummary    = result.aiInsights?.[0] || ''
  const headlineFinding  = result.aiInsights?.[1] || ''
  const officialResource = result.aiInsights?.[2] || ''

  const redFlags  = result.reasons.filter(r => r.severity !== 'positive')
  const positives = result.reasons.filter(r => r.severity === 'positive')

  const visibleRedFlags  = tier === 'guest' ? redFlags.slice(0, 1)  : tier === 'basic' ? redFlags.slice(0, 3)  : redFlags
  const visiblePositives = tier === 'guest' ? []                     : tier === 'basic' ? positives.slice(0, 2) : positives

  function toggleEvidence(i: number) {
    setCheckedEvidence(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  async function copyReport() {
    const lines: string[] = [
      `LegitCheck PH — Risk Report`,
      `Trust Score: ${trustScore}/100 (${theme.label})`,
      `Verdict: ${L(result.headline)}`,
      ``,
    ]
    if (entitySummary)   lines.push(`What we analyzed: ${entitySummary}`, ``)
    if (headlineFinding) lines.push(`Main conclusion: ${headlineFinding}`, ``)
    if (redFlags.length > 0) {
      lines.push(lang === 'tl' ? 'Mga Red Flag:' : 'Red flags found:')
      redFlags.forEach(r => {
        const p = parseFinding(L(r))
        lines.push(p ? `• ${p.observation}\n  → ${p.reason}` : `• ${L(r)}`)
      })
      lines.push(``)
    }
    lines.push(
      lang === 'tl' ? 'Saan Mag-report:' : 'Report to:',
      ...result.reportChannels.map(c => `• ${c.name}${c.contact ? ' · ' + c.contact : ''}${c.url ? ' — ' + c.url : ''}`),
      ``,
      lang === 'tl'
        ? 'Gabay lang ito. Hindi ito legal o opisyal na desisyon.'
        : 'This is a guide only. Not a final legal, bank, platform, government, or law-enforcement decision.',
      `Generated by LegitCheck PH`,
    )
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    toast.success('Report copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-paper-2">

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-50 px-4 py-3 flex items-center justify-between border-b ${
        isCritical
          ? 'bg-brand-critical/90 border-white/10 backdrop-blur-sm'
          : 'bg-paper/95 border-line backdrop-blur-sm'
      }`}>
        <div className="flex items-center gap-3">
          <Link href="/buyer" className={`transition-colors ${isCritical ? 'text-white/70 hover:text-white' : 'text-ink-3 hover:text-ink'}`}>
            <ArrowLeft size={20} />
          </Link>
          <Link href="/" className="flex items-baseline gap-1 hover:opacity-80 transition-opacity">
            <span className={`text-base font-bold tracking-tight ${isCritical ? 'text-white' : 'text-ink'}`}>LegitCheck</span>
            <span className={`text-base font-light ${isCritical ? 'text-white/60' : 'text-ink-3'}`}>PH</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {/* Lang toggle */}
          <div className={`flex rounded-full p-0.5 border ${isCritical ? 'bg-white/10 border-white/20' : 'bg-paper-2 border-line'}`}>
            {(['en', 'tl'] as const).map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  lang === l
                    ? isCritical ? 'bg-white text-brand-critical font-bold shadow-sm' : 'bg-paper text-ink shadow-sm border border-line'
                    : isCritical ? 'text-white/60' : 'text-ink-3'
                }`}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          {/* New check */}
          <Link href="/buyer" className={`flex items-center gap-1 text-xs font-medium transition-colors ${isCritical ? 'text-white/60 hover:text-white' : 'text-ink-3 hover:text-ink'}`}>
            <RotateCcw size={12} />
            <span className="hidden sm:inline">New check</span>
          </Link>
        </div>
      </header>

      {/* ── Hero verdict section ───────────────────────────────────────────── */}
      <div className={`${theme.bg} px-4 py-10 text-center ${isCritical ? 'animate-glow' : ''}`}>
        <div className="max-w-lg mx-auto">

          {/* Risk level badge */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mb-5 border ${
            isCritical ? 'bg-white/15 border-white/25 text-white' : `${theme.accentBg} ${theme.accentText} border-transparent`
          }`}>
            <span>{theme.emoji}</span>
            <span>{theme.label}</span>
          </div>

          {/* Score ring */}
          <div className="flex justify-center mb-5 animate-scale-in">
            <ScoreRing score={trustScore} riskLevel={riskLevel} />
          </div>

          {/* Headline */}
          <h1 className={`text-2xl font-bold mb-2 leading-tight ${isCritical ? 'text-white' : theme.scoreColor}`}>
            {L(result.headline)}
          </h1>
          <p className={`text-sm mb-5 leading-relaxed max-w-sm mx-auto ${isCritical ? 'text-white/75' : `${theme.scoreColor} opacity-80`}`}>
            {L(result.subheadline)}
          </p>

          {/* Primary recommendation pill */}
          <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm ${
            isCritical ? 'bg-white text-brand-critical' : `${theme.accentBg} ${theme.accentText}`
          }`}>
            <Zap size={14} />
            {lang === 'tl' ? theme.recommendationTl : theme.recommendation}
          </div>

          {/* Context note below recommendation */}
          {riskLevel === 'safe' && (
            <p className="mt-3 text-xs text-brand-green-dark opacity-60">
              {lang === 'tl'
                ? 'Hindi ito garantiya ng kaligtasan. Mag-verify pa rin bago tumuloy.'
                : 'This looks low risk based on what you shared, but always stay cautious.'}
            </p>
          )}
          {riskLevel === 'high' && (
            <p className="mt-3 text-xs text-brand-red-dark opacity-70">
              {lang === 'tl'
                ? 'Mukhang kahina-hinalang batay sa ibinigay mo.'
                : 'This looks highly suspicious based on the information you shared.'}
            </p>
          )}
          {riskLevel === 'critical' && (
            <p className="mt-3 text-xs text-white/60">
              {lang === 'tl'
                ? 'Huwag tumuloy malibang ma-verify sa opisyal at pinagkakatiwalaang channel.'
                : 'Do not proceed unless verified through official and trusted channels.'}
            </p>
          )}
          {riskLevel === 'caution' && (
            <p className="mt-3 text-xs text-brand-orange-dark opacity-70">
              {lang === 'tl'
                ? 'Ilang risk signal ang nakita. Tumuloy lamang pagkatapos ng sariling pag-verify.'
                : 'Several risk signals were detected. Proceed only after independent verification.'}
            </p>
          )}
          {riskLevel === 'low' && (
            <p className="mt-3 text-xs text-brand-yellow-dark opacity-70">
              {lang === 'tl'
                ? 'Mag-verify muna bago magpadala ng pera.'
                : 'Verify muna before sending money.'}
            </p>
          )}
        </div>
      </div>

      {/* ── Analysis body ─────────────────────────────────────────────────── */}
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4 animate-slide-up">

        {/* What was analyzed */}
        {entitySummary && (
          <div className="card flex gap-3 items-start">
            <Search size={15} className="text-ink-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="micro-label mb-1">{lang === 'tl' ? 'Ano ang sinuri' : 'What we analyzed'}</p>
              <p className="text-sm text-ink-2 leading-snug">{entitySummary}</p>
            </div>
          </div>
        )}

        {/* Main conclusion */}
        {headlineFinding && (
          <div className={`rounded-2xl border px-4 py-4 ${theme.flagBg} ${theme.flagBorder}`}>
            <p className={`micro-label mb-1.5 ${isCritical ? 'text-brand-red-dark' : ''}`}>
              {lang === 'tl' ? 'Pangunahing Natuklasan' : 'Main conclusion'}
            </p>
            <p className={`text-sm font-semibold leading-snug ${
              riskLevel === 'safe' ? 'text-brand-green-dark' :
              riskLevel === 'critical' || riskLevel === 'high' ? 'text-brand-red-dark' :
              riskLevel === 'caution' ? 'text-brand-orange-dark' :
              'text-brand-yellow-dark'
            }`}>{headlineFinding}</p>
          </div>
        )}

        {/* Official resource — basic and full only */}
        {officialResource && tier !== 'guest' && (
          <div className="card flex gap-3 items-start bg-paper-2">
            <ShieldCheck size={15} className="text-brand-teal flex-shrink-0 mt-0.5" />
            <div>
              <p className="micro-label mb-1">{lang === 'tl' ? 'Paano mag-verify nang ligtas' : 'How to verify officially'}</p>
              <p className="text-sm text-ink-2 leading-snug">{officialResource}</p>
            </div>
          </div>
        )}

        {/* Red flags */}
        {visibleRedFlags.length > 0 && (
          <div className="space-y-2.5">
            <p className="sec-label flex items-center gap-1.5">
              <AlertTriangle size={11} className="text-brand-red opacity-80" />
              {tier === 'full'
                ? (lang === 'tl' ? `Mga Nakitang Babala (${redFlags.length})` : `Red Flags Found (${redFlags.length})`)
                : (lang === 'tl'
                    ? `Mga Nakitang Babala (${visibleRedFlags.length} ng ${redFlags.length})`
                    : `Red Flags Found (${visibleRedFlags.length} of ${redFlags.length})`)}
            </p>
            {visibleRedFlags.map((r, i) => {
              const parsed = parseFinding(L(r))
              const isHard = r.severity === 'hard_red'
              return (
                <div key={i} className={`rounded-2xl border px-4 py-3.5 space-y-1 ${
                  isHard
                    ? 'bg-brand-red-light border-brand-red/25'
                    : 'bg-paper-2 border-line'
                }`}>
                  {isHard && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-red-dark bg-brand-red/10 px-1.5 py-0.5 rounded-full mb-1">
                      <AlertTriangle size={8} /> Critical flag
                    </span>
                  )}
                  {parsed ? (
                    <>
                      <p className="text-sm font-semibold text-ink leading-snug">{parsed.observation}</p>
                      {tier !== 'guest' && <p className="text-xs text-ink-3 leading-relaxed">{parsed.reason}</p>}
                    </>
                  ) : (
                    <p className="text-sm text-ink-2 leading-snug">{tier === 'guest' ? L(r).slice(0, 80) : L(r)}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Guest signup gate */}
        {tier === 'guest' && (
          <div className="bg-ink rounded-2xl p-5 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-brand-green/20 border border-brand-green/30 flex items-center justify-center mx-auto">
              <Lock size={20} className="text-brand-green" />
            </div>
            <div>
              <p className="text-base font-bold text-white mb-1">
                {redFlags.length > 1
                  ? `${redFlags.length - 1} more red flag${redFlags.length - 1 > 1 ? 's' : ''} found`
                  : 'See the full analysis'}
              </p>
              <p className="text-sm text-white/60 leading-relaxed">
                Sign up free to unlock the full report — score breakdown, all red flags, and what to do next.
              </p>
            </div>
            <div className="space-y-2">
              <Link href="/auth/signup" className="w-full bg-brand-green text-white font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-sm">
                <UserPlus size={15} /> Create free account
              </Link>
              <Link href="/auth/login" className="w-full bg-white/10 text-white font-medium rounded-xl py-3 flex items-center justify-center hover:bg-white/20 transition-all text-sm">
                Log in
              </Link>
            </div>
          </div>
        )}

        {/* Positive signals — basic and full */}
        {visiblePositives.length > 0 && (
          <div className="space-y-2.5">
            <p className="sec-label flex items-center gap-1.5">
              <CheckCircle2 size={11} className="text-brand-green opacity-80" />
              {lang === 'tl' ? `Mga Positibong Tanda (${positives.length})` : `Positive Signals (${positives.length})`}
            </p>
            {visiblePositives.map((r, i) => {
              const parsed = parseFinding(L(r))
              return (
                <div key={i} className="bg-brand-green-light border border-brand-green/20 rounded-2xl px-4 py-3.5 space-y-1">
                  {parsed ? (
                    <>
                      <p className="text-sm font-semibold text-brand-green-dark leading-snug">{parsed.observation}</p>
                      <p className="text-xs text-brand-green-dark opacity-70 leading-relaxed">{parsed.reason}</p>
                    </>
                  ) : (
                    <p className="text-sm text-brand-green-dark leading-snug">{L(r)}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* No findings fallback — full only */}
        {tier === 'full' && redFlags.length === 0 && positives.length === 0 && !headlineFinding && (
          <div className="card text-center py-6">
            <p className="text-sm text-ink-3 italic">
              {lang === 'tl'
                ? 'Walang nakitang red flag sa ibinigay na content. Subukan ulit na may mas detalyadong impormasyon.'
                : 'No specific findings in the content provided. Try again with the actual message, offer, or conversation.'}
            </p>
          </div>
        )}

        {/* Basic upgrade gate */}
        {tier === 'basic' && (
          <div className="bg-ink rounded-2xl p-5 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto">
              <Lock size={20} className="text-white/60" />
            </div>
            <div>
              <p className="text-base font-bold text-white mb-1">Unlock full analysis</p>
              <p className="text-sm text-white/60 leading-relaxed">
                Upgrade to Pro for unlimited checks, score breakdown, evidence checklist, and full reports.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-left">
              {['Unlimited checks', 'Score breakdown', 'Evidence checklist', 'Copy & share reports'].map(f => (
                <div key={f} className="flex items-center gap-1.5 text-xs text-white/60">
                  <Check size={10} className="text-brand-green flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>
            <button disabled className="w-full bg-brand-green/40 text-white/50 font-bold rounded-xl py-3.5 cursor-not-allowed text-sm">
              Upgrade to Pro — coming soon
            </button>
          </div>
        )}

        {/* Score breakdown — full only */}
        {tier === 'full' && scoreSteps.length > 1 && (
          <div className="card">
            <button
              onClick={() => setShowBreakdown(v => !v)}
              className="w-full flex items-center justify-between"
            >
              <p className="sec-label mb-0">
                {lang === 'tl' ? 'Paano nakuha ang markang ito' : 'How we arrived at this score'}
              </p>
              {showBreakdown ? <ChevronUp size={14} className="text-ink-3" /> : <ChevronDown size={14} className="text-ink-3" />}
            </button>
            {showBreakdown && (
              <div className="mt-3 rounded-xl border border-line overflow-hidden">
                {(() => {
                  let running = 70
                  return scoreSteps.map((step, i) => {
                    running = i === 0 ? 70 : Math.max(0, Math.min(100, running + step.delta))
                    const isStart     = i === 0
                    const isDeduction = step.delta < 0
                    const isBonus     = step.delta > 0
                    return (
                      <div key={i} className={`flex items-center gap-3 px-3 py-2.5 text-xs border-b border-line last:border-0 ${
                        isStart     ? 'bg-paper-2' :
                        isDeduction ? 'bg-brand-red-light/40' :
                        isBonus     ? 'bg-brand-green-light/40' : 'bg-paper-2'
                      }`}>
                        <div className="flex-shrink-0">
                          {isStart      ? <Minus size={10} className="text-ink-3" /> :
                           isDeduction  ? <TrendingDown size={10} className="text-brand-red-dark" /> :
                                          <TrendingUp size={10} className="text-brand-green-dark" />}
                        </div>
                        <div className="flex-1 text-ink-2 leading-snug">{step.label}</div>
                        <div className={`font-mono font-semibold flex-shrink-0 ${
                          isStart ? 'text-ink-3' : isDeduction ? 'text-brand-red-dark' : 'text-brand-green-dark'
                        }`}>
                          {isStart ? `${running}` : `${step.delta > 0 ? '+' : ''}${step.delta} → ${running}`}
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            )}
            {!showBreakdown && (
              <p className="text-xs text-ink-3 mt-2">
                {lang === 'tl' ? 'Tap para makita ang bawat hakbang.' : 'Tap to see every deduction step.'}
              </p>
            )}
          </div>
        )}

        {/* Recommended next steps — basic and full */}
        {tier !== 'guest' && (
          <div className="card space-y-3">
            <p className="sec-label">{lang === 'tl' ? 'Inirerekomendang Susunod na Hakbang' : 'Recommended next steps'}</p>
            {(riskLevel === 'critical' || riskLevel === 'high') && (
              <div className="space-y-2">
                {[
                  { en: 'Do not send money or click any link in this message.', tl: 'Huwag magpadala ng pera o mag-click ng link sa mensaheng ito.' },
                  { en: 'Screenshot everything as evidence before blocking.', tl: 'I-screenshot ang lahat bilang ebidensya bago mag-block.' },
                  { en: 'Verify through the official website or platform directly.', tl: 'Mag-verify sa opisyal na website o platform direkta.' },
                  { en: 'Report to the relevant authority using the contacts below.', tl: 'Mag-report sa may-katuturng awtoridad gamit ang mga contact sa ibaba.' },
                ].map((s, i) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <div className="w-5 h-5 rounded-full bg-brand-red-light border border-brand-red/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-brand-red-dark">{i + 1}</span>
                    </div>
                    <p className="text-sm text-ink-2 leading-snug">{lang === 'tl' ? s.tl : s.en}</p>
                  </div>
                ))}
              </div>
            )}
            {riskLevel === 'caution' && (
              <div className="space-y-2">
                {[
                  { en: 'Ask the seller/recruiter for verifiable proof of identity or registration.', tl: 'Humingi ng berifikabol na patunay ng pagkakakilanlan o rehistrasyon.' },
                  { en: 'Use COD, escrow, or a platform with buyer protection.', tl: 'Gumamit ng COD, escrow, o platform na may buyer protection.' },
                  { en: 'Do not pay in full upfront — use partial payment or safe channels.', tl: 'Huwag magbayad ng buo nang maaga — gumamit ng partial payment o ligtas na channel.' },
                ].map((s, i) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <div className="w-5 h-5 rounded-full bg-brand-orange-light border border-brand-orange/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-brand-orange-dark">{i + 1}</span>
                    </div>
                    <p className="text-sm text-ink-2 leading-snug">{lang === 'tl' ? s.tl : s.en}</p>
                  </div>
                ))}
              </div>
            )}
            {(riskLevel === 'low' || riskLevel === 'safe') && (
              <div className="space-y-2">
                {[
                  { en: 'Looks generally okay, but still verify before sending money.', tl: 'Mukhang okay sa pangkalahatan, pero mag-verify pa rin bago magpadala ng pera.' },
                  { en: 'Use a payment method with buyer protection (Shopee, Lazada, COD).', tl: 'Gumamit ng paraan ng bayad na may buyer protection (Shopee, Lazada, COD).' },
                  { en: 'This score is guidance only — not a guarantee of safety.', tl: 'Gabay lamang ang score na ito — hindi garantiya ng kaligtasan.' },
                ].map((s, i) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <div className="w-5 h-5 rounded-full bg-brand-green-light border border-brand-green/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-brand-green-dark">{i + 1}</span>
                    </div>
                    <p className="text-sm text-ink-2 leading-snug">{lang === 'tl' ? s.tl : s.en}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Report channels — basic and full */}
        {tier !== 'guest' && result.reportChannels.length > 0 && (
          <div className="card">
            <p className="sec-label">{lang === 'tl' ? 'Saan Mag-report' : 'Report to'}</p>
            <div className="space-y-2 mt-1">
              {result.reportChannels.map((ch, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-sm py-1">
                  <div>
                    <span className="font-medium text-ink">{ch.name}</span>
                    {ch.contact && <span className="text-ink-3 ml-2 text-xs">{ch.contact}</span>}
                  </div>
                  {ch.url && (
                    <a href={ch.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-ink-3 hover:text-ink transition-colors whitespace-nowrap flex-shrink-0">
                      Visit <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidence checklist — full only */}
        {tier === 'full' && result.evidenceItems.length > 0 && (
          <div className="card">
            <p className="sec-label">
              {lang === 'tl' ? 'Kung mag-re-report ka — ihanda ito:' : 'If reporting — gather these first:'}
            </p>
            <p className="text-xs text-ink-3 mb-3">
              {lang === 'tl'
                ? 'I-tick ang mga hawak mo, tapos pindutin ang Report para magsumite.'
                : 'Tick what you have, then hit Report to submit.'}
            </p>
            <div className="space-y-2.5">
              {result.evidenceItems.map((e, i) => (
                <button key={i} onClick={() => toggleEvidence(i)} className="flex items-center gap-3 w-full text-left group">
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                    checkedEvidence.has(i) ? 'bg-brand-green border-brand-green' : 'border-line bg-paper-2 group-hover:border-ink-3'
                  }`}>
                    {checkedEvidence.has(i) && <Check size={10} className="text-white" strokeWidth={3} />}
                  </div>
                  <span className="text-sm text-ink-2">{L(e)}</span>
                </button>
              ))}
            </div>
            {checkedEvidence.size > 0 && (
              <button
                onClick={() => setShowReportFromChecklist(true)}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-red text-white text-sm font-semibold hover:opacity-90 transition-all active:scale-95">
                <Flag size={13} />
                {lang === 'tl'
                  ? `Mag-report — ${checkedEvidence.size} ebidensya handa`
                  : `Report this — ${checkedEvidence.size} item${checkedEvidence.size > 1 ? 's' : ''} ready`}
              </button>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="border-l-2 border-line pl-3 py-1">
          <p className="text-xs text-ink-3 leading-relaxed">
            {lang === 'tl'
              ? 'Gabay lang ito. Hindi ito final legal, bank, platform, government, o law-enforcement decision. Mag-verify pa rin bago tumuloy.'
              : 'This is a guide only. Not a final legal, bank, platform, government, or law-enforcement decision. Verify further before proceeding.'}
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-2.5">
          {tier === 'full' && (
            <>
              <button onClick={copyReport}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border text-sm font-semibold transition-all active:scale-95 ${
                  copied ? 'bg-brand-green-light border-brand-green/20 text-brand-green-dark' : 'bg-paper border-line text-ink-2 hover:bg-ink hover:text-white hover:border-ink'
                }`}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : lang === 'tl' ? 'Kopyahin ang Report' : 'Copy report'}
              </button>

              {checkId && <ShareButton checkId={checkId} lang={lang} />}

              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-line bg-paper text-sm text-ink-2 font-medium hover:bg-ink hover:text-white hover:border-ink transition-all active:scale-95"
              >
                <ExternalLink size={14} />
                {lang === 'tl' ? 'I-download bilang PDF' : 'Download as PDF'}
              </button>

              <button
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank', 'width=600,height=400')}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-line bg-paper text-sm text-ink-2 font-medium hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition-all active:scale-95"
              >
                <Share2 size={14} />
                {lang === 'tl' ? 'I-share sa Facebook' : 'Share on Facebook'}
              </button>

              <Link href="/dashboard/agents"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-line bg-paper text-sm text-ink-2 font-medium hover:bg-ink hover:text-white hover:border-ink transition-all active:scale-95">
                <MessageCircle size={14} />
                {lang === 'tl' ? 'Tanungin si Bantay' : 'Ask Bantay'}
              </Link>
            </>
          )}

          <Link href="/buyer"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-line bg-paper text-sm text-ink-2 font-medium hover:bg-ink hover:text-white hover:border-ink transition-all active:scale-95">
            <Search size={14} />
            {lang === 'tl' ? 'Mag-check ng isa pa' : 'Check something else'}
          </Link>
        </div>

        <ReportScamModal
          checkId={checkId}
          categoryId={result.categoryId}
          detectedIdentifiers={detectedPhones}
          forceOpen={showReportFromChecklist}
          onClose={() => setShowReportFromChecklist(false)}
        />

        <div className="pb-8" />
      </div>
    </div>
  )
}
