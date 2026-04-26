'use client'

import { useEffect, useState } from 'react'
import type { DecisionResult } from '@/types'
import ResultClient from '@/components/ResultClient'
import { redirect } from 'next/navigation'

export default function ResultPreviewPage() {
  const [result, setResult] = useState<DecisionResult | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('legitcheck_result')
    if (!raw) { window.location.href = '/buyer'; return }
    setResult(JSON.parse(raw))
  }, [])

  if (!result) return (
    <div className="min-h-screen bg-paper-2 flex items-center justify-center">
      <div className="w-3 h-3 rounded-full bg-ink animate-throb" />
    </div>
  )

  return <ResultClient result={result} />
}
