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
- `app/espace-eleve/page.tsx` — espace élève
- `app/admin/page.tsx` — admin
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

- `api/billetweb.js` — Vercel serverless function, proxy to BilletWeb API. Reads `BILLETWEB_USER_ID`, `BILLETWEB_API_KEY` from environment variables. The API key must never be exposed client-side.

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

- `.env.local` — local secrets (not committed). Required vars: `BILLETWEB_USER_ID`, `BILLETWEB_API_KEY`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`.

### Deployment

Deployed on Vercel with Next.js framework. `vercel.json` declares `"framework": "nextjs"`.
