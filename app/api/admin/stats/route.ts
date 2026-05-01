import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [
    { count: totalUsers },
    { count: checksToday },
    { count: checksThisMonth },
    { count: pendingReports },
    { data: paidPayments },
    { data: recentUsers },
    { data: recentPayments },
  ] = await Promise.all([
    serviceClient.from('profiles').select('*', { count: 'exact', head: true }),
    serviceClient.from('checks').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    serviceClient.from('checks').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString()),
    serviceClient.from('scam_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    serviceClient.from('payments').select('amount_cents, created_at').eq('status', 'paid'),
    serviceClient.from('profiles')
      .select('id, email, full_name, credits_remaining, free_checks_this_month, created_at')
      .order('created_at', { ascending: false })
      .limit(15),
    serviceClient.from('payments')
      .select('id, plan_id, amount_cents, status, reference_no, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const revenueAllTime = (paidPayments ?? []).reduce((s, p) => s + (p.amount_cents || 0), 0)
  const revenueThisMonth = (paidPayments ?? [])
    .filter(p => p.created_at >= startOfMonth.toISOString())
    .reduce((s, p) => s + (p.amount_cents || 0), 0)

  return NextResponse.json({
    totalUsers,
    checksToday,
    checksThisMonth,
    pendingReports,
    revenueAllTime,
    revenueThisMonth,
    recentUsers: recentUsers ?? [],
    recentPayments: recentPayments ?? [],
  })
}
