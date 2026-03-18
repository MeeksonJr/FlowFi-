import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function OnboardingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if profile exists and has role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role) {
    redirect('/dashboard')
  }

  async function completeOnboarding(formData: FormData) {
    'use server'
    const role = formData.get('role') as string
    const taxRate = parseFloat(formData.get('taxRate') as string)

    const supabaseServer = await createClient()
    const { data: userData } = await supabaseServer.auth.getUser()

    if (userData.user) {
      await supabaseServer.from('profiles').update({
        role,
        tax_rate: taxRate,
      }).eq('id', userData.user.id)
    }

    redirect('/dashboard')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <form action={completeOnboarding} className="flex flex-col gap-4 w-full max-w-sm p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-4">Complete your Profile</h1>
        
        <div className="flex flex-col gap-1">
          <label htmlFor="role" className="text-sm font-medium">I am a:</label>
          <select id="role" name="role" required className="border p-2 rounded bg-white">
            <option value="freelancer">Freelancer</option>
            <option value="contractor">Contractor</option>
            <option value="driver">Rideshare/Delivery Driver</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="taxRate" className="text-sm font-medium">Estimated Tax Rate (%):</label>
          <input
            id="taxRate"
            name="taxRate"
            type="number"
            min="0"
            max="100"
            defaultValue="25"
            required
            className="border p-2 rounded"
          />
        </div>

        <button type="submit" className="mt-4 bg-blue-600 text-white p-2 rounded font-semibold text-center hover:bg-blue-700 transition">
          Go to Dashboard
        </button>
      </form>
    </div>
  )
}
