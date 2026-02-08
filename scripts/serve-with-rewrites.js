/**
 * Serveur de dev local qui reproduit les rewrites de vercel.json
 * pour que /contact, /ateliers, etc. fonctionnent comme en production.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = path.resolve(__dirname, '..');

const REWRITES = {
  '/impro-vocale': '/pages/impro-vocale.html',
  '/impro-vocale-new': '/pages/impro-vocale-new.html',
  '/ateliers': '/pages/ateliers.html',
  '/ateliers-new': '/pages/ateliers-new.html',
  '/cours-chant': '/pages/cours-chant.html',
  '/cours-chant-new': '/pages/cours-chant-new.html',
  '/about': '/pages/about.html',
  '/about-new': '/pages/about-new.html',
  '/contact': '/pages/contact-new.html',
  '/contact-new': '/pages/contact-new.html',
  '/newsletter': '/pages/newsletter.html',
  '/offre-entreprise': '/pages/offre-entreprise.html',
  '/offre-entreprise-new': '/pages/offre-entreprise-new.html',
  '/mentions-legales': '/pages/mentions-legales.html',
  '/espace-eleve-new': '/pages/espace-eleve-new.html',
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
  // Normaliser : enlever trailing slash et décoder l'URL
  const normalized = (urlPath.replace(/\/$/, '') || '/').replace(/%2F/gi, '/');
  let filePath = REWRITES[normalized] || normalized;
  if (filePath === '/') filePath = '/index.html';
  const segments = filePath.replace(/^\//, '').split('/');
  return path.join(ROOT, ...segments);
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
    res.end('Cannot GET ' + urlPath + '\n(resolved: ' + filePath + ')');
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
