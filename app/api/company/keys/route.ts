import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateApiKey } from '@/lib/companyAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// POST — generate a new API key
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: company } = await supabase
    .from('company_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!company) return NextResponse.json({ error: 'No company profile found' }, { status: 404 })

  const { label } = await req.json().catch(() => ({}))

  // Deactivate any previous keys
  await supabase
    .from('api_keys')
    .update({ is_active: false })
    .eq('company_id', company.id)

  const { key, hash, prefix } = generateApiKey()

  await supabase.from('api_keys').insert({
    company_id: company.id,
    key_hash: hash,
    key_prefix: prefix,
    label: label || 'Default',
    is_active: true,
  })

  // Return the full key ONCE — not stored, can't be retrieved again
  return NextResponse.json({ key, prefix })
}

// DELETE — revoke all active keys
export async function DELETE(req: Request) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: company } = await supabase
    .from('company_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await supabase
    .from('api_keys')
    .update({ is_active: false })
    .eq('company_id', company.id)

  return NextResponse.json({ success: true })
}
