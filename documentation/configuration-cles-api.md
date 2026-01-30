# Configuration des Clés API

Ce guide explique où et comment configurer vos clés API de manière sécurisée dans ce projet.

## 🔑 Clés dont vous avez besoin pour ce site

| Service | Clé | Où la trouver | Utilisation |
|--------|-----|----------------|-------------|
| **EmailJS** | `PUBLIC_KEY` | Dashboard EmailJS → Account → API Keys | Formulaire de contact (`pages/contact.html`) |
| **EmailJS** | `SERVICE_ID` | EmailJS → Email Services | Envoi d’emails |
| **EmailJS** | `TEMPLATE_ID` | EmailJS → Email Templates | Modèle du message |
| **BilletWeb** | `USER_ID` | BilletWeb → Back-office → API / Paramètres compte | Liste des ateliers (`index.html`, `ateliers.html`) |
| **BilletWeb** | `API_KEY` | BilletWeb → Back-office → API | Appels API (idéalement via proxy en prod) |
| **BilletWeb** | `EVENT_ID` | (optionnel) | Filtrer un seul événement |

**En local** : tout va dans `secrets.local.js` (objet `SECRETS.EMAILJS` et `SECRETS.BILLETWEB` avec les noms ci-dessus).

**Sur Vercel** : variables d’environnement avec préfixes pour les distinguer :
Voir la section **Variables Vercel (exactes)** ci-dessous.

## 🟢 Variables Vercel (exactes)

Dans **Vercel** → ton projet → **Settings** → **Environment Variables**, ajoute **exactement** ces noms (avec tes vraies valeurs) :

| Nom de la variable | Obligatoire | Exemple | Service |
|--------------------|-------------|---------|--------|
| `EMAILJS_PUBLIC_KEY` | oui (formulaire contact) | `TREtbDAfx2QLJ_xxx` | EmailJS |
| `EMAILJS_SERVICE_ID` | oui | `service_xxx` | EmailJS |
| `EMAILJS_TEMPLATE_ID` | oui | `template_xxx` | EmailJS |
| `BILLETWEB_USER_ID` | oui (ateliers) | `73590` | BilletWeb |
| `BILLETWEB_API_KEY` | oui | `d702349fae...` | BilletWeb |
| `BILLETWEB_EVENT_ID` | non | (vide ou un ID) | BilletWeb |

- Noms **sans espace**, **en majuscules** avec underscores.
- Au build, `npm run build` génère `env-config.js` à partir de ces variables ; EmailJS et BilletWeb fonctionnent en prod.
- En local : utilise uniquement `secrets.local.js` (pas besoin de ces variables).

## 📁 Fichiers de Configuration

### `secrets.local.js` (RECOMMANDÉ – développement local uniquement)
**⚠️ Ce fichier est ignoré par git et ne sera jamais commité.**

C'est le fichier principal où vous mettez vos clés API pour le **développement local**.

**En production** : ne pas exposer de secrets côté client. Utilisez un proxy backend pour BilletWeb (voir section Déploiement) et des variables d'environnement côté serveur.

**Pour commencer (dev local) :**
1. Copiez `secrets.example.js` vers `secrets.local.js`
2. Remplissez vos vraies clés API dans `secrets.local.js`
3. Le fichier sera automatiquement ignoré par git

**Exemple de structure :**
```javascript
const SECRETS = {
  EMAILJS: {
    PUBLIC_KEY: 'votre_public_key',
    SERVICE_ID: 'votre_service_id',
    TEMPLATE_ID: 'votre_template_id'
  },
  BILLETWEB: {
    API_KEY: 'votre_api_key',
    USER_ID: 'votre_user_id',
    EVENT_ID: 'votre_event_id'
  }
};
```

### `secrets.example.js` (TEMPLATE)
Ce fichier sert de template et peut être commité dans git. Il montre la structure attendue sans contenir de vraies clés.

### `emailjs-config.js` (CONFIGURATION EMAILJS)
Ce fichier charge automatiquement les clés depuis `secrets.local.js` s'il existe, sinon utilise des valeurs par défaut.

