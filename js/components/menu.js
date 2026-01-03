/**
 * Initialise le menu hamburger pour mobile
 */
export function initMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const headerNav = document.querySelector('.header-nav');
  
  if (!menuToggle || !headerNav) return;
  
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

