/**
 * Génère env-config.js à partir des variables d'environnement (Vercel, etc.).
 * À exécuter au build : npm run build
 * Le fichier généré est ignoré par git.
 */
const fs = require('fs');
const path = require('path');

const env = process.env;

const SECRETS = {
  EMAILJS: {
    PUBLIC_KEY: env.EMAILJS_PUBLIC_KEY || '',
    SERVICE_ID: env.EMAILJS_SERVICE_ID || '',
    TEMPLATE_ID: env.EMAILJS_TEMPLATE_ID || ''
  },
  BILLETWEB: {
    API_KEY: env.BILLETWEB_API_KEY || '',
    USER_ID: env.BILLETWEB_USER_ID || '',
    EVENT_ID: env.BILLETWEB_EVENT_ID || ''
  }
};

const ENV = {
  BILLETWEB_USER_ID: env.BILLETWEB_USER_ID || null,
  BILLETWEB_API_KEY: env.BILLETWEB_API_KEY || null,
  BILLETWEB_EVENT_ID: env.BILLETWEB_EVENT_ID || null,
  BILLETWEB_PROXY_URL: env.BILLETWEB_PROXY_URL || null,
  BILLETWEB_BASE_URL: env.BILLETWEB_BASE_URL || null,
  BILLETWEB_VERSION: env.BILLETWEB_VERSION || null
};

// Structure attendue par billetweb-api.js (évite que billetweb-config.js soit requis sur Vercel)
const BILLETWEB_CONFIG = {
  userId: env.BILLETWEB_USER_ID || null,
  apiKey: env.BILLETWEB_API_KEY || null,
  eventId: env.BILLETWEB_EVENT_ID || null,
  baseUrl: env.BILLETWEB_BASE_URL || 'https://www.billetweb.fr/api',
  version: env.BILLETWEB_VERSION || '1',
  authorization: null
};

const content = `// Généré au build - ne pas modifier à la main
// Source : variables d'environnement (Vercel, etc.)
(function() {
  window.SECRETS = ${JSON.stringify(SECRETS)};
  window.ENV = ${JSON.stringify(ENV)};
  window.BILLETWEB_CONFIG = ${JSON.stringify(BILLETWEB_CONFIG)};
})();
`;

const outPath = path.join(__dirname, '..', 'env-config.js');
fs.writeFileSync(outPath, content, 'utf8');
if (!env.EMAILJS_PUBLIC_KEY && !env.BILLETWEB_USER_ID) {
  console.warn('⚠️ Aucune variable EMAILJS_* ou BILLETWEB_* trouvée (normal en local)');
}
