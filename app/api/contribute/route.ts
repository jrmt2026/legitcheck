import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: Request) {
  const { check_id, contribute }: { check_id: string; contribute: boolean } = await req.json()

  if (!check_id) {
    return NextResponse.json({ error: 'check_id required' }, { status: 400 })
  }

  // Verify ownership via auth header
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  // Verify the check belongs to this user
  const { data: check } = await supabase
    .from('checks')
    .select('id, user_id')
    .eq('id', check_id)
    .eq('user_id', user.id)
    .single()

  if (!check) {
    return NextResponse.json({ error: 'Check not found' }, { status: 404 })
  }

  // Update is_public_reference flag
  const { error } = await supabase
    .from('checks')
    .update({ is_public_reference: contribute })
    .eq('id', check_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, is_public_reference: contribute })
}
