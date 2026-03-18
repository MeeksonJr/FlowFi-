'use client'

export default function SentryTestButton() {
  return (
    <div className="mt-8 border-t pt-4 text-center">
      <button
         onClick={() => {
           // @ts-ignore
           myUndefinedFunction();
         }}
         className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded text-sm"
      >
        Trigger Sentry Error
      </button>
    </div>
  )
}
