import { NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/companyAuth'
import { detectCategory, detectSignals, computeRisk } from '@/lib/decisionEngine'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export const maxDuration = 60

interface BulkItem {
  id: string
  text: string
  category?: string
}

export async function POST(req: Request) {
  // ── Auth via API key ──────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization')
  const rawKey = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!rawKey) {
    return NextResponse.json({ error: 'Missing API key. Pass Authorization: Bearer lc_live_...' }, { status: 401 })
  }

  const auth = await verifyApiKey(rawKey)
  if (!auth.valid) {
    return NextResponse.json({ error: 'Invalid or inactive API key' }, { status: 401 })
  }

  // ── Rate limit check ──────────────────────────────────────────────────────
  if ((auth.requestsThisMonth ?? 0) >= (auth.monthlyLimit ?? 500)) {
    return NextResponse.json({
      error: 'Monthly limit reached',
      limit: auth.monthlyLimit,
      used: auth.requestsThisMonth,
    }, { status: 429 })
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  const { items } = await req.json()

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'items must be a non-empty array' }, { status: 400 })
  }

  if (items.length > 50) {
    return NextResponse.json({ error: 'Maximum 50 items per request' }, { status: 400 })
  }

  // ── Process each item via keyword engine (fast, no AI call) ───────────────
  const results = items.map((item: BulkItem) => {
    if (!item.id || !item.text) {
      return { id: item.id ?? null, error: 'Missing id or text' }
    }

    try {
      const cat     = detectCategory(item.text)
      const signals = detectSignals(item.text, cat)
      const result  = computeRisk(cat, signals)

      const trustScore = 100 - result.score
      const risk =
        trustScore < 20 ? 'critical' :
        trustScore < 40 ? 'high' :
        trustScore < 60 ? 'caution' :
        trustScore < 80 ? 'low' : 'safe'

      return {
        id:         item.id,
        risk,
        color:      result.color,
        score:      trustScore,
        category:   result.categoryId,
        isHardRed:  result.isHardRed,
        flags:      result.reasons
          .filter(r => r.severity !== 'positive')
          .slice(0, 5)
          .map(r => ({ id: r.id, label: r.en.slice(0, 120), severity: r.severity })),
        action:     result.action.en,
      }
    } catch {
      return { id: item.id, error: 'Analysis failed' }
    }
  })

  // ── Track usage ───────────────────────────────────────────────────────────
  if (auth.keyId) {
    await supabase
      .from('api_keys')
      .update({
        requests_this_month: (auth.requestsThisMonth ?? 0) + items.length,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', auth.keyId)
  }

  const flagged = results.filter((r: any) => !r.error && (r.risk === 'critical' || r.risk === 'high')).length

  return NextResponse.json({
    processed: results.length,
    flagged,
    results,
    usage: {
      this_month: (auth.requestsThisMonth ?? 0) + items.length,
      limit: auth.monthlyLimit ?? 500,
    },
  })
}
