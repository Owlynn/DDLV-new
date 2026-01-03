import { escapeHtml, validateUrl } from '../utils/security.js';

// Données des ateliers (sera rempli dynamiquement)
let workshops = [];

/**
 * Affiche un indicateur de chargement
 */
export function showLoadingState() {
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
export function showErrorState(message) {
  const listView = document.getElementById('workshops-list-view');
  if (listView) {
    // Utiliser textContent pour éviter les injections XSS
    listView.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
        <p style="color: var(--color-accent); font-size: 1.1rem; margin-bottom: 1rem;">Erreur lors du chargement des ateliers</p>
        <p style="color: var(--color-text-secondary); font-size: 0.9rem;"></p>
      </div>
    `;
    // Injecter le message de manière sécurisée avec textContent
    const messageElement = listView.querySelector('p:last-child');
    if (messageElement) {
      messageElement.textContent = message || 'Une erreur est survenue.';
    }
  }
}

/**
 * Affiche un message quand aucun atelier n'est disponible
 */
export function showEmptyState() {
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

  // Valider et échapper l'URL du lien
  const validatedLink = validateUrl(workshop.link);
  const hasLink = validatedLink !== null;

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
  
  // Échapper les URLs d'images pour le CSS (échapper les apostrophes)
  const escapedImageUrl = imageUrl.replace(/'/g, "\\'");
  const escapedFallbackPngUrl = fallbackPngUrl ? fallbackPngUrl.replace(/'/g, "\\'") : null;
  const escapedDefaultImage = defaultImage.replace(/'/g, "\\'");
  
  // Utiliser un fallback CSS pour les images 404
  // Ordre: .jpg en premier, puis .png, puis image par défaut
  const backgroundImageUrls = escapedFallbackPngUrl 
    ? `url('${escapedImageUrl}'), url('${escapedFallbackPngUrl}'), url('${escapedDefaultImage}')`
    : `url('${escapedImageUrl}'), url('${escapedDefaultImage}')`;
  
  // Échapper toutes les données utilisateur pour prévenir XSS
  const escapedMainTitle = escapeHtml(mainTitle);
  const escapedSubtitle = subtitle ? escapeHtml(subtitle) : null;
  const escapedFormattedDate = formattedDate ? escapeHtml(formattedDate) : '';
  const escapedTime = workshop.time ? escapeHtml(workshop.time) : '';
  const escapedLocation = workshop.location ? escapeHtml(workshop.location) : '';
  const displayLocation = escapedLocation && escapedLocation.length > 40 ? escapedLocation.substring(0, 40) + '...' : escapedLocation;
  
  // Créer un data-attribute pour le lien au lieu d'utiliser onclick (plus sécurisé)
  const linkDataAttr = hasLink ? `data-workshop-link="${escapeHtml(validatedLink)}"` : '';
  const cardClass = hasLink ? 'card card-workshop workshop-clickable' : 'card card-workshop';
  
  return `
    <div class="${cardClass}" ${linkDataAttr}>
      <div class="workshop-image" style="background-image: ${backgroundImageUrls};"></div>
      <div class="workshop-content">
        <div class="workshop-content-wrapper">
          <h3 class="workshop-title">${escapedMainTitle}</h3>
          ${escapedSubtitle ? `<p class="workshop-subtitle">${escapedSubtitle}</p>` : ''}
          ${escapedFormattedDate ? `<p class="workshop-date">📅 ${escapedFormattedDate}${escapedTime ? `, ${escapedTime}` : ''}</p>` : ''}
          <p class="workshop-location">📍 ${displayLocation}</p>
          ${availabilityInfo}
        </div>
      </div>
      <div class="workshop-overlay">
        <span class="workshop-overlay-text">${hasLink ? 'Réserver' : 'En savoir plus'}</span>
      </div>
    </div>
  `;
}

/**
 * Rend la liste des ateliers dans la vue liste
 * @param {Array} workshopsData - Données des ateliers
 */
export function renderWorkshopsList(workshopsData) {
  const listView = document.getElementById('workshops-list-view');
  if (!listView) return;

  if (workshopsData.length === 0) {
    showEmptyState();
    return;
  }

  listView.innerHTML = workshopsData.map(workshop => generateWorkshopCard(workshop)).join('');
  
  // Ajouter les gestionnaires d'événements pour les cartes cliquables (plus sécurisé que onclick)
  const clickableCards = listView.querySelectorAll('.workshop-clickable[data-workshop-link]');
  clickableCards.forEach(card => {
    const link = card.getAttribute('data-workshop-link');
    if (link) {
      card.addEventListener('click', function() {
        const validatedLink = validateUrl(link);
        if (validatedLink) {
          window.open(validatedLink, '_blank');
        }
      });
      card.style.cursor = 'pointer';
    }
  });
}

/**
 * Charge et affiche les ateliers
 * @param {boolean} forceRefresh - Si true, ignore le cache et force le rafraîchissement
 */
export async function loadWorkshops(forceRefresh = false, fetchWorkshops, clearCache) {
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
    const workshopsData = await fetchWorkshops();
    workshops = workshopsData;
    renderWorkshopsList(workshops);
    
    // Mettre à jour le calendrier si nécessaire
    const calendarView = document.getElementById('calendar-view');
    if (calendarView && calendarView.style.display !== 'none') {
      // Le calendrier sera rendu par le module calendar
      window.dispatchEvent(new CustomEvent('workshopsLoaded', { detail: workshops }));
    }
  } catch (error) {
    console.error('Erreur lors du chargement des ateliers:', error);
    showErrorState(error.message || 'Une erreur est survenue. Veuillez réessayer plus tard.');
  }
}

export function getWorkshops() {
  return workshops;
}

