# Rapport d’audit de sécurité – Donner de la Voix

*Date : 9 février 2025*

## Résumé

Audit du site statique (HTML/CSS/JS) avec intégrations EmailJS et API BilletWeb. Plusieurs points positifs (utils de sécurité, échappement des données ateliers, formulaire contact protégé), et **une faille importante** : exposition de la clé API BilletWeb côté client en production.

---

## 1. Secrets et clés API

### 1.1 Exposition de la clé API BilletWeb côté client — **ÉLEVÉ**

**Fichiers concernés :**
- `scripts/generate-env-config.js` (lignes 11–22, 34–41, 46–48)
- `js/services/billetweb-api.js` (lignes 169–181, 203–206)
- `billetweb-config.js` (lignes 39–41, 46–49)

**Constat :**
- Au build (Vercel), `generate-env-config.js` injecte les variables d’environnement dans `env-config.js`, y compris `BILLETWEB_API_KEY` et `BILLETWEB_USER_ID`, exposés dans `window.SECRETS` et `window.BILLETWEB_CONFIG`.
- `billetweb-api.js` appelle **directement** l’API BilletWeb (`https://www.billetweb.fr/api/events`) depuis le navigateur en passant `user` et `key` en paramètres d’URL. La clé est donc lisible dans le code source chargé par le navigateur et dans les requêtes réseau.
- Aucun proxy backend n’est présent dans le projet (pas de dossier `api/` ou fonction serverless). Les commentaires du code recommandent d’utiliser un proxy, mais ce n’est pas implémenté.

**Recommandation :**
- Mettre en place un **proxy serverless** (ex. Vercel Serverless Function) qui reçoit les requêtes du front, appelle l’API BilletWeb avec la clé (stockée uniquement en variables d’environnement côté serveur), et renvoie les données au client.
- Ne plus exposer `BILLETWEB_API_KEY` (ni `USER_ID` si possible) dans `env-config.js` ni dans aucun script chargé par le navigateur. Le build ne doit injecter que des valeurs nécessaires au client (ex. `BILLETWEB_PROXY_URL`).

---

### 1.2 Fichiers de secrets et .gitignore — **OK**

- `secrets.local.js` et `env-config.js` sont listés dans `.gitignore`.
- Le dépôt contient `secrets.example.js` (sans vraies clés) et un `env-config.js` avec des chaînes vides, ce qui est correct pour un repo partagé.
- **À vérifier manuellement :** que `secrets.local.js` n’a jamais été commité (ex. `git log -p -- secrets.local.js`). Si une clé a déjà fuité, la faire révoquer chez BilletWeb et régénérer.

---

### 1.3 EmailJS — **OK**

- Les identifiants EmailJS (public key, service id, template id) sont conçus pour un usage côté client ; les bonnes pratiques EmailJS sont respectées (pas de secret serveur exposé à tort).

---

## 2. XSS (Cross-Site Scripting)

### 2.1 Données BilletWeb (ateliers) — **OK**

- `js/services/billetweb-api.js` utilise `sanitizeExtId()` pour les `ext_id` et la construction des URLs.
- `js/components/workshops.js` et `js/components/calendar.js` utilisent `escapeHtml()` et `validateExternalUrl()` pour le titre, sous-titre, date, heure, lieu et liens des ateliers. Les cartes et le calendrier ne réaffichent pas la `description` brute ; pas d’injection via ce champ.

### 2.2 Contenu statique et partials — **FAIBLE**

- **index.html** (l. 631) : `slide.innerHTML = phrases[i].html` — contenu **statique** (tableau codé en dur), pas de risque XSS.
- **Partials** (`header.html`, `floating-rdv.html`) : chargés en `fetch` puis injectés via `innerHTML` (`init-header-nav.js`, `header.js`, plusieurs pages). Contenu sous votre contrôle, même origine. Risque faible tant que les partials ne sont pas modifiés à partir de données utilisateur ou d’une source non fiable.

**Recommandation (optionnelle) :** pour durcir, on peut n’accepter le chargement des partials que depuis des chemins fixes et, si un jour du contenu dynamique est injecté, utiliser un sanitizer ou du texte échappé plutôt que du HTML brut.

### 2.3 Pas d’usage dangereux repéré

