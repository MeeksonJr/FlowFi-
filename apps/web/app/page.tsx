import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-6">
      <h1 className="text-4xl font-extrabold mb-4 text-blue-600">FlowFi</h1>
      <p className="text-lg text-gray-700 mb-8 max-w-md">
        The ultimate AI-powered finance manager for gig workers, freelancers, and contractors.
      </p>
      <div className="flex gap-4">
        <Link href="/login" className="px-6 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition">
          Get Started
        </Link>
      </div>
    </div>
  )
}
