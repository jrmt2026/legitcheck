import { createClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const raw = randomBytes(24).toString('hex')
  const key  = `lc_live_${raw}`
  const hash = createHash('sha256').update(key).digest('hex')
  const prefix = key.slice(0, 16) // 'lc_live_' + 8 chars
  return { key, hash, prefix }
}

export async function verifyApiKey(rawKey: string): Promise<{
  valid: boolean
  companyId?: string
  keyId?: string
  monthlyLimit?: number
  requestsThisMonth?: number
}> {
  if (!rawKey.startsWith('lc_live_')) return { valid: false }

  const keyHash = createHash('sha256').update(rawKey).digest('hex')

  const { data } = await supabase
    .from('api_keys')
    .select('id, company_id, is_active, monthly_limit, requests_this_month')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single()

  if (!data) return { valid: false }

  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)

  return {
    valid: true,
    companyId: data.company_id,
    keyId: data.id,
    monthlyLimit: data.monthly_limit,
    requestsThisMonth: data.requests_this_month,
  }
}

export async function incrementApiUsage(keyId: string, currentCount: number, count = 1) {
  try {
    await supabase
      .from('api_keys')
      .update({ requests_this_month: currentCount + count, last_used_at: new Date().toISOString() })
      .eq('id', keyId)
  } catch { /* silent */ }
}

// ── SEC / DTI auto-verification ───────────────────────────────────────────────

const SEC_NUMBER_PATTERN = /^(CS|OPC|HC|LC|F\d*|DC|NP|00)\d{6,}/i

export function isValidSecNumber(num: string): boolean {
  return SEC_NUMBER_PATTERN.test(num.replace(/[-\s]/g, ''))
}

export function isValidDtiNumber(num: string): boolean {
  // DTI business names: typically numeric registration number
  return /^\d{6,12}$/.test(num.replace(/[-\s]/g, ''))
}

export async function trySecVerification(
  companyName: string,
  secNumber: string,
): Promise<'verified' | 'not_found' | 'error'> {
  if (!isValidSecNumber(secNumber)) return 'not_found'

  try {
    const ctrl = new AbortController()
    const timeout = setTimeout(() => ctrl.abort(), 7000)

    const cleanNum = secNumber.replace(/[-\s]/g, '').toUpperCase()
    const res = await fetch(
      `https://efiling.sec.gov.ph/eFiling/viewCompanyInformation.html?rn=${encodeURIComponent(cleanNum)}`,
      {
        signal: ctrl.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LegitCheckPH/1.0)' },
      },
    )
    clearTimeout(timeout)

    if (!res.ok) return 'error'
    const html = await res.text()

    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
    const words = companyName.split(/\s+/).filter(w => w.length > 3).map(normalize)
    if (words.length === 0) return 'error'

    const matches = words.filter(w => normalize(html).includes(w))
    return matches.length >= Math.max(1, Math.ceil(words.length * 0.5)) ? 'verified' : 'not_found'
  } catch {
    return 'error'
  }
}
