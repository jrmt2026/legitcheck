// Extracts and normalizes entities from submission text for cross-matching and intelligence tracking.

import type { ExtractedEntity, EntityType } from '@/types'

// Mask sensitive data for public display
function maskPhone(phone: string): string {
  // 09XXXXXXXXX → 09XX••••XX
  if (phone.length >= 10) return phone.slice(0, 4) + '••••' + phone.slice(-2)
  return phone.slice(0, 2) + '••••'
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email.slice(0, 3) + '•••'
  return local.slice(0, 2) + '•••@' + domain
}

function maskAccount(account: string): string {
  if (account.length <= 4) return '••••'
  return account.slice(0, 2) + '•'.repeat(account.length - 4) + account.slice(-2)
}

function maskName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 1) + '•••'
  return parts[0] + ' ' + parts.slice(1).map(p => p.slice(0, 1) + '•••').join(' ')
}

function normPhone(raw: string): string {
  let n = raw.replace(/\D/g, '')
  if (n.startsWith('63')) n = '0' + n.slice(2)
  if (n.startsWith('9') && n.length === 10) n = '0' + n
  return n
}

function normEmail(raw: string): string {
  return raw.toLowerCase().trim()
}

function normDomain(raw: string): string {
  try {
    const url = raw.startsWith('http') ? raw : 'https://' + raw
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return raw.toLowerCase().replace(/^www\./, '').trim()
  }
}

function normName(raw: string): string {
  return raw.toLowerCase().replace(/\s+/g, ' ').trim()
}

export function extractEntities(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = []
  const seen = new Set<string>() // deduplicate by type+normalized

  function add(entity_type: EntityType, value: string, normalized_value: string, masked_value: string, role: ExtractedEntity['role'] = 'other') {
    const key = `${entity_type}:${normalized_value}`
    if (seen.has(key) || !normalized_value) return
    seen.add(key)
    entities.push({ entity_type, value, normalized_value, masked_value, role })
  }

  // ── Philippine phone numbers ──────────────────────────────────────────────
  const phoneMatches = text.match(/(\+?63|0)9\d{2}[\s-]?\d{3}[\s-]?\d{4}/g) || []
  for (const raw of phoneMatches) {
    const cleaned = raw.replace(/[\s-]/g, '')
    const normalized = normPhone(cleaned)
    add('phone', cleaned, normalized, maskPhone(normalized), 'contact_number')
  }

  // ── Email addresses ────────────────────────────────────────────────────────
  const emailMatches = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || []
  for (const raw of emailMatches) {
    add('email', raw, normEmail(raw), maskEmail(raw), 'contact_number')
  }

  // ── URLs / Domains ────────────────────────────────────────────────────────
  const urlMatches = text.match(/https?:\/\/[^\s\)\"\']+|www\.[a-z0-9\-]+\.[a-z]{2,}[^\s\)\"\']{0,100}/gi) || []
  for (const raw of urlMatches) {
    const normalized = normDomain(raw)
    if (!normalized || normalized.length < 4) continue
    // Skip known safe domains
    if (['facebook.com','instagram.com','google.com','youtube.com'].includes(normalized)) continue
    add('domain', raw, normalized, normalized, 'website')
    // Also store full URL if it has a path
    if (raw.includes('/') && raw.replace(/https?:\/\//, '').includes('/')) {
      const shortUrl = raw.slice(0, 80)
      add('url', shortUrl, shortUrl.toLowerCase(), shortUrl, 'website')
    }
  }

  // ── Facebook / social pages ────────────────────────────────────────────────
  const fbMatches = text.match(/(?:fb\.com|facebook\.com)\/(?:groups\/|pages\/)?([a-zA-Z0-9.\-_]+)/gi) || []
  for (const raw of fbMatches) {
    const handle = raw.replace(/.*\//,'').toLowerCase()
    if (handle.length < 3) continue
    add('social_page', raw, `fb:${handle}`, raw, 'social_page')
  }

  // ── GCash / Maya / e-wallet account number patterns ────────────────────────
  // GCash account numbers look like phone numbers; Maya can be similar
  // Already covered by phone number extraction above

  // ── Bank account numbers (Philippine format: 10-16 digits, often with dashes) ─
  const bankAcctMatches = text.match(/\b\d{2,4}[-\s]?\d{3,4}[-\s]?\d{4,8}\b/g) || []
  for (const raw of bankAcctMatches) {
    const normalized = raw.replace(/[\s-]/g, '')
    if (normalized.length < 8 || normalized.length > 20) continue
    // Skip if it looks like a phone number (already handled)
    if (normalized.startsWith('09') || normalized.startsWith('639')) continue
    // Skip if it's just a date or year
    if (/^(19|20)\d{2}/.test(normalized) && normalized.length <= 8) continue
    add('bank_account', raw, normalized, maskAccount(normalized), 'payment_account')
  }

  // ── Person names (Capitalized 2-4 word sequences not at sentence start) ────
  const nameMatches = text.match(/(?<![.!?\n])\b([A-Z][a-z]{1,15})(?:\s+[A-Z][a-z]{1,15}){1,3}\b/g) || []
  for (const raw of nameMatches) {
    // Filter out obvious non-names (common English/Tagalog words)
    const stopwords = new Set(['The', 'This', 'That', 'Your', 'From', 'With', 'For', 'Send', 'Click', 'Please', 'Dear', 'Hello', 'Good', 'Para', 'Kung', 'Ang', 'Mga'])
    const firstWord = raw.split(' ')[0]
    if (stopwords.has(firstWord)) continue
    if (raw.split(' ').length < 2) continue
    add('person', raw, normName(raw), maskName(raw), 'referenced_person')
  }

  // ── Business / company names ──────────────────────────────────────────────
  const bizMatches = text.match(/\b([A-Z][A-Za-z0-9\s&,\.]{2,40}(?:Inc\.?|Corp\.?|Co\.?|Ltd\.?|LLC|Trading|Enterprise|Enterprises|Foundation|Group|Holdings|International|Philippines|PH)\b)/g) || []
  for (const raw of bizMatches) {
    add('business', raw.trim(), normName(raw.trim()), raw.trim().slice(0, 40), 'claimed_company')
  }

  return entities
}

export function maskEntitiesForPublic(entities: ExtractedEntity[]): ExtractedEntity[] {
  return entities.map(e => ({ ...e, value: e.masked_value }))
}
