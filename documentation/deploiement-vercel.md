# Déploiement du site sur Vercel – guide pas à pas

Ce guide vous accompagne pour héberger le site sur Vercel et configurer les variables d’environnement (EmailJS, BilletWeb).

---

## Étape 1 : Préparer le dépôt Git

1. Vérifiez que votre projet est bien versionné et poussé sur **GitHub**, **GitLab** ou **Bitbucket**.
2. Depuis la racine du projet :
   ```bash
   git status
   git add .
   git commit -m "Préparation déploiement Vercel"
   git push origin design-marc
   ```
   (Remplacez `design-marc` par le nom de votre branche si besoin.)

---

## Étape 2 : Créer un projet sur Vercel

1. Allez sur [vercel.com](https://vercel.com) et connectez-vous (compte GitHub/GitLab/Bitbucket).
2. Cliquez sur **Add New…** → **Project**.
3. **Import** : choisissez le dépôt **DDLV-new** (ou le nom de votre repo).
4. Si on vous demande le **Framework Preset**, choisissez **Other** (ou laissez Vercel le détecter).
5. Ne déployez pas tout de suite : on va d’abord ajouter les variables d’environnement.

---

## Étape 3 : Configurer les variables d’environnement (avant le premier déploiement)

1. Dans l’écran d’import du projet, déroulez la section **Environment Variables**.
2. Ajoutez **une par une** les variables suivantes (en mettant **vos vraies valeurs** à la place des exemples).

### Variables EmailJS (formulaire de contact)

| Nom de la variable   | Valeur (exemple)   | Environnement(s) |
|----------------------|--------------------|------------------|
| `EMAILJS_PUBLIC_KEY` | `TREtbDAfx2QLJ_xxx` | Production, Preview, Development |
| `EMAILJS_SERVICE_ID` | `service_xxx`      | Production, Preview, Development |
| `EMAILJS_TEMPLATE_ID`| `template_xxx`     | Production, Preview, Development |

### Variables BilletWeb (ateliers / événements)

| Nom de la variable   | Valeur (exemple) | Environnement(s) |
|----------------------|------------------|------------------|
| `BILLETWEB_USER_ID`  | `73590`          | Production, Preview, Development |
| `BILLETWEB_API_KEY`  | `d702349fae...`  | Production, Preview, Development |
| `BILLETWEB_EVENT_ID` | *(vide ou un ID)*| Production, Preview, Development (optionnel) |

3. Pour chaque variable :
   - **Key** : le nom exact (en majuscules, avec underscores, sans espace).
   - **Value** : votre clé ou ID réel (copié depuis EmailJS / BilletWeb).
   - Cochez au moins **Production** ; cochez **Preview** et **Development** si vous voulez les mêmes clés pour les prévues et le dev.
4. Cliquez sur **Deploy** pour lancer le premier déploiement.

---

## Étape 4 : Vérifier le build

Lors du déploiement, Vercel va :

1. Cloner votre dépôt.
2. Exécuter `npm install`.
3. Exécuter `npm run build` (défini dans `vercel.json`), qui lance `node scripts/generate-env-config.js`.
4. Ce script génère **`env-config.js`** à la racine en utilisant les variables d’environnement que vous venez d’ajouter.
5. Servir le site (dossier courant `.`).

Si le build échoue, consultez les **Build Logs** dans l’onglet **Deployments** pour voir l’erreur.

---

## Étape 5 : Ajouter ou modifier des variables plus tard

1. Dans Vercel : votre projet → **Settings** → **Environment Variables**.
2. **Ajouter** : cliquez sur **Add New**, saisissez le **Name** et la **Value**, choisissez les environnements, puis **Save**.
3. **Modifier** : cliquez sur les trois points à droite de la variable → **Edit**.
4. Après toute modification de variable, il faut **redéployer** pour que le nouveau `env-config.js` soit généré :
   - **Deployments** → dernier déploiement → **⋯** → **Redeploy**.

---

## Étape 6 : Récapitulatif des noms exacts

À recopier tels quels dans Vercel (sans espace, en majuscules) :

```
EMAILJS_PUBLIC_KEY
EMAILJS_SERVICE_ID
EMAILJS_TEMPLATE_ID
BILLETWEB_USER_ID
BILLETWEB_API_KEY
BILLETWEB_EVENT_ID
```

---

## Utiliser une branche autre que `main` en production

Pour que Vercel déploie le contenu de votre branche actuelle (par ex. `design-marc`) en production :

1. **Poussez votre branche** sur le dépôt distant si ce n’est pas déjà fait :
   ```bash
   git push origin design-marc
   ```
   (Remplacez `design-marc` par le nom de votre branche.)

2. **Dans Vercel** : ouvrez votre projet → **Settings** → **Git**.

3. Dans **Production Branch**, remplacez `main` par le nom de votre branche (ex. `design-marc`), puis enregistrez.

4. **Déclencher un déploiement** :
   - Soit en poussant à nouveau un commit sur cette branche,
   - Soit dans **Deployments** → dernier déploiement → **⋯** → **Redeploy**.

À partir de là, chaque push sur cette branche mettra à jour le site en production. Vous pourrez remettre `main` plus tard dans les réglages si besoin.

---

## Dépannage

- **Le formulaire de contact ne fonctionne pas**  
  Vérifiez que `EMAILJS_PUBLIC_KEY`, `EMAILJS_SERVICE_ID` et `EMAILJS_TEMPLATE_ID` sont bien renseignés pour **Production** et que vous avez redéployé après les avoir ajoutés.

- **Les ateliers ne s’affichent pas**  
  Vérifiez `BILLETWEB_USER_ID` et `BILLETWEB_API_KEY` (et éventuellement `BILLETWEB_EVENT_ID`). Pensez à redéployer après modification.

- **Build échoue**  
  Vérifiez que `vercel.json` est commité et que la commande `npm run build` fonctionne en local (`npm run build`).

- **Variables non prises en compte**  
  Les variables sont lues **au moment du build**. Toute modification dans **Settings → Environment Variables** nécessite un **Redeploy** (sans « Use existing Build Cache » si vous voulez être sûr).

---

## Sécurité

- En production, **ne commitez jamais** `secrets.local.js` ni vos clés dans le repo.
- Sur Vercel, les variables sont chiffrées et ne sont pas visibles dans le code source du site : le script de build injecte leurs valeurs dans `env-config.js` uniquement pendant le déploiement ; ce fichier est généré sur les serveurs Vercel et servi avec le site.
- Pour BilletWeb, si vous mettez en place un proxy backend (recommandé pour la clé API), vous pourrez ajouter des variables du type `BILLETWEB_PROXY_URL` et adapter le script ou le front selon la doc du projet.

Vous pouvez maintenant partager l’URL fournie par Vercel (ex. `https://votre-projet.vercel.app`) pour accéder au site en production.
