const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// SQLite setup
const db = new sqlite3.Database('./jobs.db', (err) => {
  if (err) return console.error(err.message);
  console.log('Connected to SQLite database.');
});

db.run(`
  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    contact TEXT,
    job_type TEXT,
    description TEXT,
    preferred_date TEXT,
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/submit-job', (req, res) => {
  const { name, contact, job_type, description, preferred_date, photo_url } = req.body;

  db.run(
    `INSERT INTO jobs (name, contact, job_type, description, preferred_date, photo_url) VALUES (?, ?, ?, ?, ?, ?)`,
    [name, contact, job_type, description, preferred_date, photo_url],
    function (err) {
      if (err) {
        console.error(err.message);
        return res.status(500).send("Failed to save job.");
      }
      res.status(200).send("Job submitted successfully!");
    }
  );
});

app.get('/api/jobs', (req, res) => {
  db.all(`SELECT * FROM jobs ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send("Failed to fetch jobs.");
    }
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
