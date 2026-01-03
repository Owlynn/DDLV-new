// ============================================
// CONFIGURATION DES CLÉS API - FICHIER LOCAL
// ============================================
// ⚠️ CE FICHIER EST IGNORÉ PAR GIT - NE PAS COMMITER
// 
// Ce fichier contient vos vraies clés API.
// Copiez secrets.example.js vers secrets.local.js et remplissez avec vos clés.

const SECRETS = {
  // EmailJS Configuration
  EMAILJS: {
    PUBLIC_KEY: 'TREtbDAfx2QLJ_sam', // Public Key EmailJS (peut être publique)
    SERVICE_ID: 'service_wlmluib',  // Service ID EmailJS
    TEMPLATE_ID: 'template_8c528gn' // Template ID EmailJS
  },

  // BilletWeb Configuration (si vous utilisez un proxy backend)
  BILLETWEB: {
    API_KEY: null, // À utiliser uniquement côté serveur via proxy
    USER_ID: null,
    EVENT_ID: null
  }
};

// Exposer globalement
if (typeof window !== 'undefined') {
  window.SECRETS = SECRETS;
}

// Pour Node.js (si vous utilisez un serveur)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SECRETS;
}

