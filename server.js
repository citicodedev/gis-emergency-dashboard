// ============================================================
//  GIS Emergency Dashboard — Proxy Server
//  Serves the HTML app AND proxies API calls to Railway,
//  eliminating CORS issues completely.
// ============================================================

const express = require('express');
const path    = require('path');
const https   = require('https');

const app  = express();
const PORT = process.env.PORT || 3000;

const API_BASE       = 'https://emergencydashboardlive-production.up.railway.app';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'myadmin123';

// ── Serve static files (the HTML app) ──────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── API Proxy — forwards /api/* to Railway ─────────────────
// The browser calls /api/... on this server (same origin = no CORS)
// This server forwards the request to Railway with the auth header.
app.get('/api/*', (req, res) => {
  const targetPath = req.url;
  const targetUrl  = API_BASE + targetPath;
  console.log(`[proxy] GET ${targetUrl}`);
  const options = {
    headers: {
      'x-admin-password': ADMIN_PASSWORD,
      'Accept': 'application/json',
    },
  };
  https.get(targetUrl, options, (apiRes) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(apiRes.statusCode);
    apiRes.pipe(res);
  }).on('error', (err) => {
    console.error('[proxy] error:', err.message);
    res.status(502).json({ error: 'Proxy error: ' + err.message });
  });
});

// ── Fallback: serve index.html for any other route ─────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 GIS Dashboard running at http://localhost:${PORT}`);
});