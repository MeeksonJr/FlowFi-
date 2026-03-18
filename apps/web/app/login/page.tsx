import { login, signup } from './actions'

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form className="flex flex-col gap-4 w-full max-w-sm p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-4">Welcome to FlowFi</h1>
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">Email:</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="border p-2 rounded"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">Password:</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="border p-2 rounded"
          />
        </div>
        <div className="flex flex-col gap-2 mt-4">
          <button formAction={login} className="bg-blue-600 text-white p-2 rounded font-semibold text-center hover:bg-blue-700 transition">Log in</button>
          <button formAction={signup} className="bg-gray-100 text-gray-800 p-2 rounded font-semibold text-center hover:bg-gray-200 transition">Sign up</button>
        </div>
      </form>
    </div>
  )
}
