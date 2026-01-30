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
    BILLETWEB_API_KEY: 'd702349fae520ec1df4481902866a833', // À utiliser uniquement côté serveur via proxy
    USER_ID: '73590',
  }
};

// Exposer globalement
if (typeof window !== 'undefined') {
  window.SECRETS = SECRETS;
  // Log de confirmation en développement
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('✅ secrets.local.js chargé - BILLETWEB configuré:', {
      hasUserId: !!SECRETS.BILLETWEB?.USER_ID,
      hasApiKey: !!SECRETS.BILLETWEB?.API_KEY,
      userId: SECRETS.BILLETWEB?.USER_ID || 'non défini'
    });
  }
}

// Pour Node.js (si vous utilisez un serveur)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SECRETS;
}

