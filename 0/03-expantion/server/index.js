let express = require('express');

let mysql = require('mysql2/promise');

let port = process.env.PORT || 3105;

let pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'app123',
    database: process.env.DB_NAME || 'expenses_db',
    dateStrings: true,
    decimalNumbers: true,
});

let app = express();
app.use(express.json());

app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ ok: true, db: 'connected' });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});


app.get('/', (req, res) => {
    res.send('Hello World');
});


app.get('/expenses', async (req, res) => {  
    try {
        let [rows] = await pool.query('SELECT * FROM expenses ORDER BY date DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.get('/expenses/:id', async (req, res) => {
    try {
        let [rows] = await pool.query('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.post('/expenses', async (req, res) => {
    try {
        let [rows] = await pool.query('INSERT INTO expenses (title, description, amount, category) VALUES (?, ?, ?, ?)', [req.body.title, req.body.description, req.body.amount, req.body.category]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.put('/expenses/:id', async (req, res) => {
    try { 
        let [rows] = await pool.query('UPDATE expenses SET title = ?, description = ?, amount = ?, category = ? WHERE id = ?', [req.body.title, req.body.description, req.body.amount, req.body.category, req.params.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.delete('/expenses/:id', async (req, res) => {
    try {
        let [rows] = await pool.query('DELETE FROM expenses WHERE id = ?', [req.params.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
