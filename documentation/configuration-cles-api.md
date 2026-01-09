# Configuration des Clés API

Ce guide explique où et comment configurer vos clés API de manière sécurisée dans ce projet.

## 📁 Fichiers de Configuration

### `secrets.local.js` (RECOMMANDÉ)
**⚠️ Ce fichier est ignoré par git et ne sera jamais commité.**

C'est le fichier principal où vous devez mettre toutes vos clés API sensibles.

**Pour commencer :**
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

Pour utiliser les clés API dans vos pages HTML, chargez les fichiers dans cet ordre :

```html
<!-- 1. D'abord charger les secrets (si vous utilisez secrets.local.js) -->
<script src="../secrets.local.js"></script>

<!-- 2. Ensuite charger la configuration spécifique -->
<script src="../emailjs-config.js"></script>

<!-- 3. Puis charger les SDK externes -->
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>

<!-- 4. Enfin charger vos scripts -->
<script src="../script.js"></script>
```

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

### Proxy Backend

Pour les clés privées (comme BilletWeb), créez un proxy backend qui :
1. Stocke la clé API côté serveur
2. Fait les appels API depuis le serveur
3. Retourne les résultats au client

Cela évite d'exposer vos clés API sensibles.

## 📚 Ressources

- [EmailJS Documentation](https://www.emailjs.com/docs/)
- [BilletWeb API Documentation](https://www.billetweb.fr/api-doc)
- [OWASP - API Security](https://owasp.org/www-project-api-security/)






