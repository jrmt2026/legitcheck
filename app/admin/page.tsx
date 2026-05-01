'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const CommandCenter = dynamic(() => import('./tabs/CommandCenter'),   { loading: () => <Spinner /> })
const ReportsTab    = dynamic(() => import('./tabs/ReportsTab'),      { loading: () => <Spinner /> })
const SellersTab    = dynamic(() => import('./tabs/SellersTab'),      { loading: () => <Spinner /> })
const UsersTab      = dynamic(() => import('./tabs/UsersTab'),        { loading: () => <Spinner /> })
const IntelligenceTab = dynamic(() => import('./tabs/IntelligenceTab'), { loading: () => <Spinner /> })

function Spinner() {
  return <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-ink-3" /></div>
}

type Tab = 'overview' | 'reports' | 'sellers' | 'users' | 'intel'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'reports',  label: '🚩 Reports'  },
  { id: 'sellers',  label: '🏅 Sellers'  },
  { id: 'users',    label: '👤 Users'    },
  { id: 'intel',    label: '🔍 Intel'    },
]

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview')

  return (
    <div className="min-h-screen bg-paper-2">

      {/* Header */}
      <header className="border-b border-line bg-paper px-4 py-3 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-ink">LegitCheck Admin</span>
              <span className="text-xs text-ink-3 font-mono bg-paper-2 px-2 py-0.5 rounded-full border border-line">Internal</span>
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  tab === t.id
                    ? 'bg-ink text-white'
                    : 'text-ink-3 hover:text-ink hover:bg-paper-2'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-5">
        {tab === 'overview' && <CommandCenter />}
        {tab === 'reports'  && <ReportsTab />}
        {tab === 'sellers'  && <SellersTab />}
        {tab === 'users'    && <UsersTab />}
        {tab === 'intel'    && <IntelligenceTab />}
      </div>
    </div>
  )
}
