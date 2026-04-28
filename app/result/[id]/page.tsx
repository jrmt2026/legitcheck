'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { DecisionResult } from '@/types'
import ResultClient from '@/components/ResultClient'

export default function ResultPage({ params }: { params: { id: string } }) {
  const [result, setResult]       = useState<DecisionResult | null>(null)
  const [checkId, setCheckId]     = useState('')
  const [inputText, setInputText] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: check } = await supabase
        .from('checks')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single()

      if (!check) { router.push('/buyer'); return }

      setResult(check.result as DecisionResult)
      setCheckId(check.id)
      setInputText(check.input_text || '')
    }
    load()
  }, [params.id, router])

  if (!result) {
    return (
      <div className="min-h-screen bg-paper-2 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-ink animate-throb" />
      </div>
    )
  }

  return <ResultClient result={result} checkId={checkId} inputText={inputText} />
}
