import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const PLAN_CREDITS: Record<string, number> = {
  single:  1,
  pack5:   5,
  pack15:  15,
  pack50:  50,
}

function verifyPayMongoSignature(rawBody: string, sigHeader: string | null): boolean {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET
  if (!secret || !sigHeader) return !secret // if no secret configured, allow all (dev mode)
  // PayMongo sig header format: "t=<timestamp>,te=<hmac>,li=<hmac>"
  const parts = Object.fromEntries(sigHeader.split(',').map(p => p.split('=')))
  const timestamp = parts['t']
  const signature = parts['te'] || parts['li']
  if (!timestamp || !signature) return false
  const payload = `${timestamp}.${rawBody}`
  const expected = createHmac('sha256', secret).update(payload).digest('hex')
  return expected === signature
}

export async function POST(req: Request) {
  const rawBody = await req.text()

  if (!verifyPayMongoSignature(rawBody, req.headers.get('paymongo-signature'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  let event: any
  try { event = JSON.parse(rawBody) } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventType = event?.data?.attributes?.type

  // Handle checkout.session.payment.paid
  if (eventType === 'checkout_session.payment.paid') {
    const session    = event?.data?.attributes?.data
    const meta       = session?.attributes?.metadata || {}
    const userId     = meta.userId
    const planId     = meta.planId
    const refNo      = meta.refNo
    const paymentRowId = meta.paymentRowId

    if (!userId || !planId || !refNo) {
      console.error('Webhook missing metadata:', meta)
      return NextResponse.json({ received: true })
    }

    const credits = PLAN_CREDITS[planId]
    if (!credits) {
      console.error('Unknown planId in webhook:', planId)
      return NextResponse.json({ received: true })
    }

    // Idempotency: check if we already processed this ref
    const { data: existing } = await serviceClient
      .from('payments')
      .select('id, status')
      .eq('reference_no', refNo)
      .single()

    if (existing?.status === 'paid') {
      return NextResponse.json({ received: true, duplicate: true })
    }

    // Get PayMongo payment intent ID
    const providerPaymentId = session?.id || null

    // Mark payment as paid
    await serviceClient
      .from('payments')
      .update({
        status:           'paid',
        credits_granted:  credits,
        provider_ref:     providerPaymentId || existing?.id,
        updated_at:       new Date().toISOString(),
      })
      .eq('reference_no', refNo)

    const payId = paymentRowId || existing?.id

    // Create credit batch
    const { data: batch } = await serviceClient
      .from('credit_batches')
      .insert({
        user_id:       userId,
        payment_id:    payId,
        source:        'purchase',
        total_credits: credits,
        used_credits:  0,
      })
      .select('id')
      .single()

    if (batch) {
      // Credit ledger entry
      await serviceClient
        .from('credit_ledger')
        .insert({
          user_id:     userId,
          batch_id:    batch.id,
          delta:       credits,
          description: `Purchased ${credits} credit${credits > 1 ? 's' : ''} — plan: ${planId}`,
        })
    }

    // Sync denormalized balance on profiles
    const { data: totalRow } = await serviceClient
      .rpc('get_premium_credits', { p_user_id: userId })

    await serviceClient
      .from('profiles')
      .update({ credits_remaining: totalRow ?? credits })
      .eq('id', userId)
  }

  return NextResponse.json({ received: true })
}
