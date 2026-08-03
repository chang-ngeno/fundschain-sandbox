import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// =========================================================================
// DASHBOARD VIEW (v4.1 - EXACT IMAGE REPLICA)
// =========================================================================
function DashboardView({ onQuickAction, vouchers }) {
  // Chart 1 Data: Budget vs Actual Expenditure
  const budgetVsActualData = [
    { name: "Budget", amount: 18.45, fill: "#1d4ed8" },
    { name: "Actual", amount: 2.31, fill: "#16a34a" },
  ];

  // Chart 2 Data: Monthly Disbursement
  const trendData = [
    { month: "Jan", amount: 380 },
    { month: "Feb", amount: 520 },
    { month: "Mar", amount: 680 },
    { month: "Apr", amount: 950 },
    { month: "May", amount: 890 },
    { month: "Jun", amount: 1300 },
  ];

  // Chart 3 Data: Component Breakdown
  const componentData = [
    {
      name: "Component 1\nSustainable Land &\nWater Management\n38.6%",
      value: 38.6,
      color: "#1d4ed8",
    },
    {
      name: "Component 2\nMarket Access & Value\nChains\n27.4%",
      value: 27.4,
      color: "#16a34a",
    },
    {
      name: "Component 3\nInstitutional Strengthening\n& Policy Support\n18.9%",
      value: 18.9,
      color: "#ea580c",
    },
    {
      name: "Component 4\nProject Management\n15.1%",
      value: 15.1,
      color: "#9333ea",
    },
  ];

  // Chart 4 Data: County Expenditure
  const countyData = [
    { county: "Nakuru", amount: 456 },
    { county: "Kisii", amount: 389 },
    { county: "Meru", amount: 312 },
    { county: "Uasin Gishu", amount: 298 },
    { county: "Machakos", amount: 275 },
    { county: "Others", amount: 583 },
  ];

  // Quick Action Dynamic Config Map
  const QUICK_ACTION_CONFIG = {
    "Create Payment": {
      endpoint: "/api/vouchers",
      fields: [
        {
          name: "description",
          label: "Payment Description",
          placeholder: "e.g. Payment to Supplier",
        },
        { name: "amount", label: "Amount (KES)", placeholder: "25430000" },
      ],
    },
    "Create Contract": {
      endpoint: "/api/contracts",
      fields: [
        {
          name: "title",
          label: "Contract Title",
          placeholder: "e.g. Solar Pump Installation",
        },
        {
          name: "vendor",
          label: "Vendor / Contractor",
          placeholder: "e.g. Apex Water Ltd",
        },
        {
          name: "amount",
          label: "Contract Value (KES)",
          placeholder: "78500000",
        },
      ],
    },
    "Create Disbursement": {
      endpoint: "/api/disbursements",
      fields: [
        {
          name: "source",
          label: "Source Account",
          placeholder: "e.g. IBRD Special Account",
        },
        {
          name: "amount",
          label: "Disbursement Amount (KES)",
          placeholder: "120000000",
        },
      ],
    },
    "Record Receipt": {
      endpoint: "/api/vouchers",
      fields: [
        {
          name: "description",
          label: "Receipt Memo",
          placeholder: "e.g. Co-financing Contribution",
        },
        {
          name: "amount",
          label: "Received Amount (KES)",
          placeholder: "5000000",
        },
      ],
    },
    "New Procurement": {
      endpoint: "/api/contracts",
      fields: [
        {
          name: "title",
          label: "Procurement Item",
          placeholder: "e.g. High-Capacity Tractors",
        },
        {
          name: "vendor",
          label: "Selected Supplier",
          placeholder: "e.g. AgriMach Machinery",
        },
        {
          name: "amount",
          label: "Estimated Budget (KES)",
          placeholder: "45000000",
        },
      ],
    },
    "Add Supplier": {
      endpoint: "/api/suppliers",
      fields: [
        {
          name: "name",
          label: "Supplier / Business Name",
          placeholder: "e.g. Kenya Seed Co-op",
        },
        {
          name: "category",
          label: "Supply Category",
          placeholder: "e.g. Seed & Fertilizers",
        },
      ],
    },
    "Add Beneficiary": {
      endpoint: "/api/beneficiaries",
      fields: [
        {
          name: "groupName",
          label: "Community / Group Name",
          placeholder: "e.g. Nakuru Farmers Alliance",
        },
        {
          name: "county",
          label: "County Location",
          placeholder: "e.g. Nakuru",
        },
        { name: "members", label: "Number of Members", placeholder: "250" },
      ],
    },
    "Upload Document": {
      endpoint: "/api/documents",
      fields: [
        {
          name: "title",
          label: "Document Name",
          placeholder: "e.g. Q2 Interim Audit PDF",
        },
        { name: "type", label: "File Type", placeholder: "e.g. PDF / DOCX" },
      ],
    },
  };

  return (
    <div className="space-y-4">
      {/* PROJECT TITLE & METADATA BAR */}
      <div className="bg-white p-3 rounded shadow-xs border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-bold text-slate-900">
              Kenya Climate Smart Agriculture Project (KCSAP)
            </h1>
            <span className="bg-emerald-500 text-white font-bold text-[9px] px-2 py-0.5 rounded uppercase">
              ACTIVE
            </span>
          </div>
          <div className="text-[10px] text-slate-500 flex flex-wrap gap-4 mt-1">
            <span>
              Country: <strong className="text-slate-700">Kenya</strong>
            </span>
            <span>
              Project ID: <strong className="text-slate-700">P175248</strong>
            </span>
            <span>
              Implementing Agency:{" "}
              <strong className="text-slate-700">
                Ministry of Agriculture & Livestock Development
              </strong>
            </span>
            <span>
              Financing:{" "}
              <strong className="text-slate-700">IBRD Loan-9580-KE</strong>
            </span>
            <span>
              Closing Date:{" "}
              <strong className="text-slate-700">30 Jun 2029</strong>
            </span>
          </div>
        </div>

        <div className="flex space-x-6 text-[10px] border-t md:border-t-0 pt-2 md:pt-0 mt-2 md:mt-0 border-slate-200">
          <div>
            <div className="text-slate-400">Reporting Period</div>
            <div className="font-bold text-slate-800 flex items-center space-x-1">
              <span>📅</span> <span>Q2 2026 (Jan - Jun 2026)</span>
            </div>
          </div>
          <div>
            <div className="text-slate-400">Last Login</div>
            <div className="font-bold text-slate-800 flex items-center space-x-1">
              <span>🕒</span> <span>20 Jun 2026 10:30 AM EAT</span>
            </div>
          </div>
        </div>
      </div>

      {/* TOP 6 KPI METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          {
            title: "Total Budget (Approved)",
            val: "KES 18.45 Bn",
            icon: "📊",
            color: "border-blue-500",
          },
          {
            title: "Total Funds Received",
            val: "KES 6.72 Bn",
            icon: "🏦",
            color: "border-emerald-500",
          },
          {
            title: "Total Commitments",
            val: "KES 4.21 Bn",
            icon: "📜",
            color: "border-amber-500",
          },
          {
            title: "Total Expenditure",
            val: "KES 2.31 Bn",
            icon: "💳",
            color: "border-purple-500",
          },
          {
            title: "Available Balance",
            val: "KES 16.14 Bn",
            icon: "⚖️",
            color: "border-teal-500",
          },
          {
            title: "Utilization",
            val: "12.52%",
            icon: "📈",
            color: "border-rose-500",
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className={`bg-white p-2.5 rounded border-l-4 ${kpi.color} shadow-xs border border-slate-200 flex items-center space-x-3`}
          >
            <div className="text-2xl">{kpi.icon}</div>
            <div>
              <div className="text-[9px] text-slate-400 font-medium leading-tight">
                {kpi.title}
              </div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">
                {kpi.val}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CHARTS GRID (2x2) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Chart 1: Budget vs Actual */}
        <div className="bg-white p-3 rounded shadow-xs border border-slate-200">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2">
            BUDGET VS ACTUAL EXPENDITURE
          </h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={budgetVsActualData}
                margin={{ top: 15, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis dataKey="name" stroke="#888888" fontSize={9} />
                <YAxis
                  stroke="#888888"
                  fontSize={9}
                  tickFormatter={(v) => `${v}B`}
                />
                <Tooltip
                  formatter={(value) => [`KES ${value} Billion`, "Amount"]}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {budgetVsActualData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Monthly Disbursement Trend */}
        <div className="bg-white p-3 rounded shadow-xs border border-slate-200">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2">
            MONTHLY DISBURSEMENT TREND (KES)
          </h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis dataKey="month" stroke="#888888" fontSize={9} />
                <YAxis
                  stroke="#888888"
                  fontSize={9}
                  tickFormatter={(v) => `${v}M`}
                />
                <Tooltip formatter={(val) => [`KES ${val}M`, "Disbursement"]} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Expenditure By Component */}
        <div className="bg-white p-3 rounded shadow-xs border border-slate-200">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2">
            EXPENDITURE BY COMPONENT
          </h3>
          <div className="h-44 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={componentData}
                  dataKey="value"
                  innerRadius={28}
                  outerRadius={48}
                  paddingAngle={2}
                >
                  {componentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val}%`, "Allocation"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Expenditure By County */}
        <div className="bg-white p-3 rounded shadow-xs border border-slate-200">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2">
            EXPENDITURE BY COUNTY (TOP 6)
          </h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={countyData}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  stroke="#888888"
                  fontSize={9}
                  tickFormatter={(v) => `${v}M`}
                />
                <YAxis
                  dataKey="county"
                  type="category"
                  stroke="#888888"
                  fontSize={9}
                  width={60}
                />
                <Tooltip formatter={(val) => [`KES ${val} Million`, "Spent"]} />
                <Bar dataKey="amount" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* STATS COUNTER BAR */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: "Contracts", count: "156", icon: "📜", path: "/contracts" },
          { label: "Payments", count: "842", icon: "💳", path: "/payments" },
          { label: "Suppliers", count: "128", icon: "👥", path: "/suppliers" },
          {
            label: "Beneficiaries",
            count: "22,450",
            icon: "👨‍👩‍👧",
            path: "/beneficiaries",
          },
          { label: "Pending Tasks", count: "23", icon: "⏱️", path: "/tasks" },
          { label: "Alerts", count: "9", icon: "⚠️", path: "/audit" },
        ].map((st, i) => (
          <div
            key={i}
            className="bg-white p-2 rounded shadow-xs border border-slate-200 flex items-center justify-between"
          >
            <div>
              <div className="text-[9px] text-slate-400 font-semibold">
                {st.label}
              </div>
              <div className="text-sm font-bold text-slate-900">{st.count}</div>
              <Link
                to={st.path}
                className="text-[8px] text-blue-600 hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="text-xl">{st.icon}</div>
          </div>
        ))}
      </div>

      {/* BOTTOM CARDS: RECENT TRANSACTIONS, COMPLIANCE STATUS, BLOCKCHAIN VERIFICATION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. Recent Transactions (Restored Description & Date) */}
        <div className="bg-white p-3 rounded shadow-xs border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase">
              RECENT TRANSACTIONS
            </h3>
            <Link
              to="/payments"
              className="text-[9px] text-blue-600 hover:underline"
            >
              View all transactions
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[9px]">
              <thead>
                <tr className="border-b text-slate-400 font-semibold">
                  <th className="py-1">Type</th>
                  <th className="py-1">Ref No.</th>
                  <th className="py-1">Description</th>
                  <th className="py-1">Amount (KES)</th>
                  <th className="py-1">Date</th>
                  <th className="py-1">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[9px]">
                {[
                  {
                    type: "Payment",
                    ref: "PAY-2026-0842",
                    desc: "Payment to Supplier",
                    amt: "25,430,000",
                    date: "19 Jun 2026",
                    status: "Approved",
                    statusBg: "bg-emerald-100 text-emerald-800",
                  },
                  {
                    type: "Disbursement",
                    ref: "DISB-2026-0336",
                    desc: "Withdrawal Application",
                    amt: "120,000,000",
                    date: "18 Jun 2026",
                    status: "Approved",
                    statusBg: "bg-emerald-100 text-emerald-800",
                  },
                  {
                    type: "Commitment",
                    ref: "COM-2026-0154",
                    desc: "Contract Commitment",
                    amt: "78,500,000",
                    date: "17 Jun 2026",
                    status: "Committed",
                    statusBg: "bg-amber-100 text-amber-800",
                  },
                  {
                    type: "Payment",
                    ref: "PAY-2026-0841",
                    desc: "Advance Payment",
                    amt: "15,000,000",
                    date: "16 Jun 2026",
                    status: "Approved",
                    statusBg: "bg-emerald-100 text-emerald-800",
                  },
                  {
                    type: "Invoice",
                    ref: "INV-2026-0575",
                    desc: "Supplier Invoice",
                    amt: "12,750,000",
                    date: "16 Jun 2026",
                    status: "Verified",
                    statusBg: "bg-blue-100 text-blue-800",
                  },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-1.5">{row.type}</td>
                    <td className="py-1.5 font-bold text-blue-600">
                      {row.ref}
                    </td>
                    <td className="py-1.5 text-slate-600">{row.desc}</td>
                    <td className="py-1.5 font-mono">{row.amt}</td>
                    <td className="py-1.5 text-slate-500 whitespace-nowrap">
                      {row.date}
                    </td>
                    <td className="py-1.5">
                      <span
                        className={`${row.statusBg} text-[8px] px-1.5 py-0.5 rounded font-bold`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Compliance Status (With Timestamps) */}
        <div className="bg-white p-3 rounded shadow-xs border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase">
              COMPLIANCE STATUS
            </h3>
            <Link
              to="/audit"
              className="text-[9px] text-blue-600 hover:underline"
            >
              View compliance dashboard
            </Link>
          </div>
          <div className="space-y-2 text-[10px]">
            {[
              {
                title: "Interim Financial Report (Q2 2026)",
                date: "Submitted on 20 Jun 2026",
              },
              {
                title: "Statement of Expenditure (Q2 2026)",
                date: "Submitted on 20 Jun 2026",
              },
              {
                title: "Designated Account Reconciliation (May 2026)",
                date: "Submitted on 15 Jun 2026",
              },
              {
                title: "Procurement Plan (FY 2026)",
                date: "Approved on 10 Jan 2026",
              },
              {
                title: "Internal Audit (Q2 2026)",
                date: "Report issued on 18 Jun 2026",
              },
              {
                title: "External Audit (FY 2025)",
                date: "Report issued on 30 Apr 2026",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between border-b pb-1"
              >
                <div className="flex items-start space-x-1.5">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <div>
                    <div className="font-semibold text-slate-800 text-[10px]">
                      {item.title}
                    </div>
                    <div className="text-[8px] text-slate-400">{item.date}</div>
                  </div>
                </div>
                <span className="text-emerald-600 font-bold text-[9px]">
                  Compliant
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Blockchain Verification (3D Graphic Included) */}
        <div className="bg-white p-3 rounded shadow-xs border border-slate-200 relative overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase">
              BLOCKCHAIN VERIFICATION
            </h3>
            <Link
              to="/audit"
              className="text-[9px] text-blue-600 hover:underline"
            >
              View blockchain explorer
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1 text-[9px] font-mono flex-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Last Verified Tx:</span>
                <span className="text-blue-600 font-bold">
                  TXN-2026-00074892
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction Hash:</span>
                <span className="text-slate-700">0x7f3a...9be21c</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Block Number:</span>
                <span className="text-slate-700">18,923,456</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-slate-700">20 Jun 2026 10:25:30 AM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Smart Contract ID:</span>
                <span className="text-slate-700">WB-FUNDSCHAIN-01</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Digital Signature:</span>
                <span className="text-emerald-600 font-bold">Verified</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Verification Status:</span>
                <span className="text-emerald-600 font-bold">Confirmed</span>
              </div>
            </div>

            {/* Blockchain 3D Isometric Cube Visual */}
            <div className="hidden sm:flex flex-col items-center justify-center pl-3">
              <div className="w-12 h-12 relative flex items-center justify-center">
                <div className="absolute inset-0 bg-blue-100 rounded-lg rotate-12 opacity-50"></div>
                <div className="absolute inset-0 bg-blue-500/20 rounded-lg -rotate-6"></div>
                <span className="text-2xl relative z-10">🧊</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACCESS ACTION TOOLBAR */}
      <div className="bg-white p-3 rounded shadow-xs border border-slate-200">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          QUICK ACCESS
        </div>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2 text-center text-[10px]">
          {[
            { id: "Create Payment", label: "Create Payment", icon: "💳" },
            { id: "Create Contract", label: "Create Contract", icon: "📜" },
            {
              id: "Create Disbursement",
              label: "Create Disbursement",
              icon: "🏦",
            },
            { id: "Record Receipt", label: "Record Receipt", icon: "🧾" },
            { id: "New Procurement", label: "New Procurement", icon: "🛒" },
            { id: "Add Supplier", label: "Add Supplier", icon: "👥" },
            { id: "Add Beneficiary", label: "Add Beneficiary", icon: "👨‍👩‍👧" },
            { id: "Upload Document", label: "Upload Document", icon: "📤" },
            { id: "Generate IFR", label: "Generate IFR", icon: "📊" },
            { id: "Reports Dashboard", label: "Reports Dashboard", icon: "📈" },
          ].map((act) => (
            <button
              key={act.id}
              onClick={() => onQuickAction(act.id)}
              className="p-1.5 border border-slate-200 hover:border-blue-500 rounded bg-slate-50 hover:bg-blue-50 transition-all flex flex-col items-center justify-center space-y-1 shadow-2xs"
            >
              <span className="text-base">{act.icon}</span>
              <span className="text-[9px] font-semibold text-slate-700 leading-tight">
                {act.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// GENERIC DYNAMIC RESOURCE PAGE
// =========================================================================
function ResourcePage({ title, endpoint, icon }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/${endpoint}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(Array.isArray(resData) ? resData : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [endpoint]);

  return (
    <div className="bg-white p-4 rounded shadow-xs border border-slate-200 space-y-3">
      <div className="flex items-center space-x-2 border-b pb-2">
        <span className="text-xl">{icon}</span>
        <h2 className="text-sm font-bold text-slate-800 uppercase">
          {title} Ledger & Records
        </h2>
      </div>

      {loading ? (
        <div className="text-slate-400 py-8 text-center text-xs">
          Fetching live ledger records...
        </div>
      ) : data.length === 0 ? (
        <div className="text-slate-400 py-8 text-center text-xs">
          No entries currently found under {title}.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b bg-slate-50 text-slate-500">
                {Object.keys(data[0]).map((key) => (
                  <th key={key} className="p-2 capitalize">
                    {key.replace(/_/g, " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  {Object.values(item).map((val, i) => (
                    <td key={i} className="p-2 font-mono text-[11px]">
                      {String(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// MAIN ROUTER & APP WRAPPER (v4.1 COMPLETE ROUTING TABLE)
// =========================================================================
export default function App() {
  const [vouchers, setVouchers] = useState([]);
  const [systemAlert, setSystemAlert] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [quickInput, setQuickInput] = useState({});

  useEffect(() => {
    refreshLedgerData();
  }, []);

  const refreshLedgerData = () => {
    fetch(`${API_BASE_URL}/api/vouchers`)
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setVouchers(data))
      .catch(() =>
        setSystemAlert({
          type: "danger",
          message: "Core ledger service connection offline.",
        }),
      );
  };

  const handleQuickAction = async (actionId) => {
    setSystemAlert(null);
    switch (actionId) {
      case "Generate IFR":
        try {
          const res = await fetch(`${API_BASE_URL}/api/reports/ifr`);
          const data = await res.json();
          setSystemAlert({
            type: "success",
            message: `📊 IFR Generated for ${data.period}! Total Expenditure: KES ${data.totalSpent?.toLocaleString()} | Stamp: ${data.stamp}`,
          });
        } catch {
          setSystemAlert({
            type: "danger",
            message: "Failed to generate IFR.",
          });
        }
        break;
      default:
        setActiveModal(actionId);
        break;
    }
  };

  const submitQuickAction = async (endpoint, payload) => {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setSystemAlert({ type: "success", message: data.message });
        setActiveModal(null);
        setQuickInput({});
        refreshLedgerData();
      } else {
        setSystemAlert({
          type: "danger",
          message: data.message || "Action failed.",
        });
      }
    } catch {
      setSystemAlert({ type: "danger", message: "Backend connection error." });
    }
  };

  // Restored All 16 Sidebar Items from Mockup
  const navItems = [
    { id: "DASHBOARD", label: "DASHBOARD", path: "/", icon: "🏠" },
    { id: "MY_TASKS", label: "My Tasks", path: "/tasks", icon: "⏱️", badge: 5 },
    { id: "PROJECTS", label: "Projects", path: "/projects", icon: "⚛️" },
    { id: "BUDGET", label: "Budget", path: "/budget", icon: "📊" },
    {
      id: "PROCUREMENT",
      label: "Procurement",
      path: "/procurement",
      icon: "🛒",
    },
    { id: "CONTRACTS", label: "Contracts", path: "/contracts", icon: "📜" },
    { id: "PAYMENTS", label: "Payments", path: "/payments", icon: "💳" },
    {
      id: "DISBURSEMENTS",
      label: "Disbursements",
      path: "/disbursements",
      icon: "🏦",
    },
    { id: "SUPPLIERS", label: "Suppliers", path: "/suppliers", icon: "👥" },
    {
      id: "BENEFICIARIES",
      label: "Beneficiaries",
      path: "/beneficiaries",
      icon: "👨‍👩‍👧",
    },
    { id: "REPORTS", label: "Reports", path: "/reports", icon: "📈" },
    { id: "ACCOUNTING", label: "Accounting", path: "/vouchers", icon: "🧾" },
    { id: "AUDIT", label: "Audit & Control", path: "/audit", icon: "🛡️" },
    { id: "DOCUMENTS", label: "Documents", path: "/documents", icon: "📁" },
    { id: "ANALYTICS", label: "Analytics", path: "/analytics", icon: "📊" },
    {
      id: "SYSTEM_SETTINGS",
      label: "System Settings",
      path: "/settings",
      icon: "⚙️",
    },
  ];

  return (
    <Router>
      <div className="flex h-screen bg-[#f0f3f8] text-slate-800 font-sans text-xs antialiased overflow-hidden">
        {/* LEFT NAVIGATION SIDEBAR */}
        <aside className="w-56 bg-[#001737] text-slate-300 flex flex-col shrink-0 justify-between">
          <div>
            <div className="p-4 border-b border-slate-800 flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center font-black text-white text-xs">
                🌐
              </div>
              <div>
                <div className="font-bold text-white tracking-wider text-xs">
                  THE WORLD BANK
                </div>
                <div className="text-[9px] text-blue-400 font-semibold">
                  FundsChain Platform
                </div>
              </div>
            </div>

            <nav className="p-2 space-y-0.5 text-[11px]">
              {navItems.map((item) => (
                <SidebarNavLink key={item.path} item={item} />
              ))}
            </nav>
          </div>

          <div className="p-3 text-[10px] text-slate-400 border-t border-slate-800 space-y-1">
            <div className="font-bold text-slate-300">THE WORLD BANK</div>
            <div>1818 H Street, NW</div>
            <div>Washington, DC 20433 USA</div>
            <div className="text-slate-500 text-[9px] pt-1">v4.1</div>
          </div>
        </aside>

        {/* MAIN VIEW AREA */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* HEADER */}
          <header className="bg-[#001737] text-white px-6 py-2 flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <span className="font-bold text-sm tracking-wide">
                FundsChain
              </span>
              <span className="text-[10px] text-slate-400">
                Financial Management & Transparency Platform
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <select className="bg-[#0a2347] border border-slate-700 text-white text-xs px-3 py-1 rounded focus:outline-none">
                <option>All Projects</option>
              </select>
              <button className="text-slate-300 text-sm">❓</button>
              <div className="relative">
                <span className="text-sm">🔔</span>
                <span className="absolute -top-1 -right-1 bg-red-500 text-[9px] rounded-full px-1 font-bold">
                  6
                </span>
              </div>
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-700">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  AK
                </div>
                <div>
                  <div className="font-bold leading-tight text-[11px]">
                    Anne Kimani
                  </div>
                  <div className="text-[9px] text-slate-400">
                    Financial Specialist
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* ALERT NOTIFICATIONS */}
          {systemAlert && (
            <div
              className={`px-6 py-1.5 text-xs flex justify-between items-center ${
                systemAlert.type === "success"
                  ? "bg-emerald-100 text-emerald-900"
                  : "bg-rose-100 text-rose-900"
              }`}
            >
              <span>{systemAlert.message}</span>
              <button
                onClick={() => setSystemAlert(null)}
                className="font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* MAIN SCROLL AREA */}
          <main className="flex-1 overflow-y-auto p-4">
            <Routes>
              <Route
                path="/"
                element={
                  <DashboardView
                    onQuickAction={handleQuickAction}
                    vouchers={vouchers}
                  />
                }
              />
              <Route
                path="/tasks"
                element={
                  <ResourcePage title="My Tasks" endpoint="tasks" icon="⏱️" />
                }
              />
              <Route
                path="/projects"
                element={
                  <ResourcePage
                    title="Projects"
                    endpoint="projects"
                    icon="⚛️"
                  />
                }
              />
              <Route
                path="/budget"
                element={
                  <ResourcePage
                    title="Budget Ceilings & Allocations"
                    endpoint="projects"
                    icon="📊"
                  />
                }
              />
              <Route
                path="/procurement"
                element={
                  <ResourcePage
                    title="Procurement Plan & Tenders"
                    endpoint="contracts"
                    icon="🛒"
                  />
                }
              />
              <Route
                path="/contracts"
                element={
                  <ResourcePage
                    title="Contracts"
                    endpoint="contracts"
                    icon="📜"
                  />
                }
              />
              <Route
                path="/payments"
                element={
                  <ResourcePage
                    title="Payments"
                    endpoint="payments"
                    icon="💳"
                  />
                }
              />
              <Route
                path="/disbursements"
                element={
                  <ResourcePage
                    title="Disbursements"
                    endpoint="disbursements"
                    icon="🏦"
                  />
                }
              />
              <Route
                path="/suppliers"
                element={
                  <ResourcePage
                    title="Suppliers"
                    endpoint="suppliers"
                    icon="👥"
                  />
                }
              />
              <Route
                path="/beneficiaries"
                element={
                  <ResourcePage
                    title="Beneficiaries"
                    endpoint="beneficiaries"
                    icon="👨‍👩‍👧"
                  />
                }
              />
              <Route
                path="/reports"
                element={
                  <ResourcePage
                    title="Financial & IFR Reports"
                    endpoint="vouchers"
                    icon="📈"
                  />
                }
              />
              <Route
                path="/vouchers"
                element={
                  <ResourcePage
                    title="Accounting & Vouchers"
                    endpoint="vouchers"
                    icon="🧾"
                  />
                }
              />
              <Route
                path="/audit"
                element={
                  <ResourcePage
                    title="Audit Trail & Blockchain Logs"
                    endpoint="vouchers"
                    icon="🛡️"
                  />
                }
              />
              <Route
                path="/documents"
                element={
                  <ResourcePage
                    title="Document Vault & IPFS Anchors"
                    endpoint="vouchers"
                    icon="📁"
                  />
                }
              />
              <Route
                path="/analytics"
                element={
                  <ResourcePage
                    title="Analytics & Trend Reports"
                    endpoint="vouchers"
                    icon="📊"
                  />
                }
              />
              <Route
                path="/settings"
                element={
                  <ResourcePage
                    title="System Settings & Governance"
                    endpoint="projects"
                    icon="⚙️"
                  />
                }
              />
            </Routes>
          </main>
        </div>

        {/* DYNAMIC ACTION MODAL */}
        {activeModal && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl border border-slate-300 w-full max-w-md p-4 space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-bold text-xs uppercase text-slate-800">
                  Execute Action: {activeModal}
                </h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className="font-bold text-slate-400"
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                placeholder="Enter Reference / Amount / Title"
                className="w-full border p-2 rounded text-xs"
                onChange={(e) =>
                  setQuickInput({
                    title: e.target.value,
                    amount: e.target.value,
                  })
                }
              />
              <button
                onClick={() => submitQuickAction("/api/contracts", quickInput)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded text-xs uppercase"
              >
                Submit Record to Core Ledger
              </button>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

// Active Nav Link Component
function SidebarNavLink({ item }) {
  const location = useLocation();
  const isActive = location.pathname === item.path;

  return (
    <Link
      to={item.path}
      className={`w-full flex items-center justify-between px-3 py-1.5 rounded transition-colors ${
        isActive
          ? "bg-blue-600 text-white font-bold"
          : "hover:bg-[#0a2347] text-slate-300"
      }`}
    >
      <div className="flex items-center space-x-2">
        <span className="text-xs">{item.icon}</span>
        <span>{item.label}</span>
      </div>
      {item.badge && (
        <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
          {item.badge}
        </span>
      )}
    </Link>
  );
}
