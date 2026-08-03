import express from "express";
import cors from "cors";
import crypto from "crypto";
import pg from "pg";

const { Pool } = pg;
const app = express();

// -----------------------------------------------------------------------------
// CORS & Middleware Setup
// -----------------------------------------------------------------------------
const corsOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  process.env.ALLOWED_ORIGIN || "http://localhost:3000",
  "http://localhost:8080",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Sandbox-Role", "X-Sandbox-User-ID"],
    credentials: true,
  })
);

app.use(express.json());

// Sandbox Role Context Middleware
app.use((req, res, next) => {
  req.sandboxUser = {
    id: req.headers["x-sandbox-user-id"] || "USR-DEFAULT-001",
    role: req.headers["x-sandbox-role"] || "PROJECT_ACCOUNTANT",
  };
  next();
});

// -----------------------------------------------------------------------------
// Database Configuration & Initialization
// -----------------------------------------------------------------------------
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || "fundschain_db",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres123",
    });

const BUDGET_ALLOCATIONS = {
  "COMP-01": 35000000.0,
  "COMP-02": 15000000.0,
  "COMP-03": 10000000.0,
  "COMP-04": 5000000.0,
};

const initDatabase = async () => {
  const createTableQuery = `
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE IF NOT EXISTS vouchers (
      uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      voucher_no VARCHAR(50) NOT NULL,
      date DATE NOT NULL,
      component_code VARCHAR(20) NOT NULL,
      dr_component TEXT NOT NULL,
      dr_amount NUMERIC(15, 2) NOT NULL,
      cr_account TEXT NOT NULL,
      cr_amount NUMERIC(15, 2) NOT NULL,
      status VARCHAR(30) NOT NULL,
      created_role VARCHAR(50),
      ipfs_hash VARCHAR(100),
      digital_signature VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      contract_no VARCHAR(50) NOT NULL,
      title TEXT NOT NULL,
      vendor VARCHAR(150) NOT NULL,
      amount NUMERIC(15, 2) NOT NULL,
      status VARCHAR(30) DEFAULT 'COMMITTED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS disbursements (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      ref_no VARCHAR(50) NOT NULL,
      source_account TEXT NOT NULL,
      amount NUMERIC(15, 2) NOT NULL,
      status VARCHAR(30) DEFAULT 'APPROVED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      supplier_id VARCHAR(50) NOT NULL,
      name VARCHAR(150) NOT NULL,
      category VARCHAR(100) NOT NULL,
      status VARCHAR(30) DEFAULT 'VERIFIED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS beneficiaries (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      ben_id VARCHAR(50) NOT NULL,
      group_name VARCHAR(150) NOT NULL,
      county VARCHAR(100) NOT NULL,
      member_count INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      action VARCHAR(50) NOT NULL,
      actor VARCHAR(100) NOT NULL,
      role VARCHAR(50) NOT NULL,
      voucher_id UUID,
      tx_hash VARCHAR(100) NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(createTableQuery);
    console.log("PostgreSQL Ledger Engine Schema initialized successfully.");
  } catch (err) {
    console.error("Critical: Database migration hook failed.", err);
  }
};
initDatabase();

// -----------------------------------------------------------------------------
// Core Vouchers & Accounting Endpoints
// -----------------------------------------------------------------------------

// 1. Post Voucher
app.post("/api/vouchers", async (req, res) => {
  const { voucherNo, date, componentCode, drComponent, drAmount, crAccount, crAmount } = req.body;

  const balanceDelta = parseFloat(drAmount) - parseFloat(crAmount);
  if (Math.abs(balanceDelta) !== 0) {
    return res.status(400).json({
      errorCode: "EX_DOUBLE_ENTRY_IMBALANCE",
      message: `Accounting Validation Failure: Debit and Credit distributions must resolve to 0.00 exactly. Current Delta: ${balanceDelta.toFixed(2)} KES.`,
    });
  }

  const selectedComponent = componentCode || "COMP-02";
  const maxLimit = BUDGET_ALLOCATIONS[selectedComponent] || 15000000.0;

  try {
    const spentQuery = `
      SELECT COALESCE(SUM(dr_amount), 0) as total_spent 
      FROM vouchers 
      WHERE component_code = $1 AND status IN ('CONFIRMED', 'APPROVED')
    `;
    const spentRes = await pool.query(spentQuery, [selectedComponent]);
    const totalSpent = parseFloat(spentRes.rows[0].total_spent);

    if (totalSpent + parseFloat(drAmount) > maxLimit) {
      return res.status(400).json({
        errorCode: "EX_STRICT_BUDGET_CAP_EXCEEDED",
        message: `Transaction Blocked: Requested amount of KES ${parseFloat(drAmount).toLocaleString()} exceeds AWPB ceiling for ${selectedComponent}. Available Room: KES ${(maxLimit - totalSpent).toLocaleString()}.`,
      });
    }

    const uuid = crypto.randomUUID();
    const insertQuery = `
      INSERT INTO vouchers (uuid, voucher_no, date, component_code, dr_component, dr_amount, cr_account, cr_amount, status, created_role)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const values = [
      uuid,
      voucherNo || `NAVCP-V-${Math.floor(100 + Math.random() * 900)}`,
      date || new Date().toISOString().split("T")[0],
      selectedComponent,
      drComponent || "Component 2 (Agricultural Finance)",
      parseFloat(drAmount),
      crAccount || "Kenya CBK Designated Account",
      parseFloat(crAmount),
      "PENDING_QUEUE",
      req.sandboxUser.role,
    ];

    const result = await pool.query(insertQuery, values);

    // Write Audit Log
    const logHash = crypto.createHash("sha256").update(JSON.stringify(result.rows[0])).digest("hex");
    await pool.query(
      `INSERT INTO audit_logs (id, action, actor, role, voucher_id, tx_hash) VALUES ($1, $2, $3, $4, $5, $6)`,
      [crypto.randomUUID(), "VOUCHER_CREATED", req.sandboxUser.id, req.sandboxUser.role, uuid, logHash]
    );

    return res.status(201).json({ message: "Voucher validation successful", record: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Database infrastructure write fault." });
  }
});

