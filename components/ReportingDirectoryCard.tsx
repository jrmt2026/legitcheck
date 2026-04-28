'use client'

import { useState } from 'react'
import { ExternalLink, ChevronDown, ChevronUp, Phone, Smartphone } from 'lucide-react'
import type { DirectoryEntry } from '@/lib/officialSources'

const CATEGORY_LABELS: Record<DirectoryEntry['category'], { label: string; color: string }> = {
  cybercrime:          { label: 'Cybercrime / Law Enforcement', color: 'bg-brand-red-light text-brand-red-dark border-brand-red/20' },
  financial_regulator: { label: 'Financial Regulator',          color: 'bg-brand-blue-light text-brand-blue-dark border-brand-blue/20' },
  ewallet:             { label: 'E-Wallet',                     color: 'bg-brand-green-light text-brand-green-dark border-brand-green/20' },
  bank:                { label: 'Bank',                         color: 'bg-paper-2 text-ink-2 border-line' },
  verification_source: { label: 'Government Verification',      color: 'bg-brand-teal-light text-brand-teal-dark border-brand-teal/20' },
}

interface Props {
  entry: DirectoryEntry
  defaultExpanded?: boolean
}

export default function ReportingDirectoryCard({ entry, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const catConfig = CATEGORY_LABELS[entry.category]

  return (
    <div className="rounded-2xl border border-line bg-paper overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-paper-2 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-bold text-ink">{entry.organization}</p>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${catConfig.color}`}>
            {catConfig.label}
          </span>
        </div>
        {expanded
          ? <ChevronUp size={14} className="text-ink-3 flex-shrink-0 mt-0.5" />
          : <ChevronDown size={14} className="text-ink-3 flex-shrink-0 mt-0.5" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-line pt-3">
          {/* Handles */}
          <div>
            <p className="text-[11px] font-bold text-ink-3 uppercase tracking-wider mb-2">What they handle</p>
            <ul className="space-y-1">
              {entry.handles.map(h => (
                <li key={h} className="flex items-start gap-2 text-xs text-ink-2">
                  <span className="w-1 h-1 rounded-full bg-ink-3 flex-shrink-0 mt-1.5" />
                  {h}
                </li>
              ))}
            </ul>
          </div>

          {/* Evidence */}
          <div>
            <p className="text-[11px] font-bold text-ink-3 uppercase tracking-wider mb-2">Evidence to prepare</p>
            <ul className="space-y-1">
              {entry.evidenceRequired.map(e => (
                <li key={e} className="flex items-start gap-2 text-xs text-ink-2">
                  <span className="w-1 h-1 rounded-full bg-ink-3 flex-shrink-0 mt-1.5" />
                  {e}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          {(entry.hotline || entry.email || entry.inAppSupport) && (
            <div className="bg-paper-2 border border-line rounded-xl px-3 py-2.5 space-y-1.5">
              {entry.hotline && (
                <div className="flex items-center gap-2 text-xs text-ink-2">
                  <Phone size={11} className="text-ink-3 flex-shrink-0" />
                  <span>{entry.hotline}</span>
                </div>
              )}
              {entry.inAppSupport && (
                <div className="flex items-center gap-2 text-xs text-ink-2">
                  <Smartphone size={11} className="text-ink-3 flex-shrink-0" />
                  <span>In-app support available</span>
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          {entry.disclaimer && (
            <p className="text-[11px] text-ink-3 leading-snug italic">{entry.disclaimer}</p>
          )}

          {/* CTA */}
          <a
            href={entry.complaintUrl ?? entry.officialWebsite}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-line bg-paper text-sm text-ink-2 font-semibold hover:bg-ink hover:text-white hover:border-ink transition-all active:scale-[0.98]"
          >
            Visit {entry.shortName}
            <ExternalLink size={12} />
          </a>

          <p className="text-[10px] text-ink-3 text-center">
            Contact details may change. Always confirm on the official website.
            Last verified: {entry.lastVerified}
          </p>
        </div>
      )}
    </div>
  )
}
