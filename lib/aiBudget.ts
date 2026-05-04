import { createClient } from '@supabase/supabase-js'

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Conservative per-call cost estimates (USD) — Claude Sonnet 4
// analyze: ~5k input + 500 output tokens
// verify:  ~1.5k input + 200 output tokens
// agent:   ~1k input + 200 output tokens
export const AI_CALL_COSTS = {
  analyze: 0.023,
  verify:  0.008,
  agent:   0.006,
} as const

export type AiCallType = keyof typeof AI_CALL_COSTS

export interface DailyBudgetStatus {
  date:             string
  analyzeCalls:     number
  verifyCalls:      number
  agentCalls:       number
  estimatedCostUsd: number
  dailyLimitUsd:    number
  percentUsed:      number
  isOverBudget:     boolean
}

export async function getAiBudgetStatus(date?: string): Promise<DailyBudgetStatus> {
  const d = date ?? new Date().toISOString().split('T')[0]

  const [usageResult, configResult] = await Promise.all([
    serviceClient.from('ai_usage_daily').select('*').eq('date', d).single(),
    serviceClient.from('ai_budget_config').select('daily_limit_usd').eq('id', 1).single(),
  ])

  const usage         = usageResult.data
  const dailyLimitUsd = Number(configResult.data?.daily_limit_usd ?? process.env.AI_DAILY_LIMIT_USD ?? 10)
  const estimatedCostUsd = Number(usage?.estimated_cost_usd ?? 0)

  return {
    date:             d,
    analyzeCalls:     usage?.analyze_calls  ?? 0,
    verifyCalls:      usage?.verify_calls   ?? 0,
    agentCalls:       usage?.agent_calls    ?? 0,
    estimatedCostUsd,
    dailyLimitUsd,
    percentUsed:      dailyLimitUsd > 0 ? (estimatedCostUsd / dailyLimitUsd) * 100 : 0,
    isOverBudget:     estimatedCostUsd >= dailyLimitUsd,
  }
}

// Returns true if the call is allowed (under budget), false if blocked.
// Always fails open — if the DB is unavailable, the call proceeds.
export async function checkBudgetAndRecord(type: AiCallType): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0]
  const cost  = AI_CALL_COSTS[type]

  try {
    const [usageResult, configResult] = await Promise.all([
      serviceClient.from('ai_usage_daily').select('*').eq('date', today).single(),
      serviceClient.from('ai_budget_config').select('daily_limit_usd').eq('id', 1).single(),
    ])

    const usage         = usageResult.data
    const dailyLimitUsd = Number(configResult.data?.daily_limit_usd ?? process.env.AI_DAILY_LIMIT_USD ?? 10)
    const currentCost   = Number(usage?.estimated_cost_usd ?? 0)

    if (currentCost + cost > dailyLimitUsd) return false

    // Best-effort increment (slight over-count is acceptable during concurrent bursts)
    if (usage) {
      await serviceClient
        .from('ai_usage_daily')
        .update({
          analyze_calls:      type === 'analyze' ? (usage.analyze_calls ?? 0) + 1 : (usage.analyze_calls ?? 0),
          verify_calls:       type === 'verify'  ? (usage.verify_calls  ?? 0) + 1 : (usage.verify_calls  ?? 0),
          agent_calls:        type === 'agent'   ? (usage.agent_calls   ?? 0) + 1 : (usage.agent_calls   ?? 0),
          estimated_cost_usd: currentCost + cost,
          updated_at:         new Date().toISOString(),
        })
        .eq('date', today)
    } else {
      await serviceClient.from('ai_usage_daily').insert({
        date:               today,
        analyze_calls:      type === 'analyze' ? 1 : 0,
        verify_calls:       type === 'verify'  ? 1 : 0,
        agent_calls:        type === 'agent'   ? 1 : 0,
        estimated_cost_usd: cost,
      })
    }

    return true
  } catch {
    return true // fail open — don't block users if budget check itself errors
  }
}
