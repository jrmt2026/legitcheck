'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const ADMIN_EMAIL = 'trinidadjayryan@gmail.com'
const REPORTS_PER_CREDIT = 3
const MAX_EARNED_PER_MONTH = 2

export async function moderateReport(reportId: string, action: 'accepted' | 'rejected', adminNote?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) throw new Error('Unauthorized')

  const admin = createAdminClient()

  const { data: report } = await admin
    .from('scam_reports')
    .select('id, reporter_id, status')
    .eq('id', reportId)
    .single()

  if (!report || report.status !== 'pending') return

  await admin.from('scam_reports').update({
    status: action,
    admin_note: adminNote || null,
    moderated_at: new Date().toISOString(),
  }).eq('id', reportId)

  if (action === 'accepted' && report.reporter_id) {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const [{ count: acceptedCount }, { count: creditsEarned }] = await Promise.all([
      admin.from('scam_reports')
        .select('*', { count: 'exact', head: true })
        .eq('reporter_id', report.reporter_id)
        .eq('status', 'accepted')
        .gte('moderated_at', startOfMonth.toISOString()),
      admin.from('credit_batches')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', report.reporter_id)
        .eq('source', 'earned_report_reward')
        .gte('created_at', startOfMonth.toISOString()),
    ])

    const accepted = acceptedCount ?? 0
    const alreadyEarned = creditsEarned ?? 0

    if (accepted > 0 && accepted % REPORTS_PER_CREDIT === 0 && alreadyEarned < MAX_EARNED_PER_MONTH) {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 60)

      const { data: batch } = await admin.from('credit_batches').insert({
        user_id: report.reporter_id,
        source: 'earned_report_reward',
        total_credits: 1,
        used_credits: 0,
        expires_at: expiresAt.toISOString(),
      }).select().single()

      if (batch) {
        await admin.from('credit_ledger').insert({
          user_id: report.reporter_id,
          batch_id: batch.id,
          delta: 1,
          description: 'Earned: 3 accepted scam reports',
        })
        const { data: newBalance } = await admin.rpc('get_premium_credits', { p_user_id: report.reporter_id })
        await admin.from('profiles').update({ credits_remaining: newBalance ?? 0 }).eq('id', report.reporter_id)
      }
    }
  }

  revalidatePath('/admin')
}
