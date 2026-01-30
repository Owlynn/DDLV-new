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
- ✅ **L'impro vocale** (`pages/impro-vocale.html`) : Page de présentation de l'improvisation vocale avec sommaire interactif
- ✅ **Les ateliers** (`pages/ateliers.html`) : Liste des ateliers avec intégration BilletWeb pour les réservations
- ✅ **Les cours de chant** (`pages/cours-chant.html`) : Présentation des cours de chant individuels et en groupe
- ✅ **Contact** (`pages/contact.html`) : Formulaire de contact avec intégration EmailJS
- ✅ **La prof** (`pages/about.html`) : Présentation de la professeure

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

1. **Option 1 : Serveur de développement (recommandé)**
```bash
npm run dev
```
Le site sera accessible sur [http://localhost:3000](http://localhost:3000)

2. **Option 2 : Serveur HTTP simple**
```bash
npm run serve
```

3. **Option 3 : Ouvrir directement**
Ouvrez simplement le fichier `index.html` dans votre navigateur (certaines fonctionnalités peuvent ne pas fonctionner sans serveur)

## 📁 Structure du projet

```
├── index.html                  # Page d'accueil
├── styles.css                  # Styles CSS globaux
├── js/                         # JavaScript modulaire
│   ├── main.js                 # Point d'entrée (chargé en type="module")
│   ├── components/             # Menu, ateliers, calendrier, navigation
│   ├── services/               # API BilletWeb, cache
│   └── utils/                   # Sécurité, URLs images
├── emailjs-config.js           # Configuration EmailJS
├── billetweb-config.js         # Configuration BilletWeb
├── package.json                # Dépendances et scripts npm
├── pages/                      # Pages du site
│   ├── about.html              # Page "La prof"
│   ├── ateliers.html           # Page des ateliers
│   ├── contact.html            # Page de contact
│   ├── cours-chant.html        # Page des cours de chant
│   └── impro-vocale.html       # Page sur l'improvisation vocale
├── assets/                     # Assets statiques
│   ├── logo-ddlv.png           # Logo principal
│   ├── hexagon-pattern.svg     # Pattern hexagonal
│   └── ...
└── documentation/              # Documentation du projet
    └── configuration-cles-api.md
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

- **Violet primaire** : `#3605af` (couleur principale)
  - Variante foncée : `#2A0488`
  - Variante claire : `#4A07D4`
- **Rose accent** : `#fe66c3`
  - Variante claire : `#FF8BD2`
- **Fonds** :
  - Blanc : `#FFFFFF`
  - Violet très clair : `#F0EBFF` (backgroundSoft)
  - Violet clair : `#E8DCFF` (badgeBg)
- **Bordures** : `#D4C5FF` (borderSoft)
- **Textes** :
  - Principal : `#000000` (textMain)
  - Secondaire : `#666666` (textMuted)

Pour plus de détails, consultez `documentation/couleurs-utilisees.md`.

### Éléments visuels

- **Pattern hexagonal** : Fond SVG avec opacité et filtres CSS
- **Animations** : Transitions fluides et animations d'apparition
- **Design moderne** : Interface épurée avec effets de profondeur

## 🔧 Scripts disponibles

- `npm run dev` : Lance le serveur de développement (live-server)
- `npm run serve` : Lance un serveur HTTP simple
- `npm start` : Alias pour `npm run dev`

## 📝 Notes techniques

### Architecture

- **Site statique** : HTML, CSS et JavaScript vanilla
- **Pas de framework** : Code JavaScript natif pour la performance
- **Modulaire** : Configuration séparée pour chaque service externe

### Fonctionnalités JavaScript

- Gestion du menu hamburger mobile
- Intégration EmailJS pour les formulaires
- Récupération et affichage des ateliers BilletWeb avec cache (15 minutes)
- Navigation fluide et gestion du scroll
- Gestion des erreurs et logs de débogage

### Performance

- Cache des données BilletWeb pour réduire les appels API
- Chargement optimisé des assets
- Code JavaScript optimisé et minifiable

## 🌐 Déploiement

Le site peut être déployé sur n'importe quel hébergeur de sites statiques :

- **Netlify** : Déployez simplement le dossier racine
- **Vercel** : Configuration automatique pour sites statiques
- **GitHub Pages** : Déploiement direct depuis le repository
- **Serveur web classique** : Uploadez les fichiers sur votre serveur

**Important pour le déploiement** :
- Configurez les variables d'environnement pour BilletWeb (proxy backend)
- Vérifiez que les chemins relatifs fonctionnent correctement
- Testez les intégrations EmailJS et BilletWeb en production

## 📚 Documentation supplémentaire

- `documentation/couleurs-utilisees.md` : Documentation complète de la palette de couleurs

## 🔒 Sécurité

- Les clés API EmailJS (PUBLIC_KEY) peuvent être publiques
- **En production** : ne pas exposer la clé BilletWeb côté client. Utiliser un proxy backend (Netlify/Vercel Function ou serveur dédié) qui stocke la clé en variable d'environnement et expose un endpoint (ex. `GET /api/workshops`). Voir `documentation/configuration-cles-api.md`
- Les fichiers `secrets.local.js` et `billetweb-config.js` sont pour le **développement local uniquement** ; en production, pas de secrets dans le code client
- En-têtes HTTP de sécurité : le fichier `_headers` (Netlify) à la racine définit X-Frame-Options, X-Content-Type-Options, HSTS et CSP. Sur Vercel, configurer les headers dans `vercel.json`
- Ne jamais commiter de secrets dans le code source
