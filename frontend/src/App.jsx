import React, { useState, useEffect } from 'react';

export default function App() {
  // Navigation & Sub-Menu States matching TaskList & Manual Hierarchy
  const [currentView, setCurrentView] = useState('new-voucher'); 
  const [expandedMenus, setExpandedMenus] = useState({
    voucherMgmt: true,
    analyticsReporting: true
  });

  // Core Operational States
  const [vouchers, setVouchers] = useState([]);
  const [reportRecords, setReportRecords] = useState([]);
  const [systemAlert, setSystemAlert] = useState(null);

  // Form State Configurations (Lab 1 Context)
  const [form, setForm] = useState({
    voucherNo: 'NAVCP-V-091',
    date: new Date().toISOString().split('T')[0],
    componentCode: 'COMP-02',
    drComponent: 'Component 2.1 (Agricultural Inputs)',
    drAmount: '150000',
    crAccount: 'Kenya CBK Designated Account',
    crAmount: '150000'
  });

  // Report Params State (Lab 3 Context)
  const [reportParams, setReportParams] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Lab 2 State Hooks
  const [selectedVoucherUuid, setSelectedVoucherUuid] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [observedHash, setObservedHash] = useState('');

  useEffect(() => {
    refreshLedgerData();
  }, []);

  const refreshLedgerData = () => {
    fetch('http://localhost:5000/api/vouchers')
      .then(res => res.json())
      .then(data => {
        setVouchers(data);
        if (data.length > 0 && !selectedVoucherUuid) {
          setSelectedVoucherUuid(data[0].uuid);
        }
      })
      .catch(() => setSystemAlert({ type: 'danger', message: 'Database connectivity error.' }));
  };

  // HANDS-ON LAB 1 EXECUTION HANDLER
  const handleVoucherSubmit = (e) => {
    e.preventDefault();
    setSystemAlert(null);

    fetch('http://localhost:5000/api/vouchers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        setSystemAlert({ type: 'danger', message: data.message, code: data.errorCode });
      } else {
        setSystemAlert({ type: 'success', message: 'Voucher validation successful. Queued for Ledger verification.' });
        refreshLedgerData();
        setCurrentView('pending-queue'); // Automatically route to queue to check entry
      }
    })
    .catch(() => setSystemAlert({ type: 'danger', message: 'Failed to write record to service.' }));
  };

  // HANDS-ON LAB 2 EXECUTION HANDLER
  const handleAnchorExecution = () => {
    if (!selectedVoucherUuid || !uploadedFileName) return;
    setSystemAlert(null);

    fetch(`http://localhost:5000/api/vouchers/${selectedVoucherUuid}/anchor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: uploadedFileName })
    })
    .then(res => res.json())
    .then(data => {
      setObservedHash(data.ipfsHash);
      setSystemAlert({ type: 'success', message: `Status update resolved: ${data.message}. Cryptographic Block sealed.` });
      refreshLedgerData();
    });
  };

  // HANDS-ON LAB 3 EXECUTION HANDLER
  const handleFetchLedgerReport = () => {
    fetch(`http://localhost:5000/api/reports/soe?startDate=${reportParams.startDate}&endDate=${reportParams.endDate}`)
      .then(res => res.json())
      .then(data => {
        setReportRecords(data.records);
        setSystemAlert({ type: 'success', message: 'Real-time query complete. Block records matching timeline compiled.' });
      });
  };

  const toggleMenu = (menuKey) => {
    setExpandedMenus(prev => ({ ...prev, [menuKey]: !prev[menuKey] }));
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* ========================================================================= */}
      {/* SIDEBAR NAVIGATION MANIPULATION BAR (Matches Dark Slate Aesthetic) */}
      {/* ========================================================================= */}
      <aside className="w-80 bg-[#2d3748] text-[#f7fafc] flex flex-col justify-between shadow-xl border-r border-slate-700 font-mono select-none">
        <div className="p-5 space-y-6">
          {/* Main Module Branding Title */}
          <div className="border-b border-slate-600 pb-4">
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-500 text-slate-900 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">NAVCP</span>
              <span className="text-sm font-bold tracking-wider text-emerald-400">FundsChain Node</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 uppercase">Staging Core Terminal</p>
          </div>

          {/* Nav Links Stack */}
          <nav className="space-y-2 text-sm">
            
            {/* VOUCHER MANAGEMENT ACCORDION PARENT */}
            <div>
              <div 
                onClick={() => toggleMenu('voucherMgmt')}
                className="flex items-center justify-between p-2.5 rounded hover:bg-slate-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-amber-400 text-base">📁</span>
                  <span className="font-semibold tracking-wide text-slate-200">Voucher Management</span>
                </div>
                <span className="text-xs text-slate-400">{expandedMenus.voucherMgmt ? '▼' : '▶'}</span>
              </div>
              
              {expandedMenus.voucherMgmt && (
                <div className="pl-6 mt-1 space-y-1 border-l-2 border-slate-600/40 ml-4">
                  <div 
                    onClick={() => setCurrentView('new-voucher')}
                    className={`flex items-center space-x-2 p-2 rounded text-xs cursor-pointer transition-all ${
                      currentView === 'new-voucher' 
                        ? 'bg-emerald-500 text-slate-900 font-bold shadow-sm' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/30'
                    }`}
                  >
                    <span>✦</span>
                    <span>New Voucher</span>
                  </div>
                  
                  <div 
                    onClick={() => setCurrentView('pending-queue')}
                    className={`flex items-center space-x-2 p-2 rounded text-xs cursor-pointer transition-all ${
                      currentView === 'pending-queue' 
                        ? 'bg-emerald-500 text-slate-900 font-bold shadow-sm' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/30'
                    }`}
                  >
                    <span>✦</span>
                    <span>Pending Queue</span>
                  </div>
                </div>
              )}
            </div>

            {/* SUITEANALYTICS & REPORTING ACCORDION PARENT */}
            <div>
              <div 
                onClick={() => toggleMenu('analyticsReporting')}
                className="flex items-center justify-between p-2.5 rounded hover:bg-slate-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-amber-400 text-base">📁</span>
                  <span className="font-semibold tracking-wide text-slate-200">SuiteAnalytics & Reporting</span>
                </div>
                <span className="text-xs text-slate-400">{expandedMenus.analyticsReporting ? '▼' : '▶'}</span>
              </div>

              {expandedMenus.analyticsReporting && (
                <div className="pl-6 mt-1 space-y-1 border-l-2 border-slate-600/40 ml-4">
                  <div className="p-2 text-slate-400 font-bold text-[11px] uppercase tracking-wider select-none">
                    🗂️ Reporting
                  </div>
                  <div 
                    onClick={() => setCurrentView('statement-expenditure')}
                    className={`flex items-center space-x-2 p-2 rounded text-xs cursor-pointer transition-all pl-4 ${
                      currentView === 'statement-expenditure' 
                        ? 'bg-emerald-500 text-slate-900 font-bold shadow-sm' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/30'
                    }`}
                  >
                    <span>🔹</span>
                    <span>Statement of Expenditure</span>
                  </div>
                </div>
              )}
            </div>

          </nav>
        </div>

        {/* System Baseline Technical Footprint Parameters */}
        <div className="p-4 bg-slate-800/60 border-t border-slate-700 text-[10px] space-y-1 text-slate-400 font-mono">
          <div><strong className="text-slate-500">ENGINE:</strong> UUID Engine v1.1</div>
          <div><strong className="text-slate-500">BASE CURRENCY:</strong> KES (Shilling)</div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN CONTENT VIEWPORT EXECUTION BLOCK AREA */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP SYSTEM CONSOLE METRICS HEADBOARD */}
        <header className="bg-white border-b border-slate-200 p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">National Agricultural Value Chain Project Sandbox</h1>
            <p className="text-slate-500 text-xs mt-0.5">Republic of Kenya — Project Implementation Unit (PIU) Accountant Onboarding Simulator[cite: 1]</p>
          </div>
          <button 
            onClick={refreshLedgerData}
            className="text-xs font-mono font-bold text-emerald-600 hover:bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg transition-colors self-start"
          >
            🔄 Sync Ledger State Channels
          </button>
        </header>

        {/* APP CORE NOTIFICATION BOX RUNNER */}
        <div className="p-6 pb-0 max-w-6xl w-full mx-auto">
          {systemAlert && (
            <div className={`p-4 rounded-lg border shadow-sm transition-all ${
              systemAlert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xs font-mono uppercase">{systemAlert.type === 'success' ? '[SUCCESS]' : '[SYSTEM STATE CONFLICT]'}</span>
                {systemAlert.code && <span className="bg-rose-200 text-rose-900 text-[10px] font-mono px-1.5 py-0.5 rounded">{systemAlert.code}</span>}
              </div>
              <p className="text-xs mt-1 font-semibold">{systemAlert.message}</p>
            </div>
          )}
        </div>

        {/* ACTIVE WORKSPACE SUB-VIEW DISPATCHER */}
        <main className="flex-1 p-6 max-w-6xl w-full mx-auto">
          
          {/* VIEW 1: NEW VOUCHER FORM (Lab 1 Context) */}
          {currentView === 'new-voucher' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm max-w-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Module 1: Voucher Capturing[cite: 1]</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Hands-On Lab 1: Record payment of KES 150,000 to agricultural supplier[cite: 1].</p>
                </div>
              </div>
              <form onSubmit={handleVoucherSubmit} className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Voucher Identifier String</label>
                    <input type="text" className="w-full border p-2 rounded font-mono bg-slate-50" value={form.voucherNo} onChange={e => setForm({...form, voucherNo: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Transaction Date</label>
                    <input type="date" className="w-full border p-2 rounded" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Component Selector</label>
                  <select className="w-full border p-2 rounded bg-white" value={form.componentCode} onChange={e => setForm({...form, componentCode: e.target.value})}>
                    <option value="COMP-02">COMP-02 (Agricultural Value Chain Finance)</option>
                    <option value="COMP-01">COMP-01 (Value Chain Infrastructure Support)</option>
                  </select>
                </div>

                <div className="border border-slate-200 p-4 rounded-lg bg-slate-50/70 space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Double-Entry Distribution Allocation Matrix[cite: 1]</span>
                  <div>
                    <label className="block text-slate-500 font-medium mb-0.5">DR Allocation Line Item (Debit Expense Branch)</label>
                    <input type="text" className="w-full border p-2 rounded bg-white text-slate-700" value={form.drComponent} readOnly />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 font-medium mb-0.5">Debit Amount (KES)</label>
                      <input type="number" className="w-full border p-2 rounded font-bold text-slate-900" value={form.drAmount} onChange={e => setForm({...form, drAmount: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-0.5">Credit Amount (KES)</label>
                      <input type="number" className="w-full border p-2 rounded font-bold text-slate-900" value={form.crAmount} onChange={e => setForm({...form, crAmount: e.target.value})} required />
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg transition-colors uppercase tracking-wider text-xs">
                  Validate & Queue State Write[cite: 1]
                </button>
              </form>
            </div>
          )}

          {/* VIEW 2: PENDING QUEUE & IPFS ANCHORING ENGINE (Lab 2 Context) */}
          {currentView === 'pending-queue' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Side: Ledger Master Registry Table list */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Live Verification Block Ledger</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Select a ledger node below to anchor supporting documentation artifacts[cite: 1].</p>
                </div>
                <div className="overflow-x-auto text-[11px] flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500 border-b border-slate-200 uppercase text-[9px] tracking-wider">
                        <th className="p-3">Voucher No</th>
                        <th className="p-3">Component</th>
                        <th className="p-3 text-right">Debit (KES)</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vouchers.map(v => (
                        <tr 
                          key={v.uuid} 
                          onClick={() => setSelectedVoucherUuid(v.uuid)}
                          className={`cursor-pointer transition-colors ${selectedVoucherUuid === v.uuid ? 'bg-emerald-50/60 font-semibold' : 'hover:bg-slate-50'}`}
                        >
                          <td className="p-3 text-slate-900">{v.voucherNo}</td>
                          <td className="p-3 font-mono text-slate-500">{v.componentCode}</td>
                          <td className="p-3 text-right font-bold">{v.drAmount.toLocaleString()}.00</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${v.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 animate-pulse'}`}>
                              {v.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Side: Interactive IPFS Cryptographic Anchor drop zone[cite: 1] */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Lab 2: Supporting Document Anchor[cite: 1]</h3>
                    <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-bold px-1.5 py-0.5 rounded mt-1 inline-block">Module 2[cite: 1]</span>
                  </div>

                  {/* Drag and Drop Container Workspace Node */}
                  <div className="text-xs space-y-3">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Target Node Key</label>
                      <input type="text" className="w-full border p-2 rounded font-mono bg-slate-100 text-slate-600 truncate" value={selectedVoucherUuid || 'No Node Selected'} readOnly />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Drag Scan Documents (Max 10MB)[cite: 1]</label>
                      <div 
                        className="border-2 border-dashed border-slate-300 hover:border-emerald-400 bg-slate-50 p-4 rounded-lg text-center cursor-pointer transition-colors relative"
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => {
                          e.preventDefault();
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) setUploadedFileName(e.dataTransfer.files[0].name);
                        }}
                      >
                        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => {
                          if (e.target.files && e.target.files[0]) setUploadedFileName(e.target.files[0].name);
                        }} />
                        <span className="text-xl block">📤</span>
                        <span className="text-emerald-600 font-bold block mt-1 text-[11px]">Choose File Targets</span>
                        <span className="text-slate-400 text-[9px] block">Drop invoices or approval vouchers here[cite: 1]</span>
                      </div>
                    </div>

                    {uploadedFileName && (
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded flex justify-between items-center text-[10px] font-bold text-emerald-800">
                        <span className="truncate max-w-[150px]">📋 {uploadedFileName}</span>
                        <span>STAGED</span>
                      </div>
                    )}

                    {observedHash && (
                      <div className="p-2.5 bg-slate-900 text-emerald-400 border border-slate-800 rounded font-mono text-[10px] space-y-1 shadow-inner">
                        <div className="text-slate-400 font-bold text-[8px] uppercase tracking-wider">IPFS Anchor Hash Tag[cite: 1]:</div>
                        <div className="break-all">{observedHash}</div>
                        <div className="text-white text-[9px] pt-1">
                          🔑 First 6: <span className="bg-slate-700 px-1 py-0.5 rounded font-bold">{observedHash.substring(0,6)}</span>[cite: 1]
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={handleAnchorExecution}
                  disabled={!selectedVoucherUuid || !uploadedFileName}
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-xs uppercase tracking-wider"
                >
                  Anchor to Ledger[cite: 1]
                </button>
              </div>

            </div>
          )}

          {/* VIEW 3: STATEMENT OF EXPENDITURE REPORT ENGINE (Lab 3 Context) */}
          {currentView === 'statement-expenditure' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-6 p-6">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Module 3: Real-Time Reporting[cite: 1]</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Hands-On Lab 3: Live Statement of Expenditure (SOE) Extraction[cite: 1].</p>
                </div>
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded border border-purple-100 self-start">Analytical Query Node</span>
              </div>

              {/* Param Configurations Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Start Date Context Window</label>
                  <input type="date" className="w-full border p-2 rounded bg-slate-50" value={reportParams.startDate} onChange={e => setReportParams({...reportParams, startDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">End Date Context Window</label>
                  <input type="date" className="w-full border p-2 rounded bg-slate-50" value={reportParams.endDate} onChange={e => setReportParams({...reportParams, endDate: e.target.value})} />
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={handleFetchLedgerReport}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors uppercase tracking-wider text-xs shadow-sm h-9"
                  >
                    Fetch Ledger[cite: 1]
                  </button>
                </div>
              </div>

              {/* Compiled Statement View Grid */}
              {reportRecords.length > 0 && (
                <div className="border border-purple-100 rounded-xl overflow-hidden shadow-sm text-xs">
                  <div className="bg-purple-900 text-white p-4 flex justify-between items-center font-mono">
                    <div>
                      <h4 className="font-bold tracking-wide">Statement of Expenditure (SOE)[cite: 1]</h4>
                      <p className="text-[10px] text-purple-200 mt-0.5">Republic of Kenya — National Agricultural Value Chain Project[cite: 1]</p>
                    </div>
                    <span className="bg-purple-800 text-purple-200 border border-purple-700 text-[10px] px-2 py-0.5 rounded">VERIFIED BLOCK STATE[cite: 1]</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b border-purple-100 uppercase text-[9px] tracking-wider font-mono">
                          <th className="p-3">Voucher ID</th>
                          <th className="p-3">Execution Date</th>
                          <th className="p-3">Component Allocation Target</th>
                          <th className="p-3 text-right">Debit Distribution Amount (KES)</th>
                          <th className="p-3 text-center">Ledger Seal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {reportRecords.map(r => (
                          <tr key={r.uuid} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3 font-bold text-slate-900 font-mono">{r.voucherNo}</td>
                            <td className="p-3 whitespace-nowrap">{r.date}</td>
                            <td className="p-3 font-mono text-slate-500">{r.componentCode}</td>
                            <td className="p-3 text-right font-bold text-slate-900">{r.drAmount.toLocaleString()}.00</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${r.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-slate-50 p-3 border-t border-purple-100 text-right">
                    <button 
                      onClick={() => setSystemAlert({ type: 'success', message: 'Signed PDF Document generated containing cryptographic ledger stamp validation.' })}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-[10px] px-3 py-1.5 rounded uppercase tracking-wider shadow-sm"
                    >
                      Export as Signed PDF[cite: 1]
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}