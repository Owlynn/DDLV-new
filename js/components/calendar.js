import { escapeHtml, validateExternalUrl } from '../utils/security.js';

let currentDate = new Date();

/** Retourne true si la date du calendrier est au mois actuel ou dans le passé (on ne peut pas aller avant) */
function isAtOrBeforeCurrentMonth() {
  const now = new Date();
  if (currentDate.getFullYear() < now.getFullYear()) return true;
  if (currentDate.getFullYear() === now.getFullYear() && currentDate.getMonth() <= now.getMonth()) return true;
  return false;
}

/**
 * Rend le calendrier
 * @param {Array} workshops - Liste des ateliers
 */
export function renderCalendar(workshops = []) {
  const calendarGrid = document.getElementById('calendar-grid');
  const monthTitle = document.getElementById('month-title');
  const prevMonthBtn = document.getElementById('prev-month');

  if (!calendarGrid || !monthTitle) return; // Si on n'est pas sur une page avec calendrier

  const now = new Date();
  if (currentDate.getFullYear() < now.getFullYear() || (currentDate.getFullYear() === now.getFullYear() && currentDate.getMonth() < now.getMonth())) {
    currentDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  if (prevMonthBtn) {
    prevMonthBtn.disabled = isAtOrBeforeCurrentMonth();
  }

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
    
    // Utiliser textContent pour le numéro du jour (sécurisé)
    const dayNumber = document.createElement('span');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayElement.appendChild(dayNumber);
    
    if (dayWorkshops.length > 0) {
      dayElement.classList.add('has-workshop');
      const workshop = dayWorkshops[0];
      
      // Échapper le titre pour l'attribut data
      const escapedTitle = escapeHtml(workshop.title);
      dayElement.setAttribute('data-workshop-title', escapedTitle);
      
      // Créer les éléments de manière sécurisée avec createElement et textContent
      const workshopIndicator = document.createElement('div');
      workshopIndicator.className = 'workshop-indicator';
      workshopIndicator.setAttribute('title', escapedTitle);
      workshopIndicator.textContent = escapedTitle;
      dayElement.appendChild(workshopIndicator);
      
      const workshopOverlay = document.createElement('div');
      workshopOverlay.className = 'workshop-overlay';
      const overlayText = document.createElement('span');
      overlayText.className = 'workshop-overlay-text';
      overlayText.textContent = workshop.link ? 'Réserver' : 'En savoir plus';
      workshopOverlay.appendChild(overlayText);
      dayElement.appendChild(workshopOverlay);
      
      // Validation stricte : uniquement URLs absolues https (et http en dev)
      const allowHttp = typeof location !== 'undefined' && location.protocol === 'http:';
      const validatedLink = validateExternalUrl(workshop.link, allowHttp);
      if (validatedLink) {
        dayElement.setAttribute('data-workshop-link', escapeHtml(validatedLink));
        dayElement.style.cursor = 'pointer';
        dayElement.addEventListener('click', function() {
          window.open(validatedLink, '_blank');
        });
      }
    }
    
    calendarGrid.appendChild(dayElement);
  }
}

/**
 * Initialise la navigation du calendrier
 */
export function initCalendarNavigation() {
  const prevMonthBtn = document.getElementById('prev-month');
  const nextMonthBtn = document.getElementById('next-month');
  
  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', function() {
      if (isAtOrBeforeCurrentMonth()) return;
      currentDate.setMonth(currentDate.getMonth() - 1);
      window.dispatchEvent(new CustomEvent('calendarUpdate'));
    });
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', function() {
      currentDate.setMonth(currentDate.getMonth() + 1);
      window.dispatchEvent(new CustomEvent('calendarUpdate'));
    });
  }
  
  // Écouter les mises à jour des ateliers
  window.addEventListener('workshopsLoaded', function(e) {
    const calendarView = document.getElementById('calendar-view');
    if (calendarView && calendarView.style.display !== 'none') {
      renderCalendar(e.detail);
    }
  });
  
  // Écouter les demandes de mise à jour du calendrier
  window.addEventListener('calendarUpdate', function() {
    const calendarView = document.getElementById('calendar-view');
    if (calendarView && calendarView.style.display !== 'none') {
      const getWorkshops = window.getWorkshops || (() => []);
      renderCalendar(getWorkshops());
    }
  });
}

