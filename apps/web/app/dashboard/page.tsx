import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'
import { addManualTransaction } from './actions'
import CsvImport from './CsvImport'
import DashboardStats from './DashboardStats'
import SentryTestButton from './SentryTestButton'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tax_rate')
    .eq('id', user.id)
    .single()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  const { data: pendingReceipts } = await supabase
    .from('receipts')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'parsed')

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-extrabold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600 font-medium">Logged in as: {user.email}</p>
          </div>

          <DashboardStats 
            transactions={transactions || []} 
            taxRate={profile?.tax_rate || 20} 
          />
          
          <DashboardClient 
            transactions={transactions || []} 
            pendingReceipts={pendingReceipts || []} 
          />

          <div className="mt-12 border-t pt-8">
            <h2 className="text-xl font-semibold mb-4">Manual Entry</h2>
            <form action={addManualTransaction} className="bg-gray-50 p-5 border rounded flex flex-col gap-4 shadow-inner">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Merchant / Title</label>
                  <input name="merchant" placeholder="e.g. Uber, Gas Station" className="border p-2 w-full rounded bg-white" required />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Amount ($)</label>
                  <input type="number" step="0.01" name="amount" placeholder="0.00" className="border p-2 w-full rounded bg-white" required />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Date</label>
                  <input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} className="border p-2 w-full rounded bg-white" required />
                </div>
                <div className="flex items-center justify-start md:justify-center pt-6">
                  <input type="checkbox" name="is_business" id="manual_is_business" defaultChecked className="mr-2 h-4 w-4" />
                  <label htmlFor="manual_is_business" className="font-medium">Business Expense</label>
                </div>
              </div>
              <button type="submit" className="bg-gray-900 text-white font-semibold py-2.5 rounded mt-2 hover:bg-black transition">
                Add Transaction
              </button>
            </form>
          </div>

          <CsvImport />

          <SentryTestButton />
        </div>
      </div>
    </div>
  )
}

