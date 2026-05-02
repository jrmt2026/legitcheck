'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, Share2, ArrowRight, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const QUESTIONS = [
  {
    q: 'Nakatanggap ka ng GCash SMS na "Your account will be locked in 24 hours." May link para mag-verify. Ano ito?',
    options: ['Legit GCash security alert', 'Smishing / phishing scam', 'Normal account maintenance', 'Two-factor authentication'],
    answer: 1,
    explanation: 'Hindi nagpapadala ang GCash ng suspension warnings na may link sa SMS. Ito ay smishing — ang link ay nagnanakaw ng iyong GCash login credentials.',
  },
  {
    q: 'Isang Facebook seller ang nagsabi: "GCash muna, deliver later, maraming nagtatanong." Ano ang dapat mong gawin?',
    options: ['Magbayad agad sa GCash', 'Humingi ng COD o platform checkout', 'Bayaran ang kalahati ngayon', 'Mag-bank transfer na lang'],
    answer: 1,
    explanation: '"Bayad muna" sa GCash ng isang estranyo ang pinaka-common na online selling scam sa Pilipinas. Kapag napadala mo na, mawawala ang seller. Palaging gumamit ng COD o Shopee/Lazada checkout.',
  },
  {
    q: 'Isang investment group ang nag-alok ng 30% monthly returns, guaranteed. Ano ito?',
    options: ['Magandang high-yield investment', 'Ponzi o pyramid scheme', 'Legit na UITF o mutual fund', 'SEC-registered na produkto'],
    answer: 1,
    explanation: 'Walang legit na investment ang nag-guarantee ng returns — ilegal ito sa Pilipinas at hallmark ito ng Ponzi schemes. Regular na nag-iissue ng babala ang SEC tungkol dito.',
  },
  {
    q: 'Nanalo ka raw ng ₱50,000 sa raffle na hindi ka sumali. Kailangan mong magbayad ng ₱500 para ma-claim. Ano ito?',
    options: ['Legit na prize — bayaran ang fee', 'Prize scam — hindi ka mananalo ng hindi ka sumali', 'GCash promo', 'Government cash aid'],
    answer: 1,
    explanation: 'Ang prize scams ay palaging nag-rerequire ng upfront fee bago "i-release" ang premyo. Hindi hihingiin ng legitimate na premyo ang bayad. Kung hindi ka sumali, hindi ka mananalo.',
  },
  {
    q: 'Isang job agency sa Dubai ang humihingi ng ₱15,000 "processing fee" bago ibigay ang kontrata. Legal ba ito?',
    options: ['Oo, standard ang processing fees', 'Hindi — bawal sa POEA/DMW ang upfront fees', 'Legal kung may opisina sila', 'Legal kung sa GCash bayaran'],
    answer: 1,
    explanation: 'Pinagbabawal ng POEA/DMW na maniningil ang licensed agencies ng placement fees bago mag-deploy (para sa karamihan ng destinations). I-verify ang agency license sa dmw.gov.ph bago magbigay ng kahit anong pera.',
  },
  {
    q: 'Nakatanggap ka ng SMS na nagsasabing mayroon kang unpaid LTO violation. May link na "lto-fines.xyz/pay". Ano ang gagawin mo?',
    options: ['Bayaran agad para maiwasan ang penalty', 'I-click ang link para ma-verify', 'Huwag pansinin — pumunta sa portal.lto.gov.ph direkta', 'I-forward sa mga kaibigan'],
    answer: 2,
    explanation: 'Ang mga Philippine government agencies ay gumagamit LAMANG ng .gov.ph domains. Ang anumang .xyz, .com, .info, o .site link na nagpapanggap na gobyerno ay phishing site. I-check ang LTO violations sa portal.lto.gov.ph.',
  },
  {
    q: 'Isang online lender ang nag-approve ng iyong loan pero kailangan mong magbayad ng ₱2,000 insurance fee muna bago ilabas ang pondo. Red flag ba ito?',
    options: ['Hindi — standard ito', 'Oo — nagbabawas ng fees ang legit lenders mula sa loan amount', 'Depende kung GCash ang bayad', 'Hindi — legal ang insurance fees'],
    answer: 1,
    explanation: 'Ang mga SEC-registered lenders ay nagbabawas ng fees mula sa approved na loan amount — hindi humihiling ng advance payment. Ang "magbayad muna para makuha ang loan" ay classic advance fee scam.',
  },
  {
    q: 'Isang Shopee seller na may 0 feedback ang humihingi na magbayad outside ng Shopee sa pamamagitan ng GCash. Ano ang gagawin mo?',
    options: ['Magbayad sa GCash — mas mabilis', 'Magbayad sa loob ng Shopee para may buyer protection', 'Mag-bank transfer na lang', 'Magbayad ng kalahati sa Shopee, kalahati sa GCash'],
    answer: 1,
    explanation: 'Ang pagbabayad outside ng Shopee/Lazada ay nag-aalis ng lahat ng buyer protection. Kung hindi dumating ang item, wala kang mapupuntahan. Palaging magbayad sa loob ng platform para sa covered na pagbili.',
  },
  {
    q: 'Isang taong nakilala mo online (nagsasabing nasa abroad) ay biglang humingi ng pera para sa "medical emergency." Ano ito?',
    options: ['Tunay na emergency — tulungan mo', 'Romance / pig-butchering scam', 'Legit na financial request', 'Mag-verify muna bago magpadala'],
    answer: 1,
    explanation: 'Ang mga online stranger na humihingi ng pera pagkatapos bumuo ng emotional na koneksyon ay romance scam (tinatawag ding "pig butchering"). Namumuhunan sila ng mga linggo sa pagbuo ng tiwala bago humingi ng pera.',
  },
  {
    q: 'Alin sa mga ito ang TUNAY na official domain ng GCash?',
    options: ['gcash.com.ph', 'gcash.com', 'gcash.ph', 'gcashofficial.com'],
    answer: 1,
    explanation: 'Ang official website ng GCash ay gcash.com. Ang anumang SMS na may link sa gcash.com.ph, gcash.ph, o katulad ay phishing attempt. Palaging suriin ang URL nang mabuti.',
  },
]

