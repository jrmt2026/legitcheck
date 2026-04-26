import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

function normalizeIdentifier(raw: string): string {
  const stripped = raw.replace(/[\s\-().]/g, '')
  if (stripped.startsWith('+639')) return '0' + stripped.slice(3)
  if (stripped.startsWith('639'))  return '0' + stripped.slice(2)
  return stripped.toLowerCase()
}

export async function POST(req: Request) {
  const body = await req.json()
  const { identifier, identifier_type, account_name, platform, category, description, amount_lost, check_id } = body

  if (!identifier?.trim() || !identifier_type || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Get current user (optional — allow anonymous reports)
  let reporter_id: string | null = null
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) reporter_id = user.id
  } catch { /* anonymous ok */ }

  const { data, error } = await serviceClient.from('scam_reports').insert({
    identifier: normalizeIdentifier(identifier),
    identifier_type,
    account_name:  account_name?.trim() || null,
    platform:      platform || null,
    category,
    description:   description?.trim() || null,
    amount_lost:   amount_lost ? Number(amount_lost) : null,
    check_id:      check_id || null,
    reporter_id,
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, id: data.id })
}
