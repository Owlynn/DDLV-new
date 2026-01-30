import { sanitizeExtId } from './security.js';

/**
 * Convertit les URLs d'images au format correct (ext_id sanitisé pour éviter injection).
 * Retourne de nouveaux objets (immutabilité).
 * @param {Array} workshops - Tableau d'ateliers
 * @returns {Array} Tableau avec URLs converties
 */
export function convertImageUrls(workshops) {
  return workshops.map(workshop => {
    const safeExtId = sanitizeExtId(workshop.extId);
    let image = workshop.image;
    const needsThumb = image && !image.includes('/thumb/') && safeExtId;
    if (needsThumb) {
      image = `https://www.billetweb.fr/files/page/thumb/${safeExtId}.jpg`;
    }
    if (image && image.includes('?v=')) {
      image = image.split('?v=')[0];
    }
    return { ...workshop, image };
  });
}

