# Donner de la Voix - Site Web

Site web statique pour **Donner de la Voix**, cours de chant et ateliers d'improvisation vocale à Toulouse.

## 📋 À propos du site

**Donner de la Voix** propose :
- Des cours de chant individuels et en groupe
- Des ateliers d'improvisation vocale et circlesongs
- Des stages et interventions en entreprise
- Des cours de technique vocale

## 🎯 Fonctionnalités

### Pages disponibles

- ✅ **Page d'accueil** (`index.html`) : Design avec logo, menu de navigation et pattern hexagonal en arrière-plan
- ✅ **L'impro vocale** (`/impro-vocale`) : Présentation de l'improvisation vocale avec sommaire interactif
- ✅ **Les ateliers** (`/ateliers`) : Liste des ateliers avec intégration BilletWeb pour les réservations
- ✅ **Les cours de chant** (`/cours-chant`) : Présentation des cours de chant individuels et en groupe
- ✅ **Contact** (`/contact`) : Formulaire de contact avec intégration EmailJS
- ✅ **La prof** (`/about`) : Présentation de la professeure
- ✅ **Newsletter** (`/newsletter`) : Inscription à la newsletter
- ✅ **Offre entreprise** (`/offre-entreprise`) : Interventions et stages en entreprise
- ✅ **Espace élève** (`/espace-eleve`) : Accès dédié aux élèves
- ✅ **Mentions légales** (`/mentions-legales`)

### Intégrations

- ✅ **EmailJS** : Envoi de formulaires de contact par email
- ✅ **BilletWeb API** : Récupération et affichage des ateliers disponibles avec système de cache
- ✅ **SEO optimisé** : Métadonnées complètes (Open Graph, Twitter Cards, mots-clés)
- ✅ **Accessibilité** : Navigation au clavier, skip links, attributs ARIA

### Design et UX

- ✅ **Design responsive** : Adapté pour mobile et desktop
- ✅ **Animations CSS** : Animations d'apparition pour le logo et le menu
- ✅ **Menu hamburger** : Navigation mobile avec overlay
- ✅ **Navigation fluide** : Scroll smooth et ancres de navigation

## 🚀 Installation et utilisation

### Prérequis

- Node.js et npm installés
- Un navigateur web moderne

### Installation

```bash
npm install
```

### Développement local

Le serveur de développement applique les mêmes rewrites qu’en production (Vercel), pour que les URLs propres (`/contact`, `/ateliers`, etc.) fonctionnent en local.

