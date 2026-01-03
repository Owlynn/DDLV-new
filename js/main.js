// Vérifier que la configuration BilletWeb est disponible
if (typeof BILLETWEB_CONFIG === 'undefined') {
  console.error('❌ ERREUR: BILLETWEB_CONFIG n\'est pas défini. Assurez-vous que billetweb-config.js est chargé AVANT main.js');
}

// Imports
import { initMenu } from './components/menu.js';
import { fetchBilletWebWorkshops } from './services/billetweb-api.js';
import { clearCache } from './services/cache.js';
import { loadWorkshops, getWorkshops } from './components/workshops.js';
import { renderCalendar, initCalendarNavigation } from './components/calendar.js';
import { initSectionNavigation, initSectionToggle } from './components/navigation.js';

// Exposer les fonctions globalement pour le débogage
window.clearBilletWebCache = clearCache;
window.refreshWorkshops = () => loadWorkshops(true, fetchBilletWebWorkshops, clearCache);
window.getWorkshops = getWorkshops;

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
  // Initialiser le menu hamburger
  initMenu();
  
  // Initialiser la navigation par sections
  initSectionNavigation();
  initSectionToggle();
  
  // Initialiser le calendrier
  initCalendarNavigation();
  
  // Charger les ateliers
  loadWorkshops(false, fetchBilletWebWorkshops, clearCache);
  
  // Basculement entre liste et calendrier
  const viewToggleBtn = document.querySelector('.view-toggle-btn');
  const listView = document.getElementById('workshops-list-view');
  const calendarView = document.getElementById('calendar-view');
  const toggleLeft = document.querySelector('.view-toggle-left');
  const toggleRight = document.querySelector('.view-toggle-right');

  if (viewToggleBtn && toggleLeft && toggleRight) {
    viewToggleBtn.addEventListener('click', function(e) {
      const target = e.target.closest('.view-toggle-part');
      if (!target) return;
      
      const view = target.getAttribute('data-view');
      
      toggleLeft.classList.toggle('active', view === 'list');
      toggleRight.classList.toggle('active', view === 'calendar');
      
      if (view === 'list') {
        listView.style.display = 'flex';
        calendarView.style.display = 'none';
      } else {
        listView.style.display = 'none';
        calendarView.style.display = 'block';
        renderCalendar(getWorkshops());
      }
    });
  }

  // Initialiser le calendrier si nécessaire
  if (calendarView && calendarView.style.display === 'block') {
    renderCalendar(getWorkshops());
  }
});

