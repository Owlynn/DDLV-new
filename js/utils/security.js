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

/**
 * Valide et nettoie une URL pour prévenir les attaques XSS
 * @param {string} url - URL à valider
 * @returns {string|null} URL validée ou null si invalide
 */
export function validateUrl(url) {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    // Autoriser seulement http et https
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return null;
    }
    return url;
  } catch (e) {
    // Si ce n'est pas une URL absolue, vérifier si c'est une URL relative valide
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return url;
    }
    return null;
  }
}






