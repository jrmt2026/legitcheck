import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const RISK: Record<string, { label: string; color: string; emoji: string }> = {
  green:  { label: 'Likely Safe',        color: '#1a9968', emoji: '✅' },
  yellow: { label: 'Needs Verification', color: '#c47b0a', emoji: '🔔' },
  orange: { label: 'Suspicious',         color: '#d4650a', emoji: '🔶' },
  red:    { label: 'High Risk',          color: '#c0312c', emoji: '⚠️' },
}

export default async function Image({ params }: { params: { token: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: link } = await supabase
    .from('share_links')
    .select('checks(score, color, result)')
    .eq('token', params.token)
    .single()

  const check   = Array.isArray(link?.checks) ? link.checks[0] : (link?.checks as any)
  const color   = (check?.color as string) || 'yellow'
  const score   = check?.score ?? 50
  const trust   = 100 - score
  const cfg     = RISK[color] ?? RISK.yellow
  const result  = check?.result as any
  const headline = ((result?.headline?.en as string) || cfg.label).slice(0, 90)

  return new ImageResponse(
    (
      <div style={{ width: '1200px', height: '630px', display: 'flex', flexDirection: 'column', backgroundColor: '#0f1117', padding: '56px 64px', fontFamily: 'system-ui, sans-serif' }}>

        {/* Brand bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '52px' }}>
          <div style={{ backgroundColor: cfg.color, borderRadius: '8px', padding: '6px 14px', fontSize: '13px', fontWeight: 800, color: 'white', letterSpacing: '2px' }}>
            LEGITCHECK PH
          </div>
          <span style={{ color: '#555', fontSize: '15px' }}>Transaction Risk Report</span>
        </div>

        {/* Main row */}
        <div style={{ display: 'flex', flex: 1, gap: '64px', alignItems: 'center' }}>

          {/* Score circle */}
          <div style={{ width: '210px', height: '210px', borderRadius: '50%', border: `10px solid ${cfg.color}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: cfg.color + '18' }}>
            <span style={{ fontSize: '80px', fontWeight: 900, color: 'white', lineHeight: '1' }}>{trust}</span>
            <span style={{ fontSize: '18px', color: '#888', marginTop: '4px' }}>/100</span>
          </div>

          {/* Text */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: cfg.color + '20', border: `1.5px solid ${cfg.color}44`, borderRadius: '10px', padding: '10px 18px', width: 'fit-content' }}>
              <span style={{ fontSize: '22px' }}>{cfg.emoji}</span>
              <span style={{ color: cfg.color, fontWeight: 800, fontSize: '20px', letterSpacing: '1px' }}>{cfg.label.toUpperCase()}</span>
            </div>
            <p style={{ color: 'white', fontSize: '34px', fontWeight: 700, lineHeight: '1.25', margin: '0' }}>{headline}</p>
            <p style={{ color: '#666', fontSize: '18px', margin: '0' }}>Tap to view the full risk report →</p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #222' }}>
          <span style={{ color: '#444', fontSize: '15px' }}>legitcheck-ph.vercel.app</span>
          <span style={{ color: '#444', fontSize: '15px' }}>Safety Score: {trust}/100 · Checked before sending money</span>
        </div>

      </div>
    ),
    { width: 1200, height: 630 }
  )
}
