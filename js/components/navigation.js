/**
 * Initialise la navigation par sections avec scroll automatique
 */
export function initSectionNavigation() {
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
}

/**
 * Initialise la gestion des sections calendrier/formats
 */
export function initSectionToggle() {
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
}

