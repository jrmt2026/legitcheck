import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/supabase/assertAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = createAdminClient()
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0)

  const [{ data: batches }, { data: ledger }] = await Promise.all([
    db.from('credit_batches').select('*').order('created_at',{ascending:false}).limit(500),
    db.from('credit_ledger').select('id,user_id,delta,description,created_at').order('created_at',{ascending:false}).limit(50),
  ])

  const purchased = (batches ?? []).filter(b => b.source === 'purchase')
  const earned    = (batches ?? []).filter(b => b.source === 'earned_report_reward')
  const admin_adj = (batches ?? []).filter(b => b.source === 'admin_adjustment')

  const creditsSold      = purchased.reduce((s,b) => s + (b.total_credits||0), 0)
  const creditsUsedPaid  = purchased.reduce((s,b) => s + (b.used_credits||0), 0)
  const unusedPaid       = creditsSold - creditsUsedPaid

  const earnedIssued     = earned.reduce((s,b) => s + (b.total_credits||0), 0)
  const earnedUsed       = earned.reduce((s,b) => s + (b.used_credits||0), 0)
  const earnedThisMonth  = earned.filter(b => b.created_at >= startOfMonth.toISOString()).reduce((s,b) => s + (b.total_credits||0), 0)

  const adminIssued = admin_adj.reduce((s,b) => s + (b.total_credits||0), 0)

  // Active batches (unused) sorted by soonest expiry
  const activeBatches = (batches ?? [])
    .filter(b => (b.total_credits - b.used_credits) > 0)
    .sort((a,b) => {
      if (!a.expires_at) return 1
      if (!b.expires_at) return -1
      return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime()
    })
    .slice(0, 30)

  return NextResponse.json({
    credits_sold:       creditsSold,
    credits_used_paid:  creditsUsedPaid,
    unused_paid:        unusedPaid,
    liability_pesos:    unusedPaid * 79,
    earned_issued:      earnedIssued,
    earned_used:        earnedUsed,
    earned_this_month:  earnedThisMonth,
    admin_issued:       adminIssued,
    active_batches:     activeBatches,
    recent_ledger:      ledger ?? [],
  })
}
