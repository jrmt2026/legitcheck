'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, RotateCcw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { DecisionResult } from '@/types'
import ResultClient from '@/components/ResultClient'

export default function ResultPage() {
  const { id }                    = useParams<{ id: string }>()
  const [result, setResult]       = useState<DecisionResult | null>(null)
  const [checkId, setCheckId]     = useState('')
  const [inputText, setInputText] = useState('')
  const [notFound, setNotFound]   = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!id) return
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: check } = await supabase
        .from('checks')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (!check || !check.result) { setNotFound(true); return }

      setResult(check.result as DecisionResult)
      setCheckId(check.id)
      setInputText(check.input_text || '')
    }
    load()
  }, [id, router])

  if (notFound) {
    return (
      <div className="min-h-screen bg-paper-2 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-semibold text-ink">Result not found</p>
        <p className="text-sm text-ink-3">This check may have been deleted or belongs to another account.</p>
        <Link href="/buyer?tab=history" className="px-5 py-2.5 bg-ink text-white rounded-2xl text-sm font-semibold hover:opacity-90">
          Back to History
        </Link>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-paper-2 flex items-center justify-center">
        <Loader2 size={24} className="text-ink-3 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper-2 animate-fade-in">
      <header className="bg-ink px-4 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/buyer?tab=history" className="text-white/60 hover:text-white transition-colors" aria-label="Back to history">
            <ArrowLeft size={20} />
          </Link>
          <Link href="/buyer" className="text-lg font-bold text-white tracking-tight hover:opacity-80 transition-opacity">
            LegitCheck <span className="font-light opacity-50">PH</span>
          </Link>
        </div>
        <Link href={`/buyer?recheck=${encodeURIComponent(inputText.slice(0, 500))}`}
          className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors">
          <RotateCcw size={14} /> Recheck
        </Link>
      </header>
      <ResultClient result={result} checkId={checkId} inputText={inputText} />
    </div>
  )
}
