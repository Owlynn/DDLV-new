// Log de démarrage pour vérifier que le script se charge
console.log('🔵 script.js chargé');

// Vérifier que la configuration BilletWeb est disponible
if (typeof BILLETWEB_CONFIG === 'undefined') {
  console.error('❌ ERREUR: BILLETWEB_CONFIG n\'est pas défini. Assurez-vous que billetweb-config.js est chargé AVANT script.js');
} else {
  console.log('✅ BILLETWEB_CONFIG chargé:', BILLETWEB_CONFIG);
}

// Menu hamburger pour mobile
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔵 DOMContentLoaded déclenché');
  const menuToggle = document.querySelector('.menu-toggle');
  const headerNav = document.querySelector('.header-nav');
  
  if (menuToggle && headerNav) {
    // Créer le bouton hamburger s'il n'existe pas
    if (!menuToggle.innerHTML) {
      menuToggle.innerHTML = '<span></span><span></span><span></span>';
    }
    
    // Créer l'overlay si il n'existe pas
    let menuOverlay = document.querySelector('.menu-overlay');
    if (!menuOverlay) {
      menuOverlay = document.createElement('div');
      menuOverlay.className = 'menu-overlay';
      document.body.appendChild(menuOverlay);
    }
    
    function toggleMenu() {
      const isActive = menuToggle.classList.toggle('active');
      headerNav.classList.toggle('active');
      menuOverlay.classList.toggle('active');
      menuToggle.setAttribute('aria-expanded', isActive);
      
      // Empêcher le scroll du body quand le menu est ouvert
      if (isActive) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
    
    menuToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleMenu();
    });
    
    // Fermer le menu quand on clique sur l'overlay
    menuOverlay.addEventListener('click', function() {
      menuToggle.classList.remove('active');
      headerNav.classList.remove('active');
      menuOverlay.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
    
    // Fermer le menu quand on clique sur un lien
    const menuLinks = headerNav.querySelectorAll('.header-menu-item');
    menuLinks.forEach(link => {
      link.addEventListener('click', function() {
        menuToggle.classList.remove('active');
        headerNav.classList.remove('active');
        menuOverlay.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }
  
});

// ============================================
// CONFIGURATION API BILLETWEB
// ============================================
// La configuration est maintenant dans billetweb-config.js
// Assurez-vous que billetweb-config.js est chargé avant script.js

// Cache pour les données des ateliers
const CACHE_KEY = 'billetweb_workshops';
const CACHE_DURATION = 60 * 60 * 1000; // 1 heure en millisecondes

// Données des ateliers (sera rempli dynamiquement)
let workshops = [];

// Variables pour le calendrier
let currentDate = new Date(); // Date actuelle

// ============================================
// SERVICE API BILLETWEB
// ============================================

/**
 * Récupère les ateliers depuis l'API BilletWeb
 * @returns {Promise<Array>} Liste des événements/ateliers
 */
async function fetchBilletWebWorkshops() {
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
      return cachedData;
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
    const response = await fetch(apiUrl, {
      headers: headers
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
 * Convertit les URLs d'images au format correct
 * @param {Array} workshops - Tableau d'ateliers
 * @returns {Array} Tableau avec URLs converties
 */
function convertImageUrls(workshops) {
  console.log('🔄 Conversion des URLs d\'images pour', workshops.length, 'ateliers');
  return workshops.map(workshop => {
    // Si l'URL est au format /files/page/[id].jpg, la convertir
    if (workshop.image && workshop.image.includes('/files/page/') && !workshop.image.includes('/thumb/')) {
      if (workshop.extId) {
        const oldUrl = workshop.image;
        workshop.image = `https://www.billetweb.fr/files/page/thumb/${workshop.extId}.jpg`;
        console.log('🔧 URL convertie pour:', workshop.title);
        console.log('   Ancienne:', oldUrl);
        console.log('   Nouvelle:', workshop.image);
      } else {
        console.warn('⚠️ Pas d\'extId pour convertir l\'URL de:', workshop.title, '- URL:', workshop.image);
      }
    } else if (workshop.image && !workshop.image.includes('/thumb/')) {
      // Si l'URL n'est pas au bon format mais qu'on a un extId, la convertir quand même
      if (workshop.extId) {
        const oldUrl = workshop.image;
        workshop.image = `https://www.billetweb.fr/files/page/thumb/${workshop.extId}.jpg`;
        console.log('🔧 URL convertie (format différent) pour:', workshop.title);
        console.log('   Ancienne:', oldUrl);
        console.log('   Nouvelle:', workshop.image);
      }
    }
    // Nettoyer le paramètre ?v= s'il existe (peu importe la valeur)
    if (workshop.image && workshop.image.includes('?v=')) {
      workshop.image = workshop.image.split('?v=')[0];
      console.log('🧹 Paramètre ?v= supprimé pour:', workshop.title);
    }
    return workshop;
  });
}

/**
 * Récupère les ateliers depuis le cache
 * @returns {Array|null} Données en cache ou null
 */
function getCachedWorkshops() {
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
function setCachedWorkshops(data) {
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
 * Affiche un indicateur de chargement
 */
function showLoadingState() {
  const listView = document.getElementById('workshops-list-view');
  if (listView) {
    listView.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
        <p style="color: var(--color-primary); font-size: 1.1rem;">Chargement des ateliers...</p>
      </div>
    `;
  }
}

/**
 * Affiche un message d'erreur
 * @param {string} message - Message d'erreur à afficher
 */
function showErrorState(message) {
  const listView = document.getElementById('workshops-list-view');
  if (listView) {
    listView.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
        <p style="color: var(--color-accent); font-size: 1.1rem; margin-bottom: 1rem;">Erreur lors du chargement des ateliers</p>
        <p style="color: var(--color-text-secondary); font-size: 0.9rem;">${message}</p>
      </div>
    `;
  }
}

/**
 * Affiche un message quand aucun atelier n'est disponible
 */
function showEmptyState() {
  const listView = document.getElementById('workshops-list-view');
  if (listView) {
    listView.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
        <p style="color: var(--color-primary); font-size: 1.1rem;">Aucun atelier à venir pour le moment.</p>
        <p style="color: var(--color-text-secondary); font-size: 0.9rem; margin-top: 0.5rem;">Revenez bientôt pour découvrir nos prochains ateliers !</p>
      </div>
    `;
  }
}

/**
 * Divise un titre long en titre et sous-titre
 * @param {string} title - Titre complet
 * @returns {Object} {title: string, subtitle: string|null}
 */
function splitLongTitle(title) {
  if (!title) return { title: '', subtitle: null };
  
  const maxTitleLength = 50; // Longueur maximale pour le titre principal
  
  // Si le titre est court, pas besoin de le diviser
  if (title.length <= maxTitleLength) {
    return { title: title, subtitle: null };
  }
  
  // Chercher un point de division naturel (virgule, tiret, deux-points, etc.)
  const separators = [', ', ' - ', ' : ', ' :', ' – ', ' — '];
  let bestSplitIndex = -1;
  let bestSeparator = '';
  
  for (const separator of separators) {
    const index = title.indexOf(separator);
    if (index > 0 && index < maxTitleLength + 20) {
      // Trouver le séparateur le plus proche de la moitié du titre
      if (bestSplitIndex === -1 || Math.abs(index - title.length / 2) < Math.abs(bestSplitIndex - title.length / 2)) {
        bestSplitIndex = index;
        bestSeparator = separator;
      }
    }
  }
  
  // Si on a trouvé un bon séparateur, diviser là
  if (bestSplitIndex > 0) {
    const mainTitle = title.substring(0, bestSplitIndex).trim();
    const subtitle = title.substring(bestSplitIndex + bestSeparator.length).trim();
    return { title: mainTitle, subtitle: subtitle };
  }
  
  // Sinon, diviser au premier espace après maxTitleLength
  const spaceIndex = title.indexOf(' ', maxTitleLength);
  if (spaceIndex > 0) {
    return {
      title: title.substring(0, spaceIndex).trim(),
      subtitle: title.substring(spaceIndex + 1).trim()
    };
  }
  
  // Dernier recours : diviser à maxTitleLength
  return {
    title: title.substring(0, maxTitleLength).trim() + '...',
    subtitle: title.substring(maxTitleLength).trim()
  };
}

/**
 * Génère le HTML d'une carte d'atelier
 * @param {Object} workshop - Données de l'atelier
 * @returns {string} HTML de la carte
 */
function generateWorkshopCard(workshop) {
  // Diviser le titre si nécessaire
  const { title: mainTitle, subtitle } = splitLongTitle(workshop.title);
  
  // Formater la date en français
  let formattedDate = '';
  if (workshop.date) {
    const date = new Date(workshop.date);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    formattedDate = date.toLocaleDateString('fr-FR', options);
    // Capitaliser la première lettre
    formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  }

  const availabilityInfo = workshop.availability !== null 
    ? `<p class="workshop-availability">🎫 ${workshop.availability} place${workshop.availability > 1 ? 's' : ''} disponible${workshop.availability > 1 ? 's' : ''}</p>`
    : '';

  const linkAttr = workshop.link ? `onclick="window.open('${workshop.link}', '_blank')" style="cursor: pointer;"` : '';

  // Vérifier que l'image existe
  const defaultImage = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=80';
  let imageUrl = workshop.image || defaultImage;
  
  // Nettoyer le paramètre ?v= s'il existe dans l'URL
  if (imageUrl.includes('?v=')) {
    imageUrl = imageUrl.split('?v=')[0];
    console.log('🧹 Paramètre ?v= supprimé de l\'URL pour:', workshop.title);
  }
  
  // Créer l'URL de fallback .png si l'URL actuelle est en .jpg
  let fallbackPngUrl = null;
  if (imageUrl && imageUrl.includes('/thumb/') && imageUrl.endsWith('.jpg')) {
    fallbackPngUrl = imageUrl.replace('.jpg', '.png');
  }
  
  console.log('Génération carte pour:', workshop.title, '- Image URL:', imageUrl);
  if (fallbackPngUrl) {
    console.log('  Fallback PNG:', fallbackPngUrl);
  }
  
  // Utiliser un fallback CSS pour les images 404
  // Ordre: .jpg en premier, puis .png, puis image par défaut
  const backgroundImageUrls = fallbackPngUrl 
    ? `url('${imageUrl}'), url('${fallbackPngUrl}'), url('${defaultImage}')`
    : `url('${imageUrl}'), url('${defaultImage}')`;
  
  return `
    <div class="card card-workshop" ${linkAttr}>
      <div class="workshop-image" style="background-image: ${backgroundImageUrls};"></div>
      <div class="workshop-content">
        <div class="workshop-content-wrapper">
          <h3 class="workshop-title">${mainTitle}</h3>
          ${subtitle ? `<p class="workshop-subtitle">${subtitle}</p>` : ''}
          ${formattedDate ? `<p class="workshop-date">📅 ${formattedDate}${workshop.time ? `, ${workshop.time}` : ''}</p>` : ''}
          <p class="workshop-location">📍 ${workshop.location && workshop.location.length > 40 ? workshop.location.substring(0, 40) + '...' : workshop.location}</p>
          ${availabilityInfo}
        </div>
      </div>
      <div class="workshop-overlay">
        <span class="workshop-overlay-text">${workshop.link ? 'Réserver' : 'En savoir plus'}</span>
      </div>
    </div>
  `;
}

/**
 * Rend la liste des ateliers dans la vue liste
 * @param {Array} workshopsData - Données des ateliers
 */
function renderWorkshopsList(workshopsData) {
  const listView = document.getElementById('workshops-list-view');
  if (!listView) return;

  if (workshopsData.length === 0) {
    showEmptyState();
    return;
  }

  listView.innerHTML = workshopsData.map(workshop => generateWorkshopCard(workshop)).join('');
}

/**
 * Force le rafraîchissement des données (ignore le cache)
 * Exposée globalement pour pouvoir être appelée depuis la console
 */
function clearCache() {
  localStorage.removeItem(CACHE_KEY);
  console.log('🗑️ Cache vidé');
}

// Exposer la fonction globalement pour faciliter le débogage
window.clearBilletWebCache = clearCache;
window.refreshWorkshops = () => loadWorkshops(true);

/**
 * Charge et affiche les ateliers
 * @param {boolean} forceRefresh - Si true, ignore le cache et force le rafraîchissement
 */
async function loadWorkshops(forceRefresh = false) {
  console.log('🔵 loadWorkshops() appelée, forceRefresh:', forceRefresh);
  const listView = document.getElementById('workshops-list-view');
  if (!listView) {
    console.warn('⚠️ workshops-list-view non trouvé, on n\'est probablement pas sur la page ateliers');
    return; // Si on n'est pas sur la page ateliers
  }
  console.log('✅ workshops-list-view trouvé');

  // Vider le cache si on force le rafraîchissement
  if (forceRefresh) {
    clearCache();
  }

  showLoadingState();
  console.log('🔵 État de chargement affiché');

  try {
    const workshopsData = await fetchBilletWebWorkshops();
    workshops = workshopsData;
    renderWorkshopsList(workshops);
    
    // Mettre à jour le calendrier si nécessaire
    const calendarView = document.getElementById('calendar-view');
    if (calendarView && calendarView.style.display !== 'none') {
      renderCalendar();
    }
  } catch (error) {
    console.error('Erreur lors du chargement des ateliers:', error);
    showErrorState(error.message || 'Une erreur est survenue. Veuillez réessayer plus tard.');
  }
}

// Basculement entre liste et calendrier
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔵 DOMContentLoaded - Section ateliers');
  // Charger les ateliers au chargement de la page
  console.log('🔵 Appel de loadWorkshops()...');
  loadWorkshops();

  const viewToggleBtn = document.querySelector('.view-toggle-btn');
  const listView = document.getElementById('workshops-list-view');
  const calendarView = document.getElementById('calendar-view');
  const toggleLeft = document.querySelector('.view-toggle-left');
  const toggleRight = document.querySelector('.view-toggle-right');

  // Nouveau système de toggle
  if (viewToggleBtn && toggleLeft && toggleRight) {
    viewToggleBtn.addEventListener('click', function(e) {
      const target = e.target.closest('.view-toggle-part');
      if (!target) return;
      
      const view = target.getAttribute('data-view');
      
      // Mettre à jour les classes active
      toggleLeft.classList.toggle('active', view === 'list');
      toggleRight.classList.toggle('active', view === 'calendar');
      
      if (view === 'list') {
        listView.style.display = 'flex';
        calendarView.style.display = 'none';
      } else {
        listView.style.display = 'none';
        calendarView.style.display = 'block';
        renderCalendar();
      }
    });
  }

  // Initialiser le calendrier si nécessaire
  if (calendarView && calendarView.style.display === 'block') {
    renderCalendar();
  }

  // Navigation du calendrier
  const prevMonthBtn = document.getElementById('prev-month');
  const nextMonthBtn = document.getElementById('next-month');
  
  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', function() {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar();
    });
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', function() {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar();
    });
  }
});

// Rendu du calendrier
function renderCalendar() {
  const calendarGrid = document.getElementById('calendar-grid');
  const monthTitle = document.getElementById('month-title');
  
  if (!calendarGrid || !monthTitle) return; // Si on n'est pas sur une page avec calendrier
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Mise à jour du titre
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  monthTitle.textContent = `${monthNames[month]} ${year}`;
  
  // Premier jour du mois et nombre de jours
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  // Jours de la semaine
  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  
  // Génération du calendrier
  calendarGrid.innerHTML = '';
  
  // En-têtes des jours
  weekDays.forEach(day => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day-header';
    dayHeader.textContent = day;
    calendarGrid.appendChild(dayHeader);
  });
  
  // Jours vides au début
  for (let i = 0; i < startingDayOfWeek; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'calendar-day empty';
    calendarGrid.appendChild(emptyDay);
  }
  
  // Jours du mois
  for (let day = 1; day <= daysInMonth; day++) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayWorkshops = workshops.filter(w => w.date === dateStr);
    
    dayElement.innerHTML = `<span class="day-number">${day}</span>`;
    
    if (dayWorkshops.length > 0) {
      dayElement.classList.add('has-workshop');
      const workshop = dayWorkshops[0];
      dayElement.setAttribute('data-workshop-title', workshop.title);
      
      // Ajouter le contenu de l'atelier
      dayElement.innerHTML += `
        <div class="workshop-indicator" title="${workshop.title}">${workshop.title}</div>
        <div class="workshop-overlay">
          <span class="workshop-overlay-text">${workshop.link ? 'Réserver' : 'En savoir plus'}</span>
        </div>
      `;
      
      // Ajouter le gestionnaire de clic pour rediriger vers billet web
      if (workshop.link) {
        dayElement.setAttribute('data-workshop-link', workshop.link);
        dayElement.style.cursor = 'pointer';
        dayElement.addEventListener('click', function() {
          window.open(workshop.link, '_blank');
        });
      }
    }
    
    calendarGrid.appendChild(dayElement);
  }
}

// Navigation par sections avec scroll automatique
document.addEventListener('DOMContentLoaded', function() {
  const tocLinks = document.querySelectorAll('.article-toc-link');
  const sections = document.querySelectorAll('.article-section');
  
  if (tocLinks.length === 0) return; // Si on n'est pas sur la page avec le sommaire
  
  // Fonction pour mettre à jour le lien actif dans le TOC
  // Peut utiliser soit data-section, soit l'ID de la section (via href)
  function updateActiveLink(sectionId) {
    // Mettre à jour les liens
    tocLinks.forEach(link => {
      link.classList.remove('active');
      const linkSection = link.getAttribute('data-section');
      const linkHref = link.getAttribute('href');
      
      // Vérifier si le data-section correspond
      if (linkSection === sectionId) {
        link.classList.add('active');
      }
      // Vérifier si le href correspond à l'ID de la section (pour les sections individuelles)
      else if (linkHref && linkHref.startsWith('#') && linkHref.substring(1) === sectionId) {
        link.classList.add('active');
      }
    });
    
    // Mettre à jour les boutons
    const allTocButtons = document.querySelectorAll('.article-toc-button');
    allTocButtons.forEach(button => {
      button.classList.remove('active');
      const buttonSection = button.getAttribute('data-section');
      if (buttonSection === sectionId) {
        button.classList.add('active');
      }
    });
  }
  
  // Gérer les clics sur les liens du sommaire - scroll vers la section
  tocLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const sectionId = this.getAttribute('data-section');
      const href = this.getAttribute('href');
      let targetSection = null;
      
      // Si data-section pointe vers une section principale (calendrier, formats-d-ateliers)
      if (sectionId) {
        targetSection = document.getElementById(sectionId);
      }
      
      // Si href pointe vers une section individuelle (ateliers-focus, etc.)
      if (!targetSection && href && href.startsWith('#')) {
        const targetId = href.substring(1);
        targetSection = document.getElementById(targetId);
      }
      
      if (targetSection) {
        const headerHeight = document.querySelector('.site-nav')?.offsetHeight || 0;
        const articleTocHeight = document.querySelector('.article-toc')?.offsetHeight || 0;
        const offset = headerHeight + 20; // Offset pour le header + marge
        const sectionPosition = targetSection.getBoundingClientRect().top + window.pageYOffset;
        const sectionTop = sectionPosition - offset;
        
        window.scrollTo({
          top: sectionTop,
          behavior: 'smooth'
        });
        
        // Mettre à jour le lien actif immédiatement
        // Utiliser l'ID de la section cible plutôt que data-section
        const targetId = targetSection.id;
        updateActiveLink(targetId);
      }
    });
  });
  
  // Détection automatique de la section visible au scroll avec Intersection Observer
  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -60% 0px', // La section est considérée active quand elle est dans le tiers supérieur de la fenêtre
    threshold: 0
  };
  
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const sectionId = entry.target.id;
        if (sectionId) {
          updateActiveLink(sectionId);
        }
      }
    });
  }, observerOptions);
  
  // Observer toutes les sections
  sections.forEach(section => {
    if (section.id) {
      observer.observe(section);
    }
  });
  
  // Observer aussi les sections principales (calendrier, formats-d-ateliers) si elles existent
  const calendrierSection = document.getElementById('calendrier');
  const formatsSection = document.getElementById('formats-d-ateliers');
  if (calendrierSection) observer.observe(calendrierSection);
  if (formatsSection) observer.observe(formatsSection);
  
  // Mettre à jour le lien actif au chargement de la page selon la position du scroll
  function setInitialActiveLink() {
    const scrollPosition = window.pageYOffset;
    const headerHeight = document.querySelector('.site-nav')?.offsetHeight || 0;
    const offset = headerHeight + 100; // Offset pour déterminer quelle section est visible
    
    // Vérifier d'abord les sections individuelles
    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];
      if (!section.id) continue;
      const sectionTop = section.getBoundingClientRect().top + scrollPosition;
      
      if (scrollPosition + offset >= sectionTop) {
        updateActiveLink(section.id);
        return;
      }
    }
    
    // Sinon vérifier les sections principales
    if (formatsSection) {
      const formatsTop = formatsSection.getBoundingClientRect().top + scrollPosition;
      if (scrollPosition + offset >= formatsTop) {
        updateActiveLink('formats-d-ateliers');
        return;
      }
    }
    
    if (calendrierSection) {
      const calendrierTop = calendrierSection.getBoundingClientRect().top + scrollPosition;
      if (scrollPosition + offset >= calendrierTop) {
        updateActiveLink('calendrier');
      }
    }
  }
  
  // Appeler au chargement et après un court délai pour s'assurer que le DOM est prêt
  setTimeout(setInitialActiveLink, 100);
});

// Gestion de l'affichage/masquage des sections calendrier et formats-d-ateliers
document.addEventListener('DOMContentLoaded', function() {
  const calendrierSection = document.getElementById('calendrier');
  const formatsSection = document.getElementById('formats-d-ateliers');
  const tocLinks = document.querySelectorAll('.article-toc-link[data-section]');
  const tocButton = document.querySelector('.article-toc-button[data-section]');
  
  // Si on n'est pas sur la page ateliers, ne rien faire
  if (!calendrierSection || !formatsSection) return;
  
  // Fonction pour réinitialiser l'observer quand on affiche formats-d-ateliers
  function reinitObserver() {
    // Récupérer l'observer existant ou en créer un nouveau
    const sections = document.querySelectorAll('#formats-d-ateliers .article-section');
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    };
    
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          if (sectionId) {
            // Mettre à jour le lien actif dans le TOC
            const allTocLinks = document.querySelectorAll('.article-toc-link');
            allTocLinks.forEach(link => {
              link.classList.remove('active');
              const linkHref = link.getAttribute('href');
              if (linkHref && linkHref.startsWith('#') && linkHref.substring(1) === sectionId) {
                link.classList.add('active');
              }
            });
          }
        }
      });
    }, observerOptions);
    
    // Observer toutes les sections d'ateliers
    sections.forEach(section => {
      if (section.id) {
        observer.observe(section);
      }
    });
  }
  
  // Fonction pour afficher une section et masquer l'autre
  function showSection(sectionName) {
    if (sectionName === 'calendrier') {
      calendrierSection.style.display = 'block';
      formatsSection.style.display = 'none';
    } else if (sectionName === 'formats-d-ateliers') {
      calendrierSection.style.display = 'none';
      formatsSection.style.display = 'block';
      // Réinitialiser l'observer quand on affiche la section formats
      setTimeout(reinitObserver, 100);
    }
  }
  
  // Gérer le clic sur le bouton "Voir les prochains ateliers"
  if (tocButton) {
    tocButton.addEventListener('click', function(e) {
      e.preventDefault();
      const sectionName = this.getAttribute('data-section');
      
      // Mettre à jour les classes actives
      tocLinks.forEach(l => l.classList.remove('active'));
      const allTocButtons = document.querySelectorAll('.article-toc-button');
      allTocButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Afficher la section correspondante
      showSection(sectionName);
      
      // S'assurer que la vue liste est active
      const listView = document.getElementById('workshops-list-view');
      const calendarView = document.getElementById('calendar-view');
      const toggleLeft = document.querySelector('.view-toggle-left');
      const toggleRight = document.querySelector('.view-toggle-right');
      
      if (listView && calendarView && toggleLeft && toggleRight) {
        listView.style.display = 'flex';
        calendarView.style.display = 'none';
        toggleLeft.classList.add('active');
        toggleRight.classList.remove('active');
      }
      
      // Scroller jusqu'en haut de la page
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }, 200);
    });
  }
  
  // Gérer les clics sur les liens du TOC
  tocLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const sectionName = this.getAttribute('data-section');
      
      // Mettre à jour les classes actives
      tocLinks.forEach(l => l.classList.remove('active'));
      const allTocButtons = document.querySelectorAll('.article-toc-button');
      allTocButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Afficher la section correspondante
      showSection(sectionName);
      
      // Si on clique sur un format d'atelier, scroller vers la section correspondante
      if (sectionName === 'formats-d-ateliers') {
        const targetId = this.getAttribute('href');
        if (targetId && targetId.startsWith('#')) {
          const targetElement = document.getElementById(targetId.substring(1));
          if (targetElement) {
            setTimeout(() => {
              const headerHeight = document.querySelector('.site-nav')?.offsetHeight || 0;
              const offset = headerHeight + 20;
              const sectionPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
              const sectionTop = sectionPosition - offset;
              
              window.scrollTo({
                top: sectionTop,
                behavior: 'smooth'
              });
              
              // Mettre à jour le lien actif après le scroll
              setTimeout(() => {
                const allTocLinks = document.querySelectorAll('.article-toc-link');
                allTocLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
              }, 500);
            }, 100);
          }
        }
      }
    });
  });
  
  // Le toggle vue liste/calendrier doit afficher la section calendrier
  const viewToggleBtn = document.querySelector('.view-toggle-btn');
  if (viewToggleBtn) {
    viewToggleBtn.addEventListener('click', function(e) {
      const target = e.target.closest('.view-toggle-part');
      if (!target) return;
      
      // S'assurer que la section calendrier est visible
      showSection('calendrier');
      
      // Mettre à jour le bouton actif dans le TOC
      const allTocLinks = document.querySelectorAll('.article-toc-link');
      allTocLinks.forEach(l => l.classList.remove('active'));
      const allTocButtons = document.querySelectorAll('.article-toc-button');
      allTocButtons.forEach(b => b.classList.remove('active'));
      const calendrierButton = document.querySelector('.article-toc-button[data-section="calendrier"]');
      if (calendrierButton) {
        calendrierButton.classList.add('active');
      }
    });
  }
  
  // Gérer les clics sur les boutons "Voir les prochains ateliers" dans les descriptions
  const seeWorkshopsButtons = document.querySelectorAll('.atelier-see-workshops-btn');
  seeWorkshopsButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const sectionName = this.getAttribute('data-section');
      
      // Afficher la section calendrier
      showSection(sectionName);
      
      // S'assurer que la vue liste est active
      const listView = document.getElementById('workshops-list-view');
      const calendarView = document.getElementById('calendar-view');
      const toggleLeft = document.querySelector('.view-toggle-left');
      const toggleRight = document.querySelector('.view-toggle-right');
      
      if (listView && calendarView && toggleLeft && toggleRight) {
        listView.style.display = 'flex';
        calendarView.style.display = 'none';
        toggleLeft.classList.add('active');
        toggleRight.classList.remove('active');
      }
      
      // Mettre à jour le bouton actif dans le TOC
      const allTocLinks = document.querySelectorAll('.article-toc-link');
      allTocLinks.forEach(l => l.classList.remove('active'));
      const allTocButtons = document.querySelectorAll('.article-toc-button');
      allTocButtons.forEach(b => b.classList.remove('active'));
      const calendrierButton = document.querySelector('.article-toc-button[data-section="calendrier"]');
      if (calendrierButton) {
        calendrierButton.classList.add('active');
      }
      
      // Scroller jusqu'en haut de la page
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }, 200);
    });
  });
});