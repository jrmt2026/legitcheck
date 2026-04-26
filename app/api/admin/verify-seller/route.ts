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

export async function PATCH(req: Request) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, badge_level, rejection_reason } = await req.json()
  if (!id || !badge_level) return NextResponse.json({ error: 'Missing id or badge_level' }, { status: 400 })

  const { error } = await serviceClient
    .from('seller_verifications')
    .update({ badge_level, rejection_reason: rejection_reason || null, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function GET(req: Request) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') || 'pending'

  const query = serviceClient
    .from('seller_verifications')
    .select('*')
    .order('created_at', { ascending: false })

  if (filter !== 'all') query.eq('badge_level', filter)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ verifications: data || [] })
}
