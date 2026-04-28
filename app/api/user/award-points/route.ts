import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calcPoints, calcStreak, checkBadgeUnlocks } from '@/lib/gamification'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { categoryId, color } = await req.json()

  // Fetch current profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('shield_score, checks_total, reports_total, streak_days, last_check_date, badges_earned')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const points       = calcPoints(color)
  const newScore     = (profile.shield_score ?? 0) + points
  const newTotal     = (profile.checks_total ?? 0) + 1
  const newStreak    = calcStreak(profile.last_check_date, profile.streak_days ?? 0)
  const currentBadges: string[] = profile.badges_earned ?? []
  const newBadges    = checkBadgeUnlocks(currentBadges, newTotal, profile.reports_total ?? 0, categoryId ?? '')
  const allBadges    = [...currentBadges, ...newBadges]

  await supabase
    .from('profiles')
    .update({
      shield_score:    newScore,
      checks_total:    newTotal,
      streak_days:     newStreak,
      last_check_date: new Date().toISOString().split('T')[0],
      badges_earned:   allBadges,
    })
    .eq('id', user.id)

  return NextResponse.json({
    shieldScore:  newScore,
    checksTotal:  newTotal,
    streak:       newStreak,
    pointsEarned: points,
    newBadges,
  })
}
