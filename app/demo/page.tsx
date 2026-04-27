'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, RotateCcw, Beaker } from 'lucide-react'
import ResultClient from '@/components/ResultClient'
import type { DecisionResult } from '@/types'

// ─── Pre-baked demo scenarios ──────────────────────────────────────────────────

interface DemoScenario {
  key: string
  emoji: string
  title: string
  subtitle: string
  badge: string
  badgeColor: 'red' | 'yellow' | 'green'
  sampleText: string
  result: DecisionResult
  scoreSteps: Array<{ label: string; delta: number }>
}

const DEMO_SCENARIOS: DemoScenario[] = [
  // ── 1. MMDA SMS Scam ──────────────────────────────────────────────────────
  {
    key: 'mmda_sms',
    emoji: '🚗',
    title: 'MMDA Traffic Fine SMS',
    subtitle: 'Government impersonation / smishing',
    badge: 'SCAM',
    badgeColor: 'red',
    sampleText: 'MMDA: Mahal na motorista, mayroon kang unpaid traffic violation na nagkakahalaga ng ₱5,000. Ang iyong lisensya ay sususpindihin sa loob ng 48 oras kung hindi mababayaran. I-click ang link para bayaran ngayon: http://mmda-fines-ph.com/pay',
    scoreSteps: [
      { label: 'Base score', delta: 0 },
      { label: 'Government agency impersonation detected (MMDA)', delta: -45 },
      { label: 'Fake government URL — not on .gov.ph', delta: -45 },
      { label: 'Threat of license suspension to pressure action', delta: -40 },
      { label: 'Urgent 48-hour deadline', delta: -15 },
      { label: 'Link in SMS leading to non-official domain', delta: -20 },
    ],
    result: {
      score: 5,
      color: 'red',
      isHardRed: true,
      categoryId: 'sms_text',
      headline: { en: '🚨 This is a scam. Do not click.', tl: '🚨 Ito ay scam. Huwag i-click.' },
      subheadline: {
        en: 'This message impersonates MMDA but the link is NOT on mmda.gov.ph — a clear sign of government smishing.',
        tl: 'Nagpapanggap itong MMDA pero ang link ay HINDI nasa mmda.gov.ph — malinaw na palatandaan ng smishing.',
      },
      action: {
        en: 'Delete this message immediately. MMDA never sends payment links via SMS. Real fines are settled at LTO offices or myfines.mmda.gov.ph only.',
        tl: 'Burahin agad ang mensaheng ito. Hindi nagpapadala ng payment link sa SMS ang MMDA. Ang tunay na multa ay binabayaran sa LTO office o myfines.mmda.gov.ph lamang.',
      },
      reasons: [
        { id: 'gov_impersonation', en: 'Impersonates MMDA (a government agency)', tl: 'Nagpapanggap bilang MMDA (ahensya ng gobyerno)', riskPoints: 45, severity: 'hard_red' },
        { id: 'fake_gov_url', en: 'Link is NOT on .gov.ph — uses mmda-fines-ph.com instead', tl: 'Ang link ay HINDI nasa .gov.ph — gumagamit ng mmda-fines-ph.com', riskPoints: 45, severity: 'hard_red' },
        { id: 'smishing_threat', en: 'Threatens license suspension within 48 hours', tl: 'Nagbabanta ng suspensiyon ng lisensya sa loob ng 48 oras', riskPoints: 40, severity: 'hard_red' },
        { id: 'link_in_sms', en: 'Contains suspicious payment link via SMS', tl: 'May kahina-hinalang payment link sa SMS', riskPoints: 20, severity: 'high' },
        { id: 'urgency', en: 'Artificial 48-hour deadline to pressure payment', tl: 'Artipisyal na 48-oras na deadline para pilitin ang pagbabayad', riskPoints: 15, severity: 'medium' },
      ],
      aiInsights: [
        'The MMDA does NOT send SMS payment links. All legitimate traffic fines are settled in person at LTO/MMDA offices, or through the official portal at myfines.mmda.gov.ph. No .gov.ph link = not real.',
        'The domain "mmda-fines-ph.com" is a lookalike designed to trick you. Scammers register similar-sounding domains to steal credentials and payment info.',
        '📋 Official resource: myfines.mmda.gov.ph — the only official MMDA fine payment portal. LTO: lto.gov.ph. Hotline: MMDA 136.',
      ],
      notification: {
        sms: { en: '🚨 SCAM ALERT: That MMDA fine SMS is fake. Do not click the link. Real fines: myfines.mmda.gov.ph', tl: '🚨 SCAM: Peke ang MMDA SMS na iyon. Huwag i-click ang link. Tunay na multa: myfines.mmda.gov.ph' },
        chat: { en: 'That MMDA message is a scam — the link is not .gov.ph. Block and delete.', tl: 'Scam ang MMDA na mensaheng iyan — hindi .gov.ph ang link. I-block at burahin.' },
        push: { en: '🚨 SCAM: MMDA fine SMS is fake', tl: '🚨 SCAM: Peke ang MMDA fine SMS' },
      },
      reportChannels: [
        { name: 'NTC Anti-Spam', url: 'https://ntc.gov.ph', contact: 'complaints@ntc.gov.ph' },
        { name: 'PNP ACG Hotline', contact: '(02) 723-0401' },
        { name: 'DICT iReport', url: 'https://dict.gov.ph' },
      ],
      evidenceItems: [
        { en: 'Screenshot of the SMS with visible sender and link', tl: 'Screenshot ng SMS na may makikitang sender at link' },
        { en: 'The suspicious URL (do NOT visit it)', tl: 'Ang kahina-hinalang URL (HUWAG bisitahin ito)' },
        { en: 'Your phone number that received it', tl: 'Ang iyong numero ng telepono na nakatanggap nito' },
      ],
      recommendedPlan: 'free',
    },
  },

  // ── 2. Fake Facebook Seller ───────────────────────────────────────────────
  {
    key: 'fb_seller',
    emoji: '🛍️',
    title: 'Facebook Marketplace Seller',
    subtitle: 'Rush GCash payment, no meet-up',
    badge: 'HIGH RISK',
    badgeColor: 'red',
    sampleText: 'Seller: Hi po! Available pa po yung bag. GCash nalang po tayo para mas mabilis. Account ko: 09171234567 - J. Santos. Rush po kasi maraming nagtatanong. Pag di ka nagbayad ngayon, ibebenta ko na sa isa.',
    scoreSteps: [
      { label: 'Base score', delta: 0 },
      { label: 'GCash-only payment — avoids buyer protection', delta: -20 },
      { label: 'No meet-up offered, payment first', delta: -20 },
      { label: 'Artificial rush / scarcity pressure', delta: -20 },
      { label: 'No shop platform or verification', delta: -10 },
      { label: 'New account, no reviews mentioned', delta: -10 },
    ],
    result: {
      score: 28,
      color: 'red',
      isHardRed: false,
      categoryId: 'online_purchase',
      headline: { en: '⚠️ Multiple scam red flags', tl: '⚠️ Maraming red flag ng scam' },
      subheadline: {
        en: 'GCash-only payment with rush pressure and no meet-up is the most common pattern for Facebook Marketplace scams.',
        tl: 'Ang GCash-only na bayad na may rush pressure at walang meet-up ay ang pinakakaraniwang pattern ng Facebook Marketplace scam.',
      },
      action: {
        en: 'Do not send money yet. Insist on meet-up with cash, or use Shopee/Lazada with buyer protection. Verify the seller\'s account age and reviews first.',
        tl: 'Huwag munang magpadala ng pera. Igiting ang meet-up na may cash, o gumamit ng Shopee/Lazada na may buyer protection. I-verify muna ang edad ng account at mga review ng seller.',
      },
      reasons: [
        { id: 'gcash_only', en: 'GCash-only payment — bypasses all buyer protection', tl: 'GCash-only na bayad — lumalampas sa lahat ng buyer protection', riskPoints: 20, severity: 'high' },
        { id: 'no_meetup', en: 'Refuses meet-up, demands payment before shipping', tl: 'Tumatanggi sa meet-up, hinihingi ang bayad bago magpadala', riskPoints: 20, severity: 'high' },
        { id: 'urgency', en: '"Rush" and artificial scarcity to pressure you', tl: '"Rush" at artipisyal na kakulangan para pilitin ka', riskPoints: 20, severity: 'high' },
        { id: 'no_platform', en: 'No Shopee/Lazada listing — no escrow protection', tl: 'Walang Shopee/Lazada listing — walang escrow protection', riskPoints: 10, severity: 'medium' },
        { id: 'no_reviews', en: 'No seller reviews or verification mentioned', tl: 'Walang nabanggit na seller reviews o verification', riskPoints: 10, severity: 'medium' },
      ],
      aiInsights: [
        'This matches the classic "Facebook Marketplace advance fee" pattern: GCash only, rush pressure, no meet-up. Once you pay, the seller disappears.',
        'A legitimate seller will offer COD, meet-up, or a Shopee/Lazada listing with buyer protection. Insisting on GCash only is a major red flag.',
        '📋 Buyer tip: Always use Shopee or Lazada for items sold online. If meeting in person, choose a public place and bring exact cash — never send GCash to strangers.',
      ],
      notification: {
        sms: { en: '⚠️ HIGH RISK: This Facebook seller shows major scam patterns. GCash-only + rush = classic scam setup. Verify first.', tl: '⚠️ MATAAS NA PANGANIB: Ang seller na ito ay nagpapakita ng mga scam pattern. GCash-only + rush = klasikong scam. I-verify muna.' },
        chat: { en: 'Be careful — GCash only + rush pressure is a classic scam setup. Insist on meet-up or use Shopee.', tl: 'Mag-ingat — GCash only + rush pressure ay klasikong scam setup. Igiting ang meet-up o gumamit ng Shopee.' },
        push: { en: '⚠️ HIGH RISK: Facebook seller shows scam patterns', tl: '⚠️ MATAAS NA PANGANIB: Facebook seller ay may scam pattern' },
      },
      reportChannels: [
        { name: 'Facebook Report', url: 'https://www.facebook.com/help/reportlinks' },
        { name: 'PNP ACG', contact: '(02) 723-0401' },
        { name: 'DTI Consumer Protection', url: 'https://dti.gov.ph' },
      ],
      evidenceItems: [
        { en: 'Screenshot of the full chat conversation', tl: 'Screenshot ng buong chat conversation' },
        { en: 'GCash number and account name', tl: 'GCash number at account name' },
        { en: 'Profile URL of the seller', tl: 'Profile URL ng seller' },
      ],
      recommendedPlan: 'trust_credits',
    },
  },

  // ── 3. Legit Shopee Order ─────────────────────────────────────────────────
  {
    key: 'shopee_legit',
    emoji: '✅',
    title: 'Shopee Order Confirmation',
    subtitle: 'Legitimate purchase on official platform',
    badge: 'SAFE',
    badgeColor: 'green',
    sampleText: 'Order #SHP-2024-99871 confirmed. Item: Korean Skincare Set ₱499. Seller: BeautyStore_PH (4.8★ 2.3k reviews). Official Shopee checkout. Estimated delivery: 3-5 days.',
    scoreSteps: [
      { label: 'Base score', delta: 0 },
      { label: 'Official platform with buyer protection', delta: +15 },
      { label: 'Seller has 2,300+ verified reviews', delta: +10 },
      { label: 'High seller rating (4.8★)', delta: +5 },
      { label: 'Reasonable price — not suspiciously low', delta: +5 },
      { label: 'No payment outside platform detected', delta: +5 },
    ],
    result: {
      score: 91,
      color: 'green',
      isHardRed: false,
      categoryId: 'online_purchase',
      headline: { en: '✅ This looks legitimate', tl: '✅ Mukhang lehitimo ito' },
      subheadline: {
        en: 'Official Shopee order with a highly-rated seller and Shopee buyer protection active.',
        tl: 'Opisyal na Shopee order na may mataas na rated na seller at aktibong Shopee buyer protection.',
      },
      action: {
        en: 'This order looks safe. Keep your order number and screenshot. If the item doesn\'t arrive, file a dispute directly on Shopee within the guarantee period.',
        tl: 'Mukhang ligtas ang order na ito. Itago ang iyong order number at screenshot. Kung hindi dumating ang item, mag-file ng dispute sa Shopee sa loob ng guarantee period.',
      },
      reasons: [
        { id: 'official_platform', en: 'Processed through official Shopee platform with escrow', tl: 'Pinroseso sa opisyal na Shopee platform na may escrow', riskPoints: -15, severity: 'positive' },
        { id: 'verified_seller', en: '2,300+ reviews — high-volume established seller', tl: '2,300+ reviews — mataas na volume na established seller', riskPoints: -10, severity: 'positive' },
        { id: 'high_rating', en: '4.8★ seller rating — consistently good service', tl: '4.8★ na rating ng seller — patuloy na mahusay na serbisyo', riskPoints: -5, severity: 'positive' },
        { id: 'fair_price', en: 'Price is within normal market range', tl: 'Ang presyo ay nasa normal na hanay ng merkado', riskPoints: -5, severity: 'positive' },
      ],
      aiInsights: [
        'This is a standard Shopee order confirmation. Shopee\'s escrow system holds payment until you confirm receipt — you are protected if the item is not delivered.',
        'The seller "BeautyStore_PH" has 2,300+ reviews and a 4.8★ rating, indicating a legitimate, established seller with a track record.',
        '📋 Buyer tip: Always use the "Order Received" button only after inspecting your item. Open a dispute within Shopee\'s guarantee window if anything is wrong.',
      ],
      notification: {
        sms: { en: '✅ SAFE: Your Shopee order looks legitimate. Buyer protection is active.', tl: '✅ LIGTAS: Mukhang lehitimo ang iyong Shopee order. Aktibo ang buyer protection.' },
        chat: { en: 'Your Shopee order looks legitimate — official platform, established seller. You\'re covered by Shopee buyer protection.', tl: 'Mukhang lehitimo ang iyong Shopee order — opisyal na platform, established seller. Saklaw ka ng Shopee buyer protection.' },
        push: { en: '✅ SAFE: Shopee order confirmed legitimate', tl: '✅ LIGTAS: Nakumpirma ang Shopee order bilang lehitimo' },
      },
      reportChannels: [],
      evidenceItems: [],
      recommendedPlan: 'free',
    },
  },

  // ── 4. Investment Scam ────────────────────────────────────────────────────
  {
    key: 'investment',
    emoji: '💰',
    title: 'Investment Opportunity',
    subtitle: 'Guaranteed 30% monthly returns + referral',
    badge: 'SCAM',
    badgeColor: 'red',
    sampleText: 'Kumita na ng 30% monthly ang aming mga investors! Guaranteed po ang return. Mag-invite ka pa ng friends, may komisyon ka pa. Mag-invest ka na ngayon, last slots na lang. Withdrawal fee lang ng ₱2,000 para ma-release ang profit mo.',
    scoreSteps: [
      { label: 'Base score', delta: 0 },
      { label: 'Guaranteed high returns — impossible in legal investments', delta: -45 },
      { label: 'Referral/recruitment commission = pyramid structure', delta: -30 },
      { label: 'Withdrawal fee to "release profits" — advance fee fraud', delta: -30 },
      { label: 'Artificial scarcity ("last slots")', delta: -15 },
      { label: 'No SEC registration or regulatory mention', delta: -20 },
    ],
    result: {
      score: 8,
      color: 'red',
      isHardRed: true,
      categoryId: 'investment',
      headline: { en: '🚨 Investment scam — do not invest', tl: '🚨 Investment scam — huwag mag-invest' },
      subheadline: {
        en: 'This matches every hallmark of an illegal investment / Ponzi scheme. The "withdrawal fee" alone is a classic advance fee fraud tactic.',
        tl: 'Katugma ito sa bawat katangian ng ilegal na investment / Ponzi scheme. Ang "withdrawal fee" lamang ay klasikong advance fee fraud na taktika.',
      },
      action: {
        en: 'Do not send any money. Report this to the SEC immediately at (02) 8818-5544 or sec.gov.ph. Check if the company has a Certificate of Authority at sec.gov.ph/cas.',
        tl: 'Huwag magpadala ng kahit anong pera. Iulat ito sa SEC agad sa (02) 8818-5544 o sec.gov.ph. Tingnan kung ang kumpanya ay may Certificate of Authority sa sec.gov.ph/cas.',
      },
      reasons: [
        { id: 'guaranteed_returns', en: 'Claims "guaranteed" 30% monthly — no legal investment can guarantee this', tl: 'Nag-aangking "guaranteed" na 30% monthly — walang legal na investment ang makaka-guarantee nito', riskPoints: 45, severity: 'hard_red' },
        { id: 'pyramid', en: 'Referral commissions = illegal pyramid / multi-level structure', tl: 'Referral commissions = ilegal na pyramid / multi-level na istraktura', riskPoints: 30, severity: 'hard_red' },
        { id: 'advance_fee', en: '"Withdrawal fee" to release profit = advance fee fraud', tl: '"Withdrawal fee" para ma-release ang profit = advance fee fraud', riskPoints: 30, severity: 'hard_red' },
        { id: 'no_sec', en: 'No mention of SEC registration or license', tl: 'Walang binanggit na SEC registration o lisensya', riskPoints: 20, severity: 'high' },
        { id: 'urgency', en: 'Artificial "last slots" scarcity to pressure immediate action', tl: 'Artipisyal na "last slots" na kakulangan para pilitin ang agarang pagkilos', riskPoints: 15, severity: 'medium' },
      ],
      aiInsights: [
        'Any investment promising "guaranteed" returns above 6-8% annually is illegal in the Philippines. 30% per MONTH (360%/year) is mathematically impossible sustainably — it is always a Ponzi.',
        'The ₱2,000 "withdrawal fee" is a classic advance fee fraud tactic. Legitimate investments never charge fees to release your own money.',
        '📋 Official resource: SEC Philippines — sec.gov.ph. Check legitimate investment companies at sec.gov.ph/cas. Report at (02) 8818-5544 or email at cad@sec.gov.ph.',
      ],
      notification: {
        sms: { en: '🚨 SCAM: This is an illegal investment scheme. 30% guaranteed monthly = Ponzi. Report to SEC: (02) 8818-5544.', tl: '🚨 SCAM: Ito ay ilegal na investment scheme. 30% guaranteed monthly = Ponzi. Iulat sa SEC: (02) 8818-5544.' },
        chat: { en: 'This is an investment scam — guaranteed returns + withdrawal fees + referrals = classic Ponzi. Report to SEC.', tl: 'Ito ay investment scam — guaranteed returns + withdrawal fees + referrals = klasikong Ponzi. Iulat sa SEC.' },
        push: { en: '🚨 SCAM: Illegal investment / Ponzi scheme detected', tl: '🚨 SCAM: Nadetektahan ang ilegal na investment / Ponzi scheme' },
      },
      reportChannels: [
        { name: 'SEC Philippines', url: 'https://sec.gov.ph', contact: '(02) 8818-5544' },
        { name: 'BSP Financial Consumer Affairs', url: 'https://bsp.gov.ph', contact: '(02) 708-7087' },
        { name: 'PNP ACG', contact: '(02) 723-0401' },
      ],
      evidenceItems: [
        { en: 'Screenshots of investment offer and payment instructions', tl: 'Mga screenshot ng investment offer at payment instructions' },
        { en: 'Name of the person/company offering the investment', tl: 'Pangalan ng tao/kumpanya na nag-aalok ng investment' },
        { en: 'GCash/bank details provided for payment', tl: 'GCash/bank details na ibinigay para sa bayad' },
      ],
      recommendedPlan: 'full_check',
    },
  },

  // ── 5. OFW Job Agency ─────────────────────────────────────────────────────
  {
    key: 'job_agency',
    emoji: '✈️',
    title: 'OFW Job Agency',
    subtitle: 'Dubai deployment, upfront processing fee',
    badge: 'HIGH RISK',
    badgeColor: 'red',
    sampleText: 'Congratulations! Qualified ka sa deployment sa Dubai. Processing fee lang: ₱15,000 via GCash bago maibigay ang kontrata. Urgent — kailangan bukas na para ma-slot ka.',
    scoreSteps: [
      { label: 'Base score', delta: 0 },
      { label: 'Large upfront fee before contract — illegal under POEA rules', delta: -45 },
      { label: 'GCash payment only — no official receipt', delta: -20 },
      { label: 'No POEA license number mentioned', delta: -25 },
      { label: 'Artificial 24-hour deadline', delta: -15 },
      { label: 'No contract shown before payment demanded', delta: -15 },
    ],
    result: {
      score: 12,
      color: 'red',
      isHardRed: true,
      categoryId: 'job_agency',
      headline: { en: '🚨 Illegal recruitment / job scam', tl: '🚨 Ilegal na recruitment / job scam' },
      subheadline: {
        en: 'Asking for ₱15,000 via GCash before showing a contract is illegal under POEA rules and a textbook OFW job scam.',
        tl: 'Ang paghingi ng ₱15,000 via GCash bago ipakita ang kontrata ay ilegal sa ilalim ng POEA rules at isang textbook na OFW job scam.',
      },
      action: {
        en: 'Do not pay. Verify the agency\'s POEA license at poea.gov.ph. Legitimate agencies NEVER collect fees before deployment. Report to POEA at (02) 8722-1144.',
        tl: 'Huwag magbayad. I-verify ang POEA license ng agency sa poea.gov.ph. Ang mga lehitimong ahensya ay HINDI KAILANMAN nangongolekta ng bayad bago ang deployment. Iulat sa POEA sa (02) 8722-1144.',
      },
      reasons: [
        { id: 'placement_fee', en: 'Demands ₱15,000 before showing contract — violates POEA rules', tl: 'Humihingi ng ₱15,000 bago ipakita ang kontrata — lumalabag sa POEA rules', riskPoints: 45, severity: 'hard_red' },
        { id: 'no_poea', en: 'No POEA license number provided', tl: 'Walang ibinigay na POEA license number', riskPoints: 25, severity: 'hard_red' },
        { id: 'gcash_only', en: 'GCash payment only — no official receipt', tl: 'GCash payment lamang — walang opisyal na resibo', riskPoints: 20, severity: 'high' },
        { id: 'urgency', en: 'Fake 24-hour deadline to pressure payment', tl: 'Pekeng 24-oras na deadline para pilitin ang pagbabayad', riskPoints: 15, severity: 'medium' },
        { id: 'no_contract', en: 'No contract shown before demanding payment', tl: 'Walang ipinakitang kontrata bago humiling ng bayad', riskPoints: 15, severity: 'high' },
      ],
      aiInsights: [
        'POEA (Philippine Overseas Employment Administration) prohibits any agency from collecting placement fees before a worker signs a verified employment contract. Asking for ₱15,000 upfront via GCash = illegal.',
        'Legitimate OFW agencies are licensed and listed on poea.gov.ph. Always ask for the agency\'s POEA license number and verify it online before paying anything.',
        '📋 Official resource: POEA — poea.gov.ph. Verify agencies at poea.gov.ph/agencySearch. Hotline: (02) 8722-1144. Overseas Workers Welfare Administration (OWWA): owwa.gov.ph.',
      ],
      notification: {
        sms: { en: '🚨 SCAM: This OFW agency is demanding illegal upfront fees. Verify at poea.gov.ph. Report: (02) 8722-1144.', tl: '🚨 SCAM: Ang OFW agency na ito ay humihingi ng ilegal na upfront fees. I-verify sa poea.gov.ph. Iulat: (02) 8722-1144.' },
        chat: { en: 'This is an illegal recruitment scam — POEA bans fees before contract. Verify the agency at poea.gov.ph first.', tl: 'Ito ay ilegal na recruitment scam — ipinagbabawal ng POEA ang fees bago ang kontrata. I-verify muna ang agency sa poea.gov.ph.' },
        push: { en: '🚨 SCAM: Illegal OFW recruitment / upfront fee fraud', tl: '🚨 SCAM: Ilegal na OFW recruitment / upfront fee fraud' },
      },
      reportChannels: [
        { name: 'POEA', url: 'https://poea.gov.ph', contact: '(02) 8722-1144' },
        { name: 'OWWA', url: 'https://owwa.gov.ph', contact: '1348' },
        { name: 'NBI Anti-Fraud Division', contact: '(02) 8523-8231' },
      ],
      evidenceItems: [
        { en: 'Screenshot of the job offer and payment instructions', tl: 'Screenshot ng job offer at payment instructions' },
        { en: 'Name of the agency and recruiter', tl: 'Pangalan ng ahensya at recruiter' },
        { en: 'GCash number they sent for payment', tl: 'GCash number na ipinadala nila para sa bayad' },
      ],
      recommendedPlan: 'full_check',
    },
  },
]

