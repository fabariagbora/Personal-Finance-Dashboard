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
    database: process.env.DB_NAME,
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
                { name: 'notes', type: sql.NVarChar(500), value: notes || '' } // Handle optional notes
            ]
        );
        res.send('Expense record added successfully ✅');
    } catch (err) {
        console.error("SQL Error (Expenses):", err); // Debug SQL errors
        res.status(500).json({ error: err.message });
    }
});

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
    const { amount, lender_name, loan_date, maturity_date, payment_status } = req.body;
    try {
        await queryDatabase(
            `INSERT INTO Personal_Finance.Loans (amount, lender_name, loan_date, maturity_date, payment_status) VALUES (@amount, @lender_name, @loan_date, @maturity_date, @payment_status)`,
            [
                { name: 'amount', type: sql.Decimal(10, 2), value: amount },
                { name: 'lender_name', type: sql.NVarChar(255), value: lender_name },
                { name: 'loan_date', type: sql.Date, value: loan_date },
                { name: 'maturity_date', type: sql.Date, value: maturity_date },
                { name: 'payment_status', type: sql.NVarChar(50), value: payment_status }
            ]
        );
        res.send('Loan record added successfully ✅');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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
        console.error("SQL Error (Investments):", err); // Debug SQL errors
        res.status(500).json({ error: err.message });
    }
});


// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on https://personal-finance-dashboard-uu8u.onrender.com/${PORT}`));
