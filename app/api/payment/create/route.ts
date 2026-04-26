import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

const MAYA_BASE = process.env.MAYA_SANDBOX === 'true'
  ? 'https://pg-sandbox.maya.ph'
  : 'https://pg.maya.ph'

const PLAN_PRICES: Record<string, { amount: number; name: string }> = {
  trust_credits:  { amount: 49,   name: 'LegitCheck Trust Credits' },
  full_check:     { amount: 149,  name: 'LegitCheck Full Check' },
  case_pack:      { amount: 499,  name: 'LegitCheck Case Pack' },
  seller_pass:    { amount: 299,  name: 'LegitCheck Seller Pass' },
  business_check: { amount: 999,  name: 'LegitCheck Business Check' },
  property_check: { amount: 1499, name: 'LegitCheck Property Check' },
}

export async function POST(req: Request) {
  if (!process.env.MAYA_SECRET_KEY) {
    return NextResponse.json({ error: 'Payment not configured' }, { status: 503 })
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  const { planId } = await req.json()
  const plan = PLAN_PRICES[planId]
  if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://legitcheck-ph.vercel.app'
  const refNo  = randomUUID()

  const auth = Buffer.from(`${process.env.MAYA_SECRET_KEY}:`).toString('base64')

  try {
    const res = await fetch(`${MAYA_BASE}/checkout/v1/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        totalAmount: { value: plan.amount, currency: 'PHP' },
        buyer: { contact: { email: user.email } },
        items: [{
          name: plan.name,
          quantity: 1,
          totalAmount: { value: plan.amount, currency: 'PHP' },
        }],
        redirectUrl: {
          success: `${appUrl}/payment/success?plan=${planId}&ref=${refNo}`,
          failure: `${appUrl}/payment/failed`,
          cancel:  `${appUrl}/dashboard/pricing`,
        },
        requestReferenceNumber: refNo,
        metadata: { userId: user.id, planId },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Maya error:', err)
      return NextResponse.json({ error: 'Payment gateway error' }, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json({ checkoutUrl: data.redirectUrl, refNo })
  } catch (e) {
    console.error('Payment create error:', e)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}
