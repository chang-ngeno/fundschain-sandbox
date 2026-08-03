import React, { useState } from 'react';
import { 
  CreditCard, 
  FileCheck, 
  Send, 
  Receipt, 
  ShoppingBag, 
  Truck, 
  Users, 
  UploadCloud, 
  X, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';

const ACTION_CARDS = [
  { id: 'payment', label: 'Create Payment', icon: CreditCard, color: 'from-blue-600 to-indigo-600', badge: 'Vouchers' },
  { id: 'contract', label: 'Create Contract', icon: FileCheck, color: 'from-emerald-600 to-teal-600', badge: 'Commitments' },
  { id: 'disbursement', label: 'Disbursement', icon: Send, color: 'from-violet-600 to-purple-600', badge: 'Funds' },
  { id: 'receipt', label: 'Record Receipt', icon: Receipt, color: 'from-amber-500 to-orange-600', badge: 'Incoming' },
  { id: 'procurement', label: 'Procurement', icon: ShoppingBag, color: 'from-rose-600 to-pink-600', badge: 'Tenders' },
  { id: 'supplier', label: 'Add Supplier', icon: Truck, color: 'from-cyan-600 to-blue-600', badge: 'Vendors' },
  { id: 'beneficiary', label: 'Add Beneficiary', icon: Users, color: 'from-green-600 to-emerald-700', badge: 'Community' },
  { id: 'upload', label: 'IPFS Document', icon: UploadCloud, color: 'from-fuchsia-600 to-pink-700', badge: 'Immutable' },
];

export default function QuickActions({ onActionTrigger }) {
  const [activeAction, setActiveAction] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleOpen = (action) => {
    setActiveAction(action);
    setFormData({});
    setFeedback(null);
  };

  const handleClose = () => {
    setActiveAction(null);
    setFeedback(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Map action to API endpoint
      let endpoint = '/api/vouchers';
      if (activeAction.id === 'contract' || activeAction.id === 'procurement') endpoint = '/api/contracts';
      if (activeAction.id === 'disbursement') endpoint = '/api/disbursements';
      if (activeAction.id === 'supplier') endpoint = '/api/suppliers';
      if (activeAction.id === 'beneficiary') endpoint = '/api/beneficiaries';
      if (activeAction.id === 'upload') endpoint = '/api/documents';

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      setLoading(false);
      setFeedback(result.message || 'Operation executed successfully!');
      
      if (onActionTrigger) onActionTrigger();
    } catch (err) {
      setLoading(false);
      setFeedback(`Error: ${err.message}`);
    }
  };

  return (
    <div className="my-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white tracking-wide">Ledger Quick Launchpad</h2>
        </div>
        <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-mono">
          v4.1.1 Fullstack Ready
        </span>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {ACTION_CARDS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => handleOpen(action)}
              className="group relative flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-emerald-500/50 hover:bg-slate-800 transition-all duration-200 hover:-translate-y-1 shadow-md hover:shadow-emerald-950/20 text-center"
            >
              <div className={`p-2.5 rounded-lg bg-gradient-to-br ${action.color} text-white mb-2 shadow-inner group-hover:scale-110 transition-transform duration-200`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-slate-200 group-hover:text-white line-clamp-1">
                {action.label}
              </span>
              <span className="mt-1 text-[10px] text-slate-400 font-mono">
                {action.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Interactive Modal */}
      {activeAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${activeAction.color} text-white`}>
                  <activeAction.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{activeAction.label}</h3>
                  <p className="text-xs text-slate-400">Post cryptographically verified entry to PostgreSQL</p>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            {feedback ? (
              <div className="py-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <p className="text-sm font-medium text-slate-200">{feedback}</p>
                <button
                  onClick={handleClose}
                  className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
                >
                  Close & Return to Dashboard
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Title / Primary Reference
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Agricultural Equipment Maintenance"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    onChange={(e) => setFormData({ ...formData, title: e.target.value, description: e.target.value, name: e.target.value, groupName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Amount (KES) / Quantity / Category
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 15400000"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value, vendor: e.target.value, category: e.target.value, county: e.target.value })}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg shadow-lg shadow-emerald-950/40 transition flex items-center space-x-1"
                  >
                    {loading ? 'Processing...' : 'Execute Transaction'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}