import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, ShieldAlert, Clock, ExternalLink, BadgeCheck } from 'lucide-react'

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const BADGE_CONFIG = {
  pending: {
    icon: Clock,
    label: 'Verification Pending',
    color: 'text-ink-3',
    bg: 'bg-paper-2',
    border: 'border-line',
    desc: 'This seller has submitted their information and is awaiting review by the LegitCheck team.',
  },
  id_verified: {
    icon: ShieldCheck,
    label: 'ID Verified',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    desc: 'The seller\'s government-issued ID has been verified by LegitCheck.',
  },
  business_verified: {
    icon: ShieldCheck,
    label: 'Business Verified',
    color: 'text-brand-green-dark',
    bg: 'bg-brand-green-light',
    border: 'border-brand-green/20',
    desc: 'The seller\'s business registration (DTI/SEC) has been verified by LegitCheck.',
  },
  fully_verified: {
    icon: BadgeCheck,
    label: 'LegitCheck Verified ✓',
    color: 'text-brand-green-dark',
    bg: 'bg-brand-green-light',
    border: 'border-brand-green/30',
    desc: 'This seller has passed full identity and business verification by LegitCheck PH.',
  },
  rejected: null,
}

export default async function VerifyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const { data: seller, error } = await serviceClient
    .from('seller_verifications')
    .select('*')
    .eq('public_slug', slug)
    .maybeSingle()

  if (!seller || error || seller.badge_level === 'rejected') notFound()

  const badge = BADGE_CONFIG[seller.badge_level as keyof typeof BADGE_CONFIG]
  if (!badge) notFound()

  const Icon = badge.icon
  const verifiedDate = new Date(seller.updated_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen bg-paper-2 flex flex-col items-center justify-start py-10 px-4">
      <div className="w-full max-w-sm space-y-5 animate-slide-up">

        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-baseline gap-1 mb-6">
            <span className="text-lg font-semibold text-ink">LegitCheck</span>
            <span className="text-lg font-light text-ink-2">PH</span>
          </Link>
          <p className="text-xs font-mono uppercase tracking-widest text-ink-3">Seller Verification</p>
        </div>

        {/* Badge card */}
        <div className={`rounded-2xl border ${badge.border} ${badge.bg} px-6 py-8 text-center`}>
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/60 mb-4`}>
            <Icon size={32} className={badge.color} />
          </div>
          <h1 className={`text-2xl font-semibold ${badge.color} mb-1`}>{badge.label}</h1>
          <p className="text-sm text-ink-2 leading-relaxed mt-2">{badge.desc}</p>
        </div>

        {/* Seller info */}
        <div className="bg-paper border border-line rounded-2xl divide-y divide-line">
          <div className="px-4 py-3.5">
            <p className="text-xs font-mono text-ink-3 uppercase tracking-widest mb-0.5">Seller Name</p>
            <p className="text-base font-medium text-ink">{seller.seller_name}</p>
          </div>

          {seller.shop_name && (
            <div className="px-4 py-3.5">
              <p className="text-xs font-mono text-ink-3 uppercase tracking-widest mb-0.5">Shop / Brand</p>
              <p className="text-base text-ink">{seller.shop_name}</p>
            </div>
          )}

          {seller.description && (
            <div className="px-4 py-3.5">
              <p className="text-xs font-mono text-ink-3 uppercase tracking-widest mb-0.5">About</p>
              <p className="text-sm text-ink-2 leading-relaxed">{seller.description}</p>
            </div>
          )}

          {seller.platforms?.length > 0 && (
            <div className="px-4 py-3.5">
              <p className="text-xs font-mono text-ink-3 uppercase tracking-widest mb-1.5">Platforms</p>
              <div className="flex flex-wrap gap-2">
                {seller.platforms.map((p: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-paper-2 border border-line rounded-full text-xs text-ink-2 capitalize">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {seller.platform_handles?.filter(Boolean).length > 0 && (
            <div className="px-4 py-3.5">
              <p className="text-xs font-mono text-ink-3 uppercase tracking-widest mb-1.5">Links / Handles</p>
              <div className="space-y-1">
                {seller.platform_handles.filter(Boolean).map((h: string, i: number) => (
                  <p key={i} className="text-sm text-ink-2 break-all">{h}</p>
                ))}
              </div>
            </div>
          )}

          <div className="px-4 py-3.5">
            <p className="text-xs font-mono text-ink-3 uppercase tracking-widest mb-0.5">Verified Date</p>
            <p className="text-sm text-ink-2">{verifiedDate}</p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-l-2 border-line pl-3 py-1">
          <p className="text-xs text-ink-3 leading-relaxed">
            This verification confirms the seller's identity and/or business registration as submitted.
            LegitCheck PH does not guarantee transaction outcomes. Always use secure payment channels.
          </p>
        </div>

        <Link
          href="/buyer"
          className="flex items-center justify-center gap-2 w-full py-3 border border-line bg-paper text-sm text-ink-2 rounded-xl hover:bg-ink hover:text-white hover:border-ink transition-all"
        >
          <ExternalLink size={14} />
          Check something yourself
        </Link>

        <p className="text-center text-xs text-ink-3">legitcheck-ph.vercel.app/verify/{slug}</p>
      </div>
    </div>
  )
}
