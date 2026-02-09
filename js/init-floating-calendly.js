/**
 * Bouton flottant "Prendre RDV" : ouvre la popup Calendly si présente sur la page,
 * sinon ouvre Calendly dans un nouvel onglet.
 */
(function() {
  var CALENDLY_URL = 'https://calendly.com/contactdonnerdelavoix/30min';

  document.addEventListener('click', function(e) {
    if (!e.target.closest('#calendly-trigger-rdv')) return;
    e.preventDefault();

    var popup = document.getElementById('calendly-popup') || document.getElementById('calendly-popup-home');
    if (popup) {
      popup.style.display = popup.id === 'calendly-popup-home' ? 'flex' : 'block';
      popup.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      document.body.classList.add('no-scroll');
    } else {
      window.open(CALENDLY_URL, '_blank', 'noopener,noreferrer');
    }
  });
})();
