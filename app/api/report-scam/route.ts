import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

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
  // Rate limit: max 5 reports per IP per hour (prevents reputation bombing)
  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'
  const ipHash = createHash('sha256').update(rawIp).digest('hex')

  const { count: recentCount } = await serviceClient
    .from('scam_reports')
    .select('*', { count: 'exact', head: true })
    .eq('reporter_ip_hash', ipHash)
    .gte('created_at', new Date(Date.now() - 3_600_000).toISOString())

  if ((recentCount ?? 0) >= 5) {
    return NextResponse.json({ error: 'Rate limit: max 5 reports per hour' }, { status: 429 })
  }

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
    identifier:        normalizeIdentifier(identifier),
    identifier_type,
    account_name:      account_name?.trim() || null,
    platform:          platform || null,
    category,
    description:       description?.trim() || null,
    amount_lost:       amount_lost ? Number(amount_lost) : null,
    check_id:          check_id || null,
    reporter_id,
    reporter_ip_hash:  ipHash,
    is_verified:       false,
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, id: data.id })
}
