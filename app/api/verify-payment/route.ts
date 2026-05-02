import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

type ValidMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
function toValidMediaType(mimeType: string): ValidMediaType {
  const map: Record<string, ValidMediaType> = {
    'image/jpeg': 'image/jpeg', 'image/jpg': 'image/jpeg',
    'image/png': 'image/png', 'image/gif': 'image/gif', 'image/webp': 'image/webp',
  }
  return map[mimeType] || 'image/jpeg'
}

export const maxDuration = 30

export async function POST(req: Request) {
  const { image, platform } = await req.json()
  if (!image?.data) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  let userId: string | null = null
  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token)
    if (user) userId = user.id
  }

  const platformGuides: Record<string, string> = {
    gcash: 'GCash: green color scheme, sender/receiver names, reference number starts with a letter, amount in ₱, date/time stamp, balance shown after deduction.',
    maya: 'Maya (PayMaya): blue/yellow scheme, reference number, sender/receiver info, amount and timestamp.',
    bdo: 'BDO: BDO logo, masked account numbers, reference number, official BDO font and layout.',
    bpi: 'BPI: BPI eagle logo, red/navy colors, transaction reference, masked account details.',
    unionbank: 'UnionBank: orange color scheme, UnionBank logo, reference number.',
    other: 'Generic: look for official bank/e-wallet logo, proper formatting, reference number, date/time, matching amounts.',
  }

  const platformInfo = platformGuides[platform] || platformGuides.other

  const systemPrompt = `You are a forensic payment screenshot analyst for LegitCheck PH. Detect whether this payment proof is genuine or edited/fabricated.

Platform: ${(platform || 'unknown').toUpperCase()}
Authentic ${platform} receipt characteristics: ${platformInfo}

Return ONLY valid JSON (no markdown):
{
  "verdict": "authentic|suspicious|likely_fake|inconclusive",
  "confidence": 0-100,
  "flags": ["specific forensic observation 1", "specific forensic observation 2"],
  "summary": "One clear sentence verdict in English.",
  "summaryTl": "Same verdict in Filipino/Taglish."
}

FORENSIC CHECKS:
1. Font consistency — edited amounts often differ in weight/size/spacing from surrounding text
2. Pixel artifacts — blurring halos or compression artifacts around numbers indicate paste editing
3. Color consistency — edited regions sometimes have a slightly different background shade
4. Alignment — digits must perfectly align with the original receipt grid
5. Logo integrity — logos should not be stretched, blurry, or discolored
6. Reference number format — must follow platform-specific pattern (GCash refs start with a letter)
7. Balance logic — if before/after balances are shown, the math must be correct
8. Timestamp plausibility — cannot be a future date; suspiciously round timestamps are suspicious
9. Resolution consistency — real screenshots are uniformly sharp; fakes may show artifacts around edited areas
10. White space — inconsistent margins around text indicate copy-paste editing

VERDICT DEFINITIONS:
- "authentic": Strong evidence this is a genuine, unedited receipt
- "suspicious": Some inconsistencies present but not conclusive
- "likely_fake": Clear forensic evidence of fabrication or editing
- "inconclusive": Image quality or cropping prevents proper assessment`

  try {
    const resp = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: toValidMediaType(image.mimeType || 'image/jpeg'), data: image.data } },
          { type: 'text', text: 'Analyze this payment proof screenshot. Is it authentic or edited/fabricated?' },
        ],
      }],
    })

    const raw = resp.content[0].type === 'text' ? resp.content[0].text : '{}'
    const clean = raw.replace(/```json\s*|```\s*/g, '').trim()
    let parsed: any = {}
    try { parsed = JSON.parse(clean) } catch {
      parsed = { verdict: 'inconclusive', confidence: 30, flags: ['Could not parse analysis result'], summary: 'Analysis inconclusive. Try a clearer screenshot.', summaryTl: 'Hindi ma-confirm. Subukan ulit na mas malinaw.' }
    }

    if (userId) {
      supabase.from('payment_verifications').insert({
        user_id:    userId,
        verdict:    parsed.verdict || 'inconclusive',
        confidence: parsed.confidence || 0,
        platform:   platform || 'other',
        flags:      parsed.flags || [],
        summary:    parsed.summary || '',
      }).then(() => {}, () => {})
    }

    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({
      verdict: 'inconclusive', confidence: 0, flags: [],
      summary: 'Analysis failed. Please try again with a clearer image.',
      summaryTl: 'Hindi na-analyze. Subukan ulit na may mas malinaw na larawan.',
    })
  }
}
