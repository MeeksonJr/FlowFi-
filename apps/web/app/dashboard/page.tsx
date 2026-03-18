import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p className="mb-4">Welcome back, {user.email}!</p>
        <div className="bg-blue-50 border border-blue-200 p-4 rounded text-blue-800">
          This is your central hub for tracking income, parsing receipts, and forecasting cashflow.
        </div>
      </div>
    </div>
  )
}
