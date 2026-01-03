// ============================================
// CONFIGURATION EMAILJS
// ============================================
// Ce fichier charge la configuration EmailJS depuis secrets.local.js
//
// IMPORTANT : 
// - Ce fichier doit être chargé AVANT le script EmailJS
// - Les clés API réelles doivent être dans secrets.local.js (ignoré par git)
// - Ce fichier est ignoré par git pour éviter de commiter des clés par erreur
//
// Pour configurer :
// 1. Copiez secrets.example.js vers secrets.local.js
// 2. Remplissez vos vraies clés dans secrets.local.js

console.log('🟢 emailjs-config.js chargé');

// Charger depuis secrets.local.js si disponible, sinon utiliser des valeurs par défaut
const SECRETS = (typeof window !== 'undefined' && window.SECRETS) || {};
const EMAILJS_SECRETS = SECRETS.EMAILJS || {};

const EMAILJS_CONFIG = {
  PUBLIC_KEY: EMAILJS_SECRETS.PUBLIC_KEY || 'votre_public_key_emailjs',
  SERVICE_ID: EMAILJS_SECRETS.SERVICE_ID || 'votre_service_id_emailjs',
  TEMPLATE_ID: EMAILJS_SECRETS.TEMPLATE_ID || 'votre_template_id_emailjs'
};

// Validation en développement
const isDev = typeof window !== 'undefined' && 
              (window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1');

if (isDev) {
  if (EMAILJS_CONFIG.PUBLIC_KEY === 'votre_public_key_emailjs' ||
      EMAILJS_CONFIG.SERVICE_ID === 'votre_service_id_emailjs' ||
      EMAILJS_CONFIG.TEMPLATE_ID === 'votre_template_id_emailjs') {
    console.warn('⚠️ EmailJS: Veuillez configurer vos clés dans secrets.local.js');
    console.warn('⚠️ Copiez secrets.example.js vers secrets.local.js et remplissez vos clés');
  } else {
    console.log('✅ EmailJS configuré depuis secrets.local.js');
  }
}

// Exposer la configuration globalement
if (typeof window !== 'undefined') {
  window.EMAILJS_CONFIG = EMAILJS_CONFIG;
}

console.log('🟢 EMAILJS_CONFIG initialisé:', {
  PUBLIC_KEY: EMAILJS_CONFIG.PUBLIC_KEY ? '***' + EMAILJS_CONFIG.PUBLIC_KEY.slice(-4) : 'non défini',
  SERVICE_ID: EMAILJS_CONFIG.SERVICE_ID ? 'défini' : 'non défini',
  TEMPLATE_ID: EMAILJS_CONFIG.TEMPLATE_ID ? 'défini' : 'non défini'
});

