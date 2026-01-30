/**
 * Menu overlay plein écran sur la page d'accueil (mobile / tablette)
 */
export function initHeroDropdown() {
  const dropdown = document.querySelector('.hero-nav-dropdown');
  const trigger = document.querySelector('.hero-dropdown-trigger');
  const overlay = document.getElementById('hero-nav-overlay');
  const backdrop = overlay && overlay.querySelector('.hero-nav-overlay-backdrop');
  const closeBtn = overlay && overlay.querySelector('.hero-nav-overlay-close');

  if (!dropdown || !trigger || !overlay) return;

  function open() {
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    trigger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function toggle() {
    const isOpen = overlay.classList.contains('is-open');
    if (isOpen) close();
    else open();
  }

  trigger.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  });

  if (backdrop) {
    backdrop.addEventListener('click', close);
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', close);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
  });

  const links = overlay.querySelectorAll('.hero-nav-overlay-link');
  links.forEach(function (link) {
    link.addEventListener('click', close);
  });
}
