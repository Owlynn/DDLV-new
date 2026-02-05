/**
 * Serveur de dev local qui reproduit les rewrites de vercel.json
 * pour que /contact, /ateliers, etc. fonctionnent comme en production.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, '..');

const REWRITES = {
  '/impro-vocale': '/pages/impro-vocale.html',
  '/ateliers': '/pages/ateliers.html',
  '/cours-chant': '/pages/cours-chant.html',
  '/about': '/pages/about.html',
  '/contact': '/pages/contact.html',
  '/newsletter': '/pages/newsletter.html',
  '/offre-entreprise': '/pages/offre-entreprise.html',
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

function getFilePath(urlPath) {
  let filePath = urlPath;
  if (REWRITES[urlPath]) {
    filePath = REWRITES[urlPath];
  }
  if (filePath === '/') filePath = '/index.html';
  return path.join(ROOT, filePath.replace(/^\//, ''));
}

function getMimeType(filePath) {
  const ext = path.extname(filePath);
  return MIME[ext] || 'application/octet-stream';
}

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0].replace(/\/$/, '') || '/';
  const filePath = getFilePath(urlPath);

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Cannot GET ' + urlPath);
    return;
  }

  const content = fs.readFileSync(filePath);
  res.writeHead(200, { 'Content-Type': getMimeType(filePath) });
  res.end(content);
});

server.listen(PORT, () => {
  console.log('Serveur de dev avec rewrites : http://localhost:' + PORT);
  console.log('  / → index.html');
  Object.entries(REWRITES).forEach(([route, file]) => {
    console.log('  ' + route + ' → ' + file);
  });
});
