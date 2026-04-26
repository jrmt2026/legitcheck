import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base)
  let attempt = 0
  while (true) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt}`
    const { data } = await serviceClient
      .from('seller_verifications')
      .select('id')
      .eq('public_slug', candidate)
      .maybeSingle()
    if (!data) return candidate
    attempt++
  }
}

export async function POST(req: Request) {
  // Auth required for seller verification
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json()
  const { seller_name, shop_name, platforms, platform_handles, contact_number, dti_number, sec_number, description } = body

  if (!seller_name?.trim()) return NextResponse.json({ error: 'Seller name is required' }, { status: 400 })

  // Check if already applied
  const { data: existing } = await serviceClient
    .from('seller_verifications')
    .select('id, badge_level, public_slug')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'You have already submitted a verification request.', existing }, { status: 409 })
  }

  const public_slug = await uniqueSlug(shop_name || seller_name)

  const { data, error } = await serviceClient.from('seller_verifications').insert({
    user_id:          user.id,
    seller_name:      seller_name.trim(),
    shop_name:        shop_name?.trim() || null,
    platforms:        platforms || [],
    platform_handles: platform_handles || [],
    contact_number:   contact_number?.trim() || null,
    dti_number:       dti_number?.trim() || null,
    sec_number:       sec_number?.trim() || null,
    description:      description?.trim() || null,
    badge_level:      'pending',
    public_slug,
  }).select('id, public_slug, badge_level').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, public_slug: data.public_slug, badge_level: data.badge_level })
}

export async function GET(req: Request) {
  // Get current user's verification status
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ status: 'none' })

  const { data } = await serviceClient
    .from('seller_verifications')
    .select('id, badge_level, public_slug, seller_name, shop_name, rejection_reason, created_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!data) return NextResponse.json({ status: 'none' })
  return NextResponse.json({ status: 'exists', verification: data })
}
