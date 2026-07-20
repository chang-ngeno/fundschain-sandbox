import express from 'express';
import cors from 'cors';
import pg from 'pg';
// import 'dotenv/config';

const app = express();
app.disable('x-powered-by');
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// GET: Fetch all active budget component nodes
app.get('/api/components', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM budget_components ORDER BY component_code');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Process and validate Payment Vouchers
app.post('/api/vouchers', async (req, res) => {
  const { componentId, payeeName, amountKes } = req.body;
  const requestedAmount = Number.parseFloat(amountKes);

  if (!componentId || !payeeName || Number.isNaN(requestedAmount) || requestedAmount <= 0) {
    return res.status(400).json({ error: 'Invalid payload elements.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Retrieve corresponding budget limits 
    const componentRes = await client.query(
      'SELECT * FROM budget_components WHERE id = $1 FOR UPDATE',
      [componentId]
    );

    if (componentRes.rows.length === 0) {
      throw new Error('Target component node matching target UUID not found.');
    }

    const component = componentRes.rows[0];
    const currentBalance = Number.parseFloat(component.remaining_budget_kes);

    // Dynamic Rule Check Engine validation block
    if (requestedAmount > currentBalance) {
      return res.status(400).json({
        code: 'EX_STRICT_BUDGET_CAP_EXCEEDED',
        message: `Transaction blocked. Requested: KES ${requestedAmount.toLocaleString()}, Available: KES ${currentBalance.toLocaleString()}`,
        targetUuid: componentId
      });
    }

    // Deduct and update database
    const newBalance = currentBalance - requestedAmount;
    await client.query(
      'UPDATE budget_components SET remaining_budget_kes = $1 WHERE id = $2',
      [newBalance, componentId]
    );

    await client.query('COMMIT');
    
    res.json({
      success: true,
      transactionId: crypto.randomUUID(), // Standard UUID assignment
      remainingBalanceKes: newBalance
    });

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// const PORT = process.env.PORT;
// app.listen(PORT, () => console.log(`FundsChain API Core serving on port ${PORT}`));
// Look for PORT_CORE_API, then fallback to 5000 inside the container
const PORT = process.env.PORT_CORE_API || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`FundsChain API Core serving on port ${PORT}`);
});