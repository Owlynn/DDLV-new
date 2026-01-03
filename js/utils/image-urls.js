/**
 * Convertit les URLs d'images au format correct
 * @param {Array} workshops - Tableau d'ateliers
 * @returns {Array} Tableau avec URLs converties
 */
export function convertImageUrls(workshops) {
  return workshops.map(workshop => {
    // Si l'URL est au format /files/page/[id].jpg, la convertir
    if (workshop.image && workshop.image.includes('/files/page/') && !workshop.image.includes('/thumb/')) {
      if (workshop.extId) {
        workshop.image = `https://www.billetweb.fr/files/page/thumb/${workshop.extId}.jpg`;
      } else {
        console.warn('⚠️ Pas d\'extId pour convertir l\'URL de:', workshop.title, '- URL:', workshop.image);
      }
    } else if (workshop.image && !workshop.image.includes('/thumb/')) {
      // Si l'URL n'est pas au bon format mais qu'on a un extId, la convertir quand même
      if (workshop.extId) {
        workshop.image = `https://www.billetweb.fr/files/page/thumb/${workshop.extId}.jpg`;
      }
    }
    // Nettoyer le paramètre ?v= s'il existe (peu importe la valeur)
    if (workshop.image && workshop.image.includes('?v=')) {
      workshop.image = workshop.image.split('?v=')[0];
    }
    return workshop;
  });
}

