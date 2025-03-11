const express = require("express");
const sql = require("mssql");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

// Function to connect to the database
async function connectDB() {
  try {
    await sql.connect(config);
    console.log("✅ Connected to AzureSQL Database");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1); // Exit process if DB connection fails
  }
}

connectDB();

// Middleware to ensure DB connection
async function getDbPool() {
  return new sql.ConnectionPool(config).connect();
}

// Fetch all investments (ID, amount, investment type)
app.get("/investments", async (req, res) => {
  try {
    const pool = await getDbPool();
    const result = await pool
      .request()
      .query("SELECT id, amount, investment_type FROM Personal_Finance.Investments");
    
    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching investments:", error);
    res.status(500).json({ error: "Error fetching investments." });
  }
});

// Add a new investment (Prevent SQL Injection)
app.post("/investments", async (req, res) => {
  try {
    const { amount, investment_type, investment_date, maturity_date } = req.body;
    if (!amount || !investment_type || !investment_date || !maturity_date) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const pool = await getDbPool();
    await pool.request()
      .input("amount", sql.Decimal(18, 2), amount)
      .input("investment_type", sql.NVarChar, investment_type)
      .input("investment_date", sql.Date, investment_date)
      .input("maturity_date", sql.Date, maturity_date)
      .query(`
        INSERT INTO investments (amount, investment_type, investment_date, maturity_date) 
        VALUES (@amount, @investment_type, @investment_date, @maturity_date)
      `);

    res.json({ message: "Investment added successfully ✅" });
  } catch (error) {
    console.error("Error adding investment:", error);
    res.status(500).json({ error: "Error adding investment." });
  }
});

// Fetch all investment statuses (with investment details)
app.get("/investment-status", async (req, res) => {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT is.id, is.investment_id, is.status_date, is.current_value, 
             i.amount AS investment_amount, i.investment_type
      FROM Personal_Finance.Investment_status is
      JOIN Personal_Finance.Investments i ON is.investment_id = i.id
    `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching investment statuses:", error);
    res.status(500).json({ error: "Error fetching investment statuses." });
  }
});

// Add investment status update (Prevent SQL Injection)
app.post("/investment-status", async (req, res) => {
  try {
    const { investment_id, status_date, current_value } = req.body;
    if (!investment_id || !status_date || !current_value) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const pool = await getDbPool();
    await pool.request()
      .input("investment_id", sql.Int, investment_id)
      .input("status_date", sql.Date, status_date)
      .input("current_value", sql.Decimal(18, 2), current_value)
      .query(`
        INSERT INTO Personal_Finance.Investment_status (investment_id, status_date, current_value)
        VALUES (@investment_id, @status_date, @current_value)
      `);

    res.json({ message: "Investment status updated successfully ✅" });
  } catch (error) {
    console.error("Error updating investment status:", error);
    res.status(500).json({ error: "Error updating investment status." });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
