require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const { initStore } = require('./src/data/store');
const authRoutes = require('./src/routes/auth.routes');
const collectionsRoutes = require('./src/routes/collections.routes');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // higher limit to allow booking photo uploads (base64)

initStore(); // creates + seeds storage/database.json or in-memory DB

const statusResponse = (req, res) => {
  res.json({ status: 'online', service: 'FixMyPhone API Server', timestamp: new Date().toISOString() });
};

// Health and status endpoints
app.get('/api', statusResponse);
app.get('/api/status', statusResponse);
app.get('/api/health', statusResponse);
app.get('/health', statusResponse);

// Primary API routes mounted at /api
app.use('/api/auth', authRoutes);
app.use('/api', collectionsRoutes);

// Fallback API routes mounted at root / for serverless runtimes that strip /api prefix
app.use('/auth', authRoutes);
app.use('/', collectionsRoutes);

// Route redirects for convenience
app.get('/admin', (req, res) => res.redirect('/#admin'));
app.get('/login', (req, res) => res.redirect('/#login'));

// Serve frontend static files
const possibleFrontendPaths = [
  path.join(__dirname, '..', 'frontend', 'dist'),
  path.join(__dirname, '..', 'frontend'),
  path.join(__dirname, 'frontend', 'dist'),
  path.join(__dirname, 'frontend'),
  path.join(process.cwd(), 'fixmyphone-fullstack', 'frontend', 'dist'),
  path.join(process.cwd(), 'fixmyphone-fullstack', 'frontend'),
  path.join(process.cwd(), 'frontend', 'dist'),
  path.join(process.cwd(), 'frontend')
];
const frontendPath = possibleFrontendPaths.find(p => fs.existsSync(p)) || path.join(__dirname, '..', 'frontend');

app.use(express.static(frontendPath));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path === '/api') return res.status(404).json({ error: 'API endpoint not found' });
  const indexFile = path.join(frontendPath, 'index.html');
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.json({ message: 'FixMyPhone API Server running', frontendStatus: 'Static assets path: ' + frontendPath });
  }
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
if (!process.env.VERCEL && !process.env.NOW_REGION && require.main === module) {
  app.listen(PORT, () => {
    const adminUrl = `http://localhost:${PORT}/#admin`;
    console.log(`\n========================================`);
    console.log(`FixMyPhone Backend API Server Running`);
    console.log(`Admin Panel:  ${adminUrl}`);
    console.log(`API URL:      http://localhost:${PORT}/api`);
    console.log(`Frontend URL: http://localhost:5173 (run 'npm run dev:frontend')`);
    console.log(`========================================\n`);

    if (process.env.AUTO_OPEN !== 'false') {
      openBrowser(adminUrl);
    }
  });
}

module.exports = app;


