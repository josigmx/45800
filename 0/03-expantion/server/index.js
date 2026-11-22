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

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
