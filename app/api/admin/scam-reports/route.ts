import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

async function assertAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email || '')) return null
  return user
}

export async function GET(req: Request) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'pending'

  // Counts per status for tab badges
  const { data: countRows } = await serviceClient
    .from('scam_reports')
    .select('status')

  const counts = { pending: 0, approved: 0, rejected: 0, all: 0 }
  for (const r of countRows || []) {
    counts.all++
    if (r.status === 'pending')  counts.pending++
    if (r.status === 'approved') counts.approved++
    if (r.status === 'rejected') counts.rejected++
  }

  // Fetch reports for selected status
  let query = serviceClient
    .from('scam_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status !== 'all') query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ reports: data || [], counts })
}

export async function PATCH(req: Request) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, status, admin_note } = await req.json()

  if (!id || !['approved', 'rejected', 'pending'].includes(status)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Get report before updating (need reporter_id for credit logic)
  const { data: report } = await serviceClient
    .from('scam_reports')
    .select('reporter_id, status')
    .eq('id', id)
    .single()

  const update: Record<string, unknown> = {
    status,
    is_verified: status === 'approved',
    moderated_at: new Date().toISOString(),
  }
  if (admin_note !== undefined) update.admin_note = admin_note || null

  const { error } = await serviceClient
    .from('scam_reports')
    .update(update)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Award earned credit when a report is approved (3 accepted = 1 credit, max 2/month)
  if (status === 'approved' && report?.reporter_id && report.status !== 'approved') {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const [{ count: acceptedCount }, { count: creditsEarned }] = await Promise.all([
      serviceClient.from('scam_reports')
        .select('*', { count: 'exact', head: true })
        .eq('reporter_id', report.reporter_id)
        .eq('status', 'approved')
        .gte('moderated_at', startOfMonth.toISOString()),
      serviceClient.from('credit_batches')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', report.reporter_id)
        .eq('source', 'earned_report_reward')
        .gte('created_at', startOfMonth.toISOString()),
    ])

    const accepted = (acceptedCount ?? 0) + 1 // include this one
    const alreadyEarned = creditsEarned ?? 0

    if (accepted % 3 === 0 && alreadyEarned < 2) {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 60)

      const { data: batch } = await serviceClient.from('credit_batches').insert({
        user_id: report.reporter_id,
        source: 'earned_report_reward',
        total_credits: 1,
        used_credits: 0,
        expires_at: expiresAt.toISOString(),
      }).select().single()

      if (batch) {
        await serviceClient.from('credit_ledger').insert({
          user_id: report.reporter_id,
          batch_id: batch.id,
          delta: 1,
          description: 'Earned: 3 accepted scam reports',
        })
        const { data: newBalance } = await serviceClient.rpc('get_premium_credits', { p_user_id: report.reporter_id })
        await serviceClient.from('profiles').update({ credits_remaining: newBalance ?? 0 }).eq('id', report.reporter_id)
      }
    }
  }

  return NextResponse.json({ success: true })
}