// ─── Component ─────────────────────────────────────────────────────────────────

type DemoStep = 'select' | 'result'

export default function DemoPage() {
  const [step, setStep] = useState<DemoStep>('select')
  const [active, setActive] = useState<DemoScenario | null>(null)

  function pickScenario(s: DemoScenario) {
    setActive(s)
    setStep('result')
  }

  function reset() {
    setStep('select')
    setActive(null)
  }

  const badgeClass = {
    red: 'bg-red-100 text-red-700 border-red-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    green: 'bg-green-100 text-green-700 border-green-200',
  }

  // ── Result view ────────────────────────────────────────────────────────────
  if (step === 'result' && active) {
    return (
      <div className="min-h-screen bg-paper-2 animate-fade-in">
        {/* Header */}
        <header className="border-b border-line bg-paper sticky top-0 z-50 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={reset} className="text-ink-3 hover:text-ink transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-semibold text-ink">LegitCheck</span>
              <span className="text-lg font-light text-ink-2">PH</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Demo badge */}
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100 border border-purple-200 text-purple-700 text-xs font-semibold">
              <Beaker size={11} />
              DEMO
            </span>
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink transition-colors"
            >
              <RotateCcw size={14} />
              Try another
            </button>
          </div>
        </header>

        {/* Sample text banner */}
        <div className="bg-purple-50 border-b border-purple-100 px-4 py-3">
          <p className="text-xs text-purple-600 font-medium mb-1 flex items-center gap-1">
            <Beaker size={11} />
            Demo input
          </p>
          <p className="text-sm text-purple-800 leading-relaxed">{active.sampleText}</p>
        </div>

        <ResultClient
          result={active.result}
          inputText={active.sampleText}
          scoreSteps={active.scoreSteps}
        />
      </div>
    )
  }

  // ── Scenario selector ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-paper-2">
      {/* Header */}
      <header className="border-b border-line bg-paper px-4 py-4 flex items-center gap-3">
        <Link href="/buyer" className="text-ink-3 hover:text-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-baseline gap-1 flex-1">
          <span className="text-lg font-semibold text-ink">LegitCheck</span>
          <span className="text-lg font-light text-ink-2">PH</span>
        </div>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100 border border-purple-200 text-purple-700 text-xs font-semibold">
          <Beaker size={11} />
          DEMO MODE
        </span>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Intro */}
        <div>
          <h1 className="text-2xl font-semibold text-ink">Try a demo</h1>
          <p className="text-base text-ink-3 mt-1 leading-relaxed">
            Tap any scenario below to see how LegitCheck analyzes real Philippine scam situations — no account needed.
          </p>
        </div>

        {/* Scenario cards */}
        <div className="space-y-3">
          {DEMO_SCENARIOS.map(s => (
            <button
              key={s.key}
              onClick={() => pickScenario(s)}
              className="w-full text-left flex items-start gap-4 bg-paper border border-line rounded-2xl px-4 py-4 hover:border-ink-3 hover:shadow-sm active:scale-[0.99] transition-all group"
            >
              {/* Emoji */}
              <div className="w-12 h-12 rounded-xl bg-paper-2 flex items-center justify-center text-2xl flex-shrink-0 group-hover:bg-ink group-hover:text-white transition-all">
                {s.emoji}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-ink text-base">{s.title}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${badgeClass[s.badgeColor]}`}>
                    {s.badge}
                  </span>
                </div>
                <p className="text-sm text-ink-3 mt-0.5 leading-snug">{s.subtitle}</p>
              </div>

              <ArrowRight size={16} className="text-ink-3 flex-shrink-0 mt-1 group-hover:text-ink transition-colors" />
            </button>
          ))}
        </div>

        {/* CTA to real app */}
        <div className="rounded-2xl border border-line bg-paper px-5 py-5 space-y-3">
          <p className="text-sm font-semibold text-ink">Ready to check a real situation?</p>
          <p className="text-sm text-ink-3 leading-relaxed">
            Paste a message, upload a screenshot, or enter a number — LegitCheck analyzes it in seconds.
          </p>
          <Link
            href="/buyer"
            className="inline-flex items-center gap-2 bg-ink text-white text-sm font-semibold rounded-xl px-4 py-2.5 hover:opacity-90 transition-opacity"
          >
            Start a real check
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="pb-8" />
      </div>
    </div>
  )
}
