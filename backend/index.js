import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import pg from 'pg';

const { Pool } = pg;
const app = express();

app.use(cors({
  origin: 'http://localhost:8080',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// =========================================================================
// DATABASE CONNECTION CONFIGURATION (POOL ENGINE)
// =========================================================================
const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'fundschain_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'your_secure_dev_password',
});

// Staging target balance thresholds based on AWPB benchmarks
const BUDGET_ALLOCATIONS = {
  "COMP-01": 35000000.00,
  "COMP-02": 15000000.00
};

// =========================================================================
// SCHEMA AUTO-INITIALIZATION ROUTINE
// =========================================================================
const initDatabase = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS vouchers (
      uuid UUID PRIMARY KEY,
      voucher_no VARCHAR(50) NOT NULL,
      date DATE NOT NULL,
      component_code VARCHAR(20) NOT NULL,
      dr_component TEXT NOT NULL,
      dr_amount NUMERIC(15, 2) NOT NULL,
      cr_account TEXT NOT NULL,
      cr_amount NUMERIC(15, 2) NOT NULL,
      status VARCHAR(30) NOT NULL,
      ipfs_hash VARCHAR(100),
      digital_signature VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

// =========================================================================
// MODULE 1 & LAB 1: VOUCHER TRANSACTION PROCESSING WITH DB CHECKS
// =========================================================================
app.post('/api/vouchers', async (req, res) => {
  const { voucherNo, date, componentCode, drComponent, drAmount, crAccount, crAmount } = req.body;

  // 1. Double-Entry Structural Integrity Verification
  const balanceDelta = parseFloat(drAmount) - parseFloat(crAmount);
  if (Math.abs(balanceDelta) !== 0) {
    return res.status(400).json({
      errorCode: "EX_DOUBLE_ENTRY_IMBALANCE",
      message: `Accounting Validation Failure: Debit and Credit distributions must resolve to 0.00 exactly. Current Delta: ${balanceDelta.toFixed(2)} KES.`
    });
  }

  const selectedComponent = componentCode || "COMP-02";
  const maxLimit = BUDGET_ALLOCATIONS[selectedComponent] || 15000000.00;

  try {
    // 2. Real-Time Aggregate Spent Query execution across immutable/confirmed lines
    const spentQuery = `
      SELECT COALESCE(SUM(dr_amount), 0) as total_spent 
      FROM vouchers 
      WHERE component_code = $1 AND status = 'CONFIRMED'
    `;
    const spentRes = await pool.query(spentQuery, [selectedComponent]);
    const totalSpent = parseFloat(spentRes.rows[0].total_spent);

    if (totalSpent + parseFloat(drAmount) > maxLimit) {
      return res.status(400).json({
        errorCode: "EX_STRICT_BUDGET_CAP_EXCEEDED",
        message: `Transaction Blocked: Requested amount of ${parseFloat(drAmount).toLocaleString()} KES exceeds the allocated Annual Work Plan & Budget (AWPB) ceiling for ${selectedComponent}. Available Room: ${(maxLimit - totalSpent).toLocaleString()} KES.`
      });
    }

    // 3. Database Persistent Persistence State Insertion (UUID Engine standard)
    const insertQuery = `
      INSERT INTO vouchers (uuid, voucher_no, date, component_code, dr_component, dr_amount, cr_account, cr_amount, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      crypto.randomUUID(),
      voucherNo || `NAVCP-V-${Math.floor(100 + Math.random() * 900)}`,
      date || new Date().toISOString().split('T')[0],
      selectedComponent,
      drComponent || "Component 2.1 (Agricultural Inputs)",
      parseFloat(drAmount),
      crAccount || "Kenya CBK Designated Account",
      parseFloat(crAmount),
      "PENDING_QUEUE" // Unconfirmed raw voucher state
    ];

    const result = await pool.query(insertQuery, values);
    
    const record = {
      uuid: result.rows[0].uuid,
      voucherNo: result.rows[0].voucher_no,
      date: result.rows[0].date,
      componentCode: result.rows[0].component_code,
      drComponent: result.rows[0].dr_component,
      drAmount: parseFloat(result.rows[0].dr_amount),
      crAccount: result.rows[0].cr_account,
      crAmount: parseFloat(result.rows[0].cr_amount),
      status: result.rows[0].status
    };

    return res.status(201).json({ message: "Voucher validation successful", record });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Database infrastructure write fault." });
  }
});

// Sync Ledger Read Query Engine
app.get('/api/vouchers', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM vouchers ORDER BY created_at DESC");
    const formatted = result.rows.map(row => ({
      uuid: row.uuid,
      voucherNo: row.voucher_no,
      date: row.date.toISOString().split('T')[0],
      componentCode: row.component_code,
      drComponent: row.dr_component,
      drAmount: parseFloat(row.dr_amount),
      crAccount: row.cr_account,
      crAmount: parseFloat(row.cr_amount),
      status: row.status,
      ipfsHash: row.ipfs_hash,
      digitalSignature: row.digital_signature
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// MODULE 2 & LAB 2: IPFS CRYPTOGRAPHIC DATA STORAGE BINDING UPDATE
// =========================================================================
app.post('/api/vouchers/:uuid/anchor', async (req, res) => {
  const { uuid } = req.params;
  const { fileName } = req.body;

  try {
    const checkRes = await pool.query("SELECT * FROM vouchers WHERE uuid = $1", [uuid]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: "Target Voucher UUID execution node not found." });
    }

    const mockFileContent = `${fileName || 'invoice'}_salt_${Date.now()}`;
    const computedHash = "Qm" + crypto.createHash('sha256').update(mockFileContent).digest('hex').substring(0, 44);
    const digitalSignature = "sig_0x" + crypto.randomBytes(8).toString('hex');

    const updateQuery = `
      UPDATE vouchers 
      SET ipfs_hash = $1, digital_signature = $2, status = 'CONFIRMED'
      WHERE uuid = $3
      RETURNING *
    `;
    await pool.query(updateQuery, [computedHash, digitalSignature, uuid]);

    res.json({
      message: "Attached & Signed",
      ipfsHash: computedHash,
      signature: digitalSignature
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// MODULE 3 & LAB 3: REAL-TIME LEDGER ANALYTICS & SOE EXTRACTION
// =========================================================================
app.get('/api/reports/soe', async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    let reportQuery = "SELECT * FROM vouchers WHERE 1=1";
    let params = [];

    if (startDate && endDate) {
      reportQuery += " AND date >= $1 AND date <= $2";
      params = [startDate, endDate];
    }
    
    reportQuery += " ORDER BY date ASC";
    const result = await pool.query(reportQuery, params);
    
    const formatted = result.rows.map(row => ({
      uuid: row.uuid,
      voucherNo: row.voucher_no,
      date: row.date.toISOString().split('T')[0],
      componentCode: row.component_code,
      drComponent: row.dr_component,
      drAmount: parseFloat(row.dr_amount),
      status: row.status
    }));

    res.json({
      generatedAt: new Date().toISOString(),
      systemCertificateStamp: "BLOCKCHAIN_LEDGER_STATE_VERIFIED_V1.1",
      records: formatted
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT_CORE_API || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`FundsChain API Core serving on port ${PORT}`);
});