'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Loader2, Shield } from 'lucide-react'
import { AGENTS, callAgent } from '@/lib/agents'
import type { AgentMessage } from '@/types'

const agent = AGENTS['bantay']

export default function BantayPage() {
  const [messages, setMessages] = useState<AgentMessage[]>([{
    role: 'assistant',
    content: agent.greeting,
    agentRole: 'bantay',
    timestamp: new Date().toISOString(),
  }])
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

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
      const reply = await callAgent('bantay', input, history)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply,
        agentRole: 'bantay',
        timestamp: new Date().toISOString(),
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'May nangyaring mali. Subukan ulit.',
        agentRole: 'bantay',
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
        <div className="w-8 h-8 rounded-xl bg-brand-teal-light border border-brand-teal/20 flex items-center justify-center flex-shrink-0">
          <Shield size={15} className="text-brand-teal-dark" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-ink">{agent.name}</div>
          <div className="text-xs text-ink-3">{agent.title}</div>
        </div>
        <Link
          href="/buyer"
          className="text-xs font-semibold text-white bg-ink px-3 py-1.5 rounded-xl hover:opacity-90 transition-opacity flex-shrink-0"
        >
          Analyze Risk →
        </Link>
      </header>

      {/* Scope note */}
      <div className="px-4 py-2 bg-brand-teal-light border-b border-brand-teal/20 flex-shrink-0">
        <p className="text-xs text-brand-teal-dark text-center">
          Bantay answers scam awareness questions. Para sa specific na check, tap <strong>Analyze Risk</strong>.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-brand-teal-light border border-brand-teal/20 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                🛡️
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
            <div className="w-8 h-8 rounded-xl bg-brand-teal-light border border-brand-teal/20 flex items-center justify-center text-sm flex-shrink-0">
              🛡️
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

      {/* Suggested questions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2 flex-shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              'What are common scam signs?',
              'Paano mag-report ng scam?',
              'Is GCash safe to use?',
              'How do I check a seller?',
            ].map(q => (
              <button
                key={q}
                onClick={() => { setInput(q); }}
                className="flex-shrink-0 text-xs text-ink-2 bg-paper border border-line rounded-xl px-3 py-2 hover:bg-paper-2 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-line bg-paper px-4 py-3 flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Ask Bantay a question…"
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
      </div>
    </div>
  )
}
