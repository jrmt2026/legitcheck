import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: Request) {
  // No auth required — seller doesn't need an account
  const supabase = await createClient()

  // Rate limit: 1 dispute per share token per IP per 24h
  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'
  const ipHash = createHash('sha256').update(rawIp).digest('hex')

  const { token, issueType, message } = await req.json()

  if (!token || !issueType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Check for duplicate dispute from same IP on same token within 24h
  const { count: existingCount } = await serviceClient
    .from('disputes')
    .select('*', { count: 'exact', head: true })
    .eq('share_token', token)
    .eq('reporter_ip_hash', ipHash)
    .gte('created_at', new Date(Date.now() - 86_400_000).toISOString())

  if ((existingCount ?? 0) >= 1) {
    return NextResponse.json({ error: 'You have already submitted a dispute for this report' }, { status: 429 })
  }

  // Get share link
  const { data: shareLink } = await supabase
    .from('share_links')
    .select('token, check_id, expires_at, dispute_count')
    .eq('token', token)
    .single()

  if (!shareLink) return NextResponse.json({ error: 'Share link not found' }, { status: 404 })
  if (new Date(shareLink.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Share link has expired' }, { status: 410 })
  }

  // Insert dispute
  const { error } = await supabase.from('disputes').insert({
    share_token:      token,
    check_id:         shareLink.check_id,
    issue_type:       issueType,
    message:          message || null,
    reporter_ip_hash: ipHash,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Increment dispute count
  await supabase
    .from('share_links')
    .update({ dispute_count: (shareLink.dispute_count || 0) + 1 })
    .eq('token', token)

  return NextResponse.json({ success: true })
}
