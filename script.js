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
  const viewToggleBtn = document.querySelector('.view-toggle-btn');
  const viewButtons = document.querySelectorAll('.view-btn');
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

  // Ancien système (pour compatibilité avec ateliers.html)
  if (viewButtons.length > 0) {
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

// Slider pour la page About
document.addEventListener('DOMContentLoaded', function() {
  const sliderTrack = document.getElementById('slider-track');
  const prevBtn = document.getElementById('prev-slide');
  const nextBtn = document.getElementById('next-slide');
  const sliderDots = document.getElementById('slider-dots');
  
  if (!sliderTrack) return; // Si on n'est pas sur la page about
  
  const slides = sliderTrack.querySelectorAll('.slider-slide');
  let currentSlide = 0;
  
  // Créer les dots
  slides.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.className = 'slider-dot' + (index === 0 ? ' active' : '');
    dot.addEventListener('click', () => goToSlide(index));
    sliderDots.appendChild(dot);
  });
  
  function updateSlider() {
    slides.forEach((slide, index) => {
      if (index === currentSlide) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });
    
    const dots = sliderDots.querySelectorAll('.slider-dot');
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentSlide);
    });
  }
  
  function goToSlide(index) {
    currentSlide = index;
    updateSlider();
  }
  
  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    updateSlider();
  }
  
  function prevSlide() {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    updateSlider();
  }
  
  if (prevBtn) prevBtn.addEventListener('click', prevSlide);
  if (nextBtn) nextBtn.addEventListener('click', nextSlide);
  
  // Navigation au clavier
  document.addEventListener('keydown', function(e) {
    if (sliderTrack && document.body.contains(sliderTrack)) {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    }
  });
  
  // Initialiser
  updateSlider();
});

// Navigation par sections pour impro-vocale.html
document.addEventListener('DOMContentLoaded', function() {
  const tocLinks = document.querySelectorAll('.article-toc-link');
  const sections = document.querySelectorAll('.article-section');
  
  if (tocLinks.length === 0) return; // Si on n'est pas sur la page avec le sommaire
  
  function showSection(sectionId) {
    // Masquer toutes les sections
    sections.forEach(section => {
      section.style.display = 'none';
      section.classList.remove('active-section');
    });
    
    // Afficher la section sélectionnée
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.style.display = 'block';
      targetSection.classList.add('active-section');
    }
    
    // Mettre à jour les liens actifs
    tocLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-section') === sectionId) {
        link.classList.add('active');
      }
    });
  }
  
  // Gérer les clics sur les liens du sommaire
  tocLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const sectionId = this.getAttribute('data-section');
      showSection(sectionId);
      
      // Scroll vers le haut du contenu
      const articleMain = document.querySelector('.article-main');
      if (articleMain) {
        articleMain.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
  
  // Afficher la première section par défaut
  if (sections.length > 0) {
    const firstSection = sections[0];
    const firstSectionId = firstSection.id;
    showSection(firstSectionId);
  }
});