import { getCachedWorkshops, setCachedWorkshops } from './cache.js';
import { convertImageUrls } from '../utils/image-urls.js';

/**
 * Transforme les données BilletWeb au format attendu par l'application
 * @param {Object|Array} apiData - Données brutes de l'API BilletWeb
 * @returns {Array} Tableau d'ateliers au format interne
 */
function transformBilletWebData(apiData) {
  // Si apiData est déjà un tableau, l'utiliser directement
  // Sinon, extraire les événements depuis la structure de réponse
  let events = Array.isArray(apiData) ? apiData : (apiData.events || apiData.data || []);
  
  if (!Array.isArray(events)) {
    console.warn('Format de données API inattendu:', apiData);
    console.warn('Type reçu:', typeof apiData, 'Est un tableau?', Array.isArray(apiData));
    return [];
  }

  return events
    .map(event => {
      // Extraire la date de début selon la documentation BilletWeb
      // Format attendu: "2015-12-31 20:00:00"
      const startDate = event.start || event.start_date || event.date || null;
      const endDate = event.end || event.end_date || null;
      
      // Formater la date au format YYYY-MM-DD
      let dateStr = null;
      let timeStr = null;
      
      if (startDate) {
        // Parser la date au format BilletWeb: "2015-12-31 20:00:00"
        const date = new Date(startDate.replace(' ', 'T')); // Convertir en format ISO pour le parsing
        if (!isNaN(date.getTime())) {
          dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
          
          // Extraire l'heure (format français: "20h00")
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          
          if (endDate) {
            const endDateObj = new Date(endDate.replace(' ', 'T'));
            if (!isNaN(endDateObj.getTime())) {
              const endHours = String(endDateObj.getHours()).padStart(2, '0');
              const endMinutes = String(endDateObj.getMinutes()).padStart(2, '0');
              // Format: "20h00-23h00"
              timeStr = `${hours}h${minutes}-${endHours}h${endMinutes}`;
            } else {
              timeStr = `${hours}h${minutes}`;
            }
          } else {
            timeStr = `${hours}h${minutes}`;
          }
        }
      }

      // Extraire le lieu selon la documentation BilletWeb
      const location = event.place || event.location || event.address || event.venue || 'Lieu à confirmer';

      // Construire l'URL de l'image au format correct
      // Format attendu: "https://www.billetweb.fr/files/page/thumb/[ext_id].jpg" avec fallback .png
      let image = null;
      
      // Si l'API retourne une URL (image ou cover), la convertir au bon format
      const apiImageUrl = event.cover || event.image || null;
      
      if (apiImageUrl && event.ext_id) {
        // Convertir l'URL reçue de l'API au format correct avec ext_id
        // On utilise .jpg en premier, .png sera en fallback via CSS
        // Exemple: "https://www.billetweb.fr/files/page/1306200.jpg" 
        // -> "https://www.billetweb.fr/files/page/thumb/improvisation-vocale-chant-improvise-les-ateliers-focus3.jpg"
        image = `https://www.billetweb.fr/files/page/thumb/${event.ext_id}.jpg`;
      } else if (event.ext_id) {
        // Si pas d'URL dans l'API mais qu'on a l'ext_id, construire directement
        image = `https://www.billetweb.fr/files/page/thumb/${event.ext_id}.jpg`;
      } else {
        // Fallback: utiliser une image par défaut si pas d'ext_id
        image = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=80';
      }

      // Extraire le lien de réservation (shop dans la doc BilletWeb)
      const link = event.shop || event.url || event.booking_url || event.link || 
                  (event.id ? `https://www.billetweb.fr/shop.php?event=${event.ext_id || event.id}` : null);

      // Extraire la disponibilité (nécessite un appel séparé à /api/event/:id/avail)
      const availability = event.remaining || event.available || event.quota || null;

      return {
        id: event.id || null,
        extId: event.ext_id || null, // ID externe de l'événement
        title: event.name || event.title || 'Atelier sans titre',
        date: dateStr,
        time: timeStr || 'Horaires à confirmer',
        location: location,
        image: image,
        description: event.description || event.desc || null,
        link: link,
        availability: availability
      };
    })
    .filter(workshop => {
      // Filtrer uniquement les ateliers futurs
      if (!workshop.date) return false;
      const workshopDate = new Date(workshop.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return workshopDate >= today;
    })
    .sort((a, b) => {
      // Trier par date croissante
      if (!a.date || !b.date) return 0;
      return new Date(a.date) - new Date(b.date);
    });
}

/**
 * Récupère les ateliers depuis l'API BilletWeb
 * @returns {Promise<Array>} Liste des événements/ateliers
 */
export async function fetchBilletWebWorkshops() {
  try {
    // Vérifier que la configuration est disponible
    if (typeof BILLETWEB_CONFIG === 'undefined') {
      throw new Error('BILLETWEB_CONFIG n\'est pas défini');
    }
    
    // Vérifier que les identifiants sont configurés
    const hasAuthorization = BILLETWEB_CONFIG.authorization && BILLETWEB_CONFIG.authorization !== null;
    const hasUserIdAndKey = BILLETWEB_CONFIG.userId && BILLETWEB_CONFIG.apiKey;
    
    if (!hasAuthorization && !hasUserIdAndKey) {
      throw new Error('Les identifiants BilletWeb ne sont pas configurés. Vérifiez que secrets.local.js contient BILLETWEB.USER_ID et BILLETWEB.API_KEY');
    }
    
    // Vérifier le cache d'abord
    const cachedData = getCachedWorkshops();
    if (cachedData) {
      // Convertir les URLs même si elles sont en cache
      return convertImageUrls(cachedData);
    }

    // Construire l'URL de l'API selon la documentation BilletWeb
    // Documentation: https://www.billetweb.fr/bo/api.php?key=2
    // Endpoint: GET /api/events
    // Exemple: https://www.billetweb.fr/api/events?user=1&key=xxx&version=1&past=1
    let apiUrl = `${BILLETWEB_CONFIG.baseUrl}/events`;
    const params = new URLSearchParams();
    
    // Préparer les headers pour la requête
    const headers = {};

    // Authentification : utiliser paramètres URL (évite les problèmes CORS)
    // IMPORTANT: L'authentification via header Authorization déclenche une requête preflight CORS
    // que l'API BilletWeb ne supporte pas depuis le navigateur. On utilise donc les paramètres URL.
    // Selon la doc BilletWeb: user=[user]&key=[key]&version=1
    if (hasUserIdAndKey) {
      // Utiliser l'authentification via paramètres URL (méthode recommandée pour éviter CORS)
      params.append('user', BILLETWEB_CONFIG.userId);
      params.append('key', BILLETWEB_CONFIG.apiKey);
      params.append('version', BILLETWEB_CONFIG.version || '1');
      console.log('🔐 Authentification via paramètres URL (évite CORS)');
    } else if (hasAuthorization) {
      // Fallback: utiliser Authorization header si pas de userId/apiKey
      // Note: Cela peut causer des erreurs CORS depuis le navigateur
      headers['Authorization'] = BILLETWEB_CONFIG.authorization;
      params.append('version', BILLETWEB_CONFIG.version || '1');
      console.log('🔐 Authentification via header Authorization (peut causer CORS)');
    }

    // Paramètres optionnels selon la documentation BilletWeb :
    // - past: inclure les événements passés (1 ou 0, 0 par défaut)
    // - online: inclure uniquement les événements publiés (1 ou 0, 0 par défaut)
    // - description: inclure la description (1 ou 0, 0 par défaut)
    params.append('past', '1'); // Inclure les événements passés pour tester
    params.append('online', '1'); // Seulement les événements publiés
    params.append('description', '1'); // Inclure la description

    // Ajouter l'ID d'événement si spécifié
    if (BILLETWEB_CONFIG.eventId) {
      params.append('event', BILLETWEB_CONFIG.eventId);
    }

    apiUrl += `?${params.toString()}`;
    
    // Logs de débogage
    console.log('🌐 Appel API BilletWeb:', apiUrl.replace(/key=[^&]+/, 'key=***'));
    console.log('📋 Headers:', Object.keys(headers).length > 0 ? 'Authorization header présent' : 'Aucun header');

    // Effectuer la requête avec les headers
    // cache: 'no-store' empêche le navigateur de mettre en cache la réponse HTTP
    const response = await fetch(apiUrl, {
      headers: headers,
      cache: 'no-store'
    });
    
    console.log('📡 Réponse API - Status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur API - Status:', response.status);
      console.error('❌ Erreur API - Réponse:', errorText);
      throw new Error(`Erreur API: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Données reçues de l\'API:', Array.isArray(data) ? `${data.length} événement(s)` : 'Format inattendu', data);
    
    // Transformer les données
    let transformedData = transformBilletWebData(data);
    console.log('🔄 Données transformées:', transformedData.length, 'atelier(s)');
    
    // Convertir les URLs d'images au format correct (même si elles viennent de l'API)
    transformedData = convertImageUrls(transformedData);
    
    // Mettre en cache
    setCachedWorkshops(transformedData);
    
    return transformedData;
  } catch (error) {
    console.error('Erreur lors de la récupération des ateliers:', error);
    throw error;
  }
}

