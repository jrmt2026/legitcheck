import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export const maxDuration = 15

export async function GET() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: reports } = await supabase
    .from('scam_reports')
    .select('category, platform, description, amount_lost, created_at')
    .gte('created_at', since)
    .in('status', ['approved', 'accepted'])
    .order('created_at', { ascending: false })
    .limit(60)

  if (!reports || reports.length === 0) {
    return NextResponse.json({
      bullets: [
        'Wala pang confirmed na bagong scam reports ngayong linggo — mabuti ito!',
        'Ang mga pinaka-common sa nakaraang mga linggo: GCash-only sellers at fake government SMS.',
        'I-share ang LegitCheck sa pamilya at kaibigan para mas maraming maprotektahan.',
      ],
      reportCount: 0,
    })
  }

  const byCat: Record<string, number> = {}
  let totalLost = 0
  for (const r of reports) {
    byCat[r.category] = (byCat[r.category] || 0) + 1
    if (r.amount_lost) totalLost += Number(r.amount_lost)
  }

  const topCats = Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([cat, count]) => `${cat.replace(/_/g, ' ')}: ${count}`)
    .join(', ')

  const sampleDesc = reports
    .filter(r => r.description)
    .slice(0, 8)
    .map(r => `[${r.category}] ${r.description?.slice(0, 80)}`)
    .join('\n')

  try {
    const resp = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: `You write a brief weekly scam briefing for Filipino users in Taglish. Be specific, practical, and warn about actual patterns seen this week.

Return ONLY valid JSON:
{"bullets": ["Taglish bullet 1 (1-2 sentences, specific warning)", "bullet 2", "bullet 3"]}

Each bullet: concise, actionable, natural Taglish. No emojis inside the text.`,
      messages: [{
        role: 'user',
        content: `${reports.length} confirmed scam reports this week. Top categories: ${topCats}. Total reported losses: ₱${totalLost.toLocaleString()}.\n\nSample descriptions:\n${sampleDesc}\n\nGenerate 3 practical Taglish warnings for Filipino users.`,
      }],
    })

    const raw = resp.content[0].type === 'text' ? resp.content[0].text : '{}'
    const clean = raw.replace(/```json\s*|```\s*/g, '').trim()
    let parsed: any = {}
    try { parsed = JSON.parse(clean) } catch { /* use fallback */ }

    return NextResponse.json({
      bullets: parsed.bullets?.slice(0, 3) || [
        `${reports.length} scam reports ang natanggap ngayong linggo.`,
        `Pinaka-marami: ${topCats}.`,
        'Mag-ingat at i-check muna bago bayad.',
      ],
      reportCount: reports.length,
      totalLost,
    })
  } catch {
    return NextResponse.json({
      bullets: [
        `${reports.length} scam reports ngayong linggo.`,
        `Pinaka-marami: ${topCats}.`,
        'Mag-check muna bago bayad.',
      ],
      reportCount: reports.length,
      totalLost,
    })
  }
}