// 2. Approve Voucher (Segregation of Duties)
app.post("/api/vouchers/:uuid/approve", async (req, res) => {
  const { uuid } = req.params;

  try {
    const voucherRes = await pool.query("SELECT * FROM vouchers WHERE uuid = $1", [uuid]);
    if (voucherRes.rows.length === 0) {
      return res.status(404).json({ message: "Target Voucher UUID not found." });
    }

    const voucher = voucherRes.rows[0];

    if (voucher.created_role === req.sandboxUser.role) {
      return res.status(403).json({
        errorCode: "SOD_VIOLATION",
        message: `Segregation of Duties Conflict: Role '${req.sandboxUser.role}' created this voucher and cannot approve it. Switch roles in top bar.`,
      });
    }

    const approvalHash = crypto.createHash("sha256").update(`${uuid}-${req.sandboxUser.id}-${Date.now()}`).digest("hex");

    await pool.query(
      "UPDATE vouchers SET status = 'CONFIRMED', digital_signature = $1 WHERE uuid = $2",
      [`sig_0x${approvalHash.substring(0, 16)}`, uuid]
    );

    await pool.query(
      `INSERT INTO audit_logs (id, action, actor, role, voucher_id, tx_hash) VALUES ($1, $2, $3, $4, $5, $6)`,
      [crypto.randomUUID(), "VOUCHER_APPROVED", req.sandboxUser.id, req.sandboxUser.role, uuid, approvalHash]
    );

    return res.json({ success: true, message: "Voucher approved and posted to core ledger." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Read Vouchers
app.get("/api/vouchers", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM vouchers ORDER BY created_at DESC");
    const formatted = result.rows.map((row) => ({
      uuid: row.uuid,
      voucherNo: row.voucher_no,
      date: row.date.toISOString().split("T")[0],
      componentCode: row.component_code,
      drComponent: row.dr_component,
      drAmount: parseFloat(row.dr_amount),
      crAccount: row.cr_account,
      crAmount: parseFloat(row.cr_amount),
      status: row.status,
      createdRole: row.created_role,
      ipfsHash: row.ipfs_hash,
      digitalSignature: row.digital_signature,
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Anchor Document
app.post("/api/vouchers/:uuid/anchor", async (req, res) => {
  const { uuid } = req.params;
  const { fileName } = req.body;

  try {
    const mockFileContent = `${fileName || "invoice"}_salt_${Date.now()}`;
    const computedHash = "Qm" + crypto.createHash("sha256").update(mockFileContent).digest("hex").substring(0, 44);
    const digitalSignature = "sig_0x" + crypto.randomBytes(8).toString("hex");

    await pool.query(
      "UPDATE vouchers SET ipfs_hash = $1, digital_signature = $2, status = 'CONFIRMED' WHERE uuid = $3",
      [computedHash, digitalSignature, uuid]
    );

    res.json({ message: "Attached & Signed", ipfsHash: computedHash, signature: digitalSignature });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// Resource Specific REST & Navigation Route Handlers
// -----------------------------------------------------------------------------

// Projects
app.get("/api/projects", async (req, res) => {
  res.json([
    {
      id: "P175248",
      name: "Kenya Climate Smart Agriculture Project (KCSAP)",
      country: "Kenya",
      status: "ACTIVE",
      budget: 18450000000,
    },
  ]);
});

// Tasks
app.get("/api/tasks", async (req, res) => {
  res.json([
    { id: "TSK-101", title: "Approve Payment PAY-2026-0842", priority: "HIGH", status: "PENDING" },
    { id: "TSK-102", title: "Verify Q2 IFR Report Documentation", priority: "MEDIUM", status: "IN_PROGRESS" },
    { id: "TSK-103", title: "Review Contract Proposal COM-2026-0154", priority: "LOW", status: "PENDING" },
  ]);
});

// Contracts (Read & Create)
app.get("/api/contracts", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM contracts ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/contracts", async (req, res) => {
  const { title, vendor, amount } = req.body;
  try {
    const contractNo = `CTR-${Math.floor(1000 + Math.random() * 9000)}`;
    const result = await pool.query(
      "INSERT INTO contracts (contract_no, title, vendor, amount) VALUES ($1, $2, $3, $4) RETURNING *",
      [contractNo, title || "Infrastructure Works", vendor || "BuildCorp Ltd", parseFloat(amount || 5000000)]
    );

    res.status(201).json({
      success: true,
      message: `Contract ${contractNo} initialized for KES ${parseFloat(amount || 5000000).toLocaleString()}.`,
      contract: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Disbursements (Read & Create)
app.get("/api/disbursements", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM disbursements ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/disbursements", async (req, res) => {
  const { amount, sourceAccount } = req.body;
  try {
    const refNo = `DISB-${Math.floor(10000 + Math.random() * 90000)}`;
    const result = await pool.query(
      "INSERT INTO disbursements (ref_no, source_account, amount) VALUES ($1, $2, $3) RETURNING *",
      [refNo, sourceAccount || "Kenya CBK Designated Account", parseFloat(amount || 10000000)]
    );

    res.status(201).json({
      success: true,
      message: `Disbursement ${refNo} of KES ${parseFloat(amount || 10000000).toLocaleString()} credited to Designated Account.`,
      disbursement: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Payments (Maps to Vouchers marked as PAYMENTS or CONFIRMED)
app.get("/api/payments", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT uuid, voucher_no as ref_no, date, dr_amount as amount, status FROM vouchers ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Suppliers (Read & Create)
app.get("/api/suppliers", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM suppliers ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/suppliers", async (req, res) => {
  const { name, category } = req.body;
  try {
    const supplierId = `SUP-${Math.floor(100 + Math.random() * 900)}`;
    const result = await pool.query(
      "INSERT INTO suppliers (supplier_id, name, category) VALUES ($1, $2, $3) RETURNING *",
      [supplierId, name || "AgriTech Kenya", category || "Agriculture"]
    );

    res.status(201).json({
      success: true,
      message: `Supplier ${name || "AgriTech Kenya"} registered with ID ${supplierId}.`,
      supplier: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Beneficiaries (Read & Create)
app.get("/api/beneficiaries", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM beneficiaries ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/beneficiaries", async (req, res) => {
  const { groupName, county, memberCount } = req.body;
  try {
    const benId = `BEN-${Math.floor(1000 + Math.random() * 9000)}`;
    const result = await pool.query(
      "INSERT INTO beneficiaries (ben_id, group_name, county, member_count) VALUES ($1, $2, $3, $4) RETURNING *",
      [benId, groupName || "Kiambu Farmers Coop", county || "Kiambu", parseInt(memberCount || 45)]
    );

    res.status(201).json({
      success: true,
      message: `Beneficiary Group '${groupName || "Kiambu Farmers Coop"}' onboarded with ${memberCount || 45} members.`,
      beneficiary: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// IFR Report Generation Endpoint
app.get("/api/reports/ifr", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM vouchers WHERE status = 'CONFIRMED'");
    const totalSpent = result.rows.reduce((sum, r) => sum + parseFloat(r.dr_amount), 0);

    res.json({
      success: true,
      reportTitle: "Interim Financial Report (IFR)",
      period: "Q2 2026",
      totalSpent,
      verifiedRecordsCount: result.rows.length,
      stamp: "WB_IFR_CRYPTOGRAPHICALLY_VERIFIED",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// Server Boot
// -----------------------------------------------------------------------------
const PORT = process.env.PORT || process.env.PORT_CORE_API || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`FundsChain Core Engine serving on port ${PORT}`);
});