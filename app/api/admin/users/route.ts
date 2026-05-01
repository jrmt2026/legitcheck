import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/supabase/assertAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const sort  = searchParams.get('sort')  || 'newest'
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  const db = createAdminClient()

  const [{ data: users }, { data: payments }] = await Promise.all([
    db.from('profiles')
      .select('id,email,full_name,plan,credits_remaining,checks_total,reports_total,free_checks_this_month,last_check_date,created_at')
      .order(sort === 'checks' ? 'checks_total' : sort === 'spent' ? 'credits_remaining' : 'created_at', { ascending: false })
      .limit(limit),
    db.from('payments').select('user_id,amount_cents').eq('status','paid'),
  ])

  // Aggregate paid amount per user
  const spentMap: Record<string, number> = {}
  for (const p of payments ?? []) {
    spentMap[p.user_id] = (spentMap[p.user_id] || 0) + (p.amount_cents || 0)
  }

  const enriched = (users ?? []).map(u => ({
    ...u,
    total_paid_cents: spentMap[u.id] || 0,
  }))

  return NextResponse.json({ users: enriched, total: enriched.length })
}

export async function PATCH(req: Request) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { user_id, action, credit_delta, note } = await req.json()
  if (!user_id || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const db = createAdminClient()

  if (action === 'adjust_credits') {
    if (typeof credit_delta !== 'number') return NextResponse.json({ error: 'Invalid delta' }, { status: 400 })

    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 12)

    if (credit_delta > 0) {
      const { data: batch } = await db.from('credit_batches').insert({
        user_id, source: 'admin_adjustment', total_credits: credit_delta, used_credits: 0, expires_at: expiresAt.toISOString(),
      }).select().single()

      if (batch) {
        await db.from('credit_ledger').insert({
          user_id, batch_id: batch.id, delta: credit_delta,
          description: `Admin adjustment${note ? ': ' + note : ''}`,
        })
      }
    } else if (credit_delta < 0) {
      await db.from('credit_ledger').insert({
        user_id, delta: credit_delta,
        description: `Admin adjustment${note ? ': ' + note : ''}`,
      })
    }

    const { data: newBalance } = await db.rpc('get_premium_credits', { p_user_id: user_id })
    await db.from('profiles').update({ credits_remaining: newBalance ?? 0 }).eq('id', user_id)
    return NextResponse.json({ success: true, new_balance: newBalance })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
