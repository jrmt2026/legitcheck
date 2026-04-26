import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { detectSignals, computeRisk, detectCategory } from '@/lib/decisionEngine'
import type { RiskColor, CategoryId } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// ── Helpers ────────────────────────────────────────────────────────────────────

type ValidMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
function toValidMediaType(mimeType: string): ValidMediaType {
  const map: Record<string, ValidMediaType> = {
    'image/jpeg': 'image/jpeg', 'image/jpg': 'image/jpeg',
    'image/png': 'image/png', 'image/gif': 'image/gif', 'image/webp': 'image/webp',
  }
  return map[mimeType] || 'image/jpeg'
}

function extractUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s]+|www\.[^\s]+\.[a-z]{2,}/i)
  if (!m) return null
  const url = m[0].startsWith('http') ? m[0] : 'https://' + m[0]
  try { new URL(url); return url } catch { return null }
}

function extractPhones(text: string): string[] {
  const raw = text.match(/(\+?63|0)9\d{9}/g) || []
  return [...new Set(raw.map(m =>
    m.startsWith('+639') ? '0' + m.slice(3) : m.startsWith('639') ? '0' + m.slice(2) : m
  ))]
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s{2,}/g, ' ').trim()
}

async function fetchWebsite(url: string): Promise<{ text: string; isHttps: boolean }> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 9000)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    })
    clearTimeout(t)
    const html = await res.text()
    return { text: stripHtml(html).slice(0, 6000), isHttps: (res.url || url).startsWith('https://') }
  } catch (e) {
    clearTimeout(t)
    return { text: '', isHttps: url.startsWith('https://') }
  }
}

// ── Web search via Serper.dev (optional — set SERPER_API_KEY in env) ──────────

async function webSearch(query: string): Promise<string> {
  if (!process.env.SERPER_API_KEY) return ''
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': process.env.SERPER_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, gl: 'ph', hl: 'en', num: 8 }),
    })
    const data = await res.json()
    const organic: string = (data.organic || []).slice(0, 6)
      .map((r: any) => `• ${r.title}\n  ${r.snippet || ''}`)
      .join('\n')
    const news: string = (data.news || []).slice(0, 3)
      .map((r: any) => `• [NEWS] ${r.title}: ${r.snippet || ''}`)
      .join('\n')
    return [organic, news].filter(Boolean).join('\n')
  } catch { return '' }
}

// ── Scam database lookup ───────────────────────────────────────────────────────

async function checkScamDb(phones: string[]): Promise<string> {
  if (phones.length === 0) return ''
  try {
    const { data } = await supabase
      .from('scam_reports')
      .select('identifier, category, platform, is_verified, created_at')
      .in('identifier', phones)
    if (!data || data.length === 0) return ''
    return '\n\n=== SCAM DATABASE HITS ===\n' + phones.map(p => {
      const hits = data.filter((r: any) => r.identifier === p)
      if (!hits.length) return null
      return `${p}: reported ${hits.length}x as [${[...new Set(hits.map((r: any) => r.category))].join(', ')}]${hits.some((r: any) => r.is_verified) ? ' — ADMIN CONFIRMED SCAMMER' : ''}`
    }).filter(Boolean).join('\n') + '\n=== END ==='
  } catch { return '' }
}

// ── Smart search query builder ─────────────────────────────────────────────────

