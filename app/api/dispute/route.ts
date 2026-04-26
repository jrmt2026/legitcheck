import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  // No auth required — seller doesn't need an account
  const supabase = await createClient()
  const { token, issueType, message } = await req.json()

  if (!token || !issueType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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
    share_token: token,
    check_id: shareLink.check_id,
    issue_type: issueType,
    message: message || null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Increment dispute count
  await supabase
    .from('share_links')
    .update({ dispute_count: (shareLink.dispute_count || 0) + 1 })
    .eq('token', token)

  return NextResponse.json({ success: true })
}
