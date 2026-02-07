import { escapeHtml, validateExternalUrl } from '../utils/security.js';

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

/** Mois courts en français pour le médaillon date */
const MONTH_SHORT = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];

/** Index d'image de fond (0=bg.jpg, 1=bg1.jpg, …) selon le type d'atelier (aligné avec les formats) */
const WORKSHOP_BG_INDEX = [0, 1, 3, 4, 0, 1, 2]; // focus, art, chant, poesie, gestuelle, flashmob, coaching

/**
 * Retourne l'index d'image bg (0 à 4) pour un titre d'atelier.
 * @param {string} fullTitle - Titre complet de l'atelier
 * @returns {number} 0..4
 */
function getWorkshopBgIndex(fullTitle) {
  if (!fullTitle || !fullTitle.trim()) return 0;
  const t = fullTitle.trim();
  let idx = 0;
  for (let i = 0; i < WORKSHOP_TITLE_MAP.length; i++) {
    if (WORKSHOP_TITLE_MAP[i].match.test(t)) {
      return WORKSHOP_BG_INDEX[i % WORKSHOP_BG_INDEX.length];
    }
  }
  return 0;
}

/**
 * Génère le HTML d'une carte bento "date à venir" : fond bg*, illustration titre/sous-titre, médaillon date, horaires, lieu, overlay "En savoir plus"
 * @param {Object} workshop - Données de l'atelier
 * @returns {string} HTML de la carte
 */
function generateWorkshopBentoCard(workshop) {
  const { title: mainTitle, subtitle } = getTitleAndSubtitle(workshop.title);
  const bgIndex = getWorkshopBgIndex(workshop.title);
  let day = '';
  let month = '';
  if (workshop.date) {
    const d = new Date(workshop.date);
    if (!isNaN(d.getTime())) {
      day = String(d.getDate());
      month = MONTH_SHORT[d.getMonth()] || '';
    }
  }
  const allowHttp = typeof location !== 'undefined' && location.protocol === 'http:';
  const validatedLink = validateExternalUrl(workshop.link, allowHttp);
  const href = validatedLink || '#formats-ateliers';
  const target = validatedLink ? '_blank' : '_self';
  const rel = validatedLink ? 'noopener noreferrer' : '';
  const escapedMainTitle = escapeHtml(mainTitle);
  const escapedSubtitle = escapeHtml(subtitle);
  const escapedTime = workshop.time ? escapeHtml(workshop.time) : '';
  const escapedLocation = workshop.location ? escapeHtml(workshop.location) : 'Lieu à confirmer';

  return `
    <a class="bento-date-card bento-date-bg-${bgIndex}" href="${escapeHtml(href)}" ${target === '_blank' ? `target="${target}" rel="${rel}"` : ''} aria-label="${escapedMainTitle}, ${day} ${month}">
      <div class="bento-date-card-visual">
        <div class="bento-date-card-illustration">
          <span class="bento-date-card-illustration-title">${escapedMainTitle}</span>
          <span class="bento-date-card-illustration-subtitle">${escapedSubtitle}</span>
        </div>
        <div class="bento-date-medallion" aria-hidden="true">
          <span class="day">${escapeHtml(day)}</span>
          <span class="month">${escapeHtml(month)}</span>
        </div>
      </div>
      <div class="bento-date-card-content">
        <div class="bento-date-card-title">${escapedMainTitle}</div>
        ${escapedTime ? `<div class="bento-date-card-time"><span class="material-symbols-outlined" style="font-size:1rem;">schedule</span>${escapedTime}</div>` : ''}
        <div class="bento-date-card-location"><span class="material-symbols-outlined" style="font-size:1rem;">location_on</span>${escapedLocation}</div>
      </div>
      <div class="bento-date-card-overlay" aria-hidden="true">
        <span>En savoir plus</span>
      </div>
    </a>
  `;
}

/**
 * Rend la section "dates à venir" en bentos (page ateliers-new)
 * @param {Array} workshopsData - Données des ateliers
 */
export function renderWorkshopsBentos(workshopsData) {
  const bentosView = document.getElementById('workshops-bentos-view');
  const emptyEl = document.getElementById('workshops-bentos-empty');
  const loadingEl = document.getElementById('workshops-bentos-loading');
  if (!bentosView) return;

  if (loadingEl) loadingEl.classList.add('hidden');
  if (emptyEl) emptyEl.classList.add('hidden');

  if (!workshopsData || workshopsData.length === 0) {
    bentosView.innerHTML = '';
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }

  bentosView.innerHTML = workshopsData.map(workshop => generateWorkshopBentoCard(workshop)).join('');
}

/**
 * Affiche l'état de chargement pour la vue bentos (ateliers-new)
 */
export function showLoadingStateBentos() {
  const bentosView = document.getElementById('workshops-bentos-view');
  const emptyEl = document.getElementById('workshops-bentos-empty');
  const loadingEl = document.getElementById('workshops-bentos-loading');
  if (bentosView) bentosView.innerHTML = '';
  if (emptyEl) emptyEl.classList.add('hidden');
  if (loadingEl) loadingEl.classList.remove('hidden');
}