1. **Serveur de développement (recommandé)**
```bash
npm run dev
```
ou `npm start`. Le site est accessible sur [http://localhost:3000](http://localhost:3000).

2. **Ouvrir directement**
Ouvrir `index.html` dans le navigateur : les URLs avec chemins (`/ateliers`, etc.) ne fonctionneront pas sans serveur.

## 📁 Structure du projet

```
├── index.html                  # Page d'accueil
├── styles.css                  # Styles CSS globaux
├── js/                         # JavaScript modulaire
│   ├── main.js                 # Point d'entrée (type="module")
│   ├── init-floating-calendly.js
│   ├── init-header-nav.js
│   ├── components/             # menu, header, calendrier, ateliers, navigation, hero-dropdown
│   ├── services/               # API BilletWeb, cache
│   └── utils/                  # Sécurité, URLs images
├── partials/                   # Fragments HTML (header, floating-rdv)
├── scripts/                    # Outils de dev et build
│   ├── serve-with-rewrites.js  # Serveur local avec rewrites (comme Vercel)
│   └── generate-env-config.js  # Génère env-config.js au build
├── emailjs-config.js           # Configuration EmailJS
├── billetweb-config.js         # Configuration BilletWeb (dev)
├── env-config.js               # Config env (généré par npm run build)
├── secrets.example.js          # Modèle pour secrets locaux
├── package.json
├── vercel.json                 # Rewrites, redirects, build pour Vercel
├── _headers                    # En-têtes de sécurité (Netlify)
├── pages/                      # Pages du site (URLs propres via rewrites)
│   ├── about.html              # /about
│   ├── ateliers.html           # /ateliers
│   ├── contact.html            # /contact
│   ├── cours-chant.html        # /cours-chant
│   ├── impro-vocale.html       # /impro-vocale
│   ├── newsletter.html         # /newsletter
│   ├── offre-entreprise.html   # /offre-entreprise
│   ├── espace-eleve.html       # /espace-eleve
│   └── mentions-legales.html   # /mentions-legales
├── assets/                     # Images, logo, patterns (hexagon, etc.)
└── documentation/
    ├── configuration-cles-api.md
    └── deploiement-vercel.md
```

## ⚙️ Configuration

### EmailJS

Le fichier `emailjs-config.js` contient la configuration pour l'envoi d'emails via EmailJS :

```javascript
const EMAILJS_CONFIG = {
  PUBLIC_KEY: 'votre_public_key',
  SERVICE_ID: 'votre_service_id',
  TEMPLATE_ID: 'votre_template_id'
};
```

**Important** : Ce fichier doit être chargé avant le script EmailJS dans les pages qui l'utilisent.

### BilletWeb

Le fichier `billetweb-config.js` configure l'intégration avec l'API BilletWeb pour récupérer les ateliers disponibles.

**Sécurité** : L'API key ne doit jamais être exposée côté client. Utilisez un proxy backend pour masquer l'API key.

Configuration recommandée :
- Utiliser un proxy backend (`/api/billetweb-proxy`)
- Injecter les variables d'environnement au build
- Ne pas stocker de secrets dans le code client

## 🎨 Design

### Polices

- **Police principale** : Inter (Google Fonts)
- **Poids disponibles** : 300, 400, 500, 600, 700

### Palette de couleurs

- **Fond principal** : `#0d0218` (--color-deep-bg) — fond sombre violet/bleu nuit sur tout le site
- **Violet primaire** : `#5b2ab5` (--color-primary)
  - Clair : `#7a6ac7` (--color-primary-light)
  - Foncé : `#5a4a9f` (--color-primary-dark)
- **Rose accent** : `#cf3594` (--color-accent)
- **Teal** : `#4db8aa` / `rgba(77, 184, 170, …)` — bulles décoratives, teintes bento (bento-tint-teal), accents visuels en complément du violet et du rose
- **Textes** : blanc `#fff` (--color-text-main) et blanc à 90 % (--color-text-secondary)
- **Surfaces / bordures** : fonds semi-transparents (--bg-white-tiny, --bg-purple), bordures blanches douces (--border-white-soft)

Overlays : dégradés radiaux violet/rose en transparence et bulles animées (violet, rose, **teal**) sur le fond sombre.

Les variables CSS (couleurs, espacements) sont définies dans `styles.css`.

### Éléments visuels

- **Pattern hexagonal** : Fond SVG avec opacité et filtres CSS
- **Animations** : Transitions fluides et animations d'apparition
- **Design moderne** : Interface épurée avec effets de profondeur

## 🔧 Scripts disponibles

- `npm run dev` / `npm start` : Serveur local avec rewrites (port 3000), même comportement qu’en production
- `npm run serve` : Idem (alias)
- `npm run build` : Génère `env-config.js` à partir des variables d’environnement (utilisé avant déploiement)

## 📝 Notes techniques

### Architecture

- **Site statique** : HTML, CSS et JavaScript vanilla
- **Pas de framework** : Code JavaScript natif pour la performance
- **Modulaire** : Configuration séparée pour chaque service externe

### Fonctionnalités JavaScript

- Menu hamburger et navigation (header, menu, navigation, hero-dropdown)
- Intégration EmailJS pour les formulaires
- Récupération et affichage des ateliers BilletWeb avec cache (15 minutes)
- Calendrier flottant (Calendly) et initialisation modulaire
- URLs propres en dev et en prod via rewrites (serveur local et Vercel)
- Gestion des erreurs et logs de débogage

### Performance

- Cache des données BilletWeb pour réduire les appels API
- Chargement optimisé des assets
- Code JavaScript optimisé et minifiable

## 🌐 Déploiement

Le projet est configuré pour **Vercel** (`vercel.json`) : rewrites pour URLs propres, redirects des anciennes URLs, et commande de build `npm run build` pour générer la config d’environnement.

- **Vercel** : Déploiement recommandé ; voir `documentation/deploiement-vercel.md`
- **Netlify** : Déployer le dossier racine ; utiliser `_headers` pour les en-têtes de sécurité
- **GitHub Pages** : Pas de rewrites côté serveur ; prévoir des chemins type `/pages/ateliers.html` ou un outil (ex. 404 redirect)
- **Serveur web classique** : Configurer les rewrites/redirections équivalentes

**À faire en production** :
- Configurer les variables d’environnement (BilletWeb via proxy, etc.)
- Exécuter `npm run build` si le déploiement utilise `env-config.js`
- Tester EmailJS et BilletWeb en production

## 📚 Documentation supplémentaire

- `documentation/configuration-cles-api.md` : Configuration des clés API (EmailJS, BilletWeb, proxy)
- `documentation/deploiement-vercel.md` : Déploiement sur Vercel (rewrites, redirects, build)

## 🔒 Sécurité

- Les clés API EmailJS (PUBLIC_KEY) peuvent être publiques
- **En production** : ne pas exposer la clé BilletWeb côté client. Utiliser un proxy backend (Netlify/Vercel Function ou serveur dédié) qui stocke la clé en variable d'environnement et expose un endpoint (ex. `GET /api/workshops`). Voir `documentation/configuration-cles-api.md`
- Les fichiers `secrets.local.js` et `billetweb-config.js` sont pour le **développement local uniquement** ; en production, pas de secrets dans le code client
- En-têtes HTTP de sécurité : le fichier `_headers` (Netlify) à la racine définit X-Frame-Options, X-Content-Type-Options, HSTS et CSP. Sur Vercel, configurer les headers dans `vercel.json`
- Ne jamais commiter de secrets dans le code source
