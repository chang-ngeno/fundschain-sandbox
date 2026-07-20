import React, { useState, useEffect } from 'react';

export default function App() {
  const [components, setComponents] = useState([]);
  const [selectedNode, setSelectedNode] = useState('');
  const [payee, setPayee] = useState('');
  const [amount, setAmount] = useState('');
  const [alert, setAlert] = useState(null);

  const fetchComponents = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/components');
      const data = await response.json();
      setComponents(data);
      if (data.length > 0) setSelectedNode(data[0].id);
    } catch (err) {
      console.error('Error fetching components:', err);
    }
  };

  useEffect(() => {
    fetchComponents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    try {
      const response = await fetch('http://localhost:5000/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componentId: selectedNode,
          payeeName: payee,
          amountKes: amount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setAlert({
          type: 'error',
          title: data.code || 'VALIDATION_FAILED',
          message: data.message || 'Verification rejected by backend rules.'
        });
      } else {
        setAlert({
          type: 'success',
          title: 'VOUCHER VALIDATED AND QUEUED FOR RELEASE',
          message: `Ref ID: tx_${data.transactionId}. Remaining balance: KES ${data.remainingBalanceKes.toLocaleString()}`
        });
        fetchComponents(); // Refresh UI values
        setAmount('');
        setPayee('');
      }
    } catch (err) {
      setAlert({
        type: 'error',
        title: 'CONNECTION_ERROR',
        message: 'Could not connect to validation sandbox api server.'
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <header className="bg-slate-800 text-white p-6 rounded-t-lg border-b-4 border-teal-500 shadow">
        <h1 className="text-xl font-bold tracking-wider">FUNDS_CHAIN STAGING SIMULATOR</h1>
        <p className="text-xs text-slate-300 mt-1">Target Project: National Agricultural Value Chain Project (NAVCP)</p>
      </header>

      <main className="bg-white p-8 border border-gray-200 rounded-b-lg shadow-md space-y-8">
        
        {/* Active Nodes Tracker */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Active Budget Nodes (KES)</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {components.map((c) => (
              <div key={c.id} className="p-4 border rounded-lg bg-slate-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-1 w-1/3 bg-teal-500"></div>
                <div className="font-bold text-slate-700">{c.component_code}</div>
                <div className="text-xs text-gray-500 mb-2">{c.component_name}</div>
                <div className="text-xs font-mono bg-gray-200/50 p-1 rounded text-blue-700 select-all mb-3 text-center">
                  {c.id}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Available:</span>
                  <span className="font-bold text-teal-600">KES {parseFloat(c.remaining_budget_kes).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Form and Feedback UI */}
        <section className="border-t pt-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Submit Payment Voucher</h2>
          
          {alert && (
            <div className={`p-4 mb-6 rounded-lg border font-mono text-sm ${
              alert.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'
            }`}>
              <div className="font-bold">[{alert.title}]</div>
              <div className="mt-1">{alert.message}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Target Component UUID</label>
              <select 
                value={selectedNode} 
                onChange={(e) => setSelectedNode(e.target.value)}
                className="w-full p-2 border rounded bg-white text-sm"
              >
                {components.map(c => (
                  <option key={c.id} value={c.id}>{c.component_code} ({c.id})</option>
                ))}
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Payee Name</label>
                <input 
                  type="text" 
                  value={payee} 
                  onChange={(e) => setPayee(e.target.value)}
                  placeholder="e.g. Ruiru Agricultural Ltd"
                  className="w-full p-2 border rounded text-sm" 
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Amount (KES)</label>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 12500000"
                  className="w-full p-2 border rounded text-sm" 
                  required 
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="bg-slate-700 text-white font-bold text-sm tracking-wide px-4 py-2 rounded shadow hover:bg-slate-800 transition w-full"
            >
              Validate & Submit Voucher
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}