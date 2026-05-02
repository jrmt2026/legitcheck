import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BadgeCheck, Shield, CheckCircle, ExternalLink } from 'lucide-react'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import LegitCardCopyButton from '@/components/LegitCardCopyButton'

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const BADGE_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  pending:           { label: 'Pending Review',        color: 'text-ink-3',           desc: 'Under review — 3–5 business days.' },
  id_verified:       { label: 'ID Verified',           color: 'text-blue-600',        desc: 'Identity confirmed. Apply for business verification to unlock the full badge.' },
  business_verified: { label: 'Business Verified',     color: 'text-brand-green-dark', desc: 'DTI/SEC confirmed. Share your badge link!' },
  fully_verified:    { label: 'LegitCheck Verified ✓', color: 'text-brand-green-dark', desc: 'Full verification complete. You are a trusted seller on LegitCheck PH.' },
  rejected:          { label: 'Application Rejected',  color: 'text-brand-red-dark',  desc: 'Not approved. See reason below.' },
}

export default async function SellerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch seller verification
  const { data: verification } = await serviceClient
    .from('seller_verifications')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  // Fetch payment verification history (graceful if table doesn't exist yet)
  let paymentChecks: any[] = []
  try {
    const { data } = await serviceClient
      .from('payment_verifications')
      .select('id, verdict, confidence, platform, summary, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    paymentChecks = data || []
  } catch { /* table may not exist yet */ }

  const badgeInfo = verification ? (BADGE_LABELS[verification.badge_level] || BADGE_LABELS.pending) : null
  const publicUrl = verification?.public_slug
    ? `https://legitcheck-ph.vercel.app/verify/${verification.public_slug}`
    : null

  const shareText = publicUrl && verification?.seller_name
    ? `Hi! I'm a verified seller on LegitCheck PH 🛡️\nCheck my profile: ${publicUrl}\n\n"${verification.seller_name}" — ${badgeInfo?.label}`
    : null

  const VERDICT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    authentic:    { label: 'Authentic',   color: 'text-brand-green-dark',  bg: 'bg-brand-green-light'  },
    suspicious:   { label: 'Suspicious',  color: 'text-brand-yellow-dark', bg: 'bg-brand-yellow-light' },
    likely_fake:  { label: 'Likely Fake', color: 'text-brand-red-dark',    bg: 'bg-brand-red-light'    },
    inconclusive: { label: 'Inconclusive',color: 'text-ink-2',             bg: 'bg-paper-2'            },
  }

  return (
    <div className="min-h-screen bg-paper-2">
      <header className="border-b border-line bg-paper px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <Link href="/dashboard" className="text-ink-3 hover:text-ink transition-colors p-1 -ml-1">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-baseline gap-1">
          <span className="text-base font-medium text-ink">Seller Dashboard</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Verification status */}
        {!verification ? (
          <div className="card text-center py-8">
            <Shield size={32} className="text-ink-3 mx-auto mb-3" />
            <p className="text-base font-semibold text-ink mb-1">Get your seller badge</p>
            <p className="text-sm text-ink-3 mb-4 leading-relaxed">
              A LegitCheck badge tells buyers your shop is real. Apply for verification to get your shareable badge link.
            </p>
            <Link href="/seller" className="inline-flex items-center gap-2 px-5 py-3 bg-ink text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
              <BadgeCheck size={14} /> Apply for Verification
            </Link>
          </div>
        ) : (
          <div className="card space-y-4">
            <div className="flex items-center gap-3">
              <BadgeCheck size={20} className={badgeInfo?.color || 'text-ink-3'} />
              <div>
                <p className={`text-base font-semibold ${badgeInfo?.color || 'text-ink-3'}`}>{badgeInfo?.label}</p>
                <p className="text-xs text-ink-3 mt-0.5">{badgeInfo?.desc}</p>
              </div>
            </div>
            {verification.rejection_reason && (
              <p className="text-sm text-brand-red-dark bg-brand-red-light rounded-xl px-3 py-2">{verification.rejection_reason}</p>
            )}
            {publicUrl && verification.badge_level !== 'pending' && verification.badge_level !== 'rejected' && (
              <Link href={publicUrl} target="_blank" className="flex items-center gap-2 text-sm text-ink-2 hover:text-ink transition-colors">
                <ExternalLink size={13} /> View your badge page
              </Link>
            )}
          </div>
        )}

        {/* Legit Card share */}
        {shareText && (
          <div className="card space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-brand-green" />
              <p className="sec-label mb-0">Your "I'm Legit" Card</p>
            </div>
            <p className="text-xs text-ink-3 leading-relaxed">
              I-share ito sa iyong buyers sa Viber, Messenger, o kahit saan:
            </p>
            <div className="bg-paper-2 border border-line rounded-xl px-3 py-3">
              <pre className="text-xs text-ink-2 whitespace-pre-wrap font-sans leading-relaxed">{shareText}</pre>
            </div>
            <LegitCardCopyButton text={shareText} />
          </div>
        )}

        {/* Payment check history */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="sec-label mb-0">Payment Receipts Checked</p>
            <Link href="/verify-payment" className="text-xs text-ink-3 hover:text-ink transition-colors">
              + New check
            </Link>
          </div>

          {paymentChecks.length === 0 ? (
            <div className="card text-center py-8">
              <Shield size={24} className="text-ink-3 mx-auto mb-2" />
              <p className="text-sm font-medium text-ink-2">No payment checks yet</p>
              <p className="text-xs text-ink-3 mt-1 mb-4">Verify buyer payment receipts before releasing goods.</p>
              <Link href="/verify-payment" className="inline-flex items-center gap-2 px-4 py-2.5 bg-ink text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity">
                Check a receipt
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {paymentChecks.map(check => {
                const v = VERDICT_LABELS[check.verdict] || VERDICT_LABELS.inconclusive
                return (
                  <div key={check.id} className="card flex items-center gap-3">
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${v.bg} ${v.color}`}>{v.label}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink truncate capitalize">{check.platform} · {check.confidence}% confidence</p>
                      <p className="text-xs text-ink-3 mt-0.5 truncate">{check.summary}</p>
                      <p className="text-xs text-ink-3 mt-0.5">
                        {new Date(check.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Shield score summary */}
        <div className="bg-ink rounded-2xl px-4 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-brand-green" />
            <p className="text-sm font-semibold text-white">Seller Shield Summary</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/8 rounded-xl px-3 py-2.5 text-center">
              <p className="text-lg font-bold text-white font-mono">{paymentChecks.length}</p>
              <p className="text-xs text-white/50 mt-0.5">Receipts checked</p>
            </div>
            <div className="bg-white/8 rounded-xl px-3 py-2.5 text-center">
              <p className="text-lg font-bold text-white font-mono">
                {paymentChecks.filter(c => c.verdict === 'likely_fake').length}
              </p>
              <p className="text-xs text-white/50 mt-0.5">Fake proofs blocked</p>
            </div>
          </div>
        </div>

        <div className="pb-8" />
      </div>
    </div>
  )
}

