'use client'

import { useState } from 'react'
import { Copy, Check, Share2 } from 'lucide-react'

export default function LegitCardCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator

  async function handle() {
    if (canShare) {
      try {
        await navigator.share({ text, title: 'LegitCheck PH Verified Seller' })
        return
      } catch { /* dismissed, fall through to clipboard */ }
    }
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handle}
      className={`w-full flex items-center justify-center gap-2 py-3 border rounded-xl text-sm font-medium transition-all active:scale-95 ${
        copied
          ? 'bg-brand-green-light border-brand-green/20 text-brand-green-dark'
          : 'border-line text-ink-2 hover:bg-ink hover:text-white hover:border-ink'
      }`}
    >
      {copied ? <Check size={14} /> : canShare ? <Share2 size={14} /> : <Copy size={14} />}
      {copied ? 'Copied!' : canShare ? 'Share' : 'Copy to clipboard'}
    </button>
  )
}
