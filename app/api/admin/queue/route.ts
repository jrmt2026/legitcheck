import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/supabase/assertAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = createAdminClient()
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const [
    { data: pendingReports },
    { data: failedPayments },
    { data: stalePayments },
    { data: fpFeedback },
    { data: fnFeedback },
  ] = await Promise.all([
    db.from('scam_reports').select('id,identifier,identifier_type,category,description,amount_lost,created_at').eq('status','pending').order('created_at',{ascending:false}).limit(30),
    db.from('payments').select('id,plan_id,amount_cents,status,reference_no,created_at').in('status',['failed','expired']).order('created_at',{ascending:false}).limit(20),
    db.from('payments').select('id,plan_id,amount_cents,status,reference_no,created_at').eq('status','pending').lt('created_at',oneHourAgo).order('created_at',{ascending:false}).limit(20),
    db.from('feedback').select('id,check_id,feedback_type,user_comment,review_status,created_at').eq('feedback_type','false_positive').eq('review_status','pending').order('created_at',{ascending:false}).limit(20),
    db.from('feedback').select('id,check_id,feedback_type,user_comment,review_status,created_at').eq('feedback_type','false_negative').eq('review_status','pending').order('created_at',{ascending:false}).limit(20),
  ])

  return NextResponse.json({
    pendingReports: { count: pendingReports?.length ?? 0, items: pendingReports ?? [] },
    failedPayments: { count: failedPayments?.length ?? 0, items: failedPayments ?? [] },
    stalePayments:  { count: stalePayments?.length ?? 0,  items: stalePayments ?? [] },
    falsePositive:  { count: fpFeedback?.length ?? 0,     items: fpFeedback ?? [] },
    falseNegative:  { count: fnFeedback?.length ?? 0,     items: fnFeedback ?? [] },
  })
}
