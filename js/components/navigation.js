const SCROLL_OFFSET_PX = 20;

/** Retourne l'id de section format atelier depuis l'URL (ex. /ateliers/ateliers-focus → ateliers-focus) */
function getAteliersSectionFromPath() {
  const path = window.location.pathname.replace(/\/$/, '');
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'ateliers' && parts[1]) return parts[1];
  return null;
}

function scrollToSection(element, offset = SCROLL_OFFSET_PX) {
  if (!element) return;
  const headerHeight = document.querySelector('.site-nav')?.offsetHeight || 0;
  const totalOffset = headerHeight + offset;
  const sectionTop = element.getBoundingClientRect().top + window.pageYOffset - totalOffset;
  window.scrollTo({ top: sectionTop, behavior: 'smooth' });
}

function setActiveToc(sectionId) {
  const tocLinks = document.querySelectorAll('.article-toc-link');
  const tocButtons = document.querySelectorAll('.article-toc-button');
  tocLinks.forEach(link => {
    link.classList.remove('active');
    const linkSection = link.getAttribute('data-section');
    const linkHref = link.getAttribute('href');
    if (linkSection === sectionId || (linkHref && linkHref.startsWith('#') && linkHref.substring(1) === sectionId)) {
      link.classList.add('active');
    }
  });
  tocButtons.forEach(button => {
    button.classList.remove('active');
    if (button.getAttribute('data-section') === sectionId) {
      button.classList.add('active');
    }
  });
  const tocSelect = document.querySelector('.article-toc-select');
  if (tocSelect && tocSelect.querySelector(`option[value="${sectionId}"]`)) {
    tocSelect.value = sectionId;
  }
}

/**
 * Initialise la navigation par sections avec scroll automatique
 */
export function initSectionNavigation() {
  const tocLinks = document.querySelectorAll('.article-toc-link');
  const sections = document.querySelectorAll('.article-section');

  if (tocLinks.length === 0) return;

  const tocSelect = document.querySelector('.article-toc-select');
  const calendrierSection = document.getElementById('calendrier');
  const formatsSection = document.getElementById('formats-d-ateliers');
  if (tocSelect) {
    tocSelect.addEventListener('change', function() {
      const sectionId = this.value;
      if (!sectionId) return;
      const targetSection = document.getElementById(sectionId);
      if (targetSection) {
        // Sur la page ateliers : si la cible est dans "formats d'ateliers", afficher ce bloc d'abord (sinon il est masqué et le scroll ne mène nulle part)
        if (formatsSection && calendrierSection && formatsSection.contains(targetSection)) {
          calendrierSection.style.display = 'none';
          formatsSection.style.display = 'block';
          document.documentElement.classList.add('formats-panel-open');
          document.body.classList.add('formats-panel-open');
        }
        scrollToSection(targetSection);
        setActiveToc(sectionId);
      }
    });
  }

  tocLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const sectionId = this.getAttribute('data-section');
      const href = this.getAttribute('href');
      let targetSection = null;
      if (sectionId) targetSection = document.getElementById(sectionId);
      if (!targetSection && href && href.startsWith('#')) {
        targetSection = document.getElementById(href.substring(1));
      }
      if (targetSection) {
        scrollToSection(targetSection);
        setActiveToc(targetSection.id);
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
      if (entry.isIntersecting && entry.target.id) {
        setActiveToc(entry.target.id);
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
  if (calendrierSection) observer.observe(calendrierSection);
  if (formatsSection) observer.observe(formatsSection);
  
  // Mettre à jour le lien actif au chargement de la page selon la position du scroll
  function setInitialActiveLink() {
    const scrollPosition = window.pageYOffset;
    const headerHeight = document.querySelector('.site-nav')?.offsetHeight || 0;
    const offset = headerHeight + 100;
    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];
      if (!section.id) continue;
      const sectionTop = section.getBoundingClientRect().top + scrollPosition;
      if (scrollPosition + offset >= sectionTop) {
        setActiveToc(section.id);
        return;
      }
    }
    if (formatsSection) {
      const formatsTop = formatsSection.getBoundingClientRect().top + scrollPosition;
      if (scrollPosition + offset >= formatsTop) {
        setActiveToc('formats-d-ateliers');
        return;
      }
    }
    if (calendrierSection) {
      const calendrierTop = calendrierSection.getBoundingClientRect().top + scrollPosition;
      if (scrollPosition + offset >= calendrierTop) {
        setActiveToc('calendrier');
      }
    }
  }
  
  // Appeler au chargement et après un court délai pour s'assurer que le DOM est prêt
  setTimeout(setInitialActiveLink, 100);
}

/**
 * Initialise la gestion des sections calendrier/formats
 */
export function initSectionToggle() {
  const calendrierSection = document.getElementById('calendrier');
  const formatsSection = document.getElementById('formats-d-ateliers');
  const tocLinks = document.querySelectorAll('.article-toc-link[data-section]');
  const tocButtons = document.querySelectorAll('.article-toc-button[data-section]');
  
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
      document.documentElement.classList.remove('formats-panel-open');
      document.body.classList.remove('formats-panel-open');
    } else if (sectionName === 'formats-d-ateliers') {
      calendrierSection.style.display = 'none';
      formatsSection.style.display = 'block';
      document.documentElement.classList.add('formats-panel-open');
      document.body.classList.add('formats-panel-open');
      // Réinitialiser l'observer quand on affiche la section formats
      setTimeout(reinitObserver, 100);
    }
  }
  
  tocButtons.forEach(tocButton => {
    tocButton.addEventListener('click', function(e) {
      e.preventDefault();
      const sectionName = this.getAttribute('data-section');
      setActiveToc(sectionName);
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
  });
  
  tocLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const sectionName = this.getAttribute('data-section');
      setActiveToc(sectionName);
      showSection(sectionName);
      if (sectionName === 'formats-d-ateliers') {
        const targetId = this.getAttribute('href');
        if (targetId && targetId.startsWith('#')) {
          const targetElement = document.getElementById(targetId.substring(1));
          if (targetElement) {
            setTimeout(() => {
              scrollToSection(targetElement);
              setTimeout(() => setActiveToc(targetElement.id), 500);
            }, 100);
          }
        }
      }
    });
  });
  
  const viewToggleBtn = document.querySelector('.view-toggle-btn');
  if (viewToggleBtn) {
    viewToggleBtn.addEventListener('click', function(e) {
      const target = e.target.closest('.view-toggle-part');
      if (!target) return;
      showSection('calendrier');
      setActiveToc('calendrier');
    });
  }
  
  const seeWorkshopsButtons = document.querySelectorAll('.atelier-see-workshops-btn');
  seeWorkshopsButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const sectionName = this.getAttribute('data-section');
      showSection(sectionName);
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
      setActiveToc('calendrier');
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 200);
    });
  });
}


