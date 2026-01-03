import { convertImageUrls } from '../utils/image-urls.js';

const CACHE_KEY = 'billetweb_workshops';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Récupère les ateliers depuis le cache
 * @returns {Array|null} Données en cache ou null
 */
export function getCachedWorkshops() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();

    // Vérifier si le cache est encore valide
    if (now - timestamp < CACHE_DURATION) {
      // Convertir les URLs même si elles sont en cache
      return convertImageUrls(data);
    }

    // Cache expiré
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch (error) {
    console.error('Erreur lors de la lecture du cache:', error);
    return null;
  }
}

/**
 * Met en cache les ateliers
 * @param {Array} data - Données à mettre en cache
 */
export function setCachedWorkshops(data) {
  try {
    const cacheData = {
      data: data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Erreur lors de la mise en cache:', error);
  }
}

/**
 * Force le rafraîchissement des données (ignore le cache)
 */
export function clearCache() {
  localStorage.removeItem(CACHE_KEY);
  console.log('🗑️ Cache vidé');
}

