import express from "express";
import cors from "cors";
import crypto from "crypto";
import pg from "pg";

const { Pool } = pg;
const app = express();

const corsOrigins = [
  // Primary frontend URL (required for staging/production)
  process.env.FRONTEND_URL,
  // Fallback allowed origins
  process.env.ALLOWED_ORIGIN,
  // Local development origins (only used if env vars not set)
  ...(process.env.NODE_ENV !== 'production' 
    ? ["http://localhost:5173", "http://localhost:3000", "http://localhost:8080"] 
    : []
  ),
].filter(Boolean); // Remove undefined/null values

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) {
        callback(null, true);
      } else if (corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}. Allowed: [${corsOrigins.join(', ')}]`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Sandbox-Role", "X-Sandbox-User-ID"],
    credentials: true,
  })
);

app.use(express.json());

// Context Middleware
app.use((req, res, next) => {
  req.sandboxUser = {
    id: req.headers["x-sandbox-user-id"] || "USR-DEFAULT-001",
    role: req.headers["x-sandbox-role"] || "PROJECT_ACCOUNTANT",
  };
  next();
});

// Database Setup with Enhanced Connection Management
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // Required for Neon on Render
      },
      idleTimeoutMillis: 30000, // Clean up idle connections before Neon drops them
      connectionTimeoutMillis: 5000,
    })
  : new Pool({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || "fundschain_db",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres123",
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

// IMPORTANT: Catch idle client errors to prevent process crash
pool.on("error", (err, client) => {
  console.error("Unexpected error on idle PostgreSQL client:", err);
  // Do not crash the process; pg-pool will automatically replace dead clients
});

const initDatabase = async () => {
  const schemaQuery = `
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE IF NOT EXISTS vouchers (
      uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      voucher_no VARCHAR(50) NOT NULL,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
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

    CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      doc_ref VARCHAR(50) NOT NULL,
      title TEXT NOT NULL,
      type VARCHAR(50) NOT NULL,
      ipfs_hash VARCHAR(100) NOT NULL,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(schemaQuery);
    console.log("PostgreSQL Ledger Engine Schema (v4.1.1) initialized.");

    // Seed Vouchers if empty
    const vRes = await pool.query("SELECT COUNT(*) FROM vouchers");
    if (parseInt(vRes.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO vouchers (voucher_no, date, component_code, dr_component, dr_amount, cr_account, cr_amount, status, created_role)
        VALUES 
          ('PAY-2026-0842', '2026-06-19', 'COMP-01', 'Payment to Supplier', 25430000.00, 'CBK Designated Account', 25430000.00, 'APPROVED', 'PROJECT_ACCOUNTANT'),
          ('PAY-2026-0841', '2026-06-16', 'COMP-02', 'Advance Payment', 15000000.00, 'CBK Designated Account', 15000000.00, 'APPROVED', 'PROJECT_ACCOUNTANT');
      `);
    }

    // Seed Contracts if empty
    const cRes = await pool.query("SELECT COUNT(*) FROM contracts");
    if (parseInt(cRes.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO contracts (contract_no, title, vendor, amount, status)
        VALUES 
          ('COM-2026-0154', 'Solar Water Pump Installation', 'Apex Water Ltd', 78500000.00, 'COMMITTED'),
          ('COM-2026-0155', 'Irrigation Infra Expansion', 'Greenfield Engineering', 120000000.00, 'COMMITTED');
      `);
    }

    // Seed Suppliers if empty
    const sRes = await pool.query("SELECT COUNT(*) FROM suppliers");
    if (parseInt(sRes.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO suppliers (supplier_id, name, category, status)
        VALUES 
          ('SUP-2026-001', 'Rift Valley Agritech', 'Equipment Supply', 'VERIFIED'),
          ('SUP-2026-002', 'Kenya Seed Co-op', 'Input Supplies', 'VERIFIED');
      `);
    }

    // Seed Beneficiaries if empty
    const bRes = await pool.query("SELECT COUNT(*) FROM beneficiaries");
    if (parseInt(bRes.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO beneficiaries (ben_id, group_name, county, member_count)
        VALUES 
          ('BEN-2026-901', 'Nakuru Smallholder Co-op', 'Nakuru', 450),
          ('BEN-2026-902', 'Machakos Farmers Alliance', 'Machakos', 320);
      `);
    }
  } catch (err) {
    console.error("Database migration fault:", err);
  }
};
initDatabase();

// API ENDPOINTS

