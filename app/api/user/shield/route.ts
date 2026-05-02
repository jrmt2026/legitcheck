import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { amount } = await req.json()
  const amt = Math.max(0, Math.min(10_000_000, Number(amount) || 0))
  if (!amt) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('shield_total')
    .eq('id', user.id)
    .single()

  const current = profile?.shield_total ?? 0
  await supabase
    .from('profiles')
    .update({ shield_total: current + amt })
    .eq('id', user.id)

  return NextResponse.json({ shield_total: current + amt })
}
