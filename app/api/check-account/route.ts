import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

function normalizeIdentifier(raw: string): string {
  // Normalize PH phone numbers: strip spaces, dashes, +63 prefix → 09...
  const stripped = raw.replace(/[\s\-().]/g, '')
  if (stripped.startsWith('+639')) return '0' + stripped.slice(3)
  if (stripped.startsWith('639'))  return '0' + stripped.slice(2)
  return stripped.toLowerCase()
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ report_count: 0, categories: [], platforms: [], last_reported: null, is_verified: false })

  const normalized = normalizeIdentifier(q)

  const { data, error } = await supabase
    .from('scam_reports')
    .select('category, platform, is_verified, created_at')
    .ilike('identifier', normalized)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!data || data.length === 0) {
    return NextResponse.json({ report_count: 0, categories: [], platforms: [], last_reported: null, is_verified: false })
  }

  const categories  = [...new Set(data.map((r: any) => r.category))]
  const platforms   = [...new Set(data.map((r: any) => r.platform).filter(Boolean))]
  const is_verified = data.some((r: any) => r.is_verified)
  const last_reported = data[0].created_at

  return NextResponse.json({ report_count: data.length, categories, platforms, last_reported, is_verified })
}
