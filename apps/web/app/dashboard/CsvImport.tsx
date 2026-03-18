'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { importTransactions } from './csv-actions'

export default function CsvImport() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError('')
    setSuccess('')

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data.map((row: any) => ({
             date: row.Date || row.date,
             amount: row.Amount || row.amount,
             merchant: row.Merchant || row.merchant || row.Description || row.description || 'Unknown',
             description: row.Notes || row.notes || '',
             is_business: row.Business || row.business || false
          }))

          const res = await importTransactions(rows)
          setSuccess(`Processed ${res.count} rows. Existing duplicates were automatically skipped.`)
        } catch (err: any) {
          setError(err.message)
        } finally {
          setLoading(false)
          e.target.value = ''
        }
      },
      error: (err) => {
        setError(err.message)
        setLoading(false)
      }
    })
  }

  return (
    <div className="bg-white p-5 border border-gray-100 rounded-lg shadow-sm mt-8">
      <h2 className="text-xl font-bold mb-2">Import CSV</h2>
      <p className="text-sm text-gray-600 mb-4">
        Upload a CSV file with headers: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">Date, Amount, Merchant, Notes, Business</code>. Duplicates will be automatically ignored!
      </p>
      
      <input 
        type="file" 
        accept=".csv" 
        onChange={handleFileUpload} 
        disabled={loading}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-800 file:text-white hover:file:bg-black file:cursor-pointer"
      />
      
      {loading && <p className="text-blue-600 mt-3 text-sm font-medium animate-pulse">Processing file...</p>}
      {error && <p className="text-red-600 mt-3 text-sm font-medium bg-red-50 p-2 rounded">{error}</p>}
      {success && <p className="text-green-600 mt-3 text-sm font-medium bg-green-50 p-2 rounded">{success}</p>}
    </div>
  )
}