function buildSearchQuery(text: string, url: string | null, phones: string[]): string {
  if (url) {
    try {
      const domain = new URL(url).hostname.replace('www.', '')
      return `"${domain}" scam legit review Philippines`
    } catch {}
  }
  if (phones.length > 0) return `"${phones[0]}" scam Philippines GCash`
  // Extract likely name or company from text (first capitalized phrase)
  const nameMatch = text.match(/(?:Hi,?\s+(?:I'm|Ako si|Iam)\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/)?.[1]
  if (nameMatch) return `"${nameMatch}" scam Philippines seller`
  return ''
}

// ── Main POST handler ──────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const { text, images } = await req.json()
  let analysisText = text || ''

  // ── 1. OCR: extract text from uploaded images ────────────────────────────────
  const imageContents: Array<{ type: 'image'; source: { type: 'base64'; media_type: ValidMediaType; data: string } }> = []

  if (Array.isArray(images) && images.length > 0) {
    const parts: string[] = []
    for (const img of images.slice(0, 4)) {
      const data = typeof img === 'string' ? img : img.data
      const mime = typeof img === 'string' ? 'image/jpeg' : img.mimeType
      if (!data) continue
      imageContents.push({ type: 'image', source: { type: 'base64', media_type: toValidMediaType(mime), data } })
      try {
        const ocr = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          messages: [{ role: 'user', content: [
            { type: 'image', source: { type: 'base64', media_type: toValidMediaType(mime), data } },
            { type: 'text', text: 'Extract ALL visible text from this image exactly as written. Include names, numbers, amounts, links, labels, dates, locations. Output only the extracted text, nothing else.' },
          ]}],
        })
        const extracted = ocr.content[0].type === 'text' ? ocr.content[0].text : ''
        if (extracted) parts.push(extracted)
      } catch (e) { console.error('OCR error:', e) }
    }
    if (parts.length > 0) analysisText = parts.join('\n\n---\n\n') + (text ? '\n\nAdditional context: ' + text : '')
  }

  if (!analysisText) return NextResponse.json({ error: 'No content to analyze' }, { status: 400 })

  // ── 2. Detect phones + check scam DB ─────────────────────────────────────────
  const phones = extractPhones(analysisText)
  const scamDbContext = await checkScamDb(phones)

  // ── 3. Fetch website content if URL present ───────────────────────────────────
  let siteContext = ''
  let fetchedUrl: string | null = null
  let siteIsHttps = true

  fetchedUrl = extractUrl(analysisText)
  if (fetchedUrl) {
    const site = await fetchWebsite(fetchedUrl)
    siteIsHttps = site.isHttps
    if (site.text) siteContext = `\n\n=== WEBSITE CONTENT (${fetchedUrl}) ===\n${site.text}\n=== END ===`
    else siteContext = `\n[Website ${fetchedUrl} could not be loaded — may be down or blocking crawlers]`
  }

  // ── 4. Web search for real-time research ─────────────────────────────────────
  let searchContext = ''
  const searchQuery = buildSearchQuery(analysisText, fetchedUrl, phones)
  if (searchQuery) {
    const results = await webSearch(searchQuery)
    if (results) searchContext = `\n\n=== WEB SEARCH RESULTS for "${searchQuery}" ===\n${results}\n=== END ===`
  }

  // ── 5. Build full context for Claude ─────────────────────────────────────────
  const fullContext = [
    analysisText.slice(0, 3000),
    scamDbContext,
    siteContext,
    searchContext,
  ].filter(Boolean).join('\n')

  // ── 6. Claude deep analysis — PRIMARY VERDICT ─────────────────────────────────
  let trustScore = 50   // neutral default if Claude fails
  let verdictColor: RiskColor = 'yellow'
  let aiInsights: string[] = []
  let entitySummary = ''
  let claudeFindings: Array<{ en: string; tl: string; riskPoints: number; severity: any; id: string }> = []
  let positiveIndicators: Array<{ en: string; tl: string; riskPoints: number; severity: any; id: string }> = []

  const hasImages = imageContents.length > 0
  const isWebsiteCheck = !!fetchedUrl
  const hasSearchResults = !!searchContext

  const systemPrompt = `You are LegitCheck PH — the Philippines' premier AI fraud investigator. A Filipino user has submitted content to determine if it is a scam or legitimate.

Your analysis must be DEFINITIVE, DIRECT, and based on EVIDENCE. Filipino users trust your verdict — they may lose real money if you are vague or wrong.

Analyze everything provided and return ONLY this JSON (no markdown, no text outside JSON):
{
  "entitySummary": "One sentence describing exactly what was submitted — be specific (e.g., 'A Facebook seller named Juan Santos offering an iPhone 15 for ₱5,000, requesting GCash payment to 09171234567')",
  "trustScore": 65,
  "verdict": "yellow",
  "headlineFinding": "The single most important conclusion in one direct sentence (e.g., 'This is a textbook advance fee scam — the withdrawal fee alone confirms it')",
  "findings": [
    "OBSERVATION: [exact thing found] — REASON: [why this is a red flag or concern, in plain language a Filipino can understand]",
    "OBSERVATION: [next specific finding] — REASON: [plain explanation of the risk]"
  ],
  "positiveIndicators": [
    "OBSERVATION: [specific confirmed positive] — REASON: [why this indicates legitimacy]. Only include if genuinely confirmed — never invent positives."
  ],
  "confidence": "high"
}

FINDINGS ARE MANDATORY. You must ALWAYS return at least 1 finding — even for uncertain cases. If you cannot confirm it is a scam, still state specifically WHAT you see and WHY it does or does not raise concern. "Not enough context" is never an acceptable finding on its own — explain what context is missing and what that means. A finding like "OBSERVATION: Only a screenshot with no conversation or transaction details shown — REASON: Without seeing the actual offer or messages, we cannot assess the specific risk, but submitting unverified screenshots alone is not enough to clear anyone" is valid.

PROPERTY / LOT TRANSACTION RULES — apply these when content involves real estate:
- Reservation fee paid via GCash or personal account: trustScore 10-25 (hard red — legitimate developers never accept GCash reservations)
- Price per sqm unrealistically cheap vs Philippine market rates: flag it
- No mention of DHSUD/HLURB developer accreditation: flag it
- Title not shown or seller cannot produce TCT/OCT: flag it
- Seller is an individual (not a licensed broker or registered developer): flag it
- Payment instructions go to a personal name rather than a company: hard red
- "Reservation" required before you can see/verify documents: hard red

WHAT CONFIRMED LEGITIMACY LOOKS LIKE FOR PROPERTY:
- Developer is DHSUD-accredited (verifiable at dhsud.gov.ph)
- Broker holds a valid PRC license
- Payment goes to company escrow or bank account under developer name
- TCT/OCT can be verified at LRA before paying
- Contract to Sell is a formal legal document

SCORING GUIDE — be strictly calibrated:
- 80-100: CONFIRMED legitimate — official platform checkout (Shopee/Lazada), verified government site (.gov.ph), known major brand with SEC/DTI registration confirmed
- 60-79: Probably OK — established online presence, multiple confirmed positive signals
- 40-59: Uncertain — insufficient context only. Use this range ONLY when you literally cannot read what was submitted. NOT for actual conversations that contain red flags.
- 20-39: Red flags present — 1-2 concerning patterns in an actual conversation or offer
- 0-19: Near-certain scam — clear scam patterns present (GCash outside platform + rush, guaranteed returns, withdrawal fees, OTP requests, pay-to-earn, impersonation)

CRITICAL: If an actual conversation or chat is submitted (you can read messages, offers, instructions), DO NOT default to 40-59. A real conversation with red flags MUST score 0-39. A 50 score means you cannot read what was submitted — not that you are unsure about a conversation you can clearly read.

FILIPINO CHAT SCAM PATTERNS — score 0-30 when you see these in actual messages:
- Seller asking for GCash payment + rush/urgency in the same conversation: 10-25
- "Last slot na," "maraming nagtatanong," "ubos na agad" — classic scarcity pressure: flag it, drop score 15-20 points
- Payment requested to a personal GCash/Maya account for goods worth over ₱1,000: red flag
- Seller refuses to meet in person or do COD for a high-value item: red flag
- Price significantly below market value (e.g., iPhone for ₱3,000): hard red
- "Bayad muna, tapos padadalhan ko" with no escrow or buyer protection: 10-25
- Seller name on GCash doesn't match the seller name they gave: hard red
- Asking for OTP, password, or account credentials: 0-10
- "I-transfer mo na para ma-hold" with no receipt or contract: 15-25
- Investment promising monthly returns (e.g., "30% monthly"): 0-15
- Job offer requiring placement/processing fee upfront: 0-15
- Withdrawal fee required to release funds: 0-10
- "Libre lang mag-try, bayad lang pag kumita ka na" — pay-to-earn: 0-15
- Donation to personal GCash with no verifiable organization: 20-35

ABSOLUTE RULES — never break these:
1. UNKNOWN ≠ SAFE. If you cannot confirm legitimacy, score 35-45 MAX.
2. A real conversation with ANY red flag: score 0-39. Never 40+ if you can read concerning content.
3. Green (60+) REQUIRES confirmed positive evidence — never give green to an unknown seller.
4. Web search results showing scam reports: trustScore must be 0-25.
5. Scam database hit in context: trustScore must be 0-20. Always.
6. Guaranteed returns + referral commissions: trustScore 0-15. Always.
7. Job offer requiring upfront fee: trustScore 0-15. Always.
8. Withdrawal fee to "release" funds: trustScore 0-10. Always.
9. Social media profile photo only (no conversation): trustScore 38, ask for actual conversation.
10. Facebook/social media loan or investment group, no SEC/BSP license: trustScore 20-35.
11. Any conversation where seller pushes GCash + rush pressure + no buyer protection: trustScore 10-25.
${hasImages ? '11. Images provided — analyze visually: fake payment screenshots, stock profile photos, edited amounts, suspicious UI patterns.' : ''}
${hasSearchResults ? '12. Web search results provided — treat as primary evidence. Positive coverage = raise score. Scam reports = drop to 0-25.' : ''}
${scamDbContext ? '13. SCAM DATABASE HIT — prior reports exist for this entity. Drop trustScore to 0-25 immediately.' : ''}`

  try {
    // Build message content — include images if we have them for direct visual analysis
    const messageContent: any[] = []

    // If we have images, include them directly for visual analysis alongside all context
    if (hasImages && imageContents.length > 0) {
      for (const img of imageContents) messageContent.push(img)
    }

    messageContent.push({ type: 'text', text: `Analyze this for Philippine scam risk:\n\n${fullContext}` })

    const aiResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: 'user', content: messageContent }],
    })

    const raw = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : '{}'
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())

    trustScore     = Math.max(0, Math.min(100, Number(parsed.trustScore) || 50))
    verdictColor   = parsed.verdict === 'red' ? 'red' : parsed.verdict === 'green' ? 'green' : 'yellow'
    entitySummary  = parsed.entitySummary || ''
    aiInsights     = [
      parsed.entitySummary,
      parsed.headlineFinding,
      ...(parsed.insights || []),
    ].filter(Boolean).slice(0, 4)

    if (parsed.findings?.length) {
      claudeFindings = parsed.findings.slice(0, 5).map((f: string) => ({
        id: 'ai_detected', en: f, tl: f, riskPoints: 0, severity: 'high',
      }))
    }

    if (parsed.positiveIndicators?.length) {
      positiveIndicators = parsed.positiveIndicators.slice(0, 2).map((p: string) => ({
        id: 'ai_positive', en: p, tl: p, riskPoints: 0, severity: 'positive',
      }))
    }
  } catch (e) {
    console.error('Claude analysis error:', e)
    // Fallback: keyword engine primary
    const catId    = detectCategory(analysisText)
    const sigIds   = detectSignals(analysisText, catId)
    const fallback = computeRisk(catId, sigIds)
    trustScore   = 100 - fallback.score
    verdictColor = fallback.color
    return NextResponse.json({ result: { ...fallback, aiInsights: ['Analysis service temporarily unavailable. Result based on keyword detection only.'] }, extractedText: analysisText })
  }

  // ── 7. Keyword engine sanity check — hard reds can override Claude ────────────
  const catId  = detectCategory(analysisText)
  const sigIds = detectSignals(fullContext, catId)
  if (!siteIsHttps && !sigIds.includes('no_https')) sigIds.push('no_https')

  const kwResult = computeRisk(catId, sigIds)

  // Hard red signals override Claude (e.g., Claude missed a withdrawal fee scam)
  const isHardRed = kwResult.isHardRed
  if (isHardRed && trustScore > 25) {
    trustScore = Math.min(trustScore, 20)
    verdictColor = 'red'
  }

  // Sync color to score — green now requires 70+, not 60+
  if (trustScore < 35)              verdictColor = 'red'
  else if (trustScore < 70)         verdictColor = 'yellow'
  else                              verdictColor = 'green'

  // ── 8. Build final result ─────────────────────────────────────────────────────
  // Use keyword engine's full result structure but override score/color/reasons
  const riskScore = 100 - trustScore
  const finalResult = computeRisk(catId, sigIds)
  finalResult.score    = riskScore
  finalResult.color    = verdictColor
  finalResult.isHardRed = isHardRed || verdictColor === 'red'

  // Headline/action text based on verdict
  // Detect "not enough context" vs "actual red flags found" for yellow
  const isInsufficientContext = verdictColor === 'yellow' && trustScore >= 40 && trustScore < 60 && claudeFindings.length === 0

  if (verdictColor === 'red') {
    finalResult.headline    = { en: 'Scam Warning — Stop', tl: 'Babala: Scam — Tigil' }
    finalResult.subheadline = { en: 'High risk. Do not send money or share details.', tl: 'Mataas ang panganib. Huwag magpadala ng pera.' }
    finalResult.action      = { en: 'Stop. Do not pay or share any info.', tl: 'Tigil. Huwag magbayad o magbigay ng impormasyon.' }
  } else if (isInsufficientContext) {
    finalResult.headline    = { en: 'Not Enough to Judge', tl: 'Hindi Sapat ang Impormasyon' }
    finalResult.subheadline = { en: 'Add more context — paste the actual message, offer, or conversation.', tl: 'Magbigay ng mas detalyadong impormasyon para ma-assess.' }
    finalResult.action      = { en: 'Paste the actual message or describe what you are checking.', tl: 'I-paste ang mensahe o ilarawan kung ano ang sinusuri.' }
  } else if (verdictColor === 'yellow') {
    finalResult.headline    = { en: 'Verify Before Proceeding', tl: 'I-verify Bago Tumuloy' }
    finalResult.subheadline = { en: 'Concerns found — do not share personal details or send money without verifying.', tl: 'May alalahanin — huwag magbigay ng personal na impormasyon o magpadala ng pera nang hindi na-verify.' }
    finalResult.action      = { en: 'Stop. Verify identity and credentials first.', tl: 'Tigil. I-verify muna ang pagkakakilanlan at kredensyal.' }
  } else {
    finalResult.headline    = { en: 'Looks Legitimate', tl: 'Mukhang Lehitimo' }
    finalResult.subheadline = { en: 'Positive signals found. Still use official channels.', tl: 'May positibong senyales. Gamitin pa rin ang official channels.' }
    finalResult.action      = { en: 'Proceed carefully. Always use official channels.', tl: 'Mag-ingat pa rin. Gamitin ang official channels.' }
  }

  // Build reasons: Claude findings are primary.
  // If Claude found nothing, fall back to ALL keyword engine reasons (not just hard_reds).
  // This ensures the keyword engine always surfaces scam patterns Claude missed.
  const keywordReasons = claudeFindings.length === 0
    ? kwResult.reasons.filter(r => r.severity !== 'positive') // all non-positive keyword hits
    : kwResult.reasons.filter(r => r.severity === 'hard_red') // only hard reds to supplement Claude

  finalResult.reasons = [
    ...claudeFindings,
    ...positiveIndicators,
    ...keywordReasons,
  ]

  // Deduplicate by id
  const seen = new Set<string>()
  finalResult.reasons = finalResult.reasons.filter(r => {
    if (seen.has(r.id)) return false
    seen.add(r.id)
    return true
  })

  // If still no reasons and score is green, add confirmation note
  if (finalResult.reasons.length === 0 && trustScore >= 70) {
    finalResult.reasons = [{
      id: 'no_flags', en: 'No specific red flags detected in the content provided. This result is based only on what was submitted.',
      tl: 'Walang nakitang red flag sa ibinigay na content. Base lang ito sa ibinigay mo.', riskPoints: 0, severity: 'positive',
    }]
  }

  // If score is below 60 but still no reasons at all, add a generic uncertainty finding
  // so the user always sees SOMETHING explaining the score
  if (finalResult.reasons.length === 0 && trustScore < 60) {
    finalResult.reasons = [{
      id: 'insufficient_context',
      en: 'OBSERVATION: Limited information was submitted — REASON: Without the actual conversation, offer details, or transaction context, we cannot fully assess the risk. Submit the actual messages or describe what you are checking for a more accurate result.',
      tl: 'OBSERVATION: Hindi sapat ang ibinigay na impormasyon — REASON: Kailangan ng actual na mensahe o detalye ng transaksyon para ma-assess nang maayos.',
      riskPoints: 0, severity: 'medium',
    }]
  }

  finalResult.aiInsights = aiInsights

  return NextResponse.json({ result: finalResult, extractedText: analysisText, fetchedUrl, trustScore, searchPerformed: !!searchContext })
}
