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
  return NextResponse.json({ success: true })
}
