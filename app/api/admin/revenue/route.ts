import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/supabase/assertAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = createAdminClient()
  const today = new Date(); today.setHours(0,0,0,0)
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0)

  const [
    { data: allPayments },
    { data: paidBatches },
    { data: earnedBatches },
    { data: payingUsers },
  ] = await Promise.all([
    db.from('payments').select('id,user_id,plan_id,amount_cents,status,created_at').order('created_at',{ascending:false}).limit(500),
    db.from('credit_batches').select('total_credits,used_credits,source').eq('source','purchase'),
    db.from('credit_batches').select('total_credits,used_credits').eq('source','earned_report_reward'),
    db.from('payments').select('user_id').eq('status','paid'),
  ])

  const paid    = (allPayments ?? []).filter(p => p.status === 'paid')
  const failed  = (allPayments ?? []).filter(p => ['failed','expired','canceled'].includes(p.status))
  const pending = (allPayments ?? []).filter(p => p.status === 'pending')

  const grossAll   = paid.reduce((s,p) => s + (p.amount_cents||0), 0)
  const grossToday = paid.filter(p => p.created_at >= today.toISOString()).reduce((s,p) => s + (p.amount_cents||0), 0)
  const grossMonth = paid.filter(p => p.created_at >= startOfMonth.toISOString()).reduce((s,p) => s + (p.amount_cents||0), 0)

  // Revenue by plan
  const byPlan: Record<string, { count: number; total_cents: number }> = {}
  for (const p of paid) {
    const id = p.plan_id || 'unknown'
    if (!byPlan[id]) byPlan[id] = { count: 0, total_cents: 0 }
    byPlan[id].count++
    byPlan[id].total_cents += p.amount_cents || 0
  }
  const byPlanArr = Object.entries(byPlan).map(([plan_id, v]) => ({ plan_id, ...v })).sort((a,b) => b.total_cents - a.total_cents)

  // ARPU
  const uniquePaying = new Set((payingUsers ?? []).map(p => p.user_id)).size
  const arpu = uniquePaying > 0 ? Math.round(grossAll / uniquePaying) : 0

  // Credits
  const creditsSold    = (paidBatches ?? []).reduce((s,b) => s + (b.total_credits||0), 0)
  const creditsUsedPaid = (paidBatches ?? []).reduce((s,b) => s + (b.used_credits||0), 0)
  const unusedPaid     = creditsSold - creditsUsedPaid
  const earnedIssued   = (earnedBatches ?? []).reduce((s,b) => s + (b.total_credits||0), 0)
  const totalAttempts  = paid.length + failed.length + pending.length

  return NextResponse.json({
    gross_all_time: grossAll,
    gross_today:    grossToday,
    gross_month:    grossMonth,
    by_plan:        byPlanArr,
    paid_count:     paid.length,
    failed_count:   failed.length,
    pending_count:  pending.length,
    success_rate:   totalAttempts > 0 ? Math.round((paid.length / totalAttempts) * 100) : 0,
    arpu_cents:     arpu,
    unique_paying:  uniquePaying,
    credits_sold:   creditsSold,
    credits_used:   creditsUsedPaid,
    unused_paid:    unusedPaid,
    earned_issued:  earnedIssued,
    liability_pesos: unusedPaid * 79,
    recent_payments: (allPayments ?? []).slice(0, 15),
  })
}
