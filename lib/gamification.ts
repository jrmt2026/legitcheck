export interface Badge {
  id: string
  label: string
  emoji: string
  desc: string
  colorClass: string
}

export const BADGES: Record<string, Badge> = {
  first_check:          { id: 'first_check',          emoji: '🛡️', label: 'First Check',          desc: 'Completed your first LegitCheck.',               colorClass: 'badge-teal'   },
  scam_spotter:         { id: 'scam_spotter',          emoji: '🔍', label: 'Scam Spotter',          desc: 'Completed 5 checks.',                            colorClass: 'badge-green'  },
  phishing_defender:    { id: 'phishing_defender',     emoji: '📵', label: 'Phishing Defender',     desc: 'Checked an SMS / text scam.',                    colorClass: 'badge-blue'   },
  marketplace_guardian: { id: 'marketplace_guardian',  emoji: '🛍️', label: 'Marketplace Guardian',  desc: 'Checked an online seller or listing.',           colorClass: 'badge-purple' },
  ofw_ally:             { id: 'ofw_ally',              emoji: '✈️', label: 'OFW Safety Ally',       desc: 'Checked a job or recruitment offer.',            colorClass: 'badge-gold'   },
  donation_defender:    { id: 'donation_defender',     emoji: '❤️', label: 'Donation Defender',     desc: 'Checked a donation or charity request.',         colorClass: 'badge-red'    },
  investment_skeptic:   { id: 'investment_skeptic',    emoji: '💰', label: 'Investment Skeptic',    desc: 'Checked an investment offer.',                   colorClass: 'badge-gold'   },
  red_flag_master:      { id: 'red_flag_master',       emoji: '🏆', label: 'Red Flag Master',       desc: 'Completed 50 checks.',                           colorClass: 'badge-gold'   },
  community_reporter:   { id: 'community_reporter',    emoji: '🚩', label: 'Community Reporter',    desc: 'Submitted your first scam report.',              colorClass: 'badge-purple' },
  family_protector:     { id: 'family_protector',      emoji: '👨‍👩‍👧', label: 'Family Protector',      desc: 'Shared a warning with someone.',                 colorClass: 'badge-teal'   },
  verified_helper:      { id: 'verified_helper',       emoji: '✅', label: 'Verified Helper',       desc: 'Submitted 3 or more reports.',                   colorClass: 'badge-green'  },
}

export interface ShieldLevel {
  label: string
  minScore: number
  color: string
}

export const SHIELD_LEVELS: ShieldLevel[] = [
  { label: 'Rookie',              minScore: 0,   color: 'text-ink-3'          },
  { label: 'Scam Spotter',        minScore: 50,  color: 'text-brand-teal-dark' },
  { label: 'Fraud Defender',      minScore: 150, color: 'text-brand-blue-dark' },
  { label: 'Safety Guardian',     minScore: 350, color: 'text-brand-green-dark' },
  { label: 'Community Protector', minScore: 700, color: 'text-brand-gold-dark'  },
]

export function getShieldLevel(score: number): ShieldLevel {
  return [...SHIELD_LEVELS].reverse().find(l => score >= l.minScore) ?? SHIELD_LEVELS[0]
}

export function getNextLevel(score: number): { level: ShieldLevel; pointsNeeded: number } | null {
  const next = SHIELD_LEVELS.find(l => score < l.minScore)
  if (!next) return null
  return { level: next, pointsNeeded: next.minScore - score }
}

export function checkBadgeUnlocks(
  current: string[],
  checksTotal: number,
  reportsTotal: number,
  categoryId: string,
): string[] {
  const earned: string[] = []
  const has = (id: string) => current.includes(id) || earned.includes(id)

  if (!has('first_check')          && checksTotal >= 1)                    earned.push('first_check')
  if (!has('scam_spotter')         && checksTotal >= 5)                    earned.push('scam_spotter')
  if (!has('red_flag_master')      && checksTotal >= 50)                   earned.push('red_flag_master')
  if (!has('phishing_defender')    && categoryId === 'sms_text')           earned.push('phishing_defender')
  if (!has('marketplace_guardian') && categoryId === 'online_purchase')    earned.push('marketplace_guardian')
  if (!has('ofw_ally')             && categoryId === 'job_agency')         earned.push('ofw_ally')
  if (!has('donation_defender')    && categoryId === 'donation')           earned.push('donation_defender')
  if (!has('investment_skeptic')   && categoryId === 'investment')         earned.push('investment_skeptic')
  if (!has('community_reporter')   && reportsTotal >= 1)                   earned.push('community_reporter')
  if (!has('verified_helper')      && reportsTotal >= 3)                   earned.push('verified_helper')

  return earned
}

export function calcPoints(color: string): number {
  // Base: 10pts. Bonus 5pts if a real scam/risk was caught.
  return color === 'red' || color === 'orange' ? 15 : 10
}

export function calcStreak(lastCheckDate: string | null, currentStreak: number): number {
  if (!lastCheckDate) return 1
  const last = new Date(lastCheckDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  last.setHours(0, 0, 0, 0)
  const diffDays = Math.round((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return currentStreak      // same day, no change
  if (diffDays === 1) return currentStreak + 1  // consecutive day
  return 1                                       // streak broken
}
