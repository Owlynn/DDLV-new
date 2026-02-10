/**
 * Bouton flottant "Prendre RDV" : ouvre toujours la popup Calendly (injectée si absente).
 * Ne ouvre jamais de lien externe.
 */
(function() {
  const CALENDLY_URL = 'https://calendly.com/contactdonnerdelavoix/30min';
  const CALENDLY_WIDGET_SCRIPT = 'https://assets.calendly.com/assets/external/widget.js';
  const POPUP_PARTIAL = '/partials/calendly-popup.html';

  function getPopup() {
    return document.getElementById('calendly-popup') || document.getElementById('calendly-popup-home');
  }

  function openPopup(popup) {
    if (!popup) return;
    popup.style.display = 'flex';
    popup.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('no-scroll');
  }

  function closePopup(popup) {
    if (!popup) return;
    popup.style.display = 'none';
    popup.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.body.classList.remove('no-scroll');
  }

  function bindCloseListeners(popup) {
    if (!popup) return;
    var overlay = popup.querySelector('.calendly-popup-overlay');
    var closeBtn = popup.querySelector('.calendly-popup-close-btn') || document.getElementById('calendly-popup-close') || document.getElementById('calendly-popup-close-home');
    if (closeBtn) closeBtn.addEventListener('click', function() { closePopup(popup); });
    if (overlay) overlay.addEventListener('click', function() { closePopup(popup); });
  }

  function loadCalendlyScript() {
    if (document.querySelector('script[src*="calendly.com/assets/external/widget.js"]')) return Promise.resolve();
    return new Promise(function(resolve) {
      var s = document.createElement('script');
      s.src = CALENDLY_WIDGET_SCRIPT;
      s.async = true;
      s.onload = resolve;
      s.onerror = resolve;
      document.head.appendChild(s);
    });
  }

  function injectPopup() {
    return fetch(POPUP_PARTIAL)
      .then(function(r) { return r.ok ? r.text() : Promise.reject(new Error('Partial not found')); })
      .then(function(html) {
        var wrap = document.createElement('div');
        wrap.innerHTML = html.trim();
        var popup = wrap.firstChild;
        if (popup) {
          document.body.appendChild(popup);
          bindCloseListeners(popup);
          return popup;
        }
        return null;
      });
  }

  function ensurePopupAndOpen() {
    var popup = getPopup();
    if (popup) {
      openPopup(popup);
      return;
    }
    injectPopup()
      .then(function(injected) {
        if (injected) {
          loadCalendlyScript().then(function() { openPopup(injected); });
        }
      })
      .catch(function() {});
  }

  document.addEventListener('click', function(e) {
    if (!e.target.closest('#calendly-trigger-rdv')) return;
    e.preventDefault();
    ensurePopupAndOpen();
  });

  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape') return;
    var popup = getPopup();
    if (popup && popup.style.display === 'flex') closePopup(popup);
  });
})();
