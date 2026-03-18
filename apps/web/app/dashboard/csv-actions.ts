'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

export async function importTransactions(transactions: any[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const itemsToInsert = []

  for (const t of transactions) {
     if (!t.date || !t.amount || !t.merchant) continue

     const deduplication_hash = crypto
        .createHash('sha256')
        .update(`${user.id}-${t.date}-${t.amount}-${t.merchant}`)
        .digest('hex')

     itemsToInsert.push({
        user_id: user.id,
        date: t.date,
        amount: parseFloat(t.amount.toString().replace(/[^0-9.-]+/g, '')),
        merchant: t.merchant,
        description: t.description || '',
        is_business: t.is_business === true || t.is_business === 'true' || t.is_business === 'TRUE',
        currency: 'USD',
        deduplication_hash
     })
  }

  if (itemsToInsert.length === 0) return { count: 0 }

  const { data, error } = await supabase.from('transactions')
     .upsert(itemsToInsert, { onConflict: 'user_id, deduplication_hash', ignoreDuplicates: true })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')

  return { count: itemsToInsert.length }
}
