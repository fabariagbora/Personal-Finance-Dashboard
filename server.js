const express = require('express');
const sql = require('mssql');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// SQL Server Configuration
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME, // Ensure this is set to your database name
    port: parseInt(process.env.DB_PORT),
    options: {
        encrypt: true, // Use true if using Azure SQL
        trustServerCertificate: true // For local dev
    }
};

// Create a connection pool
const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('Connected to SQL Server ✅');
        return pool;
    })
    .catch(err => {
        console.error('Database Connection Failed ❌', err);
        process.exit(1);
    });

// Root Route
app.get('/', (req, res) => {
    res.send('Finance Tracker API is running 🚀');
});

// Generic Query Handler Function
async function queryDatabase(query, inputs = []) {
    try {
        const pool = await poolPromise;
        const request = pool.request();
        inputs.forEach(input => {
            request.input(input.name, input.type, input.value);
        });
        return await request.query(query);
    } catch (err) {
        console.error('SQL Error:', err);
        throw err;
    }
}

// ------------------ INCOME ENDPOINTS ------------------

// 🔹 Get All Income Records
app.get('/income', async (req, res) => {
    try {
        const result = await queryDatabase('SELECT * FROM Personal_Finance.Income');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 Add New Income Record
app.post('/income', async (req, res) => {
    const { amount, source, income_date } = req.body;

    console.log("Received Data:", req.body); // Debug incoming request

    if (!amount || !source || !income_date) {
        return res.status(400).json({ error: 'All fields are required!' });
    }

    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('amount', sql.Decimal(10, 2), amount)
            .input('source', sql.NVarChar(255), source)
            .input('income_date', sql.Date, income_date)
            .query(`INSERT INTO Personal_Finance.Income (amount, source, income_date) VALUES (@amount, @source, @income_date)`);
        console.log("Inserted Data Result:", result); // Debug SQL response
        res.send('Income record added successfully ✅');
    } catch (err) {
        console.error("SQL Error:", err);
        res.status(500).json({ error: err.message });
    } finally {
        sql.close();
    }
});

// ------------------ EXPENSE ENDPOINTS ------------------

// 🔹 Get All Expense Records
app.get('/expenses', async (req, res) => {
    try {
        const result = await queryDatabase('SELECT * FROM Personal_Finance.Expenses');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 Add New Expense Record
app.post('/expenses', async (req, res) => {
    const { amount, category, expense_date, notes } = req.body;

    console.log("Received Expense Data:", req.body); // Debug log

    if (!amount || !category || !expense_date) {
        return res.status(400).json({ error: 'Amount, category, and expense_date are required!' });
    }

    try {
        await queryDatabase(
            `INSERT INTO Personal_Finance.Expenses (amount, category, expense_date, notes) VALUES (@amount, @category, @expense_date, @notes)`,
            [
                { name: 'amount', type: sql.Decimal(10, 2), value: amount },
                { name: 'category', type: sql.NVarChar(255), value: category },
                { name: 'expense_date', type: sql.Date, value: expense_date },
                { name: 'notes', type: sql.NVarChar(500), value: notes || '' }
            ]
        );
        res.send('Expense record added successfully ✅');
    } catch (err) {
        console.error("SQL Error (Expenses):", err);
        res.status(500).json({ error: err.message });
    }
});

// ------------------ LOAN ENDPOINTS ------------------

// 🔹 Get All Loan Records
app.get('/loans', async (req, res) => {
    try {
        const result = await queryDatabase('SELECT * FROM Personal_Finance.Loans');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 Add New Loan Record
app.post('/loans', async (req, res) => {
    const { amount, lender_name, loan_date, maturity_date, loan_notes } = req.body;
    try {
        await queryDatabase(
            `INSERT INTO Personal_Finance.Loans (amount, lender_name, loan_date, maturity_date, loan_notes) VALUES (@amount, @lender_name, @loan_date, @maturity_date, @loan_notes)`,
            [
                { name: 'amount', type: sql.Decimal(10, 2), value: amount },
                { name: 'lender_name', type: sql.NVarChar(255), value: lender_name },
                { name: 'loan_date', type: sql.Date, value: loan_date },
                { name: 'maturity_date', type: sql.Date, value: maturity_date },
                { name: 'loan_notes', type: sql.NVarChar(500), value: loan_notes || ''  }
            ]
        );
        res.send('Loan record added successfully ✅');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ------------------ LOAN STATUS ENDPOINTS ------------------
// 🔹 Get All Loan Status Records
app.get('/loan-status', async (req, res) => {
    try {
        const result = await queryDatabase(`
          SELECT ls.id, ls.loan_id, ls.status_date, ls.current_outstanding, ls.loan_status,
                 l.amount AS loan_amount, l.lender_name
          FROM Personal_Finance.Loan_Status ls
          JOIN Personal_Finance.Loans l ON ls.loan_id = l.id
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 Add New Loan Status Record
app.post('/loan-status', async (req, res) => {
    const { loan_id, current_outstanding, status_date, loan_status } = req.body;
    if (!loan_id || !current_outstanding || !status_date || !loan_status) {
        return res.status(400).json({ error: 'All fields are required!' });
    }
    try {
        await queryDatabase(
            `INSERT INTO Personal_Finance.Loan_Status (loan_id, current_outstanding, status_date, loan_status)
             VALUES (@loan_id, @current_outstanding, @status_date, @loan_status)`,
            [
                { name: 'loan_id', type: sql.Int, value: loan_id },
                { name: 'current_outstanding', type: sql.Decimal(18, 2), value: current_outstanding },
                { name: 'status_date', type: sql.Date, value: status_date },
                { name: 'loan_status', type: sql.NVarChar(50), value: loan_status }
            ]
        );
        res.send('Loan status record added successfully ✅');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ------------------ INVESTMENT ENDPOINTS ------------------

// 🔹 Get All Investment Records
app.get('/investments', async (req, res) => {
    try {
        const result = await queryDatabase('SELECT * FROM Personal_Finance.Investments');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 Add New Investment Record
app.post('/investments', async (req, res) => {
    const { amount, investment_type, investment_date, maturity_date } = req.body;

    console.log("Received Investment Data:", req.body); // Debug log

    if (!amount || !investment_type || !investment_date || !maturity_date) {
        return res.status(400).json({ error: 'All fields are required!' });
    }

    try {
        await queryDatabase(
            `INSERT INTO Personal_Finance.Investments (amount, investment_type, investment_date, maturity_date) VALUES (@amount, @investment_type, @investment_date, @maturity_date)`,
            [
                { name: 'amount', type: sql.Decimal(10, 2), value: amount },
                { name: 'investment_type', type: sql.NVarChar(255), value: investment_type },
                { name: 'investment_date', type: sql.Date, value: investment_date },
                { name: 'maturity_date', type: sql.Date, value: maturity_date }
            ]
        );
        res.send('Investment record added successfully ✅');
    } catch (err) {
        console.error("SQL Error (Investments):", err);
        res.status(500).json({ error: err.message });
    }
});

// ------------------ INVESTMENT STATUS ENDPOINTS ------------------

// 🔹 Get All Investment Status Records
app.get('/investment-status', async (req, res) => {
    try {
        const result = await queryDatabase(`
          SELECT is.id, is.investment_id, is.status_date, is.current_value,
                 i.amount AS investment_amount, i.investment_type
          FROM Personal_Finance.Investment_Status is
          JOIN Personal_Finance.Investments i ON is.investment_id = i.id
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 Add New Investment Status Record
app.post('/investment-status', async (req, res) => {
    const { investment_id, status_date, current_value } = req.body;

    if (!investment_id || !status_date || !current_value) {
        return res.status(400).json({ error: 'All fields are required!' });
    }

    try {
        await queryDatabase(
            `INSERT INTO Personal_Finance.Investment_Status (investment_id, status_date, current_value)
             VALUES (@investment_id, @status_date, @current_value)`,
            [
                { name: 'investment_id', type: sql.Int, value: investment_id },
                { name: 'status_date', type: sql.Date, value: status_date },
                { name: 'current_value', type: sql.Decimal(10, 2), value: current_value }
            ]
        );
        res.send('Investment status updated successfully ✅');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on https://personal-finance-dashboard-uu8u.onrender.com/${PORT}`));
