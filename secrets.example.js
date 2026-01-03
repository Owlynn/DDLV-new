// ============================================
// TEMPLATE DE CONFIGURATION DES CLÉS API
// ============================================
// Copiez ce fichier vers secrets.local.js et remplissez avec vos vraies clés
// Le fichier secrets.local.js est ignoré par git pour la sécurité
//
// IMPORTANT : Ne commitez JAMAIS secrets.local.js dans git

const SECRETS = {
  // EmailJS Configuration
  EMAILJS: {
    PUBLIC_KEY: 'votre_public_key_emailjs',
    SERVICE_ID: 'votre_service_id_emailjs',
    TEMPLATE_ID: 'votre_template_id_emailjs'
  },

  // BilletWeb Configuration (si vous utilisez un proxy backend)
  BILLETWEB: {
    API_KEY: 'votre_api_key_billetweb', // À utiliser uniquement côté serveur
    USER_ID: 'votre_user_id_billetweb',
    EVENT_ID: 'votre_event_id_billetweb'
  },

  // Autres clés API
  // Ajoutez ici vos autres clés API selon vos besoins
  // EXEMPLE:
  // GOOGLE_MAPS: {
  //   API_KEY: 'votre_google_maps_api_key'
  // }
};

// Exposer globalement
if (typeof window !== 'undefined') {
  window.SECRETS = SECRETS;
}

// Pour Node.js (si vous utilisez un serveur)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SECRETS;
}