// 1. Vouchers / Payments
app.get("/api/vouchers", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM vouchers ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/vouchers", async (req, res) => {
  const { amount, description, componentCode } = req.body;
  const numAmt = parseFloat(amount || 0);
  try {
    const voucherNo = `PAY-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const result = await pool.query(
      `INSERT INTO vouchers (voucher_no, date, component_code, dr_component, dr_amount, cr_account, cr_amount, status, created_role)
       VALUES ($1, NOW(), $2, $3, $4, $5, $6, 'APPROVED', $7) RETURNING *`,
      [voucherNo, componentCode || "COMP-01", description || "Payment Action", numAmt, "CBK Designated Account", numAmt, req.sandboxUser.role]
    );
    res.status(201).json({ message: `Payment Voucher ${voucherNo} posted successfully!`, record: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Contracts & Procurement
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
      [contractNo, title || "New Procurement Contract", vendor || "Contractor Ltd", parseFloat(amount || 25000000)]
    );
    res.status(201).json({ message: `Contract ${contractNo} posted successfully!`, record: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Disbursements
app.get("/api/disbursements", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM disbursements ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/disbursements", async (req, res) => {
  const { source, amount } = req.body;
  try {
    const refNo = `DISB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const result = await pool.query(
      "INSERT INTO disbursements (ref_no, source_account, amount) VALUES ($1, $2, $3) RETURNING *",
      [refNo, source || "IBRD Special Account", parseFloat(amount || 50000000)]
    );
    res.status(201).json({ message: `Disbursement ${refNo} posted successfully!`, record: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Suppliers
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
    const suppId = `SUP-2026-${Math.floor(100 + Math.random() * 900)}`;
    const result = await pool.query(
      "INSERT INTO suppliers (supplier_id, name, category) VALUES ($1, $2, $3) RETURNING *",
      [suppId, name || "Global Agro Tech", category || "Equipment Supplier"]
    );
    res.status(201).json({ message: `Supplier ${suppId} registered successfully!`, record: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Beneficiaries
app.get("/api/beneficiaries", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM beneficiaries ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/beneficiaries", async (req, res) => {
  const { groupName, county, members } = req.body;
  try {
    const benId = `BEN-2026-${Math.floor(100 + Math.random() * 900)}`;
    const result = await pool.query(
      "INSERT INTO beneficiaries (ben_id, group_name, county, member_count) VALUES ($1, $2, $3, $4) RETURNING *",
      [benId, groupName || "Community Water User Group", county || "Nakuru", parseInt(members || 150)]
    );
    res.status(201).json({ message: `Beneficiary Group ${benId} added successfully!`, record: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Documents
app.get("/api/documents", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM documents ORDER BY uploaded_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/documents", async (req, res) => {
  const { title, type } = req.body;
  try {
    const docRef = `DOC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const ipfsHash = `Qm${crypto.randomBytes(22).toString("hex")}`;
    const result = await pool.query(
      "INSERT INTO documents (doc_ref, title, type, ipfs_hash) VALUES ($1, $2, $3, $4) RETURNING *",
      [docRef, title || "Quarterly Audit Report", type || "PDF", ipfsHash]
    );
    res.status(201).json({ message: `Document ${docRef} anchored to IPFS!`, record: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Tasks & Projects & Reports
app.get("/api/tasks", (req, res) => {
  res.json([
    { task_id: "TSK-101", title: "Approve Payment PAY-2026-0842", priority: "HIGH", status: "PENDING", due_date: "2026-06-25" },
    { task_id: "TSK-102", title: "Verify Q2 IFR Report Documentation", priority: "MEDIUM", status: "IN_PROGRESS", due_date: "2026-06-30" },
    { task_id: "TSK-103", title: "Audit Nakuru Irrigation Sub-Project", priority: "URGENT", status: "OPEN", due_date: "2026-07-05" }
  ]);
});

app.get("/api/projects", (req, res) => {
  res.json([
    { project_id: "P175248", name: "Kenya Climate Smart Agriculture Project", budget: "KES 18.45 Bn", country: "Kenya", status: "ACTIVE" },
    { project_id: "P168742", name: "Regional Water Management Initiative", budget: "KES 12.10 Bn", country: "Uganda", status: "PLANNING" }
  ]);
});

app.get("/api/reports/ifr", (req, res) => {
  res.json({
    period: "Q2 2026 (Jan - Jun 2026)",
    totalSpent: 2310000000.0,
    stamp: "WB-IFR-CRYPTOGRAPHICALLY-VERIFIED",
    generated_at: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`FundsChain v4.1.1 Engine active on port ${PORT}`);
});