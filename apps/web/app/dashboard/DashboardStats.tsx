export default function DashboardStats({ transactions, taxRate }: { transactions: any[], taxRate: number }) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthTx = transactions.filter(t => {
     const d = new Date(t.date);
     return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // Simple heuristic: positive amounts are income, negative are expenses.
  // If the user inputs positive numbers but marks them as "business", they are expenses.
  const income = currentMonthTx
    .filter(t => t.amount > 0 && !t.is_business)
    .reduce((sum, t) => sum + t.amount, 0);
    
  const expenses = currentMonthTx
    .filter(t => t.amount < 0 || t.is_business)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const taxableIncome = Math.max(0, income - expenses);
  const estimatedTax = taxableIncome * (taxRate / 100);

  const isDryPeriod = expenses > income && expenses > 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
         <p className="text-sm font-medium text-gray-500 mb-1">Monthly Income</p>
         <p className="text-2xl font-extrabold text-green-600">${income.toFixed(2)}</p>
      </div>
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
         <p className="text-sm font-medium text-gray-500 mb-1">Monthly Expenses</p>
         <p className="text-2xl font-extrabold text-red-500">${expenses.toFixed(2)}</p>
      </div>
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
         <p className="text-sm font-medium text-gray-500 mb-1">Est. Tax ({taxRate}%)</p>
         <p className="text-2xl font-extrabold text-orange-500">${estimatedTax.toFixed(2)}</p>
      </div>
      <div className={`p-4 rounded-xl border shadow-sm flex flex-col justify-center ${isDryPeriod ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
         <p className={`text-sm font-medium mb-1 ${isDryPeriod ? 'text-red-600' : 'text-gray-500'}`}>Cashflow Status</p>
         <p className={`text-lg font-bold leading-tight ${isDryPeriod ? 'text-red-700' : 'text-green-600'}`}>
            {isDryPeriod ? 'Warning: Deficit' : 'Healthy Pipeline'}
         </p>
      </div>
    </div>
  )
}
