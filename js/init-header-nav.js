/**
 * Charge le header (partials/header.html) dans #site-header et initialise
 * le menu burger (toggle + fermeture au clic sur un lien) sur toutes les pages.
 */
(function() {
  const el = document.getElementById('site-header');
  if (!el) return;
  fetch('/partials/header.html').then(function(r) { return r.ok ? r.text() : Promise.reject(); })
    .then(function(html) {
      const path = typeof window !== 'undefined' && window.location && window.location.pathname ? window.location.pathname.replace(/\/$/, '') || '/' : '/';
      if (path !== '/' && path !== '/index.html') {
        document.body.classList.add('inner-page');
      }
      el.innerHTML = html;
      const toggle = el.querySelector('.header-nav-toggle');
      const panel = document.getElementById('header-nav');
      const iconMenu = el.querySelector('.icon-menu');
      const iconClose = el.querySelector('.icon-close');
      if (toggle && panel) {
        toggle.addEventListener('click', function() {
          const open = panel.classList.contains('nav-open');
          if (open) {
            panel.classList.remove('nav-open');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Ouvrir le menu');
            panel.setAttribute('aria-hidden', 'true');
            if (iconMenu) iconMenu.classList.remove('hidden');
            if (iconClose) iconClose.classList.add('hidden');
            document.body.classList.remove('no-scroll');
          } else {
            panel.classList.add('nav-open');
            toggle.setAttribute('aria-expanded', 'true');
            toggle.setAttribute('aria-label', 'Fermer le menu');
            panel.setAttribute('aria-hidden', 'false');
            if (iconMenu) iconMenu.classList.add('hidden');
            if (iconClose) iconClose.classList.remove('hidden');
            document.body.classList.add('no-scroll');
          }
        });
        panel.querySelectorAll('a').forEach(function(link) {
          link.addEventListener('click', function() {
            panel.classList.remove('nav-open');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Ouvrir le menu');
            panel.setAttribute('aria-hidden', 'true');
            if (iconMenu) iconMenu.classList.remove('hidden');
            if (iconClose) iconClose.classList.add('hidden');
            document.body.classList.remove('no-scroll');
          });
        });
      }
    })
    .catch(function() {});
})();
