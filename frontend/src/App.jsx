import React, { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function App() {
  // Navigation State
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Data States
  const [vouchers, setVouchers] = useState([]);
  const [systemAlert, setSystemAlert] = useState(null);

  // Currency & Project Context
  const currencySymbol = 'KES';

  // Budget Allocation Mapping
  const budgetAllocations = {
    'COMP-01': 35000000.00,
    'COMP-02': 15000000.00,
    'COMP-03': 10000000.00,
    'COMP-04': 5000000.00
  };

  // Automated Double Entry Mapping
  const componentAccountMap = {
    'COMP-01': {
      drComponent: 'Component 1 (Value Chain Infrastructure Support)',
      crAccount: 'Central Bank Designated Account'
    },
    'COMP-02': {
      drComponent: 'Component 2 (Agricultural Value Chain Finance)',
      crAccount: 'Central Bank Designated Account'
    },
    'COMP-03': {
      drComponent: 'Component 3 (Institutional Strengthening)',
      crAccount: 'Central Bank Designated Account'
    },
    'COMP-04': {
      drComponent: 'Component 4 (Project Management)',
      crAccount: 'Central Bank Designated Account'
    }
  };

  // Form State
  const [form, setForm] = useState({
    voucherNo: `NAVCP-V-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    componentCode: 'COMP-02',
    drComponent: componentAccountMap['COMP-02'].drComponent,
    drAmount: '',
    crAccount: componentAccountMap['COMP-02'].crAccount,
    crAmount: ''
  });

  // Supporting Document Anchoring States
  const [selectedVoucherUuid, setSelectedVoucherUuid] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');

  useEffect(() => {
    refreshLedgerData();
  }, []);

  const refreshLedgerData = () => {
    fetch(`${API_BASE_URL}/api/vouchers`)
      .then(res => res.json())
      .then(data => {
        setVouchers(data);
        if (data.length > 0 && !selectedVoucherUuid) {
          setSelectedVoucherUuid(data[0].uuid);
        }
      })
      .catch(() => {
        setSystemAlert({
          type: 'danger',
          message: 'Core ledger service connection failure. Backend service may be warming up.'
        });
      });
  };

  const handleComponentChange = (code) => {
    const mappings = componentAccountMap[code];
    setForm(prev => ({
      ...prev,
      componentCode: code,
      drComponent: mappings.drComponent,
      crAccount: mappings.crAccount
    }));
  };

  const handleAmountChange = (val) => {
    setForm(prev => ({
      ...prev,
      drAmount: val,
      crAmount: val
    }));
  };

  const handleVoucherSubmit = (e) => {
    e.preventDefault();
    setSystemAlert(null);

    fetch(`${API_BASE_URL}/api/vouchers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        setSystemAlert({ type: 'danger', message: data.message, code: data.errorCode });
      } else {
        setSystemAlert({ type: 'success', message: 'Voucher journalized and queued for verification.' });
        refreshLedgerData();
        setForm(prev => ({
          ...prev,
          voucherNo: `NAVCP-V-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          drAmount: '',
          crAmount: ''
        }));
        setCurrentView('dashboard');
      }
    })
    .catch(() => setSystemAlert({ type: 'danger', message: 'Transaction delivery error.' }));
  };

  const handleAnchorExecution = (uuid) => {
    if (!uuid || !uploadedFileName) return;
    setSystemAlert(null);

    fetch(`${API_BASE_URL}/api/vouchers/${uuid}/anchor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: uploadedFileName })
    })
    .then(res => res.json())
    .then(data => {
      setSystemAlert({ type: 'success', message: `Blockchain Block Sealed! IPFS Hash: ${data.ipfsHash}` });
      setUploadedFileName('');
      refreshLedgerData();
    });
  };

  // Dynamic KPI Metrics Calculations
  const totalBudget = Object.values(budgetAllocations).reduce((a, b) => a + b, 0);
  const totalExpenditure = vouchers
    .filter(v => v.status === 'CONFIRMED')
    .reduce((sum, v) => sum + parseFloat(v.drAmount || 0), 0);
  const totalCommitments = vouchers
    .filter(v => v.status === 'PENDING_QUEUE')
    .reduce((sum, v) => sum + parseFloat(v.drAmount || 0), 0);
  const totalFundsReceived = totalBudget * 0.25; // 25% Advance Allocation Benchmark
  const availableBalance = totalBudget - totalExpenditure;
  const utilizationRate = ((totalExpenditure / totalBudget) * 100).toFixed(2);

  // Latest block state reference
  const latestConfirmedVoucher = vouchers.find(v => v.status === 'CONFIRMED') || {};

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-slate-800 font-sans antialiased flex flex-col">
      
      {/* ========================================================================= */}
      {/* GLOBAL ENTERPRISE TOP NAVBAR */}
      {/* ========================================================================= */}
      <header className="bg-[#0b1e36] text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-700 text-xs select-none">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 font-bold tracking-tight text-sm">
            <span className="bg-blue-600 text-white p-1 rounded font-black text-xs">🌐</span>
            <span>WORLD BANK</span>
            <span className="text-slate-400 font-normal">|</span>
            <span className="text-blue-400 font-bold">FundsChain</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <select className="bg-[#182c47] border border-slate-600 text-white px-2 py-1 rounded text-xs">
            <option>All Projects</option>
            <option>NAVCP Kenya (P176543)</option>
          </select>
          <button className="hover:text-blue-400">⚙️</button>
          <button className="hover:text-blue-400">🔔</button>
          <button className="hover:text-blue-400">⏻</button>
          <div className="flex items-center space-x-2 border-l border-slate-600 pl-3">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center font-bold text-[10px]">JD</div>
            <div>
              <div className="font-bold text-[11px]">John Doe</div>
              <div className="text-[9px] text-slate-400">FM Specialist</div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        
        {/* ========================================================================= */}
        {/* NAVIGATION SIDEBAR MENU */}
        {/* ========================================================================= */}
        <aside className="w-52 bg-[#0d233a] text-slate-300 flex flex-col justify-between select-none text-xs border-r border-slate-800 shrink-0">
          <nav className="py-2 space-y-0.5">
            {[
              { id: 'dashboard', label: 'DASHBOARD', icon: '🏠', active: currentView === 'dashboard' },
              { id: 'my-tasks', label: 'My Tasks', icon: '🎯' },
              { id: 'projects', label: 'Projects', icon: '📂' },
              { id: 'budget', label: 'Budget', icon: '📊' },
              { id: 'procurement', label: 'Procurement', icon: '🛒' },
              { id: 'contracts', label: 'Contracts', icon: '📜' },
              { id: 'payments', label: 'Payments', icon: '💳' },
              { id: 'disbursements', label: 'Disbursements', icon: '🏦' },
              { id: 'suppliers', label: 'Suppliers', icon: '👥' },
              { id: 'beneficiaries', label: 'Beneficiaries', icon: '👨‍👩‍👧' },
              { id: 'reports', label: 'Reports', icon: '📈' },
              { id: 'accounting', label: 'Accounting', icon: '📖' },
              { id: 'audit-controls', label: 'Audit & Controls', icon: '🛡️' },
              { id: 'documents', label: 'Documents', icon: '📁' },
              { id: 'analytics', label: 'Analytics', icon: '📉' },
              { id: 'system-settings', label: 'System Settings', icon: '⚙️' }
            ].map(item => (
              <div 
                key={item.id}
                onClick={() => {
                  if (item.id === 'dashboard') setCurrentView('dashboard');
                }}
                className={`flex items-center space-x-3 px-4 py-2 cursor-pointer transition-colors ${
                  item.active 
                    ? 'bg-[#1b365d] text-white font-bold border-l-4 border-blue-500' 
                    : 'hover:bg-[#142d4a] hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </nav>
        </aside>

        {/* ========================================================================= */}
        {/* MAIN WORKSPACE CONTENT AREA */}
        {/* ========================================================================= */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4 min-w-0">
          
          {/* System Notification Toast */}
          {systemAlert && (
            <div className={`p-3 rounded border text-xs font-mono flex justify-between items-center ${
              systemAlert.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}>
              <span>{systemAlert.message}</span>
              <button onClick={() => setSystemAlert(null)} className="font-bold ml-4">✕</button>
            </div>
          )}

          {/* 1. PROJECT INFORMATION HEADER BLOCK */}
          <div className="bg-white p-3.5 rounded shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-xs">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold text-slate-900">HOPE-PHC SWAP (IPF)</h1>
                <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">ACTIVE</span>
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5 space-x-3">
                <span><strong>Country:</strong> Kenya</span>
                <span>|</span>
                <span><strong>Project ID:</strong> P176543</span>
                <span>|</span>
                <span><strong>Implementing Agency:</strong> Ministry of Agriculture & Livestock Development</span>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-slate-600 text-[11px]">
              <div>
                <div className="text-slate-400 text-[10px]">Reporting Period</div>
                <div className="font-semibold text-slate-800">📅 Q2 2026 (Jan - Jun 2026)</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px]">Last Login</div>
                <div className="font-semibold text-slate-800">🕒 20 Jul 2026 10:30 AM</div>
              </div>
            </div>
          </div>

          {/* 2. KEY PERFORMANCE INDICATORS (KPIs) STRIP */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              { label: 'Total Budget (Approved)', val: `${currencySymbol} ${(totalBudget / 1000000).toFixed(2)} Mn`, color: 'bg-blue-600', icon: '🏛️' },
              { label: 'Total Funds Received', val: `${currencySymbol} ${(totalFundsReceived / 1000000).toFixed(2)} Mn`, color: 'bg-emerald-600', icon: '💵' },
              { label: 'Total Commitments', val: `${currencySymbol} ${(totalCommitments / 1000000).toFixed(2)} Mn`, color: 'bg-amber-500', icon: '📝' },
              { label: 'Total Expenditure', val: `${currencySymbol} ${(totalExpenditure / 1000000).toFixed(2)} Mn`, color: 'bg-purple-600', icon: '💸' },
              { label: 'Available Balance', val: `${currencySymbol} ${(availableBalance / 1000000).toFixed(2)} Mn`, color: 'bg-teal-600', icon: '🏦' },
              { label: 'Utilization', val: `${utilizationRate}%`, color: 'bg-rose-500', icon: '⏱️' }
            ].map((kpi, idx) => (
              <div key={idx} className="bg-white p-3 rounded shadow-sm border border-slate-200 flex items-center space-x-3">
                <div className={`${kpi.color} text-white w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0`}>
                  {kpi.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-500 truncate">{kpi.label}</div>
                  <div className="text-xs font-bold text-slate-900 font-mono truncate">{kpi.val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 3. CHARTS & ANALYTICS PANEL */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            {/* Chart 1: Budget vs Actual */}
            <div className="bg-white p-3 rounded shadow-sm border border-slate-200 flex flex-col justify-between">
              <h3 className="font-bold text-slate-800 text-[11px] mb-2">Budget vs Actual Expenditure</h3>
              <div className="h-32 flex items-end justify-center space-x-6 pb-2 border-b border-slate-100">
                <div className="flex flex-col items-center">
                  <div className="text-[9px] font-bold text-blue-600 mb-1">{(totalBudget/1000000).toFixed(0)}M</div>
                  <div className="w-8 bg-blue-600 rounded-t" style={{ height: '80px' }}></div>
                  <span className="text-[10px] text-slate-500 mt-1">Budget</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-[9px] font-bold text-emerald-600 mb-1">{(totalExpenditure/1000000).toFixed(1)}M</div>
                  <div className="w-8 bg-emerald-500 rounded-t" style={{ height: `${Math.max((totalExpenditure/totalBudget)*80, 4)}px` }}></div>
                  <span className="text-[10px] text-slate-500 mt-1">Actual</span>
                </div>
              </div>
            </div>

            {/* Chart 2: Monthly Disbursement Trend */}
            <div className="bg-white p-3 rounded shadow-sm border border-slate-200 flex flex-col justify-between">
              <h3 className="font-bold text-slate-800 text-[11px] mb-2">Monthly Disbursement Trend</h3>
              <div className="h-32 flex items-end justify-between px-2 pb-2 border-b border-slate-100 font-mono text-[9px] text-slate-400">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m, i) => (
                  <div key={m} className="flex flex-col items-center space-y-1">
                    <div className="w-1.5 bg-blue-500 rounded-full" style={{ height: `${(i + 1) * 12}px` }}></div>
                    <span>{m}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 3: Expenditure by Component */}
            <div className="bg-white p-3 rounded shadow-sm border border-slate-200 flex flex-col justify-between">
              <h3 className="font-bold text-slate-800 text-[11px] mb-2">Expenditure by Component</h3>
              <div className="h-32 flex items-center justify-center space-x-3">
                <div className="w-20 h-20 rounded-full border-8 border-blue-500 border-t-emerald-500 border-r-amber-500 flex items-center justify-center text-[10px] font-bold font-mono">
                  {utilizationRate}%
                </div>
                <div className="space-y-1 text-[9px]">
                  <div className="flex items-center space-x-1"><span className="w-2 h-2 bg-blue-500 inline-block"></span><span>Comp 1: 50.2%</span></div>
                  <div className="flex items-center space-x-1"><span className="w-2 h-2 bg-emerald-500 inline-block"></span><span>Comp 2: 24.5%</span></div>
                  <div className="flex items-center space-x-1"><span className="w-2 h-2 bg-amber-500 inline-block"></span><span>Comp 3: 15.1%</span></div>
                  <div className="flex items-center space-x-1"><span className="w-2 h-2 bg-purple-500 inline-block"></span><span>Comp 4: 10.2%</span></div>
                </div>
              </div>
            </div>

            {/* Chart 4: Expenditure by Region/County */}
            <div className="bg-white p-3 rounded shadow-sm border border-slate-200 flex flex-col justify-between">
              <h3 className="font-bold text-slate-800 text-[11px] mb-2">Expenditure by County</h3>
              <div className="space-y-1.5 text-[10px]">
                {[
                  { region: 'Kiambu', val: 'KES 312M', width: '85%' },
                  { region: 'Nakuru', val: 'KES 270M', width: '70%' },
                  { region: 'Machakos', val: 'KES 210M', width: '55%' },
                  { region: 'Kilifi', val: 'KES 180M', width: '45%' }
                ].map(r => (
                  <div key={r.region}>
                    <div className="flex justify-between text-[9px] text-slate-500"><span>{r.region}</span><span>{r.val}</span></div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full" style={{ width: r.width }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4. SUMMARY STATISTICS CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              { label: 'Contracts', count: '245', icon: '📄', color: 'text-blue-600' },
              { label: 'Payments', count: vouchers.length.toString(), icon: '💳', color: 'text-emerald-600' },
              { label: 'Suppliers', count: '186', icon: '👥', color: 'text-amber-600' },
              { label: 'Beneficiaries', count: '11,450', icon: '👨‍👩‍👧', color: 'text-purple-600' },
              { label: 'Pending Tasks', count: vouchers.filter(v=>v.status==='PENDING_QUEUE').length.toString(), icon: '📋', color: 'text-teal-600' },
              { label: 'Alerts', count: '2', icon: '⚠️', color: 'text-rose-600' }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-3 rounded shadow-sm border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500">{stat.label}</div>
                  <div className={`text-base font-bold font-mono ${stat.color}`}>{stat.count}</div>
                  <span className="text-[9px] text-blue-500 hover:underline cursor-pointer">View all</span>
                </div>
                <span className="text-lg">{stat.icon}</span>
              </div>
            ))}
          </div>

          {/* 5. OPERATIONAL PANELS: RECENT TRANSACTIONS | COMPLIANCE | BLOCKCHAIN */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* Recent Transactions & Voucher Input Form */}
            <div className="bg-white p-3.5 rounded shadow-sm border border-slate-200 flex flex-col justify-between space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-800 text-xs">Recent Ledger Transactions</h3>
                <span className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer">View all transactions</span>
              </div>

              <div className="overflow-x-auto text-[10px] max-h-48 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-mono text-[9px] uppercase border-b">
                      <th className="p-1.5">Ref No</th>
                      <th className="p-1.5">Component</th>
                      <th className="p-1.5 text-right">Amount (KES)</th>
                      <th className="p-1.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {vouchers.map(v => (
                      <tr key={v.uuid} className="hover:bg-slate-50">
                        <td className="p-1.5 font-bold text-slate-900">{v.voucherNo}</td>
                        <td className="p-1.5 text-slate-500">{v.componentCode}</td>
                        <td className="p-1.5 text-right font-bold">{v.drAmount.toLocaleString()}</td>
                        <td className="p-1.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                            v.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Quick Voucher Entry Action Drawer */}
              <form onSubmit={handleVoucherSubmit} className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[10px] space-y-2">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">Post Payment Voucher</div>
                <div className="grid grid-cols-2 gap-2">
                  <select 
                    className="border p-1 rounded bg-white" 
                    value={form.componentCode} 
                    onChange={e => handleComponentChange(e.target.value)}
                  >
                    <option value="COMP-02">COMP-02 (Agri Finance)</option>
                    <option value="COMP-01">COMP-01 (Infrastructure)</option>
                    <option value="COMP-03">COMP-03 (Institutional)</option>
                    <option value="COMP-04">COMP-04 (Management)</option>
                  </select>
                  <input 
                    type="number" 
                    placeholder="Amount (KES)" 
                    className="border p-1 rounded bg-white font-mono" 
                    value={form.drAmount}
                    onChange={e => handleAmountChange(e.target.value)}
                    required 
                  />
                </div>
                <button type="submit" className="w-full bg-[#0d233a] hover:bg-slate-800 text-white font-bold py-1 rounded text-[10px] uppercase tracking-wider">
                  Post Voucher to Queue
                </button>
              </form>
            </div>

            {/* Compliance Panel */}
            <div className="bg-white p-3.5 rounded shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                  <h3 className="font-bold text-slate-800 text-xs">Compliance Status</h3>
                  <span className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer">View compliance dashboard</span>
                </div>

                <div className="space-y-2 text-[11px]">
                  {[
                    { title: 'IFR (Q2 2026)', desc: 'Submitted on 15 Jun 2026', status: 'Compliant' },
                    { title: 'SOE (Q2 2026)', desc: 'Submitted on 15 Jun 2026', status: 'Compliant' },
                    { title: 'Designated Account Reconciliation', desc: 'May 2026', status: 'Compliant' },
                    { title: 'Procurement Plan', desc: 'FY 2026', status: 'Compliant' },
                    { title: 'Internal Audit', desc: 'Q2 2026', status: 'Compliant' },
                    { title: 'External Audit', desc: 'Q1 2026', status: 'Compliant' }
                  ].map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-100">
                      <div className="flex items-center space-x-2">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <div>
                          <div className="font-bold text-slate-800 text-[10px]">{c.title}</div>
                          <div className="text-[9px] text-slate-400">{c.desc}</div>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">{c.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Blockchain Verification Panel */}
            <div className="bg-white p-3.5 rounded shadow-sm border border-slate-200 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                  <h3 className="font-bold text-slate-800 text-xs">Blockchain Verification</h3>
                  <span className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer">View blockchain explorer</span>
                </div>

                <div className="space-y-1.5 font-mono text-[10px]">
                  <div className="flex justify-between"><span className="text-slate-400">Last Verified Txn:</span><span className="font-bold text-blue-600">{latestConfirmedVoucher.voucherNo || 'TXN-2026-00056789'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Transaction Hash:</span><span className="font-bold text-slate-700 truncate max-w-[130px]">{latestConfirmedVoucher.ipfsHash || '0x7fa3...8b6e21c'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Block Number:</span><span className="font-bold text-slate-700">178,923,456</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Timestamp:</span><span className="font-bold text-slate-700">28 Jul 2026 09:00 AM</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Smart Contract:</span><span className="font-bold text-slate-700">WB-FUNDSCHAIN-01</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Digital Signature:</span><span className="font-bold text-emerald-600">Verified ✓</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Verification Status:</span><span className="font-bold text-emerald-600 bg-emerald-50 px-1 rounded">Confirmed</span></div>
                </div>
              </div>

              {/* Interactive Supporting Document Attachment Block */}
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[10px] space-y-2">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">Fiduciary Metadata Document Seal</div>
                <select 
                  className="w-full border p-1 rounded bg-white font-mono text-[10px]" 
                  value={selectedVoucherUuid}
                  onChange={e => setSelectedVoucherUuid(e.target.value)}
                >
                  <option value="">Select Pending Voucher Target...</option>
                  {vouchers.map(v => (
                    <option key={v.uuid} value={v.uuid}>{v.voucherNo} - KES {v.drAmount}</option>
                  ))}
                </select>
                <input 
                  type="file" 
                  className="w-full border p-1 rounded bg-white text-[9px]" 
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) setUploadedFileName(e.target.files[0].name);
                  }}
                />
                <button 
                  onClick={() => handleAnchorExecution(selectedVoucherUuid)}
                  disabled={!selectedVoucherUuid || !uploadedFileName}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-1 rounded text-[10px] uppercase tracking-wider"
                >
                  Seal Cryptographic Block
                </button>
              </div>
            </div>

          </div>

          {/* 6. BOTTOM QUICK ACCESS TOOLBAR */}
          <div className="bg-white p-3 rounded shadow-sm border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Access Actions</div>
            <div className="grid grid-cols-4 md:grid-cols-10 gap-2 text-center text-[10px]">
              {[
                { label: 'Create Payment', icon: '💳' },
                { label: 'Create Contract', icon: '📜' },
                { label: 'Create Disbursement', icon: '🏦' },
                { label: 'Record Receipt', icon: '🧾' },
                { label: 'New Procurement', icon: '🛒' },
                { label: 'Add Supplier', icon: '👥' },
                { label: 'Add Beneficiary', icon: '👨‍👩‍👧' },
                { label: 'Upload Document', icon: '📤' },
                { label: 'Generate IFR', icon: '📊' },
                { label: 'Reports Dashboard', icon: '📈' }
              ].map((act, idx) => (
                <button key={idx} className="p-2 border border-slate-100 hover:border-blue-300 rounded bg-slate-50 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center space-y-1">
                  <span className="text-base">{act.icon}</span>
                  <span className="text-[9px] font-medium text-slate-700 leading-tight">{act.label}</span>
                </button>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}