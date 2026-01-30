/**
 * Échappe les caractères HTML dangereux pour prévenir les attaques XSS
 * @param {string} text - Texte à échapper
 * @returns {string} Texte échappé
 */
export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/** Protocoles interdits pour prévenir XSS et open redirect */
const FORBIDDEN_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'file:'];

/**
 * Valide et nettoie une URL pour prévenir les attaques XSS (usage général).
 * Accepte les URLs absolues http(s) et les URLs relatives.
 * @param {string} url - URL à valider
 * @returns {string|null} URL validée ou null si invalide
 */
export function validateUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  // Rejeter explicitement les protocoles dangereux
  const lower = trimmed.toLowerCase();
  if (FORBIDDEN_PROTOCOLS.some(p => lower.startsWith(p))) return null;
  try {
    const urlObj = new URL(trimmed);
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') return null;
    return trimmed;
  } catch (e) {
    if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) return trimmed;
    return null;
  }
}

/**
 * Valide une URL externe (liens ateliers, window.open) : uniquement URLs absolues https (et http en dev).
 * Refuse javascript:, data:, vbscript:, file: et les URLs relatives pour éviter XSS et open redirect.
 * @param {string} url - URL à valider
 * @param {boolean} [allowHttp=false] - Si true, autorise http: (développement local)
 * @returns {string|null} URL validée ou null si invalide
 */
export function validateExternalUrl(url, allowHttp = false) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (FORBIDDEN_PROTOCOLS.some(p => lower.startsWith(p))) return null;
  try {
    const urlObj = new URL(trimmed);
    if (urlObj.protocol !== 'https:' && (urlObj.protocol !== 'http:' || !allowHttp)) return null;
    return trimmed;
  } catch (e) {
    return null;
  }
}

/**
 * Sanitise un identifiant externe (ext_id) pour construction d'URLs.
 * Autorise uniquement alphanumériques, tirets et underscores pour éviter injection XSS / URL malformée.
 * @param {string} extId - Identifiant brut (ex. retour API BilletWeb)
 * @returns {string} Slug safe ou chaîne vide si invalide
 */
export function sanitizeExtId(extId) {
  if (extId == null || typeof extId !== 'string') return '';
  const trimmed = extId.trim();
  if (!trimmed) return '';
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return '';
  return trimmed;
}






