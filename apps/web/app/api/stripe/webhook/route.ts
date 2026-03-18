import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    // We need the service role key to bypass RLS in the webhook
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    const body = await req.text()
    
    // In production, you MUST verify the Stripe signature:
    // const signature = headers().get('stripe-signature') as string
    // const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
    
    // For MVP, we'll just parse the JSON (Insecure without signature verification!)
    const event = JSON.parse(body)
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.client_reference_id // Passed during checkout
      const customerId = session.customer as string

      if (userId) {
        // Update user to PRO
        await supabaseAdmin.from('profiles').update({
          is_pro: true
        }).eq('id', userId)

        // Increase quota to unlimited (e.g., 99999)
        await supabaseAdmin.from('usage_quotas').update({
          ai_scans_limit: 99999
        }).eq('user_id', userId)

        // Map stripe customer ID
        await supabaseAdmin.from('subscriptions').insert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: session.subscription,
          status: 'active'
        })
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object
      const customerId = subscription.customer as string

      // Find user by customerId
      const { data: sub } = await supabaseAdmin
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (sub?.user_id) {
        // Demote user
        await supabaseAdmin.from('profiles').update({
          is_pro: false
        }).eq('id', sub.user_id)

        // Reset Quota to free limit (30)
        await supabaseAdmin.from('usage_quotas').update({
          ai_scans_limit: 30
        }).eq('user_id', sub.user_id)

        // Update Subscription status
        await supabaseAdmin.from('subscriptions').update({
          status: 'canceled'
        }).eq('stripe_subscription_id', subscription.id)
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Webhook Error:', err.message)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 400 })
  }
}
