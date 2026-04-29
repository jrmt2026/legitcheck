import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { FeedbackType } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: Request) {
  const { check_id, feedback_type, user_comment }: {
    check_id: string
    feedback_type: FeedbackType
    user_comment?: string
  } = await req.json()

  if (!check_id || !feedback_type) {
    return NextResponse.json({ error: 'check_id and feedback_type required' }, { status: 400 })
  }

  const validTypes: FeedbackType[] = ['accurate', 'false_positive', 'false_negative', 'unclear']
  if (!validTypes.includes(feedback_type)) {
    return NextResponse.json({ error: 'Invalid feedback_type' }, { status: 400 })
  }

  // Try to get user from auth header
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  let userId: string | null = null
  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token)
    if (user) userId = user.id
  }

  const { error } = await supabase.from('feedback').insert({
    check_id,
    user_id: userId,
    feedback_type,
    user_comment: user_comment?.slice(0, 500) || null,
  })

  if (error) {
    // Duplicate feedback is OK — just return success
    if (error.code === '23505') return NextResponse.json({ ok: true })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
