'use client'

import { BADGES, SHIELD_LEVELS, getShieldLevel, getNextLevel } from '@/lib/gamification'

interface Props {
  shieldScore:  number
  checksTotal:  number
  streakDays:   number
  badgesEarned: string[]
  reportsTotal: number
}

export default function ScamShieldScore({
  shieldScore,
  checksTotal,
  streakDays,
  badgesEarned,
  reportsTotal,
}: Props) {
  const level    = getShieldLevel(shieldScore)
  const nextInfo = getNextLevel(shieldScore)
  const pct      = nextInfo
    ? Math.min(100, Math.round(((shieldScore - level.minScore) / (nextInfo.level.minScore - level.minScore)) * 100))
    : 100

  const radius = 44
  const circ   = 2 * Math.PI * radius
  const dash   = (pct / 100) * circ

  return (
    <div className="bg-paper border border-line rounded-2xl p-5 space-y-5">

      {/* Score ring + level */}
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-line" />
            <circle
              cx="50" cy="50" r={radius} fill="none"
              stroke="currentColor" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circ}`}
              className="text-brand-teal transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-ink leading-none">{shieldScore}</span>
            <span className="text-[10px] text-ink-3 leading-none mt-0.5">pts</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className={`text-base font-bold ${level.color}`}>{level.label}</div>
          {nextInfo ? (
            <div className="text-xs text-ink-3 mt-1 leading-snug">
              {nextInfo.pointsNeeded} pts to <span className="text-ink-2 font-medium">{nextInfo.level.label}</span>
            </div>
          ) : (
            <div className="text-xs text-ink-3 mt-1">Max level reached</div>
          )}

          <div className="flex items-center gap-3 mt-3 text-xs text-ink-3">
            <span className="flex items-center gap-1">
              <span className="text-brand-teal font-bold text-sm">{checksTotal}</span> checks
            </span>
            <span className="text-line">·</span>
            <span className="flex items-center gap-1">
              <span className="text-brand-orange font-bold text-sm">{streakDays}</span>
              {streakDays === 1 ? 'day' : 'days'} streak
            </span>
            <span className="text-line">·</span>
            <span className="flex items-center gap-1">
              <span className="text-brand-red font-bold text-sm">{reportsTotal}</span> reports
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar to next level */}
      {nextInfo && (
        <div>
          <div className="flex items-center justify-between text-[11px] text-ink-3 mb-1.5">
            <span>{level.label}</span>
            <span>{nextInfo.level.label}</span>
          </div>
          <div className="h-1.5 bg-line rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-teal rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Badges */}
      {badgesEarned.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider mb-2.5">Badges earned</p>
          <div className="flex flex-wrap gap-2">
            {badgesEarned.map(id => {
              const b = BADGES[id]
              if (!b) return null
              return (
                <div
                  key={id}
                  title={b.desc}
                  className="flex items-center gap-1.5 bg-paper-2 border border-line rounded-xl px-2.5 py-1.5"
                >
                  <span className="text-sm">{b.emoji}</span>
                  <span className="text-xs font-medium text-ink-2">{b.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {badgesEarned.length === 0 && (
        <div className="text-xs text-ink-3 text-center py-1">
          Complete your first check to earn badges
        </div>
      )}
    </div>
  )
}