- Aucun `eval()`, `new Function()`, ou `setTimeout/setInterval` avec une chaîne construite à partir de données utilisateur ou API.
- Les liens ouverts via `window.open` (ateliers, Calendly) utilisent soit une URL validée (`validateExternalUrl`), soit une constante (Calendly).

---

## 3. Formulaires et envoi de données

### 3.1 Formulaire de contact — **OK**

- **contact.html** : honeypot, limite de soumissions (rate limit via `localStorage`), temps minimal de remplissage, message minimum 10 caractères, `stripTags()` sur name, subject et message avant envoi. Envoi via EmailJS côté client.
- Les champs ne sont pas réaffichés dans la page de manière non échappée ; pas de XSS stocké côté site.

### 3.2 Newsletter

- Formulaire pointant vers Mailchimp ; `form-action` dans la CSP (voir §4) autorise le domaine concerné. Pas de traitement côté site des données saisies.

---

## 4. URLs et redirections

- Liens ateliers : validation par `validateExternalUrl()` avant affichage et avant `window.open()`, avec refus des protocoles `javascript:`, `data:`, etc.
- **init-floating-calendly.js** : URL Calendly en constante, pas de risque d’open redirect.
- Aucun paramètre de type `?redirect=...` géré côté front ; pas d’open redirect identifié.

---

## 5. En-têtes HTTP et déploiement

### 5.1 Fichier _headers — **À CORRIGER**

- Le fichier `_headers` est au format **Netlify**. Sur **Vercel**, les en-têtes se configurent dans **`vercel.json`**, pas via `_headers`. Les en-têtes de sécurité présents dans `_headers` ne sont donc **pas appliqués** sur Vercel.
- De plus, les lignes utiles dans `_headers` sont préfixées par `#` (commentaire), donc même sur Netlify elles ne seraient pas actives telles quelles.

**Recommandation :**
- Ajouter les en-têtes de sécurité dans `vercel.json` (clé `headers`), par exemple :
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
  - `Permissions-Policy: geolocation=(), microphone=(), camera=()`
  - Une **Content-Security-Policy** adaptée (sans `'unsafe-inline'` si possible, ou avec nonces/hashes pour les scripts inline).

### 5.2 CSP

- La CSP indiquée en commentaire dans `_headers` autorise `'unsafe-inline'` pour les scripts, ce qui réduit la protection contre XSS. À terme, privilégier des nonces ou hashes pour les scripts inline nécessaires.

---

## 6. Dépendances npm

- **npm audit** : 6 vulnérabilités (2 modérées, 4 élevées), toutes dans **live-server** (devDependency) : chaîne braces / chokidar / micromatch / anymatch / readdirp.
- Impact : **développement local uniquement** (pas servi en production). Risque limité tant que le serveur de dev n’est pas exposé à des tiers.

**Recommandation :**
- Mettre à jour ou remplacer `live-server` (ex. `npm audit fix`, ou passage à une autre solution de dev). Si un correctif impose un changement majeur (`npm audit fix --force`), évaluer la mise à jour dans une branche dédiée.

---

## 7. Scripts de build

- **generate-env-config.js** : lit `process.env` et écrit `env-config.js`. En production sur Vercel, les variables d’environnement (dont BilletWeb) sont injectées dans ce fichier, donc exposées au client. Voir §1.1 : la solution est de ne plus y mettre les secrets BilletWeb et d’utiliser un proxy.

---

## 8. Autres points

- Liens externes (réseaux sociaux, BilletWeb, Calendly, etc.) : usage de `target="_blank"` avec `rel="noopener noreferrer"` là où c’est pertinent — **OK**.
- Pas d’iframe non maîtrisée ; Calendly est une source connue et prévue dans la CSP.

---

## Synthèse des actions prioritaires

| Priorité | Action |
|----------|--------|
| **1** | Mettre en place un proxy serverless pour l’API BilletWeb et ne plus exposer la clé API (ni dans `env-config.js` ni dans le front). |
| **2** | Configurer les en-têtes de sécurité dans **vercel.json** (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS, Permissions-Policy, CSP). |
| **3** | Vérifier que `secrets.local.js` n’a jamais été commité ; si une clé a fuité, la révoquer et en créer une nouvelle. |
| **4** | Traiter les vulnérabilités npm dans `live-server` (mise à jour ou remplacement). |

---

*Rapport généré dans le cadre d’un audit manuel du code et de la configuration du projet.*