/**
 * Affiche l'état vide pour la vue bentos (ateliers-new)
 */
export function showEmptyStateBentos() {
  const bentosView = document.getElementById('workshops-bentos-view');
  const emptyEl = document.getElementById('workshops-bentos-empty');
  const loadingEl = document.getElementById('workshops-bentos-loading');
  if (bentosView) bentosView.innerHTML = '';
  if (loadingEl) loadingEl.classList.add('hidden');
  if (emptyEl) emptyEl.classList.remove('hidden');
}

/**
 * Affiche l'état d'erreur pour la vue bentos (ateliers-new)
 * @param {string} message - Message d'erreur
 */
export function showErrorStateBentos(message) {
  const bentosView = document.getElementById('workshops-bentos-view');
  const emptyEl = document.getElementById('workshops-bentos-empty');
  const loadingEl = document.getElementById('workshops-bentos-loading');
  if (bentosView) bentosView.innerHTML = '';
  if (loadingEl) loadingEl.classList.add('hidden');
  if (emptyEl) {
    emptyEl.classList.remove('hidden');
    const paragraphs = emptyEl.querySelectorAll('p');
    if (paragraphs[0]) paragraphs[0].textContent = 'Erreur lors du chargement des ateliers.';
    if (paragraphs[1]) paragraphs[1].textContent = message || 'Une erreur est survenue.';
  }
}

/**
 * Mots-clés par type d'atelier (titre API contient la clé, valeur = { title, subtitle }).
 * Ordre important : les correspondances plus spécifiques en premier.
 */
const WORKSHOP_TITLE_MAP = [
  { match: /ateliers?\s+focus|focus\s+impro/i, title: 'Atelier focus', subtitle: 'impro • circlesongs • mensuel' },
  { match: /art\s+des\s+circle\s*songs?|circle\s*songs?\s+formation/i, title: "L'art des circle songs", subtitle: 'circlesongs • journée' },
  { match: /chant\s+pour\s+tous/i, title: 'Chant pour tous', subtitle: 'découverte • gratuit' },
  { match: /circlesong.*po[eé]sie|po[eé]sie.*voix.*mots/i, title: 'Circlesong poésie', subtitle: 'voix • mots • impro' },
  { match: /circlesong.*gestuelle|la\s+gestuelle|gestuelle\s+impro/i, title: 'Circlesong - La Gestuelle', subtitle: 'gestuelle • impro • journée' },
  { match: /flashmob/i, title: 'Flashmob improvisé', subtitle: 'performance • rue • Toulouse' },
  { match: /coaching\s+personnalis[eé]/i, title: 'Coaching personnalisé', subtitle: 'sur mesure' }
];

/**
 * Retourne toujours un titre court + sous-titre en mots-clés pour le logo.
 * @param {string} fullTitle - Titre complet de l'atelier (API)
 * @returns {Object} { title: string, subtitle: string }
 */
