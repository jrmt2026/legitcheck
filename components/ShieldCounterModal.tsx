'use client'

import { useState } from 'react'
import { Shield, X } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  userToken?: string
}

export default function ShieldCounterModal({ isOpen, onClose, userToken }: Props) {
  const [amount, setAmount]         = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]             = useState(false)

  if (!isOpen) return null

  async function submit() {
    if (!amount || !userToken) { onClose(); return }
    setSubmitting(true)
    try {
      await fetch('/api/user/shield', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
        body: JSON.stringify({ amount: Number(amount) }),
      })
      setDone(true)
      setTimeout(onClose, 1800)
    } catch { onClose() }
    setSubmitting(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-paper w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 space-y-4 animate-slide-up shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-brand-green" />
            <span className="text-base font-bold text-ink">Scam Averted!</span>
          </div>
          <button onClick={onClose} className="text-ink-3 hover:text-ink p-1 transition-colors">
            <X size={16} />
          </button>
        </div>

        {done ? (
          <div className="text-center py-4">
            <p className="text-3xl mb-2">🛡️</p>
            <p className="text-base font-semibold text-brand-green-dark">Added to your protected total!</p>
            <p className="text-xs text-ink-3 mt-1">Makikita sa iyong dashboard.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-ink-2 leading-relaxed">
              Na-detect ang potential na scam. Magkano ang transaksyon?
              I-add namin ito sa iyong <strong className="text-ink">₱ Protected</strong> total.
            </p>
            <div>
              <label className="sec-label">Transaction amount (₱)</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="e.g. 5000"
                className="input-base mt-1"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={submit}
                disabled={submitting || !amount}
                className="flex-1 py-3 bg-ink text-white rounded-xl text-sm font-semibold disabled:opacity-40 active:scale-[0.97] transition-all"
              >
                {submitting ? 'Saving…' : 'Add to my total'}
              </button>
              <button
                onClick={onClose}
                className="py-3 px-4 border border-line text-ink-3 rounded-xl text-sm hover:bg-paper-2 transition-all"
              >
                Skip
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
