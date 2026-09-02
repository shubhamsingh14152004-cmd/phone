require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { exec } = require('child_process');

const { initStore } = require('./src/data/store');
const authRoutes = require('./src/routes/auth.routes');
const collectionsRoutes = require('./src/routes/collections.routes');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // higher limit to allow booking photo uploads (base64)

initStore(); // creates + seeds storage/database.json on first run

app.get('/api', (req, res) => {
  res.json({ status: 'online', service: 'FixMyPhone API Server', timestamp: new Date().toISOString() });
});
app.use('/api/auth', authRoutes);
app.use('/api', collectionsRoutes);

// Route redirects for convenience
app.get('/admin', (req, res) => res.redirect('/#admin'));
app.get('/login', (req, res) => res.redirect('/#login'));

// Optional: Serve frontend static files if accessed directly on this port
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API endpoint not found' });
  res.sendFile(path.join(frontendPath, 'index.html'));
});

function openBrowser(url) {
  const platform = process.platform;
  let cmd = '';
  if (platform === 'win32') {
    cmd = `start "" "${url}"`;
  } else if (platform === 'darwin') {
    cmd = `open "${url}"`;
  } else {
    cmd = `xdg-open "${url}"`;
  }
  exec(cmd, (err) => {
    if (err) {
      console.log(`Could not automatically open browser: ${err.message}`);
    }
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  const adminUrl = `http://localhost:${PORT}/#admin`;
  console.log(`\n========================================`);
  console.log(`FixMyPhone Backend API Server Running`);
  console.log(`Admin Panel:  ${adminUrl}`);
  console.log(`API URL:      http://localhost:${PORT}/api`);
  console.log(`Frontend URL: http://localhost:5173 (run 'npm run dev:frontend')`);
  console.log(`========================================\n`);

  // Automatically open the Admin Panel in default browser on startup
  if (process.env.AUTO_OPEN !== 'false') {
    openBrowser(adminUrl);
  }
});

