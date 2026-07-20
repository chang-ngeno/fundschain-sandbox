import React, { useState, useEffect } from "react";

export default function App() {
  // Core Operational States
  const [vouchers, setVouchers] = useState([]);
  const [reportRecords, setReportRecords] = useState([]);
  const [activeTab, setActiveTab] = useState("labs"); // Sandbox navigation trigger
  const [systemAlert, setSystemAlert] = useState(null);

  // Form State Configurations
  const [form, setForm] = useState({
    voucherNo: "NAVCP-V-091",
    date: new Date().toISOString().split("T")[0],
    componentCode: "COMP-02",
    drComponent: "Component 2.1 (Agricultural Inputs)",
    drAmount: "150000",
    crAccount: "Kenya CBK Designated Account",
    crAmount: "150000",
  });

  // Report Params State
  const [reportParams, setReportParams] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  // Track Lab 2 Selection Data Hook
  const [selectedVoucherUuid, setSelectedVoucherUuid] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [observedHash, setObservedHash] = useState("");

  useEffect(() => {
    refreshLedgerData();
  }, []);

  const refreshLedgerData = () => {
    fetch("http://localhost:5000/api/vouchers")
      .then((res) => res.json())
      .then((data) => {
        setVouchers(data);
        if (data.length > 0 && !selectedVoucherUuid) {
          setSelectedVoucherUuid(data[data.length - 1].uuid);
        }
      });
  };

  // HANDS-ON LAB 1 EXECUTION HANDLER
  const handleVoucherSubmit = (e) => {
    e.preventDefault();
    setSystemAlert(null);

    fetch("http://localhost:5000/api/vouchers", {
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
            message:
              "Voucher validation successful. Queued for Ledger verification.",
          });
          refreshLedgerData();
        }
      })
      .catch(() =>
        setSystemAlert({
          type: "danger",
          message:
            "Network connectivity fault linked to local container API core.",
        }),
      );
  };

  // HANDS-ON LAB 2 EXECUTION HANDLER
  const handleAnchorExecution = () => {
    if (!selectedVoucherUuid) return;
    setSystemAlert(null);

    fetch(`http://localhost:5000/api/vouchers/${selectedVoucherUuid}/anchor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: uploadedFileName || "NAVCP_Supplier_Invoice.pdf",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setObservedHash(data.ipfsHash);
        setSystemAlert({
          type: "success",
          message: `Status update resolved: ${data.message}. Cryptographic Block sealed.`,
        });
        refreshLedgerData();
      });
  };

  // HANDS-ON LAB 3 EXECUTION HANDLER
  const handleFetchLedgerReport = () => {
    fetch(
      `http://localhost:5000/api/reports/soe?startDate=${reportParams.startDate}&endDate=${reportParams.endDate}`,
    )
      .then((res) => res.json())
      .then((data) => {
        setReportRecords(data.records);
        setSystemAlert({
          type: "success",
          message: `Real-time query complete. Block records matching timeline compiled.`,
        });
      });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* HEADER MANUAL BLOCK BAR */}
      <header className="bg-slate-900 border-b-4 border-emerald-500 text-white p-6 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded">
              Staging Sandbox V1.1
            </span>
            <h1 className="text-2xl font-bold tracking-tight mt-1">
              FundsChain Interactive Training Simulator
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              National Agricultural Value Chain Project (NAVCP) — Republic of
              Kenya
            </p>
          </div>
          <div className="bg-slate-800/80 p-3 rounded border border-slate-700 text-xs font-mono space-y-1">
            <div>
              <strong className="text-slate-400">ID MAPPING TARGET:</strong>{" "}
              UUID Engine
            </div>
            <div>
              <strong className="text-slate-400">BASE CURRENCY:</strong> KES
              (Shilling)
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        {/* INTERACTIVE ALERTS AND NOTIFICATION CONTAINER */}
        {systemAlert && (
          <div
            className={`p-4 rounded-lg border shadow-sm transition-all ${
              systemAlert.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-rose-50 border-rose-200 text-rose-900"
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm uppercase">
                {systemAlert.type === "success"
                  ? "[SUCCESS]"
                  : "[SYSTEM ERROR ALERT]"}
              </span>
              {systemAlert.code && (
                <span className="bg-rose-200 text-rose-900 text-xs font-mono px-1.5 py-0.5 rounded">
                  {systemAlert.code}
                </span>
              )}
            </div>
            <p className="text-sm mt-1 font-medium">{systemAlert.message}</p>
          </div>
        )}

        {/* WORKSPACE NAVIGATION CONTROLS */}
        <div className="flex border-b border-slate-200 bg-white rounded-t-xl shadow-sm overflow-hidden">
          <button
            onClick={() => setActiveTab("labs")}
            className={`flex-1 py-4 px-6 text-center text-sm font-semibold border-b-2 transition-all ${activeTab === "labs" ? "border-emerald-600 text-emerald-600 bg-emerald-50/40" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
          >
            🔬 Hands-On Action Labs Sandbox
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={`flex-1 py-4 px-6 text-center text-sm font-semibold border-b-2 transition-all ${activeTab === "ledger" ? "border-emerald-600 text-emerald-600 bg-emerald-50/40" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
          >
            ⛓️ Live Ledger State Watcher ({vouchers.length})
          </button>
        </div>

        {/* COMPONENT TAB CONDITIONAL DISPLAY ENGINE */}
        {activeTab === "labs" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LAB 1 WIDGET CONTAINER */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h2 className="font-bold text-slate-900 text-base uppercase tracking-wide">
                    Lab 1: Voucher Entry
                  </h2>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Module 1
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Goal: Record transaction matching <strong>NAVCP-V-091</strong>
                  . Test balanced double-entry rules and real-time budget
                  thresholds.
                </p>

                <form className="space-y-3 mt-4 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Voucher Identifier String
                    </label>
                    <input
                      type="text"
                      className="w-full border p-2 rounded font-mono bg-slate-50"
                      value={form.voucherNo}
                      onChange={(e) =>
                        setForm({ ...form, voucherNo: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">
                        Component Selector
                      </label>
                      <select
                        className="w-full border p-2 rounded bg-white"
                        value={form.componentCode}
                        onChange={(e) =>
                          setForm({ ...form, componentCode: e.target.value })
                        }
                      >
                        <option value="COMP-02">COMP-02 (Agri Finance)</option>
                        <option value="COMP-01">
                          COMP-01 (Infrastructure Support)
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">
                        Transaction Date
                      </label>
                      <input
                        type="date"
                        className="w-full border p-2 rounded"
                        value={form.date}
                        onChange={(e) =>
                          setForm({ ...form, date: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="border border-slate-100 p-2.5 rounded bg-slate-50/50 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                      Double-Entry Account Distribution Matrix
                    </span>
                    <div>
                      <label className="block text-slate-500 font-medium mb-0.5">
                        DR Allocation Line Item (Debit)
                      </label>
                      <input
                        type="text"
                        className="w-full border p-1.5 rounded bg-white text-slate-700"
                        value={form.drComponent}
                        readOnly
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-500 font-medium mb-0.5">
                          Debit Amount (KES)
                        </label>
                        <input
                          type="number"
                          className="w-full border p-1.5 rounded font-bold text-slate-900"
                          value={form.drAmount}
                          onChange={(e) =>
                            setForm({ ...form, drAmount: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-medium mb-0.5">
                          Credit Amount (KES)
                        </label>
                        <input
                          type="number"
                          className="w-full border p-1.5 rounded font-bold text-slate-900"
                          value={form.crAmount}
                          onChange={(e) =>
                            setForm({ ...form, crAmount: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              <button
                onClick={handleVoucherSubmit}
                className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-xs uppercase tracking-wider shadow-sm"
              >
                Validate & Queue Voucher
              </button>
            </div>

            {/* LAB 2 WIDGET CONTAINER
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h2 className="font-bold text-slate-900 text-base uppercase tracking-wide">Lab 2: IPFS Anchoring</h2>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Module 2</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Goal: Attach dynamic metadata supporting files and lock cryptographic hashes to an active ledger transaction node sequence.</p>
                
                <div className="space-y-3 mt-4 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Target Active Voucher (UUID Standard)</label>
                    <select className="w-full border p-2 rounded font-mono bg-white" value={selectedVoucherUuid} onChange={e => setSelectedVoucherUuid(e.target.value)}>
                      <option value="">-- Select Active Pending Target Node --</option>
                      {vouchers.map(v => (
                        <option key={v.uuid} value={v.uuid}>{v.voucherNo} [{v.uuid.substring(0,8)}...]</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">File Upload Name</label>
                    <input type="text" placeholder="NAVCP_Supplier_Invoice.pdf" className="w-full border p-2 rounded" value={uploadedFileName} onChange={e => setUploadedFileName(e.target.value)} />
                  </div>
                  {observedHash && (
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded font-mono text-[11px] space-y-1">
                      <div className="text-blue-800 font-bold uppercase tracking-wider text-[9px]">Calculated Fingerprint Hash Target Generated:</div>
                      <div className="text-blue-900 break-all">{observedHash}</div>
                      <div className="text-[10px] text-blue-700 font-sans mt-1">
                        🔑 <strong>First 6 Characters:</strong> <span className="bg-blue-200 font-bold px-1 py-0.5 rounded">{observedHash.substring(0, 6)}</span> (Record this for your activity logs)
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={handleAnchorExecution} disabled={!selectedVoucherUuid} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-xs uppercase tracking-wider shadow-sm">
                Anchor to Ledger
              </button>
            </div> */}
            {/* LAB 2 WIDGET CONTAINER */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h2 className="font-bold text-slate-900 text-base uppercase tracking-wide">
                    Lab 2: IPFS Anchoring
                  </h2>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Module 2
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Goal: Attach dynamic metadata supporting files and lock
                  cryptographic hashes to an active ledger transaction node
                  sequence.
                </p>

                <div className="space-y-3 mt-4 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Target Active Voucher (UUID Standard)
                    </label>
                    <select
                      className="w-full border p-2 rounded font-mono bg-white"
                      value={selectedVoucherUuid}
                      onChange={(e) => setSelectedVoucherUuid(e.target.value)}
                    >
                      <option value="">
                        -- Select Active Pending Target Node --
                      </option>
                      {vouchers.map((v) => (
                        <option key={v.uuid} value={v.uuid}>
                          {v.voucherNo} [{v.uuid.substring(0, 8)}...]
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* NEW SIMULATED UPLOAD DRAG & DROP AREA */}
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Supporting Documentation Upload (Max 10MB)
                    </label>
                    <div
                      className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/50 p-4 rounded-lg text-center cursor-pointer transition-colors relative"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          setUploadedFileName(e.dataTransfer.files[0].name);
                        }
                      }}
                    >
                      <input
                        type="file"
                        id="file-upload"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setUploadedFileName(e.target.files[0].name);
                          }
                        }}
                      />
                      <div className="space-y-1">
                        <span className="text-lg block">📄</span>
                        <span className="text-blue-600 font-semibold block">
                          Click to browse
                        </span>
                        <span className="text-slate-400 text-[10px] block">
                          or drag and drop invoice, approval, or receipt scans
                          here[cite: 1]
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* FILE STATUS PREVIEW */}
                  {uploadedFileName && (
                    <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-100 rounded text-emerald-800 font-medium">
                      <span className="truncate max-w-[200px]">
                        📋 Selected: {uploadedFileName}
                      </span>
                      <span className="text-[10px] bg-emerald-200 px-1.5 py-0.5 rounded text-emerald-900 font-bold">
                        READY
                      </span>
                    </div>
                  )}

                  {observedHash && (
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded font-mono text-[11px] space-y-1">
                      <div className="text-blue-800 font-bold uppercase tracking-wider text-[9px]">
                        Calculated Fingerprint Hash Target Generated[cite: 1]:
                      </div>
                      <div className="text-blue-900 break-all">
                        {observedHash}
                      </div>
                      <div className="text-[10px] text-blue-700 font-sans mt-1">
                        🔑 <strong>First 6 Characters:</strong>{" "}
                        <span className="bg-blue-200 font-bold px-1 py-0.5 rounded">
                          {observedHash.substring(0, 6)}
                        </span>{" "}
                        (Record this for your activity logs)[cite: 1]
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleAnchorExecution}
                disabled={!selectedVoucherUuid || !uploadedFileName}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-xs uppercase tracking-wider shadow-sm"
              >
                Anchor to Ledger[cite: 1]
              </button>
            </div>

            {/* LAB 3 WIDGET CONTAINER */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h2 className="font-bold text-slate-900 text-base uppercase tracking-wide">
                    Lab 3: SOE Extraction
                  </h2>
                  <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    Module 3
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Goal: Execute immediate live ledger data queries to compile
                  Statements of Expenditure (SOE) without manual accounting
                  reconciliations.
                </p>

                <div className="grid grid-cols-1 gap-3 mt-4 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Start Date Context Window
                    </label>
                    <input
                      type="date"
                      className="w-full border p-2 rounded"
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
                      End Date Context Window
                    </label>
                    <input
                      type="date"
                      className="w-full border p-2 rounded"
                      value={reportParams.endDate}
                      onChange={(e) =>
                        setReportParams({
                          ...reportParams,
                          endDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {reportRecords.length > 0 && (
                  <div className="mt-4 border border-purple-100 rounded-lg overflow-hidden text-[11px]">
                    <div className="bg-purple-50 px-3 py-2 text-purple-900 font-bold border-b border-purple-100 flex justify-between items-center">
                      <span>📄 Statement of Expenditure Export</span>
                      <span className="bg-purple-200 text-purple-800 font-mono px-1 py-0.5 rounded text-[9px]">
                        LIVE COPIES
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50 space-y-1 font-mono max-h-24 overflow-y-auto">
                      {reportRecords.map((r) => (
                        <div
                          key={r.uuid}
                          className="text-slate-600 border-b border-slate-200 pb-1 last:border-0"
                        >
                          <strong>{r.voucherNo}</strong> — KES{" "}
                          {r.drAmount.toLocaleString()} ({r.status})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={handleFetchLedgerReport}
                className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-xs uppercase tracking-wider shadow-sm"
              >
                Fetch Ledger Records
              </button>
            </div>
          </div>
        ) : (
          /* CORE LEDGER MONITOR COMPONENT WATCHER SCREEN */
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                  Real-Time State Block Chain Registry
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Immutable audit line records containing verified double-entry
                  balances and system cryptographic proofs.
                </p>
              </div>
              <button
                onClick={refreshLedgerData}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-white border border-slate-200 px-3 py-1.5 rounded shadow-sm transition-colors"
              >
                🔄 Sync State Nodes
              </button>
            </div>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="p-4">Voucher No</th>
                    <th className="p-4">Target Node UUID</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Debit Distribution (KES)</th>
                    <th className="p-4 text-right">
                      Credit Distribution (KES)
                    </th>
                    <th className="p-4 text-center">System Status Flags</th>
                    <th className="p-4">IPFS Fingerprint Seal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {vouchers.map((v) => (
                    <tr
                      key={v.uuid}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="p-4 font-bold text-slate-900">
                        {v.voucherNo}
                      </td>
                      <td className="p-4 font-mono text-slate-500 text-[11px]">
                        {v.uuid}
                      </td>
                      <td className="p-4 whitespace-nowrap">{v.date}</td>
                      <td className="p-4 text-right font-bold text-emerald-700">
                        {v.drAmount.toLocaleString()}.00
                      </td>
                      <td className="p-4 text-right font-bold text-indigo-700">
                        {v.crAmount.toLocaleString()}.00
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            v.status === "CONFIRMED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800 animate-pulse"
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[11px] max-w-[150px] truncate">
                        {v.ipfsHash ? (
                          <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            {v.ipfsHash}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">
                            Unanchored Payload
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {vouchers.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        className="p-8 text-center text-slate-400 italic bg-slate-50/30"
                      >
                        No active blocks identified on the current sandbox
                        staging ledger channel context network.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
