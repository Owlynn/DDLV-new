import { getCachedWorkshops, setCachedWorkshops } from './cache.js';
import { convertImageUrls } from '../utils/image-urls.js';

/**
 * Transforme les données BilletWeb au format attendu par l'application
 * @param {Object|Array} apiData - Données brutes de l'API BilletWeb
 * @returns {Array} Tableau d'ateliers au format interne
 */
function transformBilletWebData(apiData) {
  console.log('Transformation des données - Type:', typeof apiData, 'Est un tableau?', Array.isArray(apiData));
  console.log('Données brutes:', apiData);
  
  // Si apiData est déjà un tableau, l'utiliser directement
  // Sinon, extraire les événements depuis la structure de réponse
  let events = Array.isArray(apiData) ? apiData : (apiData.events || apiData.data || []);
  
  if (!Array.isArray(events)) {
    console.warn('Format de données API inattendu:', apiData);
    console.warn('Type reçu:', typeof apiData, 'Est un tableau?', Array.isArray(apiData));
    return [];
  }
  
  console.log('Nombre d\'événements à transformer:', events.length);
  if (events.length > 0) {
    console.log('Premier événement (exemple):', events[0]);
    console.log('ext_id du premier événement:', events[0].ext_id);
    console.log('id du premier événement:', events[0].id);
    console.log('Champs image disponibles dans le premier événement:', {
      image: events[0].image,
      cover: events[0].cover,
      picture: events[0].picture,
      photo: events[0].photo
    });
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
        console.log('✅ URL image convertie depuis ext_id pour:', event.name || event.title);
        console.log('   URL originale:', apiImageUrl);
        console.log('   URL convertie:', image);
      } else if (event.ext_id) {
        // Si pas d'URL dans l'API mais qu'on a l'ext_id, construire directement
        image = `https://www.billetweb.fr/files/page/thumb/${event.ext_id}.jpg`;
        console.log('✅ Image construite depuis ext_id pour:', event.name || event.title, '- URL:', image);
      } else {
        // Fallback: utiliser une image par défaut si pas d'ext_id
        image = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=80';
        console.log('⚠️ Pas d\'ext_id pour l\'événement:', event.name || event.title, '- Utilisation de l\'image par défaut');
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
  console.log('🔵 fetchBilletWebWorkshops() appelée');
  try {
    // Vérifier que la configuration est disponible
    if (typeof BILLETWEB_CONFIG === 'undefined') {
      throw new Error('BILLETWEB_CONFIG n\'est pas défini');
    }
    console.log('✅ Configuration disponible');
    
    // Vérifier le cache d'abord
    const cachedData = getCachedWorkshops();
    if (cachedData) {
      console.log('✅ Données trouvées dans le cache');
      console.log('ℹ️ Pour voir les données fraîches de l\'API, videz le cache avec: clearCache() dans la console');
      // Convertir les URLs même si elles sont en cache
      return convertImageUrls(cachedData);
    }
    console.log('ℹ️ Pas de données en cache, appel API...');

    // Construire l'URL de l'API selon la documentation BilletWeb
    // https://www.billetweb.fr/bo/api.php
    let apiUrl = `${BILLETWEB_CONFIG.baseUrl}/events`;
    const params = new URLSearchParams();
    
    // Préparer les headers pour la requête
    // Note: Pour une requête GET, on n'a pas besoin de Content-Type
    const headers = {};

    // Authentification : utiliser Authorization header si fourni, sinon paramètres URL
    // Selon la doc BilletWeb, les deux méthodes sont supportées
    if (BILLETWEB_CONFIG.authorization) {
      // Utiliser l'authentification via header Authorization
      // Format: "Basic [base64_token]" où token = "User : [user] Key :[key]"
      headers['Authorization'] = BILLETWEB_CONFIG.authorization;
      // Ajouter seulement la version dans les paramètres
      params.append('version', BILLETWEB_CONFIG.version || '1');
      console.log('Utilisation de l\'authentification via header Authorization');
    } else {
      // Utiliser l'authentification via paramètres URL (méthode par défaut)
      params.append('user', BILLETWEB_CONFIG.userId);
      params.append('key', BILLETWEB_CONFIG.apiKey);
      params.append('version', BILLETWEB_CONFIG.version || '1');
      console.log('Utilisation de l\'authentification via paramètres URL');
    }

    // Paramètres optionnels selon la documentation BilletWeb :
    // - past: inclure les événements passés (1 ou 0, 0 par défaut)
    // - online: inclure uniquement les événements publiés (1 ou 0, 0 par défaut)
    // - description: inclure la description (1 ou 0, 0 par défaut)
    // 
    // Pour tester, on peut mettre past=1 pour voir tous les événements
    params.append('past', '1'); // Inclure les événements passés pour tester
    params.append('online', '1'); // Seulement les événements publiés
    params.append('description', '1'); // Inclure la description

    // Ajouter l'ID d'événement si spécifié
    if (BILLETWEB_CONFIG.eventId) {
      params.append('event', BILLETWEB_CONFIG.eventId);
    }

    apiUrl += `?${params.toString()}`;

    // Log pour débogage
    console.log('URL de l\'API:', apiUrl);
    console.log('Headers:', headers);

    // Effectuer la requête avec les headers
    // cache: 'no-store' empêche le navigateur de mettre en cache la réponse HTTP
    const response = await fetch(apiUrl, {
      headers: headers,
      cache: 'no-store'
    });
    
    console.log('Statut de la réponse:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur API - Réponse:', errorText);
      throw new Error(`Erreur API: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Données reçues de l\'API:', data);
    console.log('Type de données:', Array.isArray(data) ? 'Array' : typeof data);
    
    // Transformer les données
    let transformedData = transformBilletWebData(data);
    console.log('Données transformées:', transformedData);
    console.log('Nombre d\'ateliers transformés:', transformedData.length);
    
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

