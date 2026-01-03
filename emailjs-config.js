// ============================================
// CONFIGURATION EMAILJS
// ============================================
// Ce fichier contient les identifiants pour EmailJS
// À remplir avec vos propres identifiants
//
// IMPORTANT : Ce fichier doit être chargé AVANT le script EmailJS
// dans les pages HTML qui utilisent EmailJS (contact.html)

console.log('🟢 emailjs-config.js chargé');

const EMAILJS_CONFIG = {
  PUBLIC_KEY: 'hmvqMmPTj_sondUBv', // Public Key EmailJS (peut être publique)
  SERVICE_ID: 'service_wlmluib',  // Service ID EmailJS
  TEMPLATE_ID: 'template_8c528gn' // Template ID EmailJS
};

console.log('🟢 EMAILJS_CONFIG initialisé:', {
  PUBLIC_KEY: EMAILJS_CONFIG.PUBLIC_KEY ? '***' + EMAILJS_CONFIG.PUBLIC_KEY.slice(-4) : 'non défini',
  SERVICE_ID: EMAILJS_CONFIG.SERVICE_ID ? 'défini' : 'non défini',
  TEMPLATE_ID: EMAILJS_CONFIG.TEMPLATE_ID ? 'défini' : 'non défini'
});

