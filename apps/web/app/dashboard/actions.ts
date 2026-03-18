'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function confirmReceiptTransaction(receiptId: string, transactionData: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error: txError } = await supabase.from('transactions').insert({
    user_id: user.id,
    receipt_id: receiptId,
    amount: transactionData.amount,
    date: transactionData.date,
    merchant: transactionData.merchant,
    description: transactionData.description,
    is_business: transactionData.is_business,
    currency: 'USD'
  })

  if (txError) throw new Error(txError.message)

  const { error: rxError } = await supabase.from('receipts').update({
    status: 'confirmed'
  }).eq('id', receiptId)

  if (rxError) throw new Error(rxError.message)

  revalidatePath('/dashboard')
}

export async function addManualTransaction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const amount = parseFloat(formData.get('amount') as string)
  const merchant = formData.get('merchant') as string
  const date = formData.get('date') as string
  const is_business = formData.get('is_business') === 'on'

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    amount,
    date,
    merchant,
    is_business,
    currency: 'USD'
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
}
