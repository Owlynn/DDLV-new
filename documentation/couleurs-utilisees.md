# Liste exhaustive des couleurs utilisées dans le site

## 1. Couleurs personnalisées définies dans `tailwind.config.ts`

### Couleur primaire (Violet)
- **`primary`** (DEFAULT) : `#3605af` - Violet principal
- **`primary-dark`** : `#2A0488` - Violet foncé (hover, états actifs)
- **`primary-light`** : `#4A07D4` - Violet clair

### Couleur accent (Rose)
- **`accentPink`** (DEFAULT) : `#fe66c3` - Rose principal
- **`accentPink-light`** : `#FF8BD2` - Rose clair

### Couleurs de fond
- **`background`** : `#FFFFFF` - Blanc (fond principal)
- **`backgroundSoft`** : `#F0EBFF` - Violet très clair (fond doux, variante de #3605af)

### Couleurs de texte
- **`textMain`** : `#000000` - Noir (texte principal)
- **`textMuted`** : `#666666` - Gris moyen (texte secondaire)

### Couleurs de bordure
- **`borderSoft`** : `#D4C5FF` - Violet très clair (bordures douces, variante de #3605af)

### Couleur de badge
- **`badgeBg`** : `#E8DCFF` - Violet très clair (fond des badges, variante de #3605af)

---

## 2. Couleurs standards utilisées

### Blanc
- **`white`** - Utilisé pour :
  - Texte sur fonds colorés (boutons primaires, footer)
  - Bordures avec opacité (`border-white/20`)
  - Fond du header (`bg-white/60`)

### Transparent
- **`transparent`** - Utilisé pour :
  - Fond transparent des cartes et sections
  - Bordures transparentes
  - Boutons secondaires et ghost

---

## 3. Couleurs avec opacité (variantes)

### Couleur primaire avec opacité
- **`bg-primary/30`** - Fond primaire à 30% d'opacité (lignes de la timeline)
- **`border-primary/30`** - Bordure primaire à 30% d'opacité (timeline)
- **`ring-primary/30`** - Ring primaire à 30% d'opacité (effets hover)

### Couleur accent avec opacité
- **`border-accentPink/50`** - Bordure rose à 50% d'opacité (timeline hover)

### Couleur backgroundSoft avec opacité
- **`bg-backgroundSoft/80`** - Fond doux à 80% d'opacité (sections avec fond violet clair)

### Couleur blanc avec opacité
- **`bg-white/60`** - Fond blanc à 60% d'opacité (header)
- **`bg-white/30`** - Fond blanc à 30% d'opacité (anciennement utilisé)
- **`bg-white/15`** - Fond blanc à 15% d'opacité (anciennement utilisé)
- **`bg-white/50`** - Fond blanc à 50% d'opacité (anciennement utilisé)
- **`bg-white/70`** - Fond blanc à 70% d'opacité (anciennement utilisé)
- **`bg-white/95`** - Fond blanc à 95% d'opacité (anciennement utilisé)
- **`border-white/20`** - Bordure blanche à 20% d'opacité (footer)

### Couleur borderSoft avec opacité
- **`border-borderSoft/50`** - Bordure douce à 50% d'opacité (header)

---

## 4. Couleurs dans les styles CSS (`globals.css`)

### Fond hexagonal
- **Image SVG** : `/hexagon-pattern.svg`
- **Opacité** : `0.75` (75%)
- **Filtre** : `contrast(2.5) brightness(0.85)`

---

## 5. Utilisation par composant/page

### Navigation (`components/Navigation.tsx`)
- `bg-white/60` - Fond du header
- `border-borderSoft/50` - Bordure du header
- `text-textMain` - Texte des liens

### Hero (`components/sections/Hero.tsx`)
- `bg-backgroundSoft` - Fond de la section
- `text-textMain` - Texte principal
- `text-accentPink` - Icônes

### Button (`components/Button.tsx`)
- `bg-primary` - Fond bouton primaire
- `text-white` - Texte bouton primaire
- `bg-primary-dark` - Fond hover bouton primaire
- `border-primary` - Bordure bouton secondaire
- `text-primary` - Texte bouton secondaire/ghost
- `bg-backgroundSoft` - Fond hover bouton secondaire/ghost

### Footer (`components/Footer.tsx`)
- `bg-primary` - Fond du footer (violet)
- `text-white` - Texte du footer
- `border-white/20` - Bordure de séparation

### Timeline (`components/Timeline.tsx`)
- `bg-primary/30` - Lignes horizontales et verticales
- `bg-primary` - Cercles numérotés
- `text-white` - Numéros dans les cercles
- `border-primary/30` - Bordures des cartes
- `border-accentPink/50` - Bordure hover
- `text-textMain` - Titres
- `text-textMuted` - Descriptions
- `ring-primary/30` - Ring hover

### Card (`components/Card.tsx`)
- `bg-white` - Fond des cartes
- `border-borderSoft` - Bordure des cartes

### Section (`components/Section.tsx`)
- `bg-background` - Fond par défaut
- `bg-backgroundSoft` - Fond doux
- `text-primary` - Eyebrow text
- `text-textMain` - Titre

### Page Cours de chant (`app/cours-de-chant/page.tsx`)
- `bg-backgroundSoft/80` - Fond des sections
- `bg-transparent` - Fond des cartes tarifs
- `border-borderSoft` - Bordures des cartes
- `text-textMain` - Titres
- `text-textMuted` - Textes secondaires
- `text-primary` - Prix et accents

### Page Ateliers (`app/ateliers/page.tsx`)
- `bg-badgeBg` - Fond des badges
- `text-primary` - Texte des badges et liens
- `text-textMain` - Titres
- `text-textMuted` - Textes secondaires
- `bg-primary` - Fond bouton
- `text-white` - Texte bouton

### Page Contact (`app/contact/page.tsx`)
- `border-borderSoft` - Bordures des champs de formulaire
- `text-textMain` - Labels
- `text-accentPink` - Astérisques requis
- `bg-primary` - Fond bouton
- `text-white` - Texte bouton
- `bg-backgroundSoft` - Fond de la section contact

### Page Newsletter (`app/newsletter/page.tsx`)
- `border-borderSoft` - Bordures des champs
- `text-textMain` - Labels
- `text-accentPink` - Astérisques requis
- `bg-primary` - Fond bouton
- `text-white` - Texte bouton
- `text-primary` - Message de succès

### Page Cours de looper (`app/cours-de-looper/page.tsx`)
- `bg-backgroundSoft` - Fond des sections
- `bg-white` - Fond des cartes
- `border-borderSoft` - Bordures
- `text-textMain` - Titres
- `text-textMuted` - Textes
- `text-primary` - Prix

### Page Offre entreprise (`app/offre-entreprise/page.tsx`)
- `bg-white` - Fond des cartes
- `border-borderSoft` - Bordures
- `text-textMain` - Titres
- `text-textMuted` - Textes

### Page La prof (`app/la-prof/page.tsx`)
- `text-textMain` - Titres et textes principaux
- `text-textMuted` - Textes secondaires
- `text-primary` - Liens

### Page Mentions légales (`app/mentions-legales/page.tsx`)
- `text-textMain` - Titres et textes en gras
- `text-textMuted` - Textes secondaires

---

## 6. Résumé des codes hexadécimaux

| Nom | Code hexadécimal | Utilisation principale |
|-----|------------------|------------------------|
| `primary` | `#3605af` | Couleur principale (violet) |
| `primary-dark` | `#2A0488` | Hover, états actifs |
| `primary-light` | `#4A07D4` | Violet clair |
| `accentPink` | `#fe66c3` | Accents, icônes |
| `accentPink-light` | `#FF8BD2` | Accents clairs |
| `background` | `#FFFFFF` | Fond principal (blanc) |
| `backgroundSoft` | `#F0EBFF` | Fond doux (variante de #3605af) |
| `textMain` | `#000000` | Texte principal (noir) |
| `textMuted` | `#666666` | Texte secondaire (gris) |
| `borderSoft` | `#D4C5FF` | Bordures douces (variante de #3605af) |
| `badgeBg` | `#E8DCFF` | Fond des badges (variante de #3605af) |

---

## 7. Palette de couleurs globale

### Couleurs principales
- **Violet primaire** : `#3605af` → `#2A0488` → `#4A07D4` (gradient)
- **Rose accent** : `#fe66c3` → `#FF8BD2` (gradient)

### Couleurs de fond
- **Blanc** : `#FFFFFF`
- **Violet très clair** : `#F0EBFF` (backgroundSoft, variante de #3605af)
- **Violet clair** : `#E8DCFF` (badgeBg, variante de #3605af)
- **Violet très clair** : `#D4C5FF` (borderSoft, variante de #3605af)

### Couleurs de texte
- **Noir** : `#000000` (textMain)
- **Gris moyen** : `#666666` (textMuted)

### Couleur de fond hexagonal
- **Image SVG** avec opacité 75% et filtre `contrast(2.5) brightness(0.85)`

---

## Notes importantes

1. **Transparence** : De nombreuses couleurs sont utilisées avec des opacités variables (30%, 50%, 60%, 80%, etc.) pour créer des effets de profondeur et de superposition.

2. **Cohérence** : La palette est centrée autour du violet (`#3605af`) avec des variations claires et foncées dérivées de cette couleur de base, complétée par un accent rose (`#fe66c3`).

3. **Contraste** : Les couleurs de texte (`textMain` en noir, `textMuted` en gris) sont choisies pour assurer une excellente lisibilité sur les fonds clairs (`background`, `backgroundSoft`).

4. **Accessibilité** : Le footer utilise `bg-primary` (violet) avec `text-white` pour un contraste élevé. Les textes en noir sur fond clair offrent un excellent contraste pour l'accessibilité.

