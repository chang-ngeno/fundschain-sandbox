import React, { useState, useEffect } from "react";

export default function App() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '${API_BASE_URL}';
  // Navigation & Menu Orchestration
  const [currentView, setCurrentView] = useState("dashboard");
  const [expandedMenus, setExpandedMenus] = useState({
    voucherMgmt: true,
    analyticsReporting: true,
  });

  // Master State Managers
  const [vouchers, setVouchers] = useState([]);
  const [reportRecords, setReportRecords] = useState([]);
  const [systemAlert, setSystemAlert] = useState(null);

  // Enterprise AWPB Base Maps
  const [awpbData, setAwpbData] = useState({
    "COMP-01": {
      name: "Value Chain Infrastructure Support",
      accountCode: "4120-01",
      allocated: 35000000.0,
      utilized: 0,
    },
    "COMP-02": {
      name: "Agricultural Value Chain Finance",
      accountCode: "4120-02",
      allocated: 15000000.0,
      utilized: 0,
    },
  });

  // Account Mapping Engine for Voucher Entry
  const componentAccountMap = {
    "COMP-01": {
      drComponent:
        "Component 1.3 (Infrastructure & Public Works Asset Capitalization)",
      crAccount: "Central Bank of Kenya (CBK) Designated Dev Account",
    },
    "COMP-02": {
      drComponent:
        "Component 2.1 (Agricultural Value Chain Credit Scheme Mobilization)",
      crAccount: "Central Bank of Kenya (CBK) Designated Dev Account",
    },
  };

  // Structured Voucher Form Configuration
  const [form, setForm] = useState({
    voucherNo: `NAVCP-V-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split("T")[0],
    componentCode: "COMP-02",
    drComponent: componentAccountMap["COMP-02"].drComponent,
    drAmount: "",
    crAccount: componentAccountMap["COMP-02"].crAccount,
    crAmount: "",
  });

  const [reportParams, setReportParams] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  // Supporting Document Anchoring States
  const [selectedVoucherUuid, setSelectedVoucherUuid] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [observedHash, setObservedHash] = useState("");

  useEffect(() => {
    refreshLedgerData();
  }, []);

  // Recalculate AWPB maps dynamically based on finalized system entries
  const refreshLedgerData = () => {
    fetch(`${API_BASE_URL}/api/vouchers`)
      .then((res) => res.json())
      .then((data) => {
        setVouchers(data);
        if (data.length > 0 && !selectedVoucherUuid) {
          setSelectedVoucherUuid(data[0].uuid);
        }

        // Compute localized real-time utilization curves
        const baseAwpb = {
          "COMP-01": {
            name: "Value Chain Infrastructure Support",
            accountCode: "4120-01",
            allocated: 35000000.0,
            utilized: 0,
          },
          "COMP-02": {
            name: "Agricultural Value Chain Finance",
            accountCode: "4120-02",
            allocated: 15000000.0,
            utilized: 0,
          },
        };

        data.forEach((v) => {
          if (v.status === "CONFIRMED" && baseAwpb[v.componentCode]) {
            baseAwpb[v.componentCode].utilized += Number.parseFloat(v.drAmount);
          }
        });
        setAwpbData(baseAwpb);
      })
      .catch(() =>
        setSystemAlert({
          type: "danger",
          message: "Core ledger service connection failure.",
        }),
      );
  };

  // Replace your existing dashboard logic in App.jsx

  // 1. Unified Fetcher for both Ledger and Dashboard
  const refreshAllStates = () => {
    // Fetch Vouchers
    fetch(`${API_BASE_URL}/api/vouchers`)
      .then((res) => res.json())
      .then((data) => setVouchers(data));

    // Fetch Dashboard Metrics
    fetch(`${API_BASE_URL}/api/dashboard/metrics`)
      .then((res) => res.json())
      .then((data) => setAwpbData(data))
      .catch(() => console.error("Failed to sync dashboard state."));
  };

  // 2. useEffect update
  useEffect(() => {
    refreshAllStates();
  }, []);

  // 3. Update handleAnchorExecution to trigger state refresh
  const handleAnchorExecution = () => {
    if (!selectedVoucherUuid || !uploadedFileName) return;
    fetch(`${API_BASE_URL}/api/vouchers/${selectedVoucherUuid}/anchor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: uploadedFileName }),
    }).then(() => {
      setSystemAlert({
        type: "success",
        message: "Ledger block sealed and metrics updated.",
      });
      refreshAllStates(); // Refresh both List and Dashboard Metrics
    });
  };

  // Automate double-entry tracking when component selections switch
  const handleComponentChange = (code) => {
    const mappings = componentAccountMap[code];
    setForm((prev) => ({
      ...prev,
      componentCode: code,
      drComponent: mappings.drComponent,
      crAccount: mappings.crAccount,
    }));
  };

  // Keep Debit and Credit amounts matched exactly in real-time
  const handleAmountChange = (val) => {
    setForm((prev) => ({
      ...prev,
      drAmount: val,
      crAmount: val,
    }));
  };

  const handleVoucherSubmit = (e) => {
    e.preventDefault();
    setSystemAlert(null);

    fetch(`${API_BASE_URL}/api/vouchers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setSystemAlert({
            type: "danger",
            message: data.message,
            code: data.errorCode,
          });
        } else {
          setSystemAlert({
            type: "success",
            message: "Voucher journalized and pushed to the staging queue.",
          });
          refreshLedgerData();
          // Reset form identifier strings for next input sequence
          setForm((prev) => ({
            ...prev,
            voucherNo: `NAVCP-V-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            drAmount: "",
            crAmount: "",
          }));
          setCurrentView("pending-queue");
        }
      })
      .catch(() =>
        setSystemAlert({
          type: "danger",
          message: "Transaction delivery error.",
        }),
      );
  };

  // const handleAnchorExecution = () => {
  //   if (!selectedVoucherUuid || !uploadedFileName) return;
  //   setSystemAlert(null);

  //   fetch(`${API_BASE_URL}/api/vouchers/${selectedVoucherUuid}/anchor`, {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ fileName: uploadedFileName }),
  //   })
  //     .then((res) => res.json())
  //     .then((data) => {
  //       setObservedHash(data.ipfsHash);
  //       setSystemAlert({
  //         type: "success",
  //         message:
  //           "Cryptographic block successfully anchored and sealed to transaction sequence.",
  //       });
  //       refreshLedgerData();
  //     });
  // };

  const handleFetchLedgerReport = () => {
    fetch(
      `${API_BASE_URL}/api/reports/soe?startDate=${reportParams.startDate}&endDate=${reportParams.endDate}`,
    )
      .then((res) => res.json())
      .then((data) => {
        setReportRecords(data.records);
      });
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased">
      {/* ========================================================================= */}
      {/* ENTERPRISE DARK SLATE SIDEBAR NAVIGATION */}
      {/* ========================================================================= */}
      <aside className="w-80 bg-[#1e293b] text-[#f8fafc] flex flex-col justify-between shadow-xl font-mono select-none">
        <div className="p-5 space-y-6">
          <div className="border-b border-slate-700 pb-4">
            <div className="flex items-center space-x-2">
              <span className="bg-teal-500 text-slate-900 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded">
                NAVCP
              </span>
              <span className="text-sm font-bold tracking-wider text-slate-100">
                FundsChain Terminal
              </span>
            </div>
            <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-widest">
              Internal Control Module
            </p>
          </div>

          <nav className="space-y-2 text-sm">
            {/* DASHBOARD OVERVIEW ROOT */}
            <div
              onClick={() => setCurrentView("dashboard")}
              className={`flex items-center space-x-3 p-2.5 rounded cursor-pointer transition-all ${
                currentView === "dashboard"
                  ? "bg-teal-600 text-white font-bold"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <span className="text-base">📊</span>
              <span className="tracking-wide">Dashboard Overview</span>
            </div>

            {/* VOUCHER MANAGEMENT ACCORDION */}
            <div>
              <div
                onClick={() =>
                  setExpandedMenus((p) => ({
                    ...p,
                    voucherMgmt: !p.voucherMgmt,
                  }))
                }
                className="flex items-center justify-between p-2.5 rounded hover:bg-slate-800 cursor-pointer text-slate-300"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-slate-400">📁</span>
                  <span className="font-semibold tracking-wide">
                    Voucher Management
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {expandedMenus.voucherMgmt ? "▼" : "▶"}
                </span>
              </div>

              {expandedMenus.voucherMgmt && (
                <div className="pl-4 mt-1 space-y-1 border-l border-slate-700 ml-4">
                  <div
                    onClick={() => setCurrentView("new-voucher")}
                    className={`flex items-center space-x-2 p-2 rounded text-xs cursor-pointer transition-all ${
                      currentView === "new-voucher"
                        ? "bg-teal-600/30 text-teal-400 font-bold border-l-2 border-teal-500 pl-3"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                    }`}
                  >
                    <span>▪</span>
                    <span>New Voucher</span>
                  </div>

                  <div
                    onClick={() => setCurrentView("pending-queue")}
                    className={`flex items-center space-x-2 p-2 rounded text-xs cursor-pointer transition-all ${
                      currentView === "pending-queue"
                        ? "bg-teal-600/30 text-teal-400 font-bold border-l-2 border-teal-500 pl-3"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                    }`}
                  >
                    <span>▪</span>
                    <span>Pending Queue</span>
                  </div>
                </div>
              )}
            </div>

            {/* SUITEANALYTICS ACCORDION */}
            <div>
              <div
                onClick={() =>
                  setExpandedMenus((p) => ({
                    ...p,
                    analyticsReporting: !p.analyticsReporting,
                  }))
                }
                className="flex items-center justify-between p-2.5 rounded hover:bg-slate-800 cursor-pointer text-slate-300"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-slate-400">📁</span>
                  <span className="font-semibold tracking-wide">
                    SuiteAnalytics & Reports
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {expandedMenus.analyticsReporting ? "▼" : "▶"}
                </span>
              </div>

              {expandedMenus.analyticsReporting && (
                <div className="pl-4 mt-1 space-y-1 border-l border-slate-700 ml-4">
                  <div className="p-2 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                    Reporting
                  </div>
                  <div
                    onClick={() => setCurrentView("statement-expenditure")}
                    className={`flex items-center space-x-2 p-2 rounded text-xs cursor-pointer transition-all ${
                      currentView === "statement-expenditure"
                        ? "bg-teal-600/30 text-teal-400 font-bold border-l-2 border-teal-500 pl-3"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                    }`}
                  >
                    <span>▪</span>
                    <span>Statement of Expenditure</span>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        <div className="p-4 bg-[#0f172a] border-t border-slate-800 text-[10px] text-slate-400 font-mono">
          <div>System Environment: Staging Console</div>
          <div>Currency Anchor: KES (Shilling)</div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* WORKSPACE VIEWPORT VIEW */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              National Agricultural Value Chain Project (NAVCP)
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Republic of Kenya | Fiduciary Risk Staging and Verification Portal
            </p>
          </div>
          <button
            onClick={refreshLedgerData}
            className="text-xs font-semibold text-slate-700 hover:bg-slate-50 border border-slate-300 px-3 py-2 rounded-lg transition-colors flex items-center space-x-1"
          >
            <span>🔄</span> <span>Synchronize Ledger State</span>
          </button>
        </header>

        {/* Global Alert Engine */}
        <div className="p-6 pb-0 max-w-6xl w-full mx-auto">
          {systemAlert && (
            <div
              className={`p-4 rounded-xl border font-mono text-xs ${
                systemAlert.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}
            >
              <div className="font-bold flex items-center space-x-2">
                <span>
                  {systemAlert.type === "success"
                    ? "✓ SYSTEM STATE VALIDATED"
                    : "⚠ VALIDATION FAULT"}
                </span>
                {systemAlert.code && (
                  <span className="bg-rose-200 px-1 py-0.5 text-[10px] rounded font-bold text-rose-800">
                    {systemAlert.code}
                  </span>
                )}
              </div>
              <p className="mt-1 font-sans">{systemAlert.message}</p>
            </div>
          )}
        </div>

        <main className="flex-1 p-6 max-w-6xl w-full mx-auto">
          {/* ========================================================================= */}
          {/* VIEW: DASHBOARD OVERVIEW (AWPB Allocations & Balances) */}
          {/* ========================================================================= */}
          {currentView === "dashboard" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-base font-bold text-slate-900 mb-1">
                  Annual Work Plan & Budget (AWPB) Master Ledger
                </h2>
                <p className="text-slate-500 text-xs mb-6">
                  Real-time reference monitoring component funding caps against
                  commitments.
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  {Object.entries(awpbData).map(([code, data]) => {
                    const usagePct = Math.min(
                      (data.utilized / data.allocated) * 100,
                      100,
                    );
                    return (
                      <div
                        key={code}
                        className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 relative overflow-hidden"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-xs font-bold px-2 py-0.5 bg-slate-200 rounded text-slate-800 font-mono">
                              {code}
                            </span>
                            <h3 className="text-sm font-bold text-slate-800 mt-1.5 truncate max-w-[280px]">
                              {data.name}
                            </h3>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">
                            Acc: {data.accountCode}
                          </span>
                        </div>

                        <div className="my-4">
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-teal-500 h-full transition-all duration-500"
                              style={{ width: `${usagePct}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-1">
                            <span>Utilized: {usagePct.toFixed(1)}%</span>
                            <span>Limit Ceiling</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-t border-slate-200/60 pt-3 mt-2 text-center">
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold">
                              Allocated
                            </div>
                            <div className="text-xs font-bold text-slate-800 font-mono">
                              KES {data.allocated.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold">
                              Committed
                            </div>
                            <div className="text-xs font-bold text-teal-600 font-mono">
                              KES {data.utilized.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold">
                              Available Balance
                            </div>
                            <div className="text-xs font-bold text-slate-700 font-mono">
                              KES{" "}
                              {(
                                data.allocated - data.utilized
                              ).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW: NEW VOUCHER (Automated Double-Entry Ledger Posting Matrix) */}
          {/* ========================================================================= */}
          {currentView === "new-voucher" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm max-w-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                  Journalize General Ledger Payment Voucher
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submit dynamic expenditure adjustments to component pools.
                </p>
              </div>

              <form
                onSubmit={handleVoucherSubmit}
                className="p-6 space-y-5 text-xs"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Voucher Tracking String
                    </label>
                    <input
                      type="text"
                      className="w-full border p-2 rounded font-mono bg-slate-50 font-bold"
                      value={form.voucherNo}
                      onChange={(e) =>
                        setForm({ ...form, voucherNo: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Valuation Date
                    </label>
                    <input
                      type="date"
                      className="w-full border p-2 rounded"
                      value={form.date}
                      onChange={(e) =>
                        setForm({ ...form, date: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    AWPB Component Target Selector
                  </label>
                  <select
                    className="w-full border p-2 rounded bg-white text-slate-800 font-semibold"
                    value={form.componentCode}
                    onChange={(e) => handleComponentChange(e.target.value)}
                  >
                    <option value="COMP-02">
                      COMP-02 — Agricultural Value Chain Finance
                    </option>
                    <option value="COMP-01">
                      COMP-01 — Value Chain Infrastructure Support
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Transaction Disbursable Amount (KES)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 font-bold text-slate-400">
                      KES
                    </span>
                    <input
                      type="number"
                      className="w-full border p-2 pl-12 rounded font-bold text-slate-900 text-sm bg-slate-50/50"
                      placeholder="0.00"
                      value={form.drAmount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* DOUBLE ENTRY BALANCING MATRIX ENGINE */}
                <div className="border border-slate-200 rounded-xl bg-slate-50 p-4 space-y-4">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider font-mono">
                    Automated Ledger Balancing Matrix
                  </span>

                  <div className="space-y-2 border-b border-slate-200 pb-3">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-slate-700">
                        DEBIT LINE (Expenditure Outflow)
                      </span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold text-[9px] font-mono">
                        AUTOMATED
                      </span>
                    </div>
                    <div className="p-2 border rounded bg-white text-slate-600 font-mono text-[11px] truncate">
                      {form.drComponent}
                    </div>
                    <div className="text-right font-mono font-bold text-slate-900">
                      DR KES{" "}
                      {form.drAmount
                        ? Number.parseFloat(form.drAmount).toLocaleString()
                        : "0.00"}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-slate-700">
                        CREDIT LINE (Asset Source / CBK Clearing Account)
                      </span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold text-[9px] font-mono">
                        AUTOMATED
                      </span>
                    </div>
                    <div className="p-2 border rounded bg-white text-slate-600 font-mono text-[11px] truncate">
                      {form.crAccount}
                    </div>
                    <div className="text-right font-mono font-bold text-slate-900">
                      CR KES{" "}
                      {form.crAmount
                        ? Number.parseFloat(form.crAmount).toLocaleString()
                        : "0.00"}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg transition-colors uppercase tracking-wider text-xs shadow-sm"
                >
                  Commit Voucher Balanced Journal Line Items
                </button>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW: PENDING QUEUE & ANCHORING ENGINE */}
          {/* ========================================================================= */}
          {/* ========================================================================= */}
          {/* VIEW: PENDING SETTLEMENT QUEUE (Inline Fiduciary Metadata Anchoring) */}
          {/* ========================================================================= */}
          {currentView === "pending-queue" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
              <div className="p-5 bg-slate-50 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                  Pending Settlement Queue
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Attach localized supporting documentation artifacts directly
                  to individual vouchers to execute the ledger seal.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-500 border-b border-slate-200 uppercase text-[10px] tracking-wider font-mono">
                      <th className="p-4">Voucher Reference</th>
                      <th className="p-4">Component Target</th>
                      <th className="p-4 text-right">Settlement Base (DR)</th>
                      <th className="p-4">Verification Status</th>
                      <th className="p-4 w-96">
                        Fiduciary Metadata Anchor (Per Invoice Upload)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                    {vouchers.map((v) => (
                      <tr
                        key={v.uuid}
                        className="hover:bg-slate-50/50 transition-colors align-top"
                      >
                        {/* Voucher Core Data */}
                        <td className="p-4 font-mono">
                          <div className="font-bold text-slate-900">
                            {v.voucherNo}
                          </div>
                          <div className="text-[9px] text-slate-400 mt-0.5 select-all">
                            {v.uuid}
                          </div>
                        </td>
                        <td className="p-4 font-mono text-slate-500 pt-5">
                          {v.componentCode}
                        </td>
                        <td className="p-4 text-right font-bold text-slate-900 pt-5">
                          KES {v.drAmount.toLocaleString()}
                        </td>
                        <td className="p-4 pt-5">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${
                              v.status === "CONFIRMED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800 animate-pulse"
                            }`}
                          >
                            {v.status}
                          </span>
                        </td>

                        {/* PER-VOUCHER INDEPENDENT ANCHOR CONTROLS */}
                        <td className="p-4 border-l border-slate-100 bg-slate-50/40">
                          {v.status === "CONFIRMED" ? (
                            <div className="space-y-1.5 p-2 bg-emerald-50/60 border border-emerald-100 rounded-lg font-mono text-[10px] text-emerald-800">
                              <div className="flex justify-between items-center">
                                <span className="font-bold">
                                  ✓ ARTIFACT SECURED
                                </span>
                                <span className="text-[9px] bg-emerald-200 px-1.5 py-0.2 rounded">
                                  IMMUTABLE
                                </span>
                              </div>
                              {v.ipfsHash && (
                                <div className="break-all text-[9px] text-slate-600">
                                  Hash: {v.ipfsHash}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {/* Inline Interactive Drag-Drop/Click Action Box */}
                              <div className="relative border border-dashed border-slate-300 hover:border-teal-400 bg-white p-2.5 rounded-lg text-center transition-colors">
                                <input
                                  type="file"
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      // Assign metadata staging reference values instantly
                                      setSelectedVoucherUuid(v.uuid);
                                      setUploadedFileName(
                                        e.target.files[0].name,
                                      );
                                    }
                                  }}
                                />
                                <div className="text-[11px] text-teal-600 font-bold">
                                  {selectedVoucherUuid === v.uuid &&
                                  uploadedFileName
                                    ? "📋 " + uploadedFileName
                                    : "📄 Choose Support Evidence Scan"}
                                </div>
                                <div className="text-[9px] text-slate-400">
                                  Max 10MB (Invoices, Memos)
                                </div>
                              </div>

                              {/* Inline Verification Execution Action Trigger */}
                              {selectedVoucherUuid === v.uuid &&
                                uploadedFileName && (
                                  <div className="flex gap-2 animate-fadeIn">
                                    <button
                                      onClick={handleAnchorExecution}
                                      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-1.5 px-3 rounded text-[10px] uppercase font-mono tracking-wider shadow-sm transition-colors"
                                    >
                                      Lock & Seal Block
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedVoucherUuid("");
                                        setUploadedFileName("");
                                      }}
                                      className="bg-slate-200 hover:bg-slate-300 text-slate-600 px-2 py-1.5 rounded text-[10px] font-bold"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {vouchers.length === 0 && (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-8 text-center text-slate-400 font-mono italic"
                        >
                          No pipeline vouchers currently awaiting transaction
                          settlement.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW: STATEMENT OF EXPENDITURE REPORT ENGINE */}
          {/* ========================================================================= */}
          {currentView === "statement-expenditure" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                    Statement of Expenditure (SOE) Query Tool
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Aggregate runtime transaction outputs for audit execution
                    timelines.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Reporting Period Start
                  </label>
                  <input
                    type="date"
                    className="w-full border p-2 rounded bg-slate-50"
                    value={reportParams.startDate}
                    onChange={(e) =>
                      setReportParams({
                        ...reportParams,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Reporting Period End
                  </label>
                  <input
                    type="date"
                    className="w-full border p-2 rounded bg-slate-50"
                    value={reportParams.endDate}
                    onChange={(e) =>
                      setReportParams({
                        ...reportParams,
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleFetchLedgerReport}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-lg transition-colors uppercase tracking-wider text-xs h-9"
                  >
                    Generate SOE Report Extract
                  </button>
                </div>
              </div>

              {reportRecords.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm text-xs">
                  <div className="bg-slate-900 text-white p-4 flex justify-between items-center font-mono">
                    <div>
                      <h4 className="font-bold tracking-wide">
                        Statement of Expenditure (SOE)
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Republic of Kenya — National Agricultural Value Chain
                        Project
                      </p>
                    </div>
                    <span className="bg-slate-800 text-teal-400 border border-slate-700 text-[10px] px-2 py-0.5 rounded font-bold">
                      STATE VERIFIED
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[9px] tracking-wider font-mono">
                          <th className="p-3">Voucher ID</th>
                          <th className="p-3">Posting Date</th>
                          <th className="p-3">Component Target</th>
                          <th className="p-3 text-right">
                            Debit Distribution (KES)
                          </th>
                          <th className="p-3 text-center">Ledger Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700 font-mono">
                        {reportRecords.map((r) => (
                          <tr
                            key={r.uuid}
                            className="hover:bg-slate-50/50 transition-colors text-[11px]"
                          >
                            <td className="p-3 font-bold text-slate-900">
                              {r.voucherNo}
                            </td>
                            <td className="p-3 whitespace-nowrap">{r.date}</td>
                            <td className="p-3 text-slate-500">
                              {r.componentCode}
                            </td>
                            <td className="p-3 text-right font-bold text-slate-900">
                              KES {r.drAmount.toLocaleString()}
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold ${r.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
                              >
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
