import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/supabase/assertAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = createAdminClient()

  const [{ data: allFeedback }, { data: lowConfidence }] = await Promise.all([
    db.from('feedback').select('id,check_id,feedback_type,user_comment,review_status,created_at').order('created_at',{ascending:false}).limit(200),
    db.from('checks').select('id,category_id,score,color,created_at').lt('score', 40).order('created_at',{ascending:false}).limit(20),
  ])

  const total = allFeedback?.length ?? 0
  const typeMap: Record<string, number> = {}
  for (const f of allFeedback ?? []) {
    typeMap[f.feedback_type] = (typeMap[f.feedback_type] || 0) + 1
  }

  const accurate  = typeMap['accurate']       || 0
  const fp        = typeMap['false_positive'] || 0
  const fn        = typeMap['false_negative'] || 0
  const unclear   = typeMap['unclear']        || 0

  const recentComments = (allFeedback ?? [])
    .filter(f => f.user_comment && f.user_comment.trim())
    .slice(0, 20)
    .map(f => ({ id: f.id, type: f.feedback_type, comment: f.user_comment, created_at: f.created_at }))

  return NextResponse.json({
    total,
    accurate,
    false_positive: fp,
    false_negative: fn,
    unclear,
    accuracy_rate:      total > 0 ? Math.round((accurate / total) * 100) : 0,
    fp_rate:            total > 0 ? Math.round((fp / total) * 100) : 0,
    fn_rate:            total > 0 ? Math.round((fn / total) * 100) : 0,
    by_type: Object.entries(typeMap).map(([type, count]) => ({ type, count })).sort((a,b) => b.count - a.count),
    recent_comments:    recentComments,
    low_confidence:     lowConfidence ?? [],
  })
}

export async function PATCH(req: Request) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, review_status } = await req.json()
  const db = createAdminClient()
  await db.from('feedback').update({ review_status }).eq('id', id)
  return NextResponse.json({ success: true })
}
