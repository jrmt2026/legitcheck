import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { detectSignals, computeRisk, detectCategory, SIGNALS } from '@/lib/decisionEngine'
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

  // ── 5b. Run keyword engine EARLY — inject findings into Claude's context ──────
  const catIdEarly  = detectCategory(analysisText)
  const sigIdsEarly = detectSignals(fullContext, catIdEarly)
  if (!siteIsHttps && !sigIdsEarly.includes('no_https')) sigIdsEarly.push('no_https')
  const kwEarly = computeRisk(catIdEarly, sigIdsEarly)

  const detectedPatterns = sigIdsEarly
    .map(id => SIGNALS[id])
    .filter(Boolean)
    .filter(s => s.severity !== 'positive')

  const signalContext = detectedPatterns.length > 0
    ? `\n\nPRE-SCAN ALERT — keyword engine already confirmed these patterns in the text:\n${detectedPatterns.map(s => `• ${s.en} (severity: ${s.severity})`).join('\n')}\nYou MUST factor these confirmed patterns into your score. They are not guesses — they are definite matches found in the submitted text.`
    : ''

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

  const systemPrompt = `You are LegitCheck PH — the Philippines' premier AI fraud investigator. Your ONLY job is to READ what was submitted and LIST what you find. Do NOT assign a trust score — the scoring system handles that separately based on your findings.

Return ONLY this JSON (no markdown, no text outside JSON):
{
  "entitySummary": "One specific sentence: who/what was submitted, what they are offering, what payment they request, and any names/numbers mentioned. Be as specific as possible.",
  "headlineFinding": "The single most important conclusion in one direct sentence. If it is a scam, say so directly. If unclear, say what is missing.",
  "redFlags": [
    {
      "observation": "Exact thing you found — quote directly from the text where possible",
      "reason": "Why this is a red flag in plain Filipino-English. Be specific about the risk.",
      "severity": "critical"
    }
  ],
  "positiveIndicators": [
    {
      "observation": "Specific confirmed positive thing found",
      "reason": "Why this indicates legitimacy"
    }
  ],
  "canRead": true
}

SEVERITY LEVELS for redFlags:
- "critical": Near-certain scam indicator (withdrawal fee, OTP request, pay-to-earn, guaranteed returns, GCash payment + urgency together, bayad muna with no escrow, advance fee for job/loan)
- "high": Strong red flag (GCash to personal account for high-value item, refusal to meet/COD, price far below market, no buyer protection, unverifiable seller)
- "medium": Concern worth noting (new account, no item proof, emotional pressure, vague seller details)

SET canRead to FALSE only if the content is literally unreadable (blank image, unrecognizable file). If you can read ANY text or conversation, canRead must be TRUE and you must find at least one observation.

WHAT TO LOOK FOR — Filipino scam patterns:
- "Bayad muna, tapos padadalhan ko" / pay first with no escrow = CRITICAL
- GCash/Maya payment requested + urgency ("last slot," "may nagtatanong," "ibebenta na sa iba") = CRITICAL
- Withdrawal fee / "bayad para ma-release ang pera" = CRITICAL
- Guaranteed monthly returns ("30% monthly," "sure kita") = CRITICAL
- Job offer requiring placement/processing fee = CRITICAL
- OTP or password requested = CRITICAL
- Seller refuses meetup or COD for items over ₱1,000 = HIGH
- Price far below market (iPhone 15 for ₱3,000) = HIGH/CRITICAL
- Payment to personal account for property/land = CRITICAL
- Reservation required before seeing documents = CRITICAL
- Unknown or unverified seller with no track record = MEDIUM
- Facebook loan/investment group with no SEC/BSP license = HIGH

WHAT IS NOT A SCAM (do not flag these as red flags):
- Official Shopee/Lazada checkout with order confirmation
- Payment to verified business account matching company name
- Government websites (.gov.ph)
- Established brands with verifiable web presence

${hasImages ? 'Images are included — analyze them visually. Look for: edited amounts, fake payment screenshots (wrong fonts, cut-off details), stock profile photos, suspicious UI patterns.' : ''}
${hasSearchResults ? 'Web search results are included — if they show scam reports or news articles about fraud, these are critical evidence. If they confirm legitimacy, note it as positive.' : ''}
${scamDbContext ? 'SCAM DATABASE HIT — this entity has prior scam reports. This is critical evidence of a repeat scammer.' : ''}`

  try {
    // Build message content — include images if we have them for direct visual analysis
    const messageContent: any[] = []

    // If we have images, include them directly for visual analysis alongside all context
    if (hasImages && imageContents.length > 0) {
      for (const img of imageContents) messageContent.push(img)
    }

    messageContent.push({ type: 'text', text: `Analyze this for Philippine scam risk:\n\n${fullContext}${signalContext}` })

    const aiResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: 'user', content: messageContent }],
    })

    const raw = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : '{}'
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())

    entitySummary = parsed.entitySummary || ''
    aiInsights    = [parsed.entitySummary, parsed.headlineFinding].filter(Boolean).slice(0, 2)

    // ── Compute trustScore FROM findings — not from Claude's score ──────────────
    // Claude's job is to FIND things. Our job is to SCORE based on what was found.
    const redFlagList: Array<{ observation: string; reason: string; severity: string }> = parsed.redFlags || []
    const positiveList: Array<{ observation: string; reason: string }> = parsed.positiveIndicators || []
    const canRead = parsed.canRead !== false  // default true

    if (!canRead) {
      // Content unreadable — truly uncertain
      trustScore = 45
    } else {
      // Start at 70 (assume OK until proven otherwise)
      // Each finding deducts based on severity
      let score = 70
      for (const flag of redFlagList) {
        if (flag.severity === 'critical') score -= 38
        else if (flag.severity === 'high')     score -= 22
        else                                   score -= 10
      }
      for (const _ of positiveList) score += 12

      // Bonus deductions from context
      if (scamDbContext)    score -= 50  // confirmed scammer in DB
      if (searchContext && searchContext.toLowerCase().includes('scam')) score -= 25

      trustScore = Math.max(0, Math.min(100, score))
    }

    verdictColor = trustScore < 35 ? 'red' : trustScore < 70 ? 'yellow' : 'green'

    // Convert to signal-like objects for display
    claudeFindings = redFlagList.slice(0, 6).map((f, i) => ({
      id: `ai_flag_${i}`,
      en: `OBSERVATION: ${f.observation} — REASON: ${f.reason}`,
      tl: `OBSERVATION: ${f.observation} — REASON: ${f.reason}`,
      riskPoints: 0,
      severity: f.severity === 'critical' ? 'hard_red' : f.severity === 'high' ? 'high' : 'medium',
    }))

    positiveIndicators = positiveList.slice(0, 3).map((p, i) => ({
      id: `ai_pos_${i}`,
      en: `OBSERVATION: ${p.observation} — REASON: ${p.reason}`,
      tl: `OBSERVATION: ${p.observation} — REASON: ${p.reason}`,
      riskPoints: 0,
      severity: 'positive' as any,
    }))
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

  // ── 7. Keyword engine — supplements Claude, catches what Claude missed ──────────
  const catId    = catIdEarly
  const sigIds   = sigIdsEarly
  const kwResult = kwEarly
  const isHardRed = kwResult.isHardRed

  // If keyword engine found hard reds that Claude missed, apply them too
  if (isHardRed && trustScore > 15) {
    trustScore   = Math.min(trustScore, 15)
    verdictColor = 'red'
  }

  // Sync color from final score
  if (trustScore < 35)      verdictColor = 'red'
  else if (trustScore < 70) verdictColor = 'yellow'
  else                      verdictColor = 'green'

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
