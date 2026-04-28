import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { checkId, amount } = await req.json()

  if (!checkId) return NextResponse.json({ error: 'Missing checkId' }, { status: 400 })

  // Verify this check belongs to user
  const { data: check } = await supabase
    .from('checks')
    .select('id')
    .eq('id', checkId)
    .eq('user_id', user.id)
    .single()

  if (!check) return NextResponse.json({ error: 'Check not found' }, { status: 404 })

  const amountNum = parseInt(amount) || 0
  const isFree = amountNum <= 1000

  // Check if paid unlock required
  if (!isFree) {
    // TODO: verify payment before proceeding
    // For now, flag it — frontend enforces the paywall
    // In production: check if user has active Full Check plan or credit
  }

  // Check if share link already exists for this check
  const { data: existing } = await supabase
    .from('share_links')
    .select('token, expires_at')
    .eq('check_id', checkId)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (existing) {
    return NextResponse.json({
      token: existing.token,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/share/${existing.token}`,
      expiresAt: existing.expires_at,
      alreadyExisted: true,
    })
  }

  // Generate new token
  const token = nanoid(21)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

  const { error } = await supabase.from('share_links').insert({
    token,
    check_id: checkId,
    user_id: user.id,
    amount: amountNum,
    is_free: isFree,
    expires_at: expiresAt,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    token,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/share/${token}`,
    expiresAt,
    isFree,
  })
}
