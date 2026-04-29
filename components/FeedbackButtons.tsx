'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown, HelpCircle, CheckCircle2, Loader2, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import type { FeedbackType } from '@/types'

interface Props {
  checkId?: string
  lang?: 'en' | 'tl'
}

const BUTTONS: { type: FeedbackType; labelEn: string; labelTl: string; icon: React.ReactNode; activeClass: string }[] = [
  {
    type: 'accurate',
    labelEn: 'Result was accurate',
    labelTl: 'Tama ang resulta',
    icon: <CheckCircle2 size={12} />,
    activeClass: 'bg-brand-green text-white border-brand-green',
  },
  {
    type: 'false_positive',
    labelEn: 'Too strict / false alarm',
    labelTl: 'Masyadong strict',
    icon: <ThumbsUp size={12} />,
    activeClass: 'bg-brand-yellow text-white border-brand-yellow',
  },
  {
    type: 'false_negative',
    labelEn: 'Missed a scam',
    labelTl: 'Hindi nakita ang scam',
    icon: <ThumbsDown size={12} />,
    activeClass: 'bg-brand-red text-white border-brand-red',
  },
  {
    type: 'unclear',
    labelEn: 'Not sure',
    labelTl: 'Hindi sigurado',
    icon: <HelpCircle size={12} />,
    activeClass: 'bg-ink-3 text-white border-ink-3',
  },
]

export default function FeedbackButtons({ checkId, lang = 'en' }: Props) {
  const [selected, setSelected]   = useState<FeedbackType | null>(null)
  const [comment, setComment]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const needsComment = selected === 'false_positive' || selected === 'false_negative'

  async function submit() {
    if (!selected) return
    setLoading(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          check_id: checkId || 'anonymous',
          feedback_type: selected,
          user_comment: comment.trim() || undefined,
        }),
      })
      if (res.ok) {
        setSubmitted(true)
        toast.success(lang === 'tl' ? 'Salamat sa feedback!' : 'Thanks for your feedback!')
      } else {
        toast.error(lang === 'tl' ? 'Hindi nasave ang feedback.' : 'Could not save feedback.')
      }
    } catch {
      toast.error(lang === 'tl' ? 'Hindi nasave ang feedback.' : 'Could not save feedback.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="card text-center py-4">
        <p className="text-sm text-ink-2">
          {lang === 'tl'
            ? 'Salamat! Ginagamit namin ang iyong feedback para mapabuti ang LegitCheck.'
            : 'Thank you! Your feedback helps us improve LegitCheck.'}
        </p>
      </div>
    )
  }

  return (
    <div className="card space-y-3">
      <p className="sec-label">
        {lang === 'tl' ? 'Tumpak ba ang resulta?' : 'Was this result accurate?'}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {BUTTONS.map(btn => (
          <button
            key={btn.type}
            onClick={() => setSelected(btn.type === selected ? null : btn.type)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all active:scale-95 ${
              selected === btn.type
                ? btn.activeClass
                : 'bg-paper-2 border-line text-ink-2 hover:border-ink-3'
            }`}
          >
            {btn.icon}
            {lang === 'tl' ? btn.labelTl : btn.labelEn}
          </button>
        ))}
      </div>

      {needsComment && (
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder={lang === 'tl' ? 'Anong nangyari? (opsyonal)' : 'What went wrong? (optional)'}
          maxLength={500}
          rows={2}
          className="w-full text-sm border border-line rounded-xl px-3 py-2.5 bg-paper-2 text-ink placeholder:text-ink-3 resize-none focus:outline-none focus:border-ink-3"
        />
      )}

      {selected && (
        <button
          onClick={submit}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-ink text-white text-sm font-semibold hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          {lang === 'tl' ? 'Isumite ang feedback' : 'Submit feedback'}
        </button>
      )}
    </div>
  )
}
