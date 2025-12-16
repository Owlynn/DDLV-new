// Données des ateliers
const workshops = [
  { title: "Atelier d'improvisation vocale", date: "2024-03-15", time: "14h-17h", location: "Toulouse, Studio La Voix", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=80" },
  { title: "Circle Songs découverte", date: "2024-03-24", time: "10h-12h30", location: "Toulouse, Espace Culturel", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80" },
  { title: "Impro vocale avancée", date: "2024-04-06", time: "15h-18h", location: "Toulouse, Studio La Voix", image: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&q=80" },
  { title: "Vocal painting et direction", date: "2024-04-14", time: "14h-17h", location: "Toulouse, Espace Culturel", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=80" },
  { title: "Atelier découverte", date: "2024-04-20", time: "10h-12h", location: "Toulouse, Studio La Voix", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80" },
  { title: "Impro vocale intensive", date: "2024-04-28", time: "14h-18h", location: "Toulouse, Espace Culturel", image: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&q=80" }
];

// Variables pour le calendrier
let currentDate = new Date(2024, 2, 1); // Mars 2024

// Basculement entre liste et calendrier
document.addEventListener('DOMContentLoaded', function() {
  const viewButtons = document.querySelectorAll('.view-btn');
  const listView = document.getElementById('workshops-list-view');
  const calendarView = document.getElementById('calendar-view');

  viewButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const view = this.getAttribute('data-view');
      
      viewButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      if (view === 'list') {
        listView.style.display = 'flex';
        calendarView.style.display = 'none';
      } else {
        listView.style.display = 'none';
        calendarView.style.display = 'block';
        renderCalendar();
      }
    });
  });
  
  // Initialiser le calendrier si nécessaire
  if (calendarView.style.display === 'block') {
    renderCalendar();
  }

  // Navigation du calendrier
  document.getElementById('prev-month').addEventListener('click', function() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById('next-month').addEventListener('click', function() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });
});

// Rendu du calendrier
function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Mise à jour du titre
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  document.getElementById('month-title').textContent = `${monthNames[month]} ${year}`;
  
  // Premier jour du mois et nombre de jours
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  // Jours de la semaine
  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  
  // Génération du calendrier
  const calendarGrid = document.getElementById('calendar-grid');
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
      dayElement.innerHTML += `
        <div class="workshop-indicator" title="${workshop.title}">${workshop.title}</div>
        <div class="workshop-overlay">
          <span class="workshop-overlay-text">En savoir plus</span>
        </div>
      `;
    }
    
    calendarGrid.appendChild(dayElement);
  }
}
