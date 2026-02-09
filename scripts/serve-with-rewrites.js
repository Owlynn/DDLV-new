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
  // Routes principales (sans -new)
  '/impro-vocale': '/pages/impro-vocale.html',
  '/ateliers': '/pages/ateliers.html',
  '/pages/ateliers': '/pages/ateliers.html',
  '/pages/ateliers.html': '/pages/ateliers.html',
  '/cours-chant': '/pages/cours-chant.html',
  '/about': '/pages/about.html',
  '/contact': '/pages/contact.html',
  '/newsletter': '/pages/newsletter.html',
  '/offre-entreprise': '/pages/offre-entreprise.html',
  '/mentions-legales': '/pages/mentions-legales.html',
  '/espace-eleve': '/pages/espace-eleve.html',
  // Anciennes URLs -new → même page (redirection douce en dev)
  '/impro-vocale-new': '/pages/impro-vocale.html',
  '/ateliers-new': '/pages/ateliers.html',
  '/pages/ateliers-new.html': '/pages/ateliers.html',
  '/cours-chant-new': '/pages/cours-chant.html',
  '/pages/cours-chant-new.html': '/pages/cours-chant.html',
  '/about-new': '/pages/about.html',
  '/pages/about-new.html': '/pages/about.html',
  '/contact-new': '/pages/contact.html',
  '/pages/contact-new.html': '/pages/contact.html',
  '/newsletter-new': '/pages/newsletter.html',
  '/pages/newsletter-new.html': '/pages/newsletter.html',
  '/offre-entreprise-new': '/pages/offre-entreprise.html',
  '/pages/offre-entreprise-new.html': '/pages/offre-entreprise.html',
  '/espace-eleve-new': '/pages/espace-eleve.html',
  '/pages/espace-eleve-new.html': '/pages/espace-eleve.html',
  '/pages/impro-vocale-new.html': '/pages/impro-vocale.html',
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
  // Normaliser : enlever trailing slash et décoder l'URL (sans le hash, le serveur ne le reçoit pas)
  const withoutHash = urlPath.split('#')[0];
  const normalized = (withoutHash.replace(/\/$/, '') || '/').replace(/%2F/gi, '/');
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
  let filePath = getFilePath(urlPath);

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Cannot GET ' + urlPath + '\n(resolved: ' + filePath + ')');
    return;
  }

  const content = fs.readFileSync(filePath);
  res.writeHead(200, { 'Content-Type': getMimeType(filePath) });
  res.end(content);
});

server.listen(PORT, () => {});
