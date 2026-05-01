import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/supabase/assertAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = createAdminClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: allReports }, { data: recentReports }] = await Promise.all([
    db.from('scam_reports').select('identifier,identifier_type,category,platform,status,created_at').in('status',['pending','accepted','approved']).limit(1000),
    db.from('scam_reports').select('created_at').in('status',['pending','accepted','approved']).gte('created_at', sevenDaysAgo),
  ])

  // Top identifiers by report count
  const identMap: Record<string, { count: number; type: string; categories: Set<string> }> = {}
  for (const r of allReports ?? []) {
    const key = r.identifier
    if (!key) continue
    if (!identMap[key]) identMap[key] = { count: 0, type: r.identifier_type, categories: new Set() }
    identMap[key].count++
    if (r.category) identMap[key].categories.add(r.category)
  }
  const topIdentifiers = Object.entries(identMap)
    .map(([identifier, v]) => ({ identifier, identifier_type: v.type, count: v.count, categories: [...v.categories] }))
    .sort((a,b) => b.count - a.count)
    .slice(0, 20)

  // By category
  const catMap: Record<string, number> = {}
  for (const r of allReports ?? []) {
    if (r.category) catMap[r.category] = (catMap[r.category] || 0) + 1
  }
  const byCategory = Object.entries(catMap).map(([category, count]) => ({ category, count })).sort((a,b) => b.count - a.count)

  // By type
  const typeMap: Record<string, number> = {}
  for (const r of allReports ?? []) {
    if (r.identifier_type) typeMap[r.identifier_type] = (typeMap[r.identifier_type] || 0) + 1
  }
  const byType = Object.entries(typeMap).map(([type, count]) => ({ type, count })).sort((a,b) => b.count - a.count)

  // Daily trend (last 7 days)
  const dayMap: Record<string, number> = {}
  for (const r of recentReports ?? []) {
    const day = r.created_at.slice(0, 10)
    dayMap[day] = (dayMap[day] || 0) + 1
  }
  const dailyTrend = Object.entries(dayMap).map(([date, count]) => ({ date, count })).sort((a,b) => a.date.localeCompare(b.date))

  return NextResponse.json({
    total_reports: allReports?.length ?? 0,
    top_identifiers: topIdentifiers,
    by_category: byCategory,
    by_type: byType,
    daily_trend: dailyTrend,
  })
}
