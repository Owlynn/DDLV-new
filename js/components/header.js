/**
 * Charge le header commun (partials/header.html) et l'injecte dans l'élément #site-header.
 * À appeler au chargement de chaque page pour éviter la duplication de la barre de navigation.
 */
const HEADER_URL = '/partials/header.html';

export function loadHeader() {
  const container = document.getElementById('site-header');
  if (!container) return;

  fetch(HEADER_URL)
    .then((res) => {
      if (!res.ok) throw new Error('Header partial not found');
      return res.text();
    })
    .then((html) => {
      container.innerHTML = html;
    })
    .catch((err) => {
      console.warn('Header module: impossible de charger le partial', err);
    });
}