const LEVEL_LABELS = [
  { min: 0,  max: 3,  label: 'Baguhan',       emoji: '🌱', desc: 'Simulan mong mag-aral ng mga scam patterns.' },
  { min: 4,  max: 5,  label: 'Alerto',         emoji: '👀', desc: 'Okay na! Pag-aralan pa ang mga detalye.' },
  { min: 6,  max: 7,  label: 'Bantay',         emoji: '🛡️', desc: 'Magaling! May malinaw kang pag-unawa sa mga scam.' },
  { min: 8,  max: 9,  label: 'Scam Spotter',   emoji: '🔍', desc: 'Excellent! Halos lahat ay tama mo.' },
  { min: 10, max: 10, label: 'Scam Hunter',    emoji: '🏆', desc: 'Perfect score! Ikaw na ang maaasahang bantay.' },
]

function getLevel(score: number) {
  return LEVEL_LABELS.find(l => score >= l.min && score <= l.max) || LEVEL_LABELS[0]
}

export default function QuizPage() {
  const [currentQ, setCurrentQ]   = useState(0)
  const [selected, setSelected]   = useState<number | null>(null)
  const [revealed, setRevealed]   = useState(false)
  const [score, setScore]         = useState(0)
  const [finished, setFinished]   = useState(false)
  const [shared, setShared]       = useState(false)

  const q = QUESTIONS[currentQ]
  const level = getLevel(score)

  function choose(idx: number) {
    if (revealed) return
    setSelected(idx)
    setRevealed(true)
    if (idx === q.answer) setScore(s => s + 1)
  }

  function next() {
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(c => c + 1)
      setSelected(null)
      setRevealed(false)
    } else {
      setFinished(true)
      // Award IQ points silently if logged in
      try {
        const supabase = createClient()
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session?.access_token) return
          fetch('/api/user/award-points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ categoryId: 'quiz', color: 'green', quizScore: score, quizTotal: QUESTIONS.length }),
          }).catch(() => {})
        })
      } catch { /* ignore */ }
    }
  }

  async function shareScore() {
    const text = `Nakakuha ako ng ${score}/${QUESTIONS.length} sa LegitCheck PH Scam IQ Quiz! 🛡️ Anong score mo? i-test mo rin sa: legitcheck-ph.vercel.app/quiz`
    if (navigator.share) {
      try { await navigator.share({ text, title: 'Scam IQ Quiz — LegitCheck PH' }) } catch { /* dismissed */ }
    } else {
      await navigator.clipboard.writeText(text)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
  }

  if (finished) {
    return (
      <div className="min-h-screen bg-ink flex flex-col">
        <header className="px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <span className="text-base font-bold text-white tracking-tight">
            LegitCheck <span className="font-light opacity-50">PH</span>
          </span>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center max-w-sm mx-auto py-8 animate-scale-in">
          <p className="text-6xl mb-4">{level.emoji}</p>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">{level.label}</h1>
          <p className="text-5xl font-bold text-white font-mono mt-4 mb-1">
            {score}<span className="text-white/40">/{QUESTIONS.length}</span>
          </p>
          <p className="text-base text-white/50 mb-2">Scam IQ Score</p>
          <p className="text-sm text-white/40 leading-relaxed mb-8 max-w-xs">{level.desc}</p>

          <div className="w-full bg-white/10 rounded-full h-2 mb-8 overflow-hidden">
            <div
              className="h-full bg-brand-green rounded-full transition-all duration-1000"
              style={{ width: `${(score / QUESTIONS.length) * 100}%` }}
            />
          </div>

          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={shareScore}
              className="w-full flex items-center justify-center gap-2 py-4 bg-brand-green text-white rounded-2xl font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <Share2 size={16} />
              {shared ? 'Copied to clipboard!' : 'Share my score'}
            </button>
            <button
              onClick={() => { setCurrentQ(0); setScore(0); setSelected(null); setRevealed(false); setFinished(false) }}
              className="w-full py-4 bg-white/8 text-white/70 rounded-2xl font-medium text-base hover:bg-white/15 active:scale-[0.98] transition-all"
            >
              Ulit muli
            </button>
            <Link href="/buyer" className="w-full py-4 border border-white/10 text-white/50 rounded-2xl font-medium text-base text-center hover:bg-white/5 transition-all">
              Check something now
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper-2">
      <header className="border-b border-line bg-paper px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <Link href="/" className="text-ink-3 hover:text-ink transition-colors p-1 -ml-1">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-baseline gap-1">
          <span className="text-base font-medium text-ink">LegitCheck</span>
          <span className="text-base font-light text-ink-2">PH</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Trophy size={13} className="text-ink-3" />
          <span className="text-xs text-ink-3 font-medium">{currentQ + 1}/{QUESTIONS.length}</span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-paper-2 border-b border-line">
        <div
          className="h-full bg-brand-green transition-all duration-300"
          style={{ width: `${((currentQ + (revealed ? 1 : 0)) / QUESTIONS.length) * 100}%` }}
        />
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        <div>
          <p className="text-xs font-bold text-ink-3 font-mono uppercase tracking-widest mb-3">
            Question {currentQ + 1} of {QUESTIONS.length} · Score: {score}
          </p>
          <h2 className="text-lg font-semibold text-ink leading-snug">{q.q}</h2>
        </div>

        <div className="space-y-2.5">
          {q.options.map((opt, i) => {
            const isSelected = selected === i
            const isCorrect  = i === q.answer
            let style = 'bg-paper border-line text-ink-2 hover:border-ink-3 hover:bg-paper-2'
            if (revealed) {
              if (isCorrect)                style = 'bg-brand-green-light border-brand-green/30 text-brand-green-dark'
              else if (isSelected && !isCorrect) style = 'bg-brand-red-light border-brand-red/25 text-brand-red-dark'
              else                          style = 'bg-paper border-line text-ink-3 opacity-50'
            } else if (isSelected) {
              style = 'bg-ink border-ink text-white'
            }
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all text-sm font-medium active:scale-[0.99] ${style}`}
              >
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  revealed
                    ? isCorrect ? 'bg-brand-green border-brand-green text-white' : isSelected ? 'bg-brand-red border-brand-red text-white' : 'border-line text-ink-3'
                    : isSelected ? 'bg-white border-white text-ink' : 'border-line text-ink-3'
                }`}>
                  {revealed && isCorrect ? <CheckCircle size={14} /> : revealed && isSelected && !isCorrect ? <XCircle size={14} /> : String.fromCharCode(65 + i)}
                </div>
                {opt}
              </button>
            )
          })}
        </div>

        {/* Explanation */}
        {revealed && (
          <div className={`rounded-2xl border px-4 py-4 animate-slide-up ${
            selected === q.answer
              ? 'bg-brand-green-light border-brand-green/25'
              : 'bg-brand-red-light border-brand-red/20'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {selected === q.answer
                ? <CheckCircle size={15} className="text-brand-green-dark flex-shrink-0" />
                : <XCircle size={15} className="text-brand-red-dark flex-shrink-0" />}
              <span className={`text-sm font-bold ${selected === q.answer ? 'text-brand-green-dark' : 'text-brand-red-dark'}`}>
                {selected === q.answer ? 'Tama!' : `Mali — Tamang sagot: ${q.options[q.answer]}`}
              </span>
            </div>
            <p className={`text-sm leading-relaxed ${selected === q.answer ? 'text-brand-green-dark' : 'text-brand-red-dark'} opacity-80`}>
              {q.explanation}
            </p>
          </div>
        )}

        {revealed && (
          <button
            onClick={next}
            className="w-full flex items-center justify-center gap-2 py-4 bg-ink text-white rounded-2xl font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all"
          >
            {currentQ < QUESTIONS.length - 1 ? 'Next question' : 'See my score'}
            <ArrowRight size={18} />
          </button>
        )}

        <div className="pb-8" />
      </div>
    </div>
  )
}
