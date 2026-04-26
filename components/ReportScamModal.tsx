'use client'

import { useState } from 'react'
import { X, Flag, Check, Loader2, ChevronDown } from 'lucide-react'
import type { CategoryId } from '@/types'
import toast from 'react-hot-toast'

interface Props {
  checkId?: string
  categoryId: CategoryId
  detectedIdentifiers?: string[]
  forceOpen?: boolean
  onClose?: () => void
}

const PLATFORMS = [
  { value: 'gcash',      label: 'GCash' },
  { value: 'maya',       label: 'Maya / PayMaya' },
  { value: 'bpi',        label: 'BPI' },
  { value: 'bdo',        label: 'BDO' },
  { value: 'metrobank',  label: 'Metrobank' },
  { value: 'unionbank',  label: 'UnionBank' },
  { value: 'facebook',   label: 'Facebook / Messenger' },
  { value: 'shopee',     label: 'Shopee' },
  { value: 'lazada',     label: 'Lazada' },
  { value: 'other',      label: 'Other' },
]

const ID_TYPES = [
  { value: 'phone',    label: 'Phone / GCash number' },
  { value: 'bank',     label: 'Bank account number' },
  { value: 'facebook', label: 'Facebook profile / page' },
  { value: 'shopee',   label: 'Shopee store' },
  { value: 'url',      label: 'Website URL' },
  { value: 'email',    label: 'Email address' },
  { value: 'other',    label: 'Other' },
]

export default function ReportScamModal({ checkId, categoryId, detectedIdentifiers = [], forceOpen = false, onClose }: Props) {
  const [open, setOpen]           = useState(false)

  const isOpen = open || forceOpen
  function handleClose() { setOpen(false); onClose?.() }
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]           = useState(false)

  const [identifier,      setIdentifier]     = useState(detectedIdentifiers[0] || '')
  const [identifierType,  setIdentifierType] = useState('phone')
  const [accountName,     setAccountName]    = useState('')
  const [platform,        setPlatform]       = useState('')
  const [description,     setDescription]    = useState('')
  const [amountLost,      setAmountLost]     = useState('')

  async function submit() {
    if (!identifier.trim()) { toast.error('Please enter the account or number'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/report-scam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          identifier_type: identifierType,
          account_name:    accountName || undefined,
          platform:        platform    || undefined,
          category:        categoryId,
          description:     description || undefined,
          amount_lost:     amountLost  ? Number(amountLost) : undefined,
          check_id:        checkId,
        }),
      })
      if (res.ok) { setDone(true); toast.success('Report submitted. Salamat!') }
      else { const d = await res.json(); toast.error(d.error || 'Submission failed') }
    } catch { toast.error('Network error') }
    setSubmitting(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-brand-red/30 bg-brand-red-light text-brand-red-dark text-sm font-medium hover:bg-brand-red hover:text-white transition-all active:scale-95"
      >
        <Flag size={14} />
        Report this as a scam
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={handleClose} />

          {/* Sheet */}
          <div className="relative w-full max-w-lg bg-paper rounded-t-3xl sm:rounded-2xl shadow-2xl animate-slide-up max-h-[92dvh] flex flex-col">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-line flex-shrink-0">
              <div>
                <h2 className="text-base font-semibold text-ink">Report a Scam</h2>
                <p className="text-xs text-ink-3 mt-0.5">Your report helps protect other Filipinos.</p>
              </div>
              <button onClick={handleClose} className="text-ink-3 hover:text-ink transition-colors p-1">
                <X size={20} />
              </button>
            </div>

            {done ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 px-5">
                <div className="w-14 h-14 rounded-full bg-brand-green-light flex items-center justify-center">
                  <Check size={28} className="text-brand-green-dark" strokeWidth={2.5} />
                </div>
                <p className="text-base font-semibold text-ink">Report Submitted</p>
                <p className="text-sm text-ink-3 text-center leading-relaxed">
                  Salamat! Your report has been added to the database. It will help warn others checking this account.
                </p>
                <button onClick={handleClose} className="mt-2 px-6 py-2.5 bg-ink text-white rounded-xl text-sm font-medium">
                  Done
                </button>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                {/* Identifier type */}
                <div>
                  <label className="sec-label">What are you reporting?</label>
                  <div className="relative">
                    <select
                      value={identifierType}
                      onChange={e => setIdentifierType(e.target.value)}
                      className="w-full appearance-none border border-line rounded-xl px-4 py-3 text-base text-ink bg-paper focus:outline-none focus:border-ink pr-10"
                      style={{ fontSize: '16px' }}
                    >
                      {ID_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
                  </div>
                </div>

                {/* Identifier */}
                <div>
                  <label className="sec-label">Account / Number / Link *</label>
                  <input
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="09171234567 or URL or account number"
                    className="w-full border border-line rounded-xl px-4 py-3 text-base text-ink bg-paper focus:outline-none focus:border-ink placeholder-ink-3"
                    style={{ fontSize: '16px' }}
                  />
                </div>

                {/* Account name */}
                <div>
                  <label className="sec-label">Account / Seller Name (if known)</label>
                  <input
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    placeholder="e.g. J. Santos"
                    className="w-full border border-line rounded-xl px-4 py-3 text-base text-ink bg-paper focus:outline-none focus:border-ink placeholder-ink-3"
                    style={{ fontSize: '16px' }}
                  />
                </div>

                {/* Platform */}
                <div>
                  <label className="sec-label">Platform Used</label>
                  <div className="relative">
                    <select
                      value={platform}
                      onChange={e => setPlatform(e.target.value)}
                      className="w-full appearance-none border border-line rounded-xl px-4 py-3 text-base text-ink bg-paper focus:outline-none focus:border-ink pr-10"
                      style={{ fontSize: '16px' }}
                    >
                      <option value="">Select platform…</option>
                      {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="sec-label">Amount Lost (PHP) — optional</label>
                  <input
                    type="number"
                    value={amountLost}
                    onChange={e => setAmountLost(e.target.value)}
                    placeholder="e.g. 2500"
                    className="w-full border border-line rounded-xl px-4 py-3 text-base text-ink bg-paper focus:outline-none focus:border-ink placeholder-ink-3"
                    style={{ fontSize: '16px' }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="sec-label">What happened? (optional)</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Briefly describe the scam attempt…"
                    rows={3}
                    className="w-full border border-line rounded-xl px-4 py-3 text-base text-ink bg-paper focus:outline-none focus:border-ink placeholder-ink-3 resize-none"
                    style={{ fontSize: '16px' }}
                  />
                </div>

                <button
                  onClick={submit}
                  disabled={submitting || !identifier.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-red text-white rounded-xl text-base font-semibold disabled:opacity-40 transition-opacity active:scale-95"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />}
                  {submitting ? 'Submitting…' : 'Submit Report'}
                </button>

                <p className="text-xs text-ink-3 text-center pb-safe">
                  Reports are anonymous. Submitting false reports is a violation of our terms.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
