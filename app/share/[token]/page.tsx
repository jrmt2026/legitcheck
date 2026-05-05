import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import SharePageClient from './SharePageClient'
import type { DecisionResult } from '@/types'

interface Props {
  params: { token: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient()
  const { data: shareLink } = await supabase
    .from('share_links')
    .select('checks(score, color, result)')
    .eq('token', params.token)
    .single()

  const check   = Array.isArray(shareLink?.checks) ? shareLink.checks[0] : (shareLink?.checks as any)
  const color   = (check?.color as string) || 'yellow'
  const score   = check?.score ?? 50
  const trust   = 100 - score
  const result  = check?.result as any
  const headline = (result?.headline?.en as string) || 'Transaction Risk Result'

  const LABELS: Record<string, string> = {
    green: 'Likely Safe', yellow: 'Needs Verification', orange: 'Suspicious', red: 'High Risk',
  }
  const label  = LABELS[color] ?? 'Risk Result'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://legitcheck-ph.vercel.app'

  return {
    title: `${label} (${trust}/100) — LegitCheck PH`,
    description: `Safety Score: ${trust}/100. ${headline} · Checked with LegitCheck PH before sending money.`,
    robots: 'noindex',
    openGraph: {
      title: `${label} (${trust}/100) — LegitCheck PH`,
      description: headline,
      url: `${appUrl}/share/${params.token}`,
      siteName: 'LegitCheck PH',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${label} (${trust}/100) — LegitCheck PH`,
      description: headline,
    },
  }
}

export default async function SharePage({ params }: Props) {
  const supabase = await createClient()

  // Fetch share link (public read allowed by RLS)
  const { data: shareLink } = await supabase
    .from('share_links')
    .select(`
      token,
      amount,
      is_free,
      expires_at,
      view_count,
      dispute_count,
      checks (
        id,
        category_id,
        score,
        color,
        result,
        created_at
      )
    `)
    .eq('token', params.token)
    .single()

  if (!shareLink) notFound()

  const isExpired = new Date(shareLink.expires_at) < new Date()
  if (isExpired) {
    return (
      <div className="min-h-screen bg-paper-2 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="text-4xl mb-4">⏱</div>
          <h1 className="text-xl font-medium text-ink mb-2">Link expired</h1>
          <p className="text-sm text-ink-3 leading-relaxed">
            This share link was valid for 7 days and has now expired.
            Ask the buyer to generate a new link from their LegitCheck PH account.
          </p>
        </div>
      </div>
    )
  }

  // Increment view count (fire and forget)
  supabase.rpc('increment_share_view', { p_token: params.token }).then(() => {})

  const check = Array.isArray(shareLink.checks) ? shareLink.checks[0] : shareLink.checks as any
  const result = check?.result as DecisionResult

  return (
    <SharePageClient
      token={params.token}
      result={result}
      categoryId={check?.category_id}
      score={check?.score}
      color={check?.color}
      amount={shareLink.amount}
      expiresAt={shareLink.expires_at}
      checkedAt={check?.created_at}
    />
  )
}
