'use client'

import { useState } from 'react'
import { confirmReceiptTransaction } from './actions'

export default function DashboardClient({ transactions, pendingReceipts }: { transactions: any[], pendingReceipts: any[] }) {
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null)
  
  async function handleConfirmReceipt(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    await confirmReceiptTransaction(selectedReceipt.id, {
      amount: parseFloat(formData.get('amount') as string),
      merchant: formData.get('merchant'),
      date: formData.get('date'),
      description: formData.get('description'),
      is_business: formData.get('is_business') === 'on'
    })
    setSelectedReceipt(null)
  }

  return (
    <div className="mt-8">
      {pendingReceipts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Pending Receipts to Confirm</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pendingReceipts.map(receipt => (
              <div key={receipt.id} className="border p-4 rounded bg-yellow-50 flex justify-between items-center shadow-sm">
                <div>
                  <p className="font-bold">{receipt.parsed_data?.merchantName || 'Unknown Merchant'}</p>
                  <p>${receipt.parsed_data?.totalAmount || '0.00'}</p>
                </div>
                <button
                  onClick={() => setSelectedReceipt(receipt)}
                  className="bg-yellow-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-yellow-700 transition"
                >
                  Review
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">Confirm Transaction</h3>
            <img src={selectedReceipt.image_url} alt="Receipt" className="h-32 object-contain mb-4 mx-auto border rounded p-1" />
            <form onSubmit={handleConfirmReceipt} className="flex flex-col gap-3">
              <div>
                <label className="text-sm font-medium">Merchant</label>
                <input name="merchant" defaultValue={selectedReceipt.parsed_data?.merchantName || ''} className="border p-2 w-full rounded" required />
              </div>
              <div>
                <label className="text-sm font-medium">Amount ($)</label>
                <input type="number" step="0.01" name="amount" defaultValue={selectedReceipt.parsed_data?.totalAmount || ''} className="border p-2 w-full rounded" required />
              </div>
              <div>
                <label className="text-sm font-medium">Date</label>
                <input type="date" name="date" defaultValue={selectedReceipt.parsed_data?.date ? selectedReceipt.parsed_data.date.split('T')[0] : new Date().toISOString().split('T')[0]} className="border p-2 w-full rounded" required />
              </div>
              <div>
                <label className="text-sm font-medium">Description (Optional)</label>
                <input name="description" placeholder="What was this for?" className="border p-2 w-full rounded" />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" name="is_business" id="is_business" defaultChecked />
                <label htmlFor="is_business" className="font-medium text-sm">Business Expense</label>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setSelectedReceipt(null)} className="flex-1 border p-2 rounded font-medium hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded font-medium hover:bg-blue-700 transition">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-500 italic">No transactions recorded yet.</p>
        ) : (
          <div className="border rounded divide-y bg-white shadow-sm">
            {transactions.map(tx => (
              <div key={tx.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition">
                <div>
                  <p className="font-semibold text-gray-800">{tx.merchant} <span className="text-xs ml-2 text-gray-500 font-normal">{new Date(tx.date).toLocaleDateString()}</span></p>
                  <p className="text-sm text-gray-600">{tx.description || 'No description'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${tx.amount}</p>
                  {tx.is_business && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium mt-1 inline-block">Business</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
