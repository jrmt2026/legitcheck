'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Loader2 } from 'lucide-react'
import { AGENTS, callAgent } from '@/lib/agents'
import type { AgentRole, AgentMessage } from '@/types'

const AGENT_COLORS: Record<AgentRole, string> = {
  fraud_detector:   'bg-brand-red-light text-brand-red-dark border-brand-red/20',
  qa_engineer:      'bg-brand-blue-light text-brand-blue-dark border-brand-blue/20',
  cpo:              'bg-purple-50 text-purple-800 border-purple-200',
  cmo:              'bg-brand-yellow-light text-brand-yellow-dark border-brand-yellow/20',
  product_designer: 'bg-brand-green-light text-brand-green-dark border-brand-green/20',
}

const AGENT_AVATAR: Record<AgentRole, string> = {
  fraud_detector: 'bg-brand-red text-white',
  qa_engineer: 'bg-brand-blue text-white',
  cpo: 'bg-purple-600 text-white',
  cmo: 'bg-brand-yellow text-white',
  product_designer: 'bg-brand-green text-white',
}

export default function AgentsPage() {
  const [activeAgent, setActiveAgent] = useState<AgentRole>('fraud_detector')
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const agent = AGENTS[activeAgent]

  useEffect(() => {
    // Initialize with greeting
    setMessages([{
      role: 'assistant',
      content: agent.greeting,
      agentRole: activeAgent,
      timestamp: new Date().toISOString(),
    }])
  }, [activeAgent])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || loading) return
    const userMsg: AgentMessage = { role: 'user', content: input, timestamp: new Date().toISOString() }
    const history = messages.map(m => ({ role: m.role, content: m.content }))
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const reply = await callAgent(activeAgent, input, history)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply,
        agentRole: activeAgent,
        timestamp: new Date().toISOString(),
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I ran into an issue. Please try again.',
        agentRole: activeAgent,
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper-2 flex flex-col">
      {/* Header */}
      <header className="border-b border-line bg-paper px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <Link href="/dashboard" className="text-ink-3 hover:text-ink transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-baseline gap-1 flex-1">
          <span className="text-base font-medium text-ink">LegitCheck</span>
          <span className="text-base font-light text-ink-2">PH</span>
          <span className="ml-2 text-xs font-mono text-ink-3">/ Agents</span>
        </div>
      </header>

      {/* Agent selector */}
      <div className="border-b border-line bg-paper px-4 py-3 overflow-x-auto flex-shrink-0">
        <div className="flex gap-2 min-w-max">
          {(Object.values(AGENTS)).map(ag => (
            <button
              key={ag.role}
              onClick={() => setActiveAgent(ag.role)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all whitespace-nowrap ${
                activeAgent === ag.role
                  ? AGENT_COLORS[ag.role] + ' border'
                  : 'border-line text-ink-3 hover:text-ink bg-paper'
              }`}
            >
              <span>{ag.emoji}</span>
              {ag.name}
            </button>
          ))}
        </div>
      </div>

      {/* Agent info strip */}
      <div className="px-4 py-3 bg-paper border-b border-line flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium flex-shrink-0 ${AGENT_AVATAR[activeAgent]}`}>
            {agent.emoji}
          </div>
          <div>
            <div className="text-sm font-medium text-ink">{agent.name}</div>
            <div className="text-xs text-ink-3">{agent.title}</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role === 'assistant' && (
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs flex-shrink-0 mt-0.5 ${AGENT_AVATAR[activeAgent]}`}>
                {agent.emoji}
              </div>
            )}
            <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-ink text-white rounded-tr-sm'
                : 'bg-paper border border-line text-ink-2 rounded-tl-sm'
            }`}>
              {msg.content.split('\n').map((line, j) => (
                <span key={j}>{line}{j < msg.content.split('\n').length - 1 && <br />}</span>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs flex-shrink-0 ${AGENT_AVATAR[activeAgent]}`}>
              {agent.emoji}
            </div>
            <div className="bg-paper border border-line rounded-2xl rounded-tl-sm px-3.5 py-3 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-ink-3 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-ink-3 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-ink-3 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-line bg-paper px-4 py-3 flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder={`Ask ${agent.name}…`}
            rows={1}
            className="flex-1 border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink bg-paper-2 focus:outline-none focus:border-ink placeholder-ink-3 resize-none leading-relaxed max-h-32"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-10 h-10 bg-ink text-white rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 flex-shrink-0"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
        <p className="text-xs text-ink-3 mt-2 text-center">
          Powered by Claude · For guidance only · Not legal advice
        </p>
      </div>
    </div>
  )
}
