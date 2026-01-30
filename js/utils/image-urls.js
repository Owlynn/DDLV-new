import { sanitizeExtId } from './security.js';

/**
 * Convertit les URLs d'images au format correct (ext_id sanitisé pour éviter injection).
 * @param {Array} workshops - Tableau d'ateliers
 * @returns {Array} Tableau avec URLs converties
 */
export function convertImageUrls(workshops) {
  return workshops.map(workshop => {
    const safeExtId = sanitizeExtId(workshop.extId);
    if (workshop.image && workshop.image.includes('/files/page/') && !workshop.image.includes('/thumb/')) {
      if (safeExtId) {
        workshop.image = `https://www.billetweb.fr/files/page/thumb/${safeExtId}.jpg`;
      }
    } else if (workshop.image && !workshop.image.includes('/thumb/')) {
      if (safeExtId) {
        workshop.image = `https://www.billetweb.fr/files/page/thumb/${safeExtId}.jpg`;
      }
    }
    if (workshop.image && workshop.image.includes('?v=')) {
      workshop.image = workshop.image.split('?v=')[0];
    }
    return workshop;
  });
}

