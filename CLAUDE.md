# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static website for **Donner de la Voix** — singing lessons and vocal improvisation workshops in Toulouse. Built with **Next.js 15 (App Router)**, React 19, TypeScript, and Tailwind CSS.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Next.js dev server on http://localhost:3000
npm run build        # Production build
npm run lint         # Lint
```

No test runner is configured.

## TODO (prochaine session)

- **Vérifier que l'invitation élève fonctionne** de bout en bout en conditions réelles (un vrai élève reçoit l'email Resend, clique le lien, arrive sur `/reset-password`, définit son mot de passe, accède à son espace).
- **Formulaire infos élève** — permettre à l'élève de renseigner nom, prénom, adresse et numéro de téléphone (probablement une nouvelle table Postgres liée à `auth.users.id`, sur le même modèle que `student_tags`).
- **Créer le blog** — page(s) publique(s) affichant les articles publiés depuis la table `posts` (aujourd'hui seul `/admin` → Blog permet de les créer/éditer, rien ne les affiche encore sur le site).
- **Créer une base de données avec les exercices** — probablement une nouvelle table Postgres + interface admin pour les gérer (nature exacte des exercices à préciser).
- **Récupérer la liste des ateliers sur BilletWeb** — via `app/api/billetweb/route.ts` (déjà utilisé par `app/ateliers/page.tsx`), à afficher/gérer quelque part dans `/admin` ou le dashboard élève.
- **Prévoir une fonction d'import des élèves par CSV** — alternative à l'invitation unitaire dans `/admin` → Élèves, pour inviter plusieurs élèves d'un coup.

## Architecture

### Page structure (App Router)

- `app/page.tsx` — homepage
- `app/ateliers/page.tsx` — stages & ateliers
- `app/impro-vocale/page.tsx` — impro vocale
- `app/cours-chant/page.tsx` — cours de chant
- `app/contact/page.tsx` — contact
- `app/newsletter/page.tsx` — newsletter
- `app/about/page.tsx` — about
- `app/offre-entreprise/page.tsx` — offre entreprise
- `app/espace-eleve/page.tsx` — espace élève (connexion + mot de passe oublié)
- `app/reset-password/page.tsx` — définir un nouveau mot de passe (lien reçu par email : reset ou invitation)
- `app/admin/page.tsx` — admin (dashboard, blog, gestion des élèves, suivi des séances, exercices, paiements, candidatures Formation Focus). L’onglet « Paiements » rend `components/PaiementsManager.tsx` (table `paiements`, une ligne par échéance : élève, libellé, contexte, dû, payé, échéance, moyen, commentaire ; statut calculé et totaux ; types/helpers dans `lib/paiements.ts`, SQL dans `supabase/migrations/20261008_paiements.sql` ; les paiements survivent à la suppression du compte, `eleve_nom` garde le nom). Réservé aux comptes étiquetés `admin` ; les autres sont renvoyés vers `/eleve`.
- `app/eleve/infos/page.tsx` — « Mes informations » : l’élève remplit sa fiche (table `eleves` : prénom, nom, téléphone ; `groupe` réservé aux admins via un trigger), types/helpers dans `lib/eleves.ts`, SQL dans `supabase/migrations/20261007_eleves.sql`. Les admins éditent les fiches depuis `/admin` → Élèves (`components/ElevesManager.tsx` : invitation, tableau comptes + fiches + étiquettes avec recherche et filtres, modale de fiche avec étiquettes et suppression). Une fiche est créée automatiquement pour chaque nouveau compte (trigger, `supabase/migrations/20261007_eleves_tous_les_comptes.sql`).
- `app/eleve/` — espace élève : `layout.tsx` (sidebar en blocs, garde de session, contexte `useStudent()` depuis `components/eleve/StudentContext.tsx`), `page.tsx` (accueil). Un bloc par contexte, déclaré dans `lib/student-pages.ts` (menu + garde d’accès par étiquette ; un admin voit tout ; un bloc sans `href` est un simple titre) : **Formation Focus** (`focus2026-2027` : `formation-focus/page.tsx` échéances et séances de l’année, `formation-focus/calendrier`, `formation-focus/suivi`, `formation-focus/devoirs` → `components/DevoirsManager.tsx` : tables `devoirs` (exercice, commentaire, date limite, étiquettes ; « Contenu à venir » si vide) et `devoirs_rendus` (un rendu par élève, bouton « J’ai rendu l’exercice »), SQL dans `supabase/migrations/20261007_devoirs.sql`), **Cours** (`cours/suivi`), **Ateliers** (`ateliers/suivi`). Chaque page `suivi` rend `components/eleve/SuiviSeances.tsx` (wrapper) → `components/SuiviSeancesManager.tsx` pour son contexte : tableau des récaps de la table `suivi_seances` + modale de détail (exercices), lecture filtrée par la RLS selon les étiquettes, création/modification en modale pour les admins. Le même manager, sans contexte, sert l’onglet « Suivi des séances » de `/admin` (filtre + choix du contexte). De même, `DevoirsManager` sans `contexte` ni `userId` sert l’onglet « Devoirs à rendre » de `/admin` (tous contextes, filtre, choix du contexte, liste des rendus ; pas de bouton de rendu). L’onglet « Exercices » de `/admin` rend `components/ExercicesManager.tsx` (table `exercices` : titre, `description`, `notions_objectifs` = liste d’ids de la table `notions_objectifs`, choisis via `NotionPicker` avec recherche et création à la volée — SQL dans `supabase/migrations/20261007_notions_objectifs.sql` ; supprimer un exercice le retire aussi des `suivi_seances.exercices`). Modale, champs et boutons partagés dans `components/ManagerUI.tsx` (types dans `lib/suivi.ts`, SQL dans `supabase/migrations/20261007_suivi_seances.sql`). Briques visuelles partagées dans `components/eleve/ui.tsx`.
- `app/formation-focus/page.tsx` — page de la formation longue "Formation Focus" (co-improvisation vocale & circlesong) ; son calendrier (dates, devoirs) vient de `lib/formation-focus.ts`, partagé avec l’espace élève
- `app/mentions-legales/page.tsx` — mentions légales
- `app/layout.tsx` — root layout (header, footer, global styles)

### Components

`components/` — shared React components:
- `Header.tsx` — navigation header
- `FloatingRdv.tsx` — floating Calendly button
- `SocialBar.tsx` — fixed social links sidebar
- `AteliersFormatPanel.tsx` — interactive bento grid + slide-in panel for ateliers formats
- `WorkshopsSection.tsx` — upcoming workshops grid (BilletWeb data)

### Backend / API

- `app/api/billetweb/route.ts` — Next.js Route Handler, proxy to BilletWeb API. Reads `BILLETWEB_USER_ID`, `BILLETWEB_API_KEY` from environment variables. The API key must never be exposed client-side. (A legacy duplicate used to live at the repo-root `api/billetweb.js` — that top-level `/api` directory alongside Next.js App Router API routes caused Vercel to misroute all `/api/*` traffic through it in production; it has been removed.)
- `app/api/admin/users/route.ts`, `app/api/admin/users/[id]/route.ts` — Next.js Route Handlers wrapping the Supabase Admin API (list/invite/delete auth users, for the "Élèves" tab in `/admin`). Use `lib/supabase-admin.ts` (server-only client built with `SUPABASE_SECRET_KEY`) — never import it from a `'use client'` file. Every handler verifies the caller's Supabase session via the `Authorization: Bearer <access_token>` header before touching the Admin API, then `requireAdmin` checks the caller has the `admin` tag in `student_tags` (accounts are only created by invite, no public signup).
- `app/api/admin/formation-focus-candidatures/route.ts` — Route Handler proxying the Tally API (`GET /forms/{formId}/submissions`) to list responses to the Formation Focus application form ([tally.so/r/2EydxM](https://tally.so/r/2EydxM), linked from `/formation-focus`), for the "Candidatures Formation Focus" tab in `/admin`. Reads `TALLY_API_KEY` (server-only). Same `requireAdmin` check as the users routes.

### Auth (Supabase)

- `lib/supabase-client.ts` — browser client (publishable key, safe to expose).
- Login (`/espace-eleve`) is email/password only — no signup form. Accounts are created by an admin inviting a student from `/admin` → Élèves, which sends a Supabase invite email.
- Both the "forgot password" email and the invite email redirect to `/reset-password`, which detects the recovery/invite session Supabase establishes on load and lets the user set a password via `updateUser`.
- `public.student_tags` (Postgres table, RLS from `supabase/migrations/20261007_student_tags_admin_rls.sql`: a user reads only their own row; admins — via the `public.is_admin()` function — read and write all rows) — `user_id uuid` (FK to `auth.users`, `on delete cascade`) + `tags text[]`. Queried directly client-side (like `posts`, no API route needed). After login, `lib/student-access.ts` (`homePathFor`) sends admins to `/admin` and everyone else to `/eleve`. Tag definitions (key/label/color) live in `lib/student-tags.ts` — add a new tag there and it appears automatically as a toggle pill in `/admin` → Élèves.

### Styles

- `app/globals.css` — global CSS with Tailwind directives
- `styles.css` — shared CSS variables and component styles (bento tints, glass panels, animations)

CSS variables:
- `--color-deep-bg`: `#0d0218` (dark purple/navy background)
- `--color-primary`: `#5b2ab5` (purple)
- `--color-accent`: `#cf3594` (pink/rose)
- Font: Josefin Sans (Google Fonts), weights 300–700

### Static assets

All static files live in `public/`. Images are at `public/assets/` and served at `/assets/`.

### Configuration & secrets

- `.env.local` — local secrets (not committed). Required vars: `BILLETWEB_USER_ID`, `BILLETWEB_API_KEY`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `SUPABASE_SECRET_KEY` (Supabase Admin API), `TALLY_API_KEY` (Tally API, personal access token from tally.so → Settings → API Access) — server-only, never expose client-side; must also be set in Vercel project env vars.

### Deployment

Deployed on Vercel with Next.js framework. `vercel.json` declares `"framework": "nextjs"`.
