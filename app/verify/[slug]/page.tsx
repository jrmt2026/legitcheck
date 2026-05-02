import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, ShieldAlert, Clock, ExternalLink, BadgeCheck, Building2 } from 'lucide-react'
import LegitCardCopyButton from '@/components/LegitCardCopyButton'

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// ── Badge configs ─────────────────────────────────────────────────────────────

const SELLER_BADGE_CONFIG = {
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
    desc: "The seller's government-issued ID has been verified by LegitCheck.",
  },
  business_verified: {
    icon: ShieldCheck,
    label: 'Business Verified',
    color: 'text-brand-green-dark',
    bg: 'bg-brand-green-light',
    border: 'border-brand-green/20',
    desc: "The seller's business registration (DTI/SEC) has been verified by LegitCheck.",
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

const COMPANY_BADGE_CONFIG: Record<string, { icon: any; label: string; color: string; bg: string; border: string; desc: string } | null> = {
  sec_verified: {
    icon: BadgeCheck,
    label: 'SEC Verified Business ✓',
    color: 'text-brand-green-dark',
    bg: 'bg-brand-green-light',
    border: 'border-brand-green/30',
    desc: 'This company\'s SEC registration has been confirmed automatically by LegitCheck PH.',
  },
  dti_verified: {
    icon: BadgeCheck,
    label: 'DTI Verified Business ✓',
    color: 'text-brand-green-dark',
    bg: 'bg-brand-green-light',
    border: 'border-brand-green/30',
    desc: 'This company\'s DTI registration has been confirmed automatically by LegitCheck PH.',
  },
  sec_submitted: {
    icon: Clock,
    label: 'SEC Registration on File',
    color: 'text-brand-yellow-dark',
    bg: 'bg-brand-yellow-light',
    border: 'border-brand-yellow/20',
    desc: 'This company has provided a SEC registration number. Full verification is in progress.',
  },
  dti_submitted: {
    icon: Clock,
    label: 'DTI Registration on File',
    color: 'text-brand-yellow-dark',
    bg: 'bg-brand-yellow-light',
    border: 'border-brand-yellow/20',
    desc: 'This company has provided a DTI registration number. Full verification is in progress.',
  },
  unverified: {
    icon: ShieldAlert,
    label: 'Claimed — Not Yet Verified',
    color: 'text-ink-3',
    bg: 'bg-paper-2',
    border: 'border-line',
    desc: 'This company has created an account but has not yet provided registration documents.',
  },
  failed: null,
}

export default async function VerifyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // ── Try company profile first ─────────────────────────────────────────────
  const { data: company } = await serviceClient
    .from('company_profiles')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (company) {
    const badge = COMPANY_BADGE_CONFIG[company.verification_status]
    if (!badge) notFound()

    const Icon = badge.icon
    const verifiedDate = company.verified_at
      ? new Date(company.verified_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
      : null

    return (
      <div className="min-h-screen bg-paper-2 flex flex-col items-center justify-start py-10 px-4">
        <div className="w-full max-w-sm space-y-5 animate-slide-up">

          <div className="text-center">
            <Link href="/" className="inline-flex items-baseline gap-1 mb-6">
              <span className="text-lg font-semibold text-ink">LegitCheck</span>
              <span className="text-lg font-light text-ink-2">PH</span>
            </Link>
            <div className="flex items-center justify-center gap-1.5">
              <Building2 size={11} className="text-ink-3" />
              <p className="text-xs font-mono uppercase tracking-widest text-ink-3">Business Verification</p>
            </div>
          </div>

          <div className={`rounded-2xl border ${badge.border} ${badge.bg} px-6 py-8 text-center`}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/60 mb-4">
              <Icon size={32} className={badge.color} />
            </div>
            <h1 className={`text-2xl font-semibold ${badge.color} mb-1`}>{badge.label}</h1>
            <p className="text-sm text-ink-2 leading-relaxed mt-2">{badge.desc}</p>
          </div>

          <div className="bg-paper border border-line rounded-2xl divide-y divide-line">
            <div className="px-4 py-3.5">
              <p className="text-xs font-mono text-ink-3 uppercase tracking-widest mb-0.5">Company Name</p>
              <p className="text-base font-medium text-ink">{company.company_name}</p>
            </div>

            {company.industry && (
              <div className="px-4 py-3.5">
                <p className="text-xs font-mono text-ink-3 uppercase tracking-widest mb-0.5">Industry</p>
                <p className="text-base text-ink">{company.industry}</p>
              </div>
            )}

            {company.website && (
              <div className="px-4 py-3.5">
                <p className="text-xs font-mono text-ink-3 uppercase tracking-widest mb-0.5">Website</p>
                <a href={company.website} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-ink-2 hover:underline flex items-center gap-1">
                  {company.website} <ExternalLink size={10} />
                </a>
              </div>
            )}

            {company.sec_number && (
              <div className="px-4 py-3.5">
                <p className="text-xs font-mono text-ink-3 uppercase tracking-widest mb-0.5">SEC Registration</p>
                <p className="text-sm text-ink-2">{company.sec_number}</p>
              </div>
            )}

            {company.dti_number && (
              <div className="px-4 py-3.5">
                <p className="text-xs font-mono text-ink-3 uppercase tracking-widest mb-0.5">DTI Registration</p>
                <p className="text-sm text-ink-2">{company.dti_number}</p>
              </div>
            )}

            <div className="px-4 py-3.5">
              <p className="text-xs font-mono text-ink-3 uppercase tracking-widest mb-0.5">
                {verifiedDate ? 'Verified Date' : 'Registered Date'}
              </p>
              <p className="text-sm text-ink-2">
                {verifiedDate ?? new Date(company.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="border-l-2 border-line pl-3 py-1">
            <p className="text-xs text-ink-3 leading-relaxed">
              This verification confirms the company's registration as submitted to LegitCheck PH.
              Always verify transactions through official channels before proceeding.
            </p>
          </div>

          <Link href="/buyer"
            className="flex items-center justify-center gap-2 w-full py-3 border border-line bg-paper text-sm text-ink-2 rounded-xl hover:bg-ink hover:text-white hover:border-ink transition-all">
            <ExternalLink size={14} />
            Check something yourself
          </Link>

          <p className="text-center text-xs text-ink-3">legitcheck-ph.vercel.app/verify/{slug}</p>
        </div>
      </div>
    )
  }

  // ── Fall back to seller verifications ─────────────────────────────────────
  const { data: seller, error } = await serviceClient
    .from('seller_verifications')
    .select('*')
    .eq('public_slug', slug)
    .maybeSingle()

  if (!seller || error || seller.badge_level === 'rejected') notFound()

  const badge = SELLER_BADGE_CONFIG[seller.badge_level as keyof typeof SELLER_BADGE_CONFIG]
  if (!badge) notFound()

  const Icon = badge.icon
  const verifiedDate = new Date(seller.updated_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen bg-paper-2 flex flex-col items-center justify-start py-10 px-4">
      <div className="w-full max-w-sm space-y-5 animate-slide-up">

        <div className="text-center">
          <Link href="/" className="inline-flex items-baseline gap-1 mb-6">
            <span className="text-lg font-semibold text-ink">LegitCheck</span>
            <span className="text-lg font-light text-ink-2">PH</span>
          </Link>
          <p className="text-xs font-mono uppercase tracking-widest text-ink-3">Seller Verification</p>
        </div>

        <div className={`rounded-2xl border ${badge.border} ${badge.bg} px-6 py-8 text-center`}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/60 mb-4">
            <Icon size={32} className={badge.color} />
          </div>
          <h1 className={`text-2xl font-semibold ${badge.color} mb-1`}>{badge.label}</h1>
          <p className="text-sm text-ink-2 leading-relaxed mt-2">{badge.desc}</p>
        </div>

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
                  <span key={i} className="px-3 py-1 bg-paper-2 border border-line rounded-full text-xs text-ink-2 capitalize">{p}</span>
                ))}
              </div>
            </div>
          )}

          <div className="px-4 py-3.5">
            <p className="text-xs font-mono text-ink-3 uppercase tracking-widest mb-0.5">Verified Date</p>
            <p className="text-sm text-ink-2">{verifiedDate}</p>
          </div>
        </div>

        <div className="border-l-2 border-line pl-3 py-1">
          <p className="text-xs text-ink-3 leading-relaxed">
            This verification confirms the seller's identity and/or business registration as submitted.
            LegitCheck PH does not guarantee transaction outcomes. Always use secure payment channels.
          </p>
        </div>

        {(seller.badge_level === 'id_verified' || seller.badge_level === 'business_verified' || seller.badge_level === 'fully_verified') && (
          <div className="bg-paper border border-line rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-ink-3 uppercase tracking-widest">Your "I&apos;m Legit" Card</p>
            <p className="text-xs text-ink-3">I-share sa iyong mga buyers sa Viber, Messenger, o chat:</p>
            <div className="bg-paper-2 border border-line rounded-xl px-3 py-2.5">
              <pre className="text-xs text-ink-2 whitespace-pre-wrap font-sans leading-relaxed">{
                `Hi! Verified seller po ako sa LegitCheck PH 🛡️\nI-check ang aking badge: legitcheck-ph.vercel.app/verify/${slug}\n\n"${seller.seller_name}" — ${badge.label}`
              }</pre>
            </div>
            <LegitCardCopyButton text={`Hi! Verified seller po ako sa LegitCheck PH 🛡️\nI-check ang aking badge: legitcheck-ph.vercel.app/verify/${slug}\n\n"${seller.seller_name}" — ${badge.label}`} />
          </div>
        )}

        <Link href="/buyer"
          className="flex items-center justify-center gap-2 w-full py-3 border border-line bg-paper text-sm text-ink-2 rounded-xl hover:bg-ink hover:text-white hover:border-ink transition-all">
          <ExternalLink size={14} />
          Check something yourself
        </Link>

        <p className="text-center text-xs text-ink-3">legitcheck-ph.vercel.app/verify/{slug}</p>
      </div>
    </div>
  )
}
