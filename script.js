const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'supersecretpassword',
  resave: false,
  saveUninitialized: true
}));

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'pass123'; // Change this in production

const db = new sqlite3.Database('./jobs.db', (err) => {
  if (err) return console.error(err.message);
  console.log('Connected to SQLite.');
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

app.get('/dashboard', (req, res) => {
  if (req.session.loggedIn) {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.loggedIn = true;
    res.redirect('/dashboard');
  } else {
    res.send('Login failed. <a href="/login">Try again</a>.');
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
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
      res.status(200).send("Job submitted!");
    }
  );
});

app.get('/api/jobs', (req, res) => {
  if (!req.session.loggedIn) return res.status(403).send("Forbidden");
  db.all(`SELECT * FROM jobs ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).send("Failed to fetch jobs.");
    res.json(rows);
  });
});

app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
