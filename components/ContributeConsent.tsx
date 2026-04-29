'use client'

import { useState } from 'react'
import { Shield, Users, Gift, ChevronDown, ChevronUp, Loader2, Lock } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Props {
  checkId?: string
  lang?: 'en' | 'tl'
  isLoggedIn?: boolean
  userToken?: string
}

export default function ContributeConsent({ checkId, lang = 'en', isLoggedIn = false, userToken }: Props) {
  const [expanded, setExpanded]   = useState(false)
  const [contributed, setContributed] = useState(false)
  const [loading, setLoading]     = useState(false)

  // If no checkId, we can't contribute
  if (!checkId) return null

  async function handleContribute(contribute: boolean) {
    if (!isLoggedIn || !userToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/contribute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({ check_id: checkId, contribute }),
      })
      if (res.ok) {
        setContributed(true)
        if (contribute) {
          toast.success(lang === 'tl'
            ? 'Salamat! Ang iyong report ay makakatulong sa ibang tao.'
            : 'Thank you! Your report will help protect others.')
        }
      } else {
        toast.error(lang === 'tl' ? 'Hindi nasave.' : 'Could not save preference.')
      }
    } catch {
      toast.error(lang === 'tl' ? 'Hindi nasave.' : 'Could not save preference.')
    } finally {
      setLoading(false)
    }
  }

  if (contributed) {
    return (
      <div className="bg-ink rounded-2xl p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-brand-green" />
          <p className="text-sm font-semibold text-white">
            {lang === 'tl' ? 'Nai-contribute na ang report mo!' : 'Report contributed!'}
          </p>
        </div>
        <p className="text-xs text-white/60 leading-relaxed">
          {lang === 'tl'
            ? 'Ang iyong anonymized na report ay makakatulong sa aming community na maprotektahan laban sa ganitong uri ng scam.'
            : 'Your anonymized report will help our community identify and avoid similar scams.'}
        </p>
        {/* Reward loop CTA */}
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <Gift size={13} className="text-brand-yellow" />
            <p className="text-xs font-semibold text-brand-yellow">
              {lang === 'tl' ? 'Kumita ng libreng premium check!' : 'Earn a free premium check!'}
            </p>
          </div>
          <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
            {lang === 'tl'
              ? 'Mag-submit ng 2 accepted na report at makakuha ng 1 libreng premium check. Makikita ang iyong credits sa iyong dashboard.'
              : 'Submit 2 accepted reports, earn 1 free premium check. Credits appear in your dashboard.'}
          </p>
        </div>
      </div>
    )
  }

  // Guest — show signup CTA
  if (!isLoggedIn) {
    return (
      <div className="border border-line rounded-2xl p-4 space-y-3 bg-paper">
        <div className="flex items-center gap-2">
          <Users size={15} className="text-ink-3" />
          <p className="text-sm font-semibold text-ink">
            {lang === 'tl' ? 'Tulungan ang iba. Gumawa ng libre na account.' : 'Help protect others. Create a free account.'}
          </p>
        </div>
        <p className="text-xs text-ink-3 leading-relaxed">
          {lang === 'tl'
            ? 'Mag-sign up para ma-contribute ang iyong report at kumita ng free premium checks.'
            : 'Sign up to anonymously contribute your report to the community and earn free premium checks.'}
        </p>
        <div className="flex items-center gap-1.5 bg-ink/5 rounded-xl px-3 py-2">
          <Gift size={12} className="text-brand-yellow flex-shrink-0" />
          <p className="text-[11px] text-ink-2">
            {lang === 'tl'
              ? 'Mag-submit ng 2 helpful na report → makakuha ng 1 libreng premium check'
              : 'Submit 2 helpful reports → earn 1 free premium check'}
          </p>
        </div>
        <Link href="/auth/signup"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-ink text-white text-sm font-semibold hover:opacity-90 transition-opacity">
          <Lock size={13} /> {lang === 'tl' ? 'Gumawa ng libreng account' : 'Create free account'}
        </Link>
      </div>
    )
  }

  // Logged in — show consent prompt
  return (
    <div className="border border-line rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between p-4 text-left bg-paper hover:bg-paper-2 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center flex-shrink-0">
            <Users size={14} className="text-brand-green" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">
              {lang === 'tl' ? 'Tulungan ang iyong komunidad' : 'Help protect your community'}
            </p>
            <p className="text-xs text-ink-3">
              {lang === 'tl' ? 'I-contribute ang report nang anonymous' : 'Anonymously contribute this report'}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={14} className="text-ink-3" /> : <ChevronDown size={14} className="text-ink-3" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-3 bg-paper border-t border-line">
          <p className="text-xs text-ink-2 leading-relaxed pt-3">
            {lang === 'tl'
              ? 'Ang iyong personal na impormasyon ay hindi ibibigay. Ang mga numero ng telepono, account, at pangalan ay imi-mask bago ibahagi. Ang data na ito ay gagamitin upang protektahan ang ibang tao mula sa katulad na scam.'
              : 'Your personal information is never shared. Phone numbers, accounts, and names are masked before being added to the community database. This data is used to protect others from similar scams.'}
          </p>
          <div className="flex items-center gap-1.5 bg-ink/5 rounded-xl px-3 py-2">
            <Gift size={12} className="text-brand-yellow flex-shrink-0" />
            <p className="text-[11px] text-ink-2">
              {lang === 'tl'
                ? 'Mag-submit ng 2 accepted na report → makakuha ng 1 libreng premium check'
                : 'Submit 2 accepted reports → earn 1 free premium check'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleContribute(false)}
              disabled={loading}
              className="py-2.5 rounded-xl border border-line bg-paper-2 text-xs font-medium text-ink-2 hover:bg-paper hover:border-ink-3 transition-all disabled:opacity-50"
            >
              {lang === 'tl' ? 'Hindi, salamat' : 'No thanks'}
            </button>
            <button
              onClick={() => handleContribute(true)}
              disabled={loading}
              className="py-2.5 rounded-xl bg-brand-green text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading
                ? <Loader2 size={12} className="animate-spin" />
                : <Shield size={12} />}
              {lang === 'tl' ? 'Yes, i-contribute' : 'Yes, contribute'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
