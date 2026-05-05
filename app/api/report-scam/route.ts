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
  // Rate limit: max 5 reports per IP per day + 1 per target per 30 days
  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'
  const ipHash = createHash('sha256').update(rawIp).digest('hex')

  const { count: recentCount } = await serviceClient
    .from('scam_reports')
    .select('*', { count: 'exact', head: true })
    .eq('reporter_ip_hash', ipHash)
    .gte('created_at', new Date(Date.now() - 86_400_000).toISOString())

  if ((recentCount ?? 0) >= 5) {
    return NextResponse.json({ error: 'You have reached the daily report limit (5 per day). Please try again tomorrow.', rateLimited: true }, { status: 429 })
  }

  const body = await req.json()
  const { identifier, identifier_type, account_name, platform, category, description, amount_lost, check_id, declarationSworn } = body

  if (!category || !description?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // 1 report per identifier per 30 days per IP (prevents targeted harassment)
  if (identifier?.trim()) {
    const normalizedId = normalizeIdentifier(identifier)
    const { count: targetCount } = await serviceClient
      .from('scam_reports')
      .select('*', { count: 'exact', head: true })
      .eq('reporter_ip_hash', ipHash)
      .eq('identifier', normalizedId)
      .gte('created_at', new Date(Date.now() - 30 * 86_400_000).toISOString())
    if ((targetCount ?? 0) >= 1) {
      return NextResponse.json({ error: 'You have already submitted a report for this account within the last 30 days.', rateLimited: true }, { status: 429 })
    }
  }

  // Get current user (optional — allow anonymous reports)
  let reporter_id: string | null = null
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) reporter_id = user.id
  } catch { /* anonymous ok */ }

  const { data, error } = await serviceClient.from('scam_reports').insert({
    ...(identifier?.trim() && {
      identifier:     normalizeIdentifier(identifier),
      identifier_type: identifier_type || 'other',
    }),
    account_name:         account_name?.trim() || null,
    platform:             platform || null,
    category,
    description:          description?.trim() || null,
    amount_lost:          amount_lost ? Number(amount_lost) : null,
    check_id:             check_id || null,
    reporter_id,
    reporter_ip_hash:     ipHash,
    is_verified:          false,
    declaration_sworn:    Boolean(declarationSworn),
    declaration_timestamp: declarationSworn ? new Date().toISOString() : null,
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, id: data.id })
}
