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
  const t = setTimeout(() => ctrl.abort(), 4000)
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

export const maxDuration = 60 // allow up to 60s on Vercel Pro; free tier capped at 10s

export async function POST(req: Request) {
  const { text, images } = await req.json()

  // ── Auth check + rate limiting ────────────────────────────────────────────
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  let tier: 'guest' | 'basic' | 'full' = 'guest'

  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token)
    if (user) tier = 'full'
  }

  let analysisText = text || ''

  // ── 1. Prepare images — NO separate OCR call. Claude sees images directly. ───
  // Doing OCR + analysis = 2 Claude calls = timeout on free Vercel (10s limit).
  // Instead: send images straight to the main Claude call (it reads images natively).
  const imageContents: Array<{ type: 'image'; source: { type: 'base64'; media_type: ValidMediaType; data: string } }> = []
  const hasImages = Array.isArray(images) && images.length > 0

  if (hasImages) {
    for (const img of images.slice(0, 4)) {
      const data = typeof img === 'string' ? img : img.data
      const mime = typeof img === 'string' ? 'image/jpeg' : img.mimeType
      if (data) imageContents.push({ type: 'image', source: { type: 'base64', media_type: toValidMediaType(mime), data } })
    }
  }

  // Need at least text or images
  if (!analysisText && imageContents.length === 0) {
    return NextResponse.json({ error: 'No content to analyze' }, { status: 400 })
  }

  // For image-only submissions, use a placeholder so keyword engine has something
  const textForKeywords = analysisText || '[Image submitted — see visual analysis]'

  // ── 2-4. Phones + scam DB + website + web search — ALL IN PARALLEL ───────────
  const phones     = extractPhones(analysisText)
  const fetchedUrl = extractUrl(analysisText)
  const searchQuery = buildSearchQuery(analysisText, fetchedUrl, phones)

  const [scamDbContext, siteResult, searchResults] = await Promise.all([
    checkScamDb(phones),
    fetchedUrl ? fetchWebsite(fetchedUrl) : Promise.resolve({ text: '', isHttps: true }),
    searchQuery ? webSearch(searchQuery) : Promise.resolve(''),
  ])

  const siteIsHttps = siteResult.isHttps
  const siteContext = fetchedUrl
    ? (siteResult.text
        ? `\n\n=== WEBSITE CONTENT (${fetchedUrl}) ===\n${siteResult.text}\n=== END ===`
        : `\n[Website ${fetchedUrl} could not be loaded]`)
    : ''
  const searchContext = searchResults
    ? `\n\n=== WEB SEARCH RESULTS for "${searchQuery}" ===\n${searchResults}\n=== END ===`
    : ''

  // ── 5. Build full context for Claude ─────────────────────────────────────────
  const fullContext = [
    analysisText.slice(0, 3000),
    scamDbContext,
    siteContext,
    searchContext,
  ].filter(Boolean).join('\n')

  // ── 5b. Run keyword engine EARLY — inject findings into Claude's context ──────
  const catIdEarly  = detectCategory(textForKeywords)
  const sigIdsEarly = detectSignals(fullContext || textForKeywords, catIdEarly)
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
  let scoreSteps: Array<{ label: string; delta: number }> = []

  const isWebsiteCheck = !!fetchedUrl
  const hasSearchResults = !!searchContext

  const systemPrompt = `You are LegitCheck PH — the Philippines' most trusted AI fraud investigator. You have comprehensive knowledge of Philippine scam patterns, official government domains, legitimate business practices, and how fraudsters operate.

Your job: Read what was submitted, apply your knowledge, identify the scam type (if any), and explain your reasoning clearly so a non-expert understands exactly what is happening and what to do.

Return ONLY this JSON (no markdown, no text outside JSON):
{
  "entitySummary": "One specific sentence: what was submitted, what it claims to be, what it is asking the recipient to do, and any names/numbers/links mentioned.",
  "headlineFinding": "A decisive 1-2 sentence verdict. If it IS a scam: name the scam type and say so directly (e.g. 'This is a smishing scam — the text impersonates MMDA but the link lto.sssg.mx is not an official Philippine government domain.'). If LEGITIMATE: explain what makes it trustworthy. Never hedge when evidence is clear.",
  "officialResource": "If this involves a government agency, bank, or verifiable institution, state the correct official way to verify: exact official URL or hotline (e.g. 'To check LTO violations yourself: portal.lto.gov.ph — never use links from SMS.'). Leave empty string if not applicable.",
  "redFlags": [
    {
      "observation": "Quote the specific text or element that is suspicious — be precise (e.g. 'Link domain is lto.sssg.mx — .mx is Mexico, not a Philippine government domain')",
      "reason": "2-3 sentences: (1) exactly what is wrong and why it proves fraud, (2) how this specific scam technique works to steal money or data, (3) what the victim risks if they comply. Explain as if to someone who has never seen this scam.",
      "severity": "critical|high|medium"
    }
  ],
  "positiveIndicators": [
    {
      "observation": "Specific confirmed positive element — quote from the content",
      "reason": "2 sentences: why this indicates legitimacy and what protection it provides."
    }
  ],
  "canRead": true
}

══════════════════════════════════════════════
OFFICIAL PHILIPPINE GOVERNMENT DOMAINS
(Any URL claiming to be these agencies but NOT on .gov.ph is DEFINITIVELY FAKE)
══════════════════════════════════════════════
LTO (Land Transportation Office): portal.lto.gov.ph, lto.gov.ph
MMDA: mmda.gov.ph — MMDA does NOT send payment SMS with links
BIR: bir.gov.ph, efps.bir.gov.ph
SSS: my.sss.gov.ph, sss.gov.ph
PhilHealth: philhealth.gov.ph
Pag-IBIG / HDMF: pagibigfund.gov.ph
COMELEC: comelec.gov.ph
DFA (passport): dfa.gov.ph
DOLE: dole.gov.ph
POEA/DMW: dmw.gov.ph, poea.gov.ph
NBI: nbi.gov.ph
PNP: pnp.gov.ph
SEC: sec.gov.ph
BSP: bsp.gov.ph
Banks: bdo.com.ph, bpi.com.ph, metrobank.com.ph, unionbankph.com, rcbc.com, pnb.com.ph
GCash: gcash.com — never contacts you about account issues via SMS with links
Maya: maya.ph — official app only, not via SMS payment links

══════════════════════════════════════════════
PHILIPPINE SCAM TAXONOMY — KNOW THESE PATTERNS
══════════════════════════════════════════════

1. SMISHING / GOVERNMENT IMPERSONATION (SMS phishing)
   Pattern: Text claims to be MMDA, LTO, BIR, SSS, PhilHealth, or any gov't agency with a link NOT on .gov.ph
   Urgency: "past due," "penalty," "failure to pay will result in," "warrant of arrest," "license suspended"
   Tell: Domain is .mx, .xyz, .top, .tk, .site, .info, .cc, or any non-.gov.ph TLD
   Verdict: CRITICAL — government agencies in PH never send payment links via SMS

2. BAYAD MUNA SCAM (Facebook Marketplace / OLX)
   Pattern: GCash payment first, seller will deliver later — no escrow, no buyer protection
   Filipino markers: "bayad muna," "padala muna," "i-gcash mo muna," "para masigurado"
   Verdict: CRITICAL — once GCash sent, seller disappears

3. INVESTMENT / PONZI SCAM
   Pattern: Guaranteed monthly returns (10-30%+), recruit friends for commission, "last slots"
   Filipino markers: "guaranteed return," "sure kita," "kumita na ang investors ko," "mag-invite ng friends"
   Verdict: CRITICAL — no legitimate investment guarantees returns; this is illegal and regulated by SEC

4. WITHDRAWAL FEE SCAM
   Pattern: "You have earned ₱50,000 — pay ₱2,000 withdrawal fee to release funds"
   Verdict: CRITICAL — no legitimate platform charges you to withdraw your own money

5. JOB PLACEMENT FEE SCAM
   Pattern: Job offer (often overseas/Dubai) requiring placement/processing fee before contract signing
   Tell: POEA-licensed agencies are PROHIBITED from collecting placement fees upfront (for most destinations)
   Verdict: CRITICAL — report to DMW/POEA; verify agency license at dmw.gov.ph

6. PROPERTY / LAND TITLE SCAM
   Pattern: Deposit required before seeing title; personal GCash/bank account for property payment; seller not on title
   Tell: Legitimate transactions go through a broker licensed by PRC, title verified at LRA/Registry of Deeds
   Signs of legitimacy: TCT/OCT number you can verify, licensed broker (PRC license), DHSUD-accredited developer
   Verdict: CRITICAL if deposit demanded before documents shown

7. LOAN ADVANCE FEE SCAM
   Pattern: Loan approved — pay processing/insurance fee first to release funds
   Tell: Legitimate lenders (SEC-registered) deduct fees from loan, never collect upfront
   Verdict: CRITICAL — verify lender at sec.gov.ph

8. OTP / PHISHING
   Pattern: Any message asking for your one-time pin, password, or account verification code
   Verdict: CRITICAL — banks, GCash, and Maya never ask for your OTP; this steals your account

9. PRIZE / RAFFLE SCAM
   Pattern: "You won ₱50,000 / iPhone / car — pay ₱500 shipping/tax to claim"
   Verdict: CRITICAL — you cannot win what you did not enter; payment to claim = scam

10. ROMANCE SCAM
    Pattern: Online relationship (often foreign military/doctor), eventual money request for emergency/travel
    Tell: Never met in person, video calls always fail, consistent excuses, sudden financial need
    Verdict: CRITICAL if money requested

11. FAKE LAND TITLE DOCUMENT
    Pattern: Title looks official but has errors (wrong format, misspelled agencies, wrong seal)
    Legitimate check: TCT/OCT must be verifiable at the Registry of Deeds (LRA) in the province where the land is
    Tell: Real titles have micro-printing, security paper, official LRA seals

12. DONATION SCAM
    Pattern: Disaster relief appeal to personal GCash with no organizational affiliation, emotional pressure
    Verdict: HIGH — verify through official channels (DSWD, Red Cross PH website)

══════════════════════════════════════════════
SEVERITY RULES
══════════════════════════════════════════════
- "critical": Pattern definitively matches a known fraud type with near-zero false positive rate
- "high": Strong indicator requiring verification before proceeding
- "medium": Concern worth noting — alone doesn't confirm fraud

SET canRead to FALSE ONLY if the content is literally blank or unrecognizable. If ANY text is readable, canRead must be TRUE and you MUST analyze it.

DO NOT FLAG AS RED FLAGS:
- Official Shopee/Lazada/Lazada checkout (order confirmed in-app)
- Payment to verified business account matching company name exactly
- Any .gov.ph URL (these are official)
- Established Philippine banks' own websites

${hasImages ? 'IMAGES ATTACHED — analyze visually: check for edited amounts, fake payment screenshots (wrong fonts, cut-off bank logos, impossible balances), stock profile photos used as seller photo, suspicious document formatting.' : ''}
${hasSearchResults ? 'WEB SEARCH RESULTS ATTACHED — if results show news articles, scam reports, or warnings about this entity/link/number, treat this as strong corroborating evidence. If results confirm legitimacy (official news, gov announcements), note as positive.' : ''}
${scamDbContext ? 'SCAM DATABASE MATCH — this identifier has been reported as a scammer by previous LegitCheck users. This is critical corroborating evidence.' : ''}`

  try {
    // Build message: images first, then text context
    const messageContent: any[] = []

    // Include all images directly — Claude reads them natively (no separate OCR needed)
    for (const img of imageContents) messageContent.push(img)

    const contextText = fullContext || textForKeywords
    messageContent.push({ type: 'text', text: `Analyze this for Philippine scam risk:\n\n${contextText}${signalContext}` })

    const aiResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: messageContent }],
    })

    const rawText = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : '{}'
    // Robust JSON extraction — handles markdown fences and truncated responses
    let jsonStr = rawText.replace(/```json\s*|```\s*/g, '').trim()
    // If JSON is truncated (cut off mid-stream), attempt to close it
    if (!jsonStr.endsWith('}')) {
      const lastBrace = jsonStr.lastIndexOf('}')
      jsonStr = lastBrace > 0 ? jsonStr.slice(0, lastBrace + 1) + '}' : jsonStr + '}'
    }
    let parsed: any = {}
    try { parsed = JSON.parse(jsonStr) } catch {
      // Try extracting just the fields we need via regex fallback
      const obs = rawText.match(/"observation"\s*:\s*"([^"]+)"/g) || []
      if (obs.length > 0) {
        parsed = {
          entitySummary: (rawText.match(/"entitySummary"\s*:\s*"([^"]+)"/) || [])[1] || '',
          headlineFinding: (rawText.match(/"headlineFinding"\s*:\s*"([^"]+)"/) || [])[1] || '',
          redFlags: obs.slice(0, 4).map(o => ({ observation: o.replace(/"observation"\s*:\s*"/, '').replace(/"$/, ''), reason: 'See full analysis.', severity: 'high' })),
          positiveIndicators: [],
          canRead: true,
        }
      }
    }

    entitySummary = parsed.entitySummary || ''
    const officialResource: string = parsed.officialResource || ''
    aiInsights    = [parsed.entitySummary, parsed.headlineFinding, officialResource].filter(Boolean).slice(0, 3)

    // ── Compute trustScore FROM findings — not from Claude's score ──────────────
    // Claude's job is to FIND things. Our job is to SCORE based on what was found.
    const redFlagList: Array<{ observation: string; reason: string; severity: string }> = parsed.redFlags || []
    const positiveList: Array<{ observation: string; reason: string }> = parsed.positiveIndicators || []
    const canRead = parsed.canRead !== false  // default true

    scoreSteps = []

    if (!canRead) {
      trustScore = 45
      scoreSteps.push({ label: 'Content could not be read', delta: -25 })
    } else {
      let score = 70
      scoreSteps.push({ label: 'Starting point (neutral — must earn trust)', delta: 0 })

      for (const flag of redFlagList) {
        const delta = flag.severity === 'critical' ? -38 : flag.severity === 'high' ? -22 : -10
        const label = flag.severity === 'critical'
          ? `Critical red flag: ${flag.observation.slice(0, 60)}${flag.observation.length > 60 ? '…' : ''}`
          : flag.severity === 'high'
            ? `High-risk signal: ${flag.observation.slice(0, 60)}${flag.observation.length > 60 ? '…' : ''}`
            : `Concern: ${flag.observation.slice(0, 60)}${flag.observation.length > 60 ? '…' : ''}`
        score += delta
        scoreSteps.push({ label, delta })
      }

      for (const pos of positiveList) {
        score += 12
        scoreSteps.push({ label: `Positive: ${pos.observation.slice(0, 60)}${pos.observation.length > 60 ? '…' : ''}`, delta: 12 })
      }

      if (scamDbContext) {
        score -= 50
        scoreSteps.push({ label: 'Confirmed in scam database', delta: -50 })
      }
      if (searchContext && searchContext.toLowerCase().includes('scam')) {
        score -= 25
        scoreSteps.push({ label: 'Web search found scam reports', delta: -25 })
      }

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
  } catch (e: any) {
    console.error('Claude analysis error:', e)
    const errMsg = e?.message || e?.error?.message || String(e) || 'unknown'
    console.error('Error detail:', errMsg)
    // Fallback: keyword engine runs as primary — still returns real findings
    const catIdFb  = detectCategory(textForKeywords)
    const sigIdsFb = detectSignals(textForKeywords, catIdFb)
    const fallback = computeRisk(catIdFb, sigIdsFb)
    // Override score/color from keyword findings
    const fbTrustScore = 100 - fallback.score
    const fbColor: RiskColor = fbTrustScore < 35 ? 'red' : fbTrustScore < 70 ? 'yellow' : 'green'
    fallback.color = fbColor
    if (fbColor === 'red') {
      fallback.headline    = { en: 'Scam Warning — Stop', tl: 'Babala: Scam — Tigil' }
      fallback.subheadline = { en: 'High risk detected. Do not send money or share details.', tl: 'Mataas ang panganib. Huwag magpadala ng pera.' }
      fallback.action      = { en: 'Stop. Do not pay or share any info.', tl: 'Tigil. Huwag magbayad o magbigay ng impormasyon.' }
    }
    return NextResponse.json({
      result: { ...fallback, aiInsights: ['Pattern detection only — AI analysis unavailable.'] },
      extractedText: analysisText,
      trustScore: fbTrustScore,
      scoreSteps: [{ label: 'Pattern-based detection (AI unavailable)', delta: 0 }],
      tier,
    })
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

  return NextResponse.json({ result: finalResult, extractedText: analysisText, fetchedUrl, trustScore, searchPerformed: !!searchContext, scoreSteps: scoreSteps || [], tier })
}
