'use client'

import { ExternalLink, ShieldAlert, Info } from 'lucide-react'
import type { VerificationSource, VerificationStatus } from '@/lib/officialSources'

const STATUS_CONFIG: Record<VerificationStatus, { label: string; color: string }> = {
  official_website:     { label: 'Official website',        color: 'bg-brand-teal-light text-brand-teal-dark border-brand-teal/20'  },
  manual_verification:  { label: 'Manual verification',     color: 'bg-brand-yellow-light text-brand-yellow-dark border-brand-yellow/20' },
  api_not_connected:    { label: 'API not connected',       color: 'bg-paper-2 text-ink-3 border-line'                              },
  no_public_checker:    { label: 'No public checker',       color: 'bg-brand-yellow-light text-brand-yellow-dark border-brand-yellow/20' },
}

interface Props {
  source: VerificationSource
  lang?: 'en' | 'tl'
}

export default function OfficialVerificationCard({ source, lang = 'en' }: Props) {
  const status = STATUS_CONFIG[source.status]

  return (
    <div className="rounded-2xl border border-line bg-paper overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-line bg-paper-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert size={14} className="text-ink-3 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-ink-2 uppercase tracking-wider">Official Verification Needed</p>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap flex-shrink-0 ${status.color}`}>
            {status.label}
          </span>
        </div>
        <p className="text-base font-bold text-ink mt-1.5">{source.title}</p>
        <p className="text-xs text-ink-3 mt-0.5">{source.agency}</p>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        {/* Detected */}
        <div className="flex gap-2 items-start">
          <Info size={12} className="text-ink-3 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-ink-3"><span className="font-semibold text-ink-2">Detected:</span> {source.detected}</p>
        </div>

        {/* Warning copy */}
        <div className="bg-brand-yellow-light border border-brand-yellow/25 rounded-xl px-3 py-2.5">
          <p className="text-xs text-brand-yellow-dark leading-relaxed">
            We cannot directly confirm this from government databases or private institutions.
            Use the official source below <strong>before sending money or sharing personal information.</strong>
          </p>
        </div>

        {/* Description */}
        <p className="text-sm text-ink-2 leading-relaxed">{source.description}</p>

        {/* What to search */}
        <div className="bg-paper-2 border border-line rounded-xl px-3 py-2.5">
          <p className="text-[11px] font-bold text-ink-3 uppercase tracking-wider mb-1">What to search</p>
          <p className="text-sm text-ink-2 leading-snug">{source.whatToSearch}</p>
        </div>

        {/* Proves / Does not prove */}
        <div className="grid grid-cols-1 gap-2">
          <div className="rounded-xl border border-line px-3 py-2.5">
            <p className="text-[11px] font-bold text-brand-teal-dark uppercase tracking-wider mb-1">This can show</p>
            <p className="text-xs text-ink-2 leading-snug">{source.whatItProves}</p>
          </div>
          <div className="rounded-xl border border-brand-orange/20 bg-brand-orange-light px-3 py-2.5">
            <p className="text-[11px] font-bold text-brand-orange-dark uppercase tracking-wider mb-1">This does NOT prove</p>
            <p className="text-xs text-brand-orange-dark leading-snug">{source.whatItDoesNotProve}</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        <a
          href={source.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-ink text-white text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
        >
          {source.buttonLabel}
          <ExternalLink size={13} />
        </a>
        <p className="text-[10px] text-ink-3 text-center mt-2 leading-snug">
          Always verify contact details on the official website before submitting sensitive information.
          Last verified: {source.lastVerified}
        </p>
      </div>
    </div>
  )
}
