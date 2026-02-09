import { getCachedWorkshops, setCachedWorkshops } from './cache.js';
import { convertImageUrls } from '../utils/image-urls.js';
import { sanitizeExtId } from '../utils/security.js';

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
    return [];
  }
  // #region agent log
  const today = new Date(); today.setHours(0,0,0,0);
  const withDate = events.map(e => (e.start || e.start_date || e.date || null)).filter(Boolean);
  (function(pl){if(typeof window!=='undefined'&&window.__debugLogs){window.__debugLogs.push(pl);try{localStorage.setItem('__debugLogs',JSON.stringify(window.__debugLogs));}catch(e){}}})({location:'billetweb-api.js:transformBilletWebData',message:'events before filter',data:{eventsLength:events.length,withDateCount:withDate.length,sampleStart:withDate[0]},timestamp:Date.now(),hypothesisId:'H4_H5'});
  // #endregion

  const defaultImage = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=80';

  return events
    .map(event => {
      // Sanitiser ext_id pour éviter injection XSS / URL malformée (alphanum, tirets, underscores uniquement)
      const safeExtId = sanitizeExtId(event.ext_id);

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

      // Construire l'URL de l'image avec ext_id sanitisé uniquement
      let image = null;
      const apiImageUrl = event.cover || event.image || null;
      if (safeExtId) {
        image = `https://www.billetweb.fr/files/page/thumb/${safeExtId}.jpg`;
      } else if (apiImageUrl || event.ext_id) {
        image = defaultImage;
      } else {
        image = defaultImage;
      }

      // Lien vers la page de l'atelier (ext_id sanitisé pour éviter injection)
      const rawLink = event.shop || event.url || event.booking_url || event.link ||
        (event.id ? `https://www.billetweb.fr/shop.php?event=${safeExtId || event.id}` : null);
      let link = rawLink;
      if (safeExtId) {
        link = `https://www.billetweb.fr/${safeExtId}`;
      } else if (rawLink && rawLink.includes('shop.php?event=')) {
        const slug = rawLink.replace(/^.*shop\.php\?event=([^&]*).*$/i, '$1');
        const safeSlug = sanitizeExtId(slug);
        if (safeSlug && slug !== rawLink) link = `https://www.billetweb.fr/${safeSlug}`;
      }

      // Extraire la disponibilité (nécessite un appel séparé à /api/event/:id/avail)
      const availability = event.remaining || event.available || event.quota || null;

      return {
        id: event.id || null,
        extId: safeExtId || null, // ID externe sanitisé
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
 * Convertit les liens billetterie (shop.php) en lien page de l'atelier (billetweb.fr/slug)
 * @param {Array} workshops - Liste des ateliers
 * @returns {Array} Liste avec liens mis à jour
 */
function convertLinksToEventPage(workshops) {
  if (!Array.isArray(workshops)) return workshops;
  return workshops.map(w => {
    let link = w.link;
    const safeExtId = sanitizeExtId(w.extId);
    if (safeExtId) {
      link = `https://www.billetweb.fr/${safeExtId}`;
    } else if (link && link.includes('shop.php?event=')) {
      const slug = link.replace(/^.*shop\.php\?event=([^&]*).*$/i, '$1');
      const safeSlug = sanitizeExtId(slug);
      if (safeSlug) link = `https://www.billetweb.fr/${safeSlug}`;
    }
    return { ...w, link };
  });
}

/**
 * Récupère les ateliers depuis l'API BilletWeb
 * @returns {Promise<Array>} Liste des événements/ateliers
 */
export async function fetchBilletWebWorkshops() {
  // #region agent log
  if (typeof window !== 'undefined') window.__debugLogs = [];
  // #endregion
  try {
    // #region agent log
    const hasAuthorization = BILLETWEB_CONFIG && BILLETWEB_CONFIG.authorization && BILLETWEB_CONFIG.authorization !== null;
    const hasUserIdAndKey = BILLETWEB_CONFIG && BILLETWEB_CONFIG.userId && BILLETWEB_CONFIG.apiKey;
    const isLocalhost = typeof window !== 'undefined' && /localhost|127\.0\.0\.1/.test(window.location.hostname);
    const useProxy = BILLETWEB_CONFIG && BILLETWEB_CONFIG.proxyUrl && BILLETWEB_CONFIG.proxyUrl.trim() !== '' && !isLocalhost;
    (function(pl){fetch('http://127.0.0.1:7242/ingest/48ad0c73-d731-4873-aa3b-f049104867e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pl)}).catch(()=>{});if(typeof window!=='undefined'){window.__debugLogs.push(pl);try{localStorage.setItem('__debugLogs',JSON.stringify(window.__debugLogs));}catch(e){}}})({location:'billetweb-api.js:fetchBilletWebWorkshops',message:'config and branch',data:{hasCredentials:!!hasUserIdAndKey,useProxy,isLocalhost,hostname:typeof window!=='undefined'?window.location.hostname:''},timestamp:Date.now(),hypothesisId:'H1_H2'});
    // #endregion
    // Vérifier que la configuration est disponible
    if (typeof BILLETWEB_CONFIG === 'undefined') {
      throw new Error('BILLETWEB_CONFIG n\'est pas défini');
    }
    
    // Vérifier que les identifiants sont configurés
    if (!useProxy && !hasAuthorization && !hasUserIdAndKey) {
      throw new Error('Configuration BilletWeb manquante (proxy ou identifiants).');
    }
    
    // Vérifier le cache d'abord (ignorer un cache vide pour permettre un nouveau fetch)
    const cachedData = getCachedWorkshops();
    // #region agent log
    (function(pl){fetch('http://127.0.0.1:7242/ingest/48ad0c73-d731-4873-aa3b-f049104867e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pl)}).catch(()=>{});if(typeof window!=='undefined'){window.__debugLogs.push(pl);try{localStorage.setItem('__debugLogs',JSON.stringify(window.__debugLogs));}catch(e){}}})({location:'billetweb-api.js:cache',message:'cache check',data:{cacheHit:!!cachedData,cachedLength:cachedData?cachedData.length:0},timestamp:Date.now(),hypothesisId:'H3'});
    // #endregion
    if (cachedData && cachedData.length > 0) {
      const withImages = convertImageUrls(cachedData);
      return convertLinksToEventPage(withImages);
    }

    // Construire l'URL de l'API selon la documentation BilletWeb
    // Documentation: https://www.billetweb.fr/bo/api.php?key=2
    // Endpoint: GET /api/events
    // Exemple: https://www.billetweb.fr/api/events?user=1&key=xxx&version=1&past=1
    let apiUrl;
    const headers = {};

    if (useProxy) {
      apiUrl = BILLETWEB_CONFIG.proxyUrl;
    } else {
      let baseUrl = `${BILLETWEB_CONFIG.baseUrl}/events`;
      const params = new URLSearchParams();
      if (hasUserIdAndKey) {
        params.append('user', BILLETWEB_CONFIG.userId);
        params.append('key', BILLETWEB_CONFIG.apiKey);
        params.append('version', BILLETWEB_CONFIG.version || '1');
      } else if (hasAuthorization) {
        headers['Authorization'] = BILLETWEB_CONFIG.authorization;
        params.append('version', BILLETWEB_CONFIG.version || '1');
      }
      params.append('past', '1');
      params.append('online', '1');
      params.append('description', '1');
      if (BILLETWEB_CONFIG.eventId) params.append('event', BILLETWEB_CONFIG.eventId);
      apiUrl = `${baseUrl}?${params.toString()}`;
    }

    // #region agent log
    (function(pl){fetch('http://127.0.0.1:7242/ingest/48ad0c73-d731-4873-aa3b-f049104867e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pl)}).catch(()=>{});if(typeof window!=='undefined'){window.__debugLogs.push(pl);try{localStorage.setItem('__debugLogs',JSON.stringify(window.__debugLogs));}catch(e){}}})({location:'billetweb-api.js:beforeFetch',message:'request target',data:{useProxy,urlFirst50:typeof apiUrl==='string'?apiUrl.substring(0,50):''},timestamp:Date.now(),hypothesisId:'H2'});
    // #endregion
    const response = await fetch(apiUrl, { headers, cache: 'no-store' });

    if (!response.ok) {
      throw new Error('Impossible de charger les ateliers. Veuillez réessayer plus tard.');
    }

    const data = await response.json();
    // #region agent log
    const rawKeys = data && typeof data === 'object' && !Array.isArray(data) ? Object.keys(data) : [];
    const rawEventsCount = Array.isArray(data) ? data.length : (data && (data.events || data.data || data.event || []).length);
    (function(pl){fetch('http://127.0.0.1:7242/ingest/48ad0c73-d731-4873-aa3b-f049104867e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pl)}).catch(()=>{});if(typeof window!=='undefined'){window.__debugLogs.push(pl);try{localStorage.setItem('__debugLogs',JSON.stringify(window.__debugLogs));}catch(e){}}})({location:'billetweb-api.js:afterFetch',message:'response shape',data:{responseOk:response.ok,dataKeys:rawKeys,rawEventsCount,isArray:Array.isArray(data)},timestamp:Date.now(),hypothesisId:'H4'});
    // #endregion
    let transformedData = transformBilletWebData(data);
    // #region agent log
    (function(pl){fetch('http://127.0.0.1:7242/ingest/48ad0c73-d731-4873-aa3b-f049104867e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pl)}).catch(()=>{});if(typeof window!=='undefined'){window.__debugLogs.push(pl);try{localStorage.setItem('__debugLogs',JSON.stringify(window.__debugLogs));}catch(e){}}})({location:'billetweb-api.js:afterTransform',message:'transformed count',data:{transformedLength:transformedData.length,sampleDates:transformedData.slice(0,3).map(w=>w.date)},timestamp:Date.now(),hypothesisId:'H4_H5'});
    // #endregion
    // Convertir les URLs d'images au format correct (même si elles viennent de l'API)
    transformedData = convertImageUrls(transformedData);
    // Liens déjà au format page atelier dans transformBilletWebData
    
    // Mettre en cache uniquement si on a des ateliers (éviter de figer "aucun atelier")
    if (transformedData.length > 0) {
      setCachedWorkshops(transformedData);
    }

    return transformedData;
  } catch (error) {
    // Message générique pour l'utilisateur ; ne pas réexposer les détails techniques
    if (error.message && error.message.includes('Impossible de charger')) {
      throw error;
    }
    throw new Error('Impossible de charger les ateliers. Veuillez réessayer plus tard.');
  }
}

