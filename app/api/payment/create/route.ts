import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Confirmed pricing (centavos)
const PLANS: Record<string, { amountCents: number; credits: number; name: string }> = {
  single:   { amountCents:  7900, credits:  1, name: 'Full Protection Check (1 credit)' },
  pack5:    { amountCents:  9900, credits:  5, name: 'Protect More (5 credits)' },
  pack15:   { amountCents: 19900, credits: 15, name: 'Family / Small Seller Pack (15 credits)' },
  pack50:   { amountCents: 49900, credits: 50, name: 'Power Protection Pack (50 credits)' },
}

export async function POST(req: Request) {
  const pmSecretKey = process.env.PAYMONGO_SECRET_KEY
  if (!pmSecretKey) {
    return NextResponse.json({ error: 'Payment not configured' }, { status: 503 })
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  const { planId } = await req.json()
  const plan = PLANS[planId]
  if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://legitcheck-ph.vercel.app'
  const refNo  = randomUUID()

  // Record pending payment row first (idempotency anchor)
  const { data: paymentRow, error: insertErr } = await serviceClient
    .from('payments')
    .insert({
      user_id:       user.id,
      reference_no:  refNo,
      plan_id:       planId,
      amount_cents:  plan.amountCents,
      status:        'pending',
      credits_granted: 0,
      metadata:      { userEmail: user.email },
    })
    .select('id')
    .single()

  if (insertErr || !paymentRow) {
    console.error('Payment insert error:', insertErr)
    return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 })
  }

  const auth = Buffer.from(`${pmSecretKey}:`).toString('base64')

  try {
    const res = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            billing: { email: user.email },
            line_items: [{
              currency:    'PHP',
              amount:      plan.amountCents,
              name:        plan.name,
              quantity:    1,
            }],
            payment_method_types: ['gcash', 'paymaya', 'card'],
            success_url: `${appUrl}/payment/success?ref=${refNo}&plan=${planId}`,
            cancel_url:  `${appUrl}/payment/cancelled`,
            metadata: {
              userId:       user.id,
              planId,
              refNo,
              paymentRowId: paymentRow.id,
            },
            send_email_receipt: true,
            show_description: true,
            description: `LegitCheck PH — ${plan.name}`,
          },
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('PayMongo error:', err)
      return NextResponse.json({ error: 'Payment gateway error' }, { status: 502 })
    }

    const data = await res.json()
    const sessionId      = data?.data?.id
    const checkoutUrl    = data?.data?.attributes?.checkout_url

    if (!checkoutUrl) {
      console.error('No checkout URL from PayMongo:', JSON.stringify(data))
      return NextResponse.json({ error: 'No checkout URL returned' }, { status: 502 })
    }

    // Store PayMongo session ID for webhook matching
    await serviceClient
      .from('payments')
      .update({ provider_ref: sessionId })
      .eq('id', paymentRow.id)

    return NextResponse.json({ checkoutUrl, refNo })
  } catch (e) {
    console.error('Payment create error:', e)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}