function getTitleAndSubtitle(fullTitle) {
  if (!fullTitle || !fullTitle.trim()) return { title: 'Atelier', subtitle: 'impro • chant' };

  const t = fullTitle.trim();

  for (const { match, title, subtitle } of WORKSHOP_TITLE_MAP) {
    if (match.test(t)) return { title, subtitle };
  }

  const separators = [', ', ' – ', ' - ', ' : '];
  for (const sep of separators) {
    const idx = t.indexOf(sep);
    if (idx > 0) {
      const main = t.substring(0, idx).trim();
      const rest = t.substring(idx + sep.length).trim();
      if (main.length >= 2 && rest.length >= 2) return { title: main, subtitle: rest };
    }
  }

  const deMatch = t.match(/^(.+?)\s+(?:d'|de\s+la\s+|de\s+l'|des\s+)(.+)$/i);
  if (deMatch) {
    const main = deMatch[1].trim();
    const keywords = deMatch[2].trim();
    if (main.length >= 2 && keywords.length >= 2) return { title: main, subtitle: keywords };
  }

  if (t.length > 50) {
    let bestIdx = -1;
    for (const sep of separators) {
      const i = t.indexOf(sep, 20);
      if (i > 0 && i < 55) {
        if (bestIdx === -1 || Math.abs(i - 35) < Math.abs(bestIdx - 35)) bestIdx = i;
      }
    }
    if (bestIdx > 0) {
      return { title: t.substring(0, bestIdx).trim(), subtitle: t.substring(bestIdx).replace(/^[\s,–\-:]+/, '').trim() };
    }
    const spaceIdx = t.indexOf(' ', 45);
    if (spaceIdx > 0) {
      return { title: t.substring(0, spaceIdx).trim(), subtitle: t.substring(spaceIdx + 1).trim() };
    }
    return { title: t.substring(0, 47).trim() + '…', subtitle: t.substring(47).trim() };
  }

  const stopWords = /\b(atelier|ateliers|le|la|les|l'|un|une|et|en|à|pour|des|du|de)\b/gi;
  const words = t.replace(stopWords, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const subtitle = words.length > 1 ? words.slice(0, 4).join(' • ') : (words[0] || 'impro • chant');
  return { title: t, subtitle };
}

/**
 * Génère le HTML d'une carte d'atelier
 * @param {Object} workshop - Données de l'atelier
 * @returns {string} HTML de la carte
 */
function generateWorkshopCard(workshop) {
  // Titre court + sous-titre en mots-clés (toujours les deux pour le logo)
  const { title: mainTitle, subtitle } = getTitleAndSubtitle(workshop.title);
  
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

  // Validation stricte : uniquement URLs absolues https (et http en dev) pour éviter XSS / open redirect
  const allowHttp = typeof location !== 'undefined' && location.protocol === 'http:';
  const validatedLink = validateExternalUrl(workshop.link, allowHttp);
  const hasLink = validatedLink !== null;

  // Échapper toutes les données utilisateur pour prévenir XSS
  const escapedMainTitle = escapeHtml(mainTitle);
  const escapedSubtitle = escapeHtml(subtitle);
  const escapedFormattedDate = formattedDate ? escapeHtml(formattedDate) : '';
  const escapedTime = workshop.time ? escapeHtml(workshop.time) : '';
  const escapedLocation = workshop.location ? escapeHtml(workshop.location) : '';
  const displayLocation = escapedLocation && escapedLocation.length > 40 ? escapedLocation.substring(0, 40) + '...' : escapedLocation;
  
  // Créer un data-attribute pour le lien au lieu d'utiliser onclick (plus sécurisé)
  const linkDataAttr = hasLink ? `data-workshop-link="${escapeHtml(validatedLink)}"` : '';
  const cardClass = hasLink ? 'card card-workshop workshop-clickable' : 'card card-workshop';
  
  // Logo style DDLV : fond blanc, titre atelier en fuchsia, décor ondulé + arcs (remplace l'image)
  const logoHtml = `
    <div class="workshop-image workshop-logo">
      <div class="workshop-logo-bg">
        <svg class="workshop-logo-waves" viewBox="0 0 120 100" preserveAspectRatio="xMaxYMid meet" aria-hidden="true">
          <path fill="none" stroke="var(--color-accent)" stroke-width="1.5" stroke-opacity="0.9" d="M0 50 Q30 20 60 50 T120 50"/>
          <path fill="none" stroke="var(--color-accent)" stroke-width="1.2" stroke-opacity="0.7" d="M0 55 Q35 25 65 55 T120 55"/>
          <path fill="none" stroke="var(--color-accent)" stroke-width="1" stroke-opacity="0.5" d="M0 60 Q40 30 70 60 T120 60"/>
        </svg>
        <svg class="workshop-logo-arcs" viewBox="0 0 80 100" preserveAspectRatio="xMinYMid meet" aria-hidden="true">
          <path fill="none" stroke="var(--color-primary-light)" stroke-width="2" d="M 10 20 Q 50 0 80 30"/>
          <path fill="none" stroke="var(--color-primary-light)" stroke-width="2" d="M 10 80 Q 50 100 80 70"/>
        </svg>
      </div>
      <div class="workshop-logo-text">
        <span class="workshop-logo-title">${escapedMainTitle}</span>
        <span class="workshop-logo-subtitle">${escapedSubtitle}</span>
      </div>
    </div>`;
  return `
    <div class="${cardClass}" ${linkDataAttr}>
      ${logoHtml}
      <div class="workshop-content">
        <div class="workshop-content-wrapper">
          <h3 class="workshop-title">${escapedMainTitle}</h3>
          <p class="workshop-subtitle">${escapedSubtitle}</p>
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
  const allowHttp = typeof location !== 'undefined' && location.protocol === 'http:';
  clickableCards.forEach(card => {
    const link = card.getAttribute('data-workshop-link');
    if (link) {
      card.addEventListener('click', function() {
        const validatedLink = validateExternalUrl(link, allowHttp);
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
  const listView = document.getElementById('workshops-list-view');
  const bentosView = document.getElementById('workshops-bentos-view');
  if (!listView && !bentosView) {
    console.warn('⚠️ Ni workshops-list-view ni workshops-bentos-view trouvé');
    return;
  }

  // Vider le cache si on force le rafraîchissement
  if (forceRefresh) {
    clearCache();
  }

  if (listView) showLoadingState();
  if (bentosView) showLoadingStateBentos();

  try {
    const workshopsData = await fetchWorkshops();
    workshops = workshopsData;

    if (listView) {
      if (workshops.length === 0) {
        showEmptyState();
      } else {
        renderWorkshopsList(workshops);
      }
    }
    if (bentosView) {
      if (workshops.length === 0) {
        showEmptyStateBentos();
      } else {
        renderWorkshopsBentos(workshops);
      }
    }

    const calendarView = document.getElementById('calendar-view');
    if (calendarView && calendarView.style.display !== 'none') {
      window.dispatchEvent(new CustomEvent('workshopsLoaded', { detail: workshops }));
    }
  } catch (error) {
    console.error('Erreur lors du chargement des ateliers:', error);
    const msg = error.message || 'Une erreur est survenue. Veuillez réessayer plus tard.';
    if (listView) showErrorState(msg);
    if (bentosView) showErrorStateBentos(msg);
  }
}

export function getWorkshops() {
  return workshops;
}

