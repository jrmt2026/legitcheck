import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const PLAN_CREDITS: Record<string, number> = {
  trust_credits:  5,
  full_check:     1,
  case_pack:      10,
  seller_pass:    999,
  business_check: 1,
  property_check: 1,
}

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    console.log('Maya webhook:', JSON.stringify(payload, null, 2))

    const status  = payload?.status
    const refNo   = payload?.requestReferenceNumber
    const meta    = payload?.metadata || {}
    const userId  = meta.userId
    const planId  = meta.planId

    if (status === 'PAYMENT_SUCCESS' && userId && planId) {
      const credits = PLAN_CREDITS[planId] || 1
      await serviceClient
        .from('profiles')
        .update({ plan: planId, credits_remaining: credits })
        .eq('id', userId)
    }

    return NextResponse.json({ received: true })
  } catch (e) {
    console.error('Webhook error:', e)
    return NextResponse.json({ received: true })
  }
}
