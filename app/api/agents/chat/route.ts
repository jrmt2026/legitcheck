import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AGENTS } from '@/lib/agents'
import { checkBudgetAndRecord } from '@/lib/aiBudget'
import type { AgentRole } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // systemPrompt must come from server — never trust the client's copy
  const { agentRole, messages } = await req.json()
  const agent = AGENTS[agentRole as AgentRole]
  if (!agent) return NextResponse.json({ error: 'Invalid agent' }, { status: 400 })

  const budgetAllowed = await checkBudgetAndRecord('agent')
  if (!budgetAllowed) {
    return NextResponse.json({ content: 'Hi! Bantay is temporarily resting for today — the daily AI limit has been reached. Please come back tomorrow. Para sa urgent na check, gamitin ang keyword-based Analyze Risk button.' })
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: agent.systemPrompt,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  })

  const content = response.content[0].type === 'text' ? response.content[0].text : ''
  return NextResponse.json({ content })
}