### `billetweb-config.js` (CONFIGURATION BILLETWEB)
Ce fichier est également ignoré par git. Il configure l'API BilletWeb.

## 🔒 Sécurité

### Clés Publiques vs Clés Privées

**Clés Publiques (peuvent être exposées côté client) :**
- EmailJS Public Key : Peut être visible dans le code source
- Google Maps API Key (si configurée pour le domaine) : Peut être visible

**Clés Privées (NE JAMAIS exposer côté client) :**
- BilletWeb API Key : Doit être utilisée uniquement via un proxy backend
- Toute clé secrète d'API : Doit être utilisée uniquement côté serveur

### Bonnes Pratiques

1. ✅ **Utilisez `secrets.local.js`** pour toutes vos clés API
2. ✅ **Ne commitez JAMAIS** `secrets.local.js` dans git
3. ✅ **Utilisez un proxy backend** pour les clés privées (comme BilletWeb)
4. ✅ **Vérifiez votre `.gitignore`** pour s'assurer que les fichiers sensibles sont ignorés
5. ❌ **NE JAMAIS** mettre de clés API directement dans le code source
6. ❌ **NE JAMAIS** commiter de clés API dans git

## 📝 Utilisation dans les Pages HTML

Pour utiliser les clés API dans vos pages HTML, chargez les fichiers dans cet ordre (exemple depuis la racine) :

```html
<!-- 1. Config env (Vercel) puis secrets locaux -->
<script src="env-config.js"></script>
<script src="secrets.local.js"></script>
<script src="billetweb-config.js"></script>

<!-- 2. Point d'entrée JavaScript (module) -->
<script type="module" src="js/main.js"></script>
```

Depuis une page dans `pages/`, utilisez les chemins relatifs (`../env-config.js`, `../js/main.js`, etc.).

## 🔄 Migration depuis l'Ancien Système

Si vous aviez des clés API directement dans `emailjs-config.js`, vous pouvez :

1. Déplacer ces clés vers `secrets.local.js`
2. Le fichier `emailjs-config.js` chargera automatiquement depuis `secrets.local.js`

## 🚀 Déploiement

### Variables d'Environnement

Pour la production, vous pouvez utiliser des variables d'environnement selon votre plateforme :

- **Vercel** : Variables d'environnement dans le dashboard
- **Netlify** : Variables d'environnement dans le dashboard
- **GitHub Pages** : Utilisez un fichier de configuration local ou un proxy backend

### Proxy Backend (obligatoire en production pour BilletWeb)

En production, la clé API BilletWeb **ne doit pas** être utilisée côté client (elle serait visible dans le code source et les requêtes réseau). Créez un proxy backend qui :
1. Stocke la clé API en variable d'environnement côté serveur
2. Expose un endpoint (ex. `GET /api/workshops`) qui appelle l'API BilletWeb
3. Retourne les résultats au client sans exposer la clé

Exemples : Netlify Function, Vercel Serverless Function, ou petit serveur dédié. Le front doit alors appeler ce proxy au lieu de `https://www.billetweb.fr/api/events` directement.

### En-têtes HTTP de sécurité

En production, configurez les en-têtes de sécurité pour limiter les risques (clickjacking, XSS, MIME sniffing, etc.) :

- **Netlify** : le fichier `_headers` à la racine du projet est appliqué automatiquement. Il définit notamment `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security` et `Content-Security-Policy`. Voir [Netlify – Custom headers](https://docs.netlify.com/routing/headers/).
- **Vercel** : configurez les headers dans `vercel.json` (section `headers`).
- **Autres hébergeurs** : reportez-vous à leur documentation pour définir les mêmes en-têtes.

Aucun secret ne doit être exposé côté client en production.

## 📚 Ressources

- [EmailJS Documentation](https://www.emailjs.com/docs/)
- [BilletWeb API Documentation](https://www.billetweb.fr/api-doc)
- [OWASP - API Security](https://owasp.org/www-project-api-security/)


