import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { getAiBudgetStatus } from '@/lib/aiBudget'

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

export async function GET() {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Fetch today + last 6 days
  const days: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }

  const [today, ...history] = await Promise.all(days.map(d => getAiBudgetStatus(d)))

  return NextResponse.json({ today, history: [today, ...history] })
}

export async function PATCH(req: Request) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { dailyLimitUsd } = await req.json()
  const limit = Number(dailyLimitUsd)

  if (isNaN(limit) || limit < 0.5 || limit > 500) {
    return NextResponse.json({ error: 'Limit must be between $0.50 and $500' }, { status: 400 })
  }

  const { error } = await serviceClient
    .from('ai_budget_config')
    .upsert({ id: 1, daily_limit_usd: limit, updated_at: new Date().toISOString() })
    .eq('id', 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, dailyLimitUsd: limit })
}
