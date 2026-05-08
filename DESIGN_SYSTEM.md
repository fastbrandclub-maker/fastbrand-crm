# FastBrand CRM — Design System

> Source de vérité du **Design Authority** du CRM coach. Toute interface (CRM coach, portail élève, futurs modules) doit s'aligner sur ce document.
>
> Dernier audit : 2026-05-08 — basé sur la branche `main` (commit `bb78961`).

## Table des matières

1. [Foundations](#1-foundations)
2. [Couleurs](#2-couleurs)
3. [Typographie](#3-typographie)
4. [Espacements](#4-espacements)
5. [Border-radius](#5-border-radius)
6. [Ombres et effets](#6-ombres-et-effets)
7. [Iconographie](#7-iconographie)
8. [Composants UI atomiques](#8-composants-ui-atomiques)
9. [Composants métier](#9-composants-métier)
10. [Layout & navigation](#10-layout--navigation)
11. [Patterns récurrents](#11-patterns-récurrents)
12. [Incohérences à corriger](#12-incohérences-à-corriger)

---

## 1. Foundations

| Élément | Valeur |
|---|---|
| Stack | React 18 + Vite + Tailwind 3.4 + Lucide icons |
| Mode | **Dark only** (pas de toggle clair/sombre) |
| Police | **Inter** (Google Fonts, weights 300/400/500/600/700) |
| Locale par défaut | `fr` (date-fns/locale/fr) |
| Background body | `#0A0A0A` (`brand.dark`) |
| Couleur de texte par défaut | `#FFFFFF` |

**Fichiers clés :**
- [src/index.css](src/index.css) — base CSS + scrollbar custom
- [tailwind.config.js](tailwind.config.js) — tokens couleurs `brand.*`
- [index.html](index.html) — preload Inter font

```css
/* src/index.css */
body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: #0A0A0A;
  color: #fff;
}
::-webkit-scrollbar { width: 6px; height: 6px }
::-webkit-scrollbar-track { background: #111111 }
::-webkit-scrollbar-thumb { background: #333; border-radius: 3px }
::-webkit-scrollbar-thumb:hover { background: #444 }
```

---

## 2. Couleurs

### 2.1 Brand (définies dans `tailwind.config.js`)

| Token Tailwind | HEX | Usage |
|---|---|---|
| `brand-red` | `#E8000D` | Accent principal, CTA primaires, badges critiques, focus, logo |
| `brand-dark` | `#0A0A0A` | Background page (body) |
| `brand-surface` | `#111111` | Background cartes, panneaux, sidebar, inputs |
| `brand-card` | `#161616` | Background modales (1 cran plus clair que `surface`) |
| `brand-border` | `#222222` | Bordures par défaut (cartes, inputs, séparateurs) |

### 2.2 Échelle Zinc (Tailwind par défaut, intensivement utilisée)

| Token | HEX | Usage typique |
|---|---|---|
| `zinc-300` | `#D4D4D8` | Texte secondaire (corps de message) |
| `zinc-400` | `#A1A1AA` | Texte muted (labels, meta) |
| `zinc-500` | `#71717A` | Texte tertiaire (helper, captions, placeholders forts) |
| `zinc-600` | `#52525B` | Placeholder inputs, texte ultra-faible, icônes inactives, focus border |
| `zinc-700` | `#3F3F46` | Hover bordure |
| `zinc-800` | `#27272A` | Backgrounds neutres alternatifs (badges "À faire") |

### 2.3 Couleurs sémantiques

| Intention | Token primaire | Token bg | Token texte | Token bordure |
|---|---|---|---|---|
| **Danger / erreur** | `brand-red` | `bg-red-950/40` ou `bg-red-950/50` | `text-red-300` ou `text-red-400` | `border-red-800/40` à `/60` |
| **Warning** | `amber-400` | `bg-amber-500/20` ou `bg-amber-950/40` | `text-amber-400` | `border-amber-800/40` |
| **Success** | `emerald-400` | `bg-emerald-500/10` ou `bg-emerald-950` | `text-emerald-300` ou `text-emerald-400` | `border-emerald-500/30` à `/50` |
| **Info / neutre actif** | `blue-400` | `bg-blue-950` ou `bg-blue-950/20` | `text-blue-300` ou `text-blue-400` | `border-blue-800/30` à `/40` |

**Convention** : utiliser `bg-{color}-950/40` ou `bg-{color}-500/10..20` pour les surfaces, et `text-{color}-300/400` pour le texte. Les couleurs pleines (`bg-red-500`) ne sont **jamais** utilisées en grande surface — elles servent aux dots et ponctuels.

### 2.4 Couleurs offres (cf [OfferTimer.jsx](src/components/students/OfferTimer.jsx))

| Offre | Background | Texte |
|---|---|---|
| 60 Jours | `bg-blue-950` | `text-blue-300` |
| 6 Mois | `bg-purple-950` | `text-purple-300` |
| 12 Mois | `bg-indigo-950` | `text-indigo-300` |
| Résultats | `bg-emerald-950` | `text-emerald-300` |
| Indéterminé | `bg-zinc-800` | `text-zinc-400` |

### 2.5 Statuts d'étape (cf [constants.js](src/lib/constants.js))

| Statut | Background badge | Texte badge | Dot |
|---|---|---|---|
| À faire | `bg-zinc-800` | `text-zinc-400` | `bg-zinc-500` |
| En cours | `bg-blue-950` | `text-blue-300` | `bg-blue-400` |
| Validé | `bg-emerald-950` | `text-emerald-300` | `bg-emerald-400` |
| Bloqué | `bg-red-950` | `text-red-300` | `bg-red-500` |

### 2.6 Surfaces translucides (récurrentes)

| Classe | Usage |
|---|---|
| `bg-white/5` | Hover ghost button, surface alternative subtile |
| `bg-white/10` | Hover de boutons sur fond sombre |
| `bg-black/60` à `/70` | Overlay modale (avec `backdrop-blur-sm`) |
| `border-white/8` à `/15` | Bordures fines sur fond très sombre (utilisé surtout dans **StudentPortal — incohérence**) |

---

## 3. Typographie

### 3.1 Police

```html
<!-- index.html -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
```

Stack fallback : `'Inter', system-ui, -apple-system, sans-serif`.

### 3.2 Échelle de tailles

| Token Tailwind | Taille | Line-height | Usage typique |
|---|---|---|---|
| `text-[10px]` | 10px | — | Labels uppercase, meta très faible, badges micro |
| `text-[11px]` | 11px | — | Sous-titres header sticky du portail, footer |
| `text-xs` | 12px | 16px | Labels, helper text, meta, badges, pills |
| `text-sm` | 14px | 20px | **Corps par défaut**, body de carte, inputs |
| `text-base` | 16px | 24px | Titres modale (`text-base font-semibold`), inputs mobile |
| `text-lg` | 18px | 28px | Titres de fiche (StudentDetail, mobile) |
| `text-xl` | 20px | 28px | Titres de page (`Élèves`, `Bonjour Lilian 👋`) |
| `text-2xl` | 24px | 32px | Titre Login, écrans d'auth |
| `text-3xl` | 30px | 36px | Valeurs numériques de StatCard du Dashboard |

### 3.3 Poids

| Token | Valeur | Usage |
|---|---|---|
| `font-normal` (400) | 400 | (rare — par défaut le body est en `font-medium`) |
| `font-medium` | 500 | Body, items de liste, navigation |
| `font-semibold` | 600 | Titres de section, labels forts |
| `font-bold` | 700 | Titres de page, valeurs StatCard, CTA forts, prénoms en liste |

### 3.4 Conventions

- **Labels de formulaire** : `text-xs font-medium text-zinc-400`
- **Section header** : `text-xs font-semibold text-zinc-500 uppercase tracking-wider`
- **Pills uppercase** : `text-[10px] font-bold uppercase tracking-wider` ou `tracking-wide`
- **Placeholders** : `placeholder-zinc-600`
- **Texte tronqué** : `truncate` ou `line-clamp-2`

### 3.5 Hiérarchie de référence

```jsx
{/* Page header */}
<h1 className="text-xl font-bold text-white">Élèves</h1>
<p className="text-sm text-zinc-500 mt-0.5">34 élèves au total</p>

{/* Card section */}
<h2 className="text-sm font-semibold text-white">Les 9 étapes de la méthode</h2>

{/* Section divider (uppercase) */}
<p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Admin</p>

{/* Field label */}
<label className="text-xs font-medium text-zinc-400">Statut</label>
```

---

## 4. Espacements

Le projet utilise l'**échelle Tailwind par défaut** (multiples de 4px). Aucun spacing custom dans la config.

### 4.1 Échelle effectivement utilisée

| Token | px | Usage typique |
|---|---|---|
| `0.5` | 2 | Pills très compactes (`py-0.5`) |
| `1` | 4 | Gaps minimaux |
| `1.5` | 6 | Gaps entre icône+label, dots |
| `2` | 8 | **Gap par défaut** (badges, items de liste) |
| `2.5` | 10 | Padding boutons compacts |
| `3` | 12 | Gap section, padding card compact (`p-3`) |
| `4` | 16 | **Padding card par défaut** (`p-4`), gap entre sections |
| `5` | 20 | Padding card riche (`p-5`, `px-5 py-4` modal header) |
| `6` | 24 | Padding desktop (`lg:p-6`) |
| `8` | 32 | Marge bloc Login |

### 4.2 Conventions de page

```jsx
{/* Page wrapper standard */}
<div className="p-4 lg:p-6 max-w-6xl mx-auto">
  {/* p-4 mobile, p-6 desktop */}
</div>
```

| Page | `max-w-` | Padding |
|---|---|---|
| Dashboard | `max-w-6xl` | `p-4 lg:p-6` |
| Élèves (liste) | `max-w-6xl` | `p-4 lg:p-6` |
| Fiche élève | `max-w-5xl` | `p-4 lg:p-6` |
| Portail élève | `max-w-2xl` | `px-4` |
| Login | `max-w-sm` (card) | `p-4` (page) / `p-6` (card) |

### 4.3 Padding interne par composant

| Composant | Padding |
|---|---|
| Card standard | `p-4` |
| Card riche (StudentDetail header) | `p-5` |
| Modal header | `px-5 py-4` |
| Modal body | `px-5 py-4` |
| Bouton md | `px-3.5 py-2` |
| Bouton sm | `px-2.5 py-1.5` |
| Bouton lg | `px-5 py-2.5` |
| Input | `px-3 py-2` |
| Pill / badge | `px-2 py-0.5` |

### 4.4 Gaps verticaux entre sections

- Sections d'une page : `mb-4` à `mb-5`
- Items dans une card : `space-y-2` (compact) ou `space-y-3` (standard)
- Sections internes séparées par bordure : `mt-4 pt-4 border-t border-brand-border`

---

## 5. Border-radius

| Token | px | Usage |
|---|---|---|
| `rounded` | 4 | (rare) |
| `rounded-md` | 6 | **Boutons par défaut**, inputs, dropdowns, items navigation |
| `rounded-lg` | 8 | Cards secondaires, alertes inline, status pills compacts |
| `rounded-xl` | 12 | **Cards principales**, modales, blocs CTA |
| `rounded-2xl` | 16 | (utilisé uniquement dans StudentPortal — **incohérence**) |
| `rounded-full` | ∞ | Avatars, dots de statut, pills (badges arrondis) |

**Règle** : choisir le radius selon l'imbrication. Une card `rounded-xl` qui contient des items devrait avoir des items `rounded-md` ou `rounded-lg`.

---

## 6. Ombres et effets

### 6.1 Shadows

| Token | Usage | Source |
|---|---|---|
| `shadow-lg shadow-brand-red/20` | Logo Login (lueur rouge subtile) | [Login.jsx:26](src/pages/Login.jsx#L26) |
| `shadow-xl` | Card du formulaire Login | [Login.jsx:34](src/pages/Login.jsx#L34) |
| `shadow-2xl` | Modale | [Modal.jsx:27](src/components/ui/Modal.jsx#L27) |

> Ombres très peu utilisées hors auth/modales — la profondeur visuelle se joue surtout sur les nuances de bg (`brand-dark`/`brand-surface`/`brand-card`).

### 6.2 Transitions

```css
transition-colors        /* défaut sur 99% des hover */
transition-transform     /* chevrons rotate-180 dans accordéon */
transition-all           /* combinaisons (ex: bouton + bordure + couleur) */
duration-200             /* sidebar mobile slide */
duration-700             /* barre progression du portail */
```

Aucune `easing` custom n'est définie — Tailwind applique `ease-in-out` par défaut.

### 6.3 Animations

```css
animate-spin    /* loaders : <div className="border-2 border-brand-red border-t-transparent rounded-full animate-spin" /> */
```

### 6.4 Backdrop

```jsx
{/* Modal overlay */}
<div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
```

---

## 7. Iconographie

**Librairie** : [`lucide-react`](https://lucide.dev) v0.344.0.

### 7.1 Tailles standard

| Contexte | Taille |
|---|---|
| Icône inline dans titre / label | `size={10}` à `size={13}` |
| Icône dans bouton standard | `size={13}` à `size={15}` |
| Icône dans CTA grand format | `size={18}` |
| Icône dans avatar carré (logo Zap) | `size={14}` (petit) à `size={26}` (Login) |
| ChevronRight/Down dans listes | `size={14}` à `size={15}` |

### 7.2 Couleurs

```jsx
<Icon size={13} className="text-zinc-400" />     {/* défaut neutre */}
<Icon size={13} className="text-brand-red" />    {/* accent */}
<Icon size={13} className="text-amber-400" />    {/* warning */}
<Icon size={13} className="text-emerald-400" />  {/* success */}
<Icon size={13} className="text-blue-400" />     {/* info */}
```

### 7.3 Icônes signature

| Usage | Icône |
|---|---|
| Logo FastBrand | `Zap` |
| Élèves | `Users` |
| Kanban | `Columns` |
| Calendrier | `CalendarDays` |
| Ressources | `BookOpen` |
| Feedbacks | `MessageSquare` |
| Comptabilité | `Receipt` |
| Sales | `TrendingUp` |
| Contrat | `FileText` |
| Bloqué/litige | `AlertTriangle`, `ShieldAlert` |
| Inactif | `Clock` |
| Validé | `CheckCircle`, `CheckCircle2`, `Check` |
| Lien externe | `ExternalLink` |
| Action positive (relance) | `MessageCircle` |
| Suppression | `Trash2` |
| Édition | `Edit` |
| Fermeture modale | `X` |
| Navigation | `ChevronRight`, `ChevronDown`, `ChevronLeft`, `ArrowRight` |

---

## 8. Composants UI atomiques

### 8.1 Button — [src/components/ui/Button.jsx](src/components/ui/Button.jsx)

```jsx
<Button variant="primary" size="md">Action</Button>
```

| Prop | Valeurs | Défaut |
|---|---|---|
| `variant` | `primary` \| `secondary` \| `ghost` \| `danger` | `primary` |
| `size` | `sm` \| `md` \| `lg` | `md` |

**Classes par variante :**

```jsx
const variants = {
  primary:   'bg-brand-red text-white hover:bg-red-700',
  secondary: 'bg-white/5 text-white hover:bg-white/10 border border-brand-border',
  ghost:     'text-zinc-400 hover:text-white hover:bg-white/5',
  danger:    'bg-red-900/50 text-red-300 hover:bg-red-900 border border-red-800',
}
const sizes = {
  sm: 'text-xs px-2.5 py-1.5',
  md: 'text-sm px-3.5 py-2',
  lg: 'text-sm px-5 py-2.5',
}
const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
```

### 8.2 Input / Textarea / Select — [src/components/ui/Input.jsx](src/components/ui/Input.jsx)

```jsx
<Input label="Nom" placeholder="..." />
<Textarea label="Notes" rows={3} />
<Select label="Statut">
  <option value="todo">À faire</option>
</Select>
```

**Classes communes :**

```jsx
className="bg-brand-surface border border-brand-border rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
```

- **Label** : `text-xs font-medium text-zinc-400`
- **Erreur** : ajoute `border-red-700` + `<p className="text-xs text-red-400">{error}</p>`

### 8.3 Modal — [src/components/ui/Modal.jsx](src/components/ui/Modal.jsx)

```jsx
<Modal open={isOpen} onClose={close} title="Modifier l'élève" size="lg">
  ...contenu...
</Modal>
```

| Prop `size` | `max-w-` |
|---|---|
| `sm` | `md` (28rem) |
| `md` (défaut) | `lg` (32rem) |
| `lg` | `2xl` (42rem) |
| `xl` | `3xl` (48rem) |

**Structure :**

```jsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
  <div className="relative w-full max-w-lg bg-brand-card border border-brand-border rounded-xl shadow-2xl">
    <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
      <h2 className="text-base font-semibold text-white">Titre</h2>
      <button className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-white hover:bg-white/10">
        <X size={15} />
      </button>
    </div>
    <div className="px-5 py-4">{children}</div>
  </div>
</div>
```

**Comportements :**
- Ferme sur `Escape`
- Ferme sur clic backdrop
- `bg-brand-card` (cran plus clair que les pages) — distingue de `bg-brand-surface` des cards

### 8.4 Badge — [src/components/ui/Badge.jsx](src/components/ui/Badge.jsx)

#### `<StatusBadge status="todo" />`

```jsx
<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium {bg} {text}">
  <span className="w-1.5 h-1.5 rounded-full {dot}" />
  {label}
</span>
```

Mapping `STEP_STATUS` (cf [constants.js](src/lib/constants.js)) :

| Statut | bg | text | dot |
|---|---|---|---|
| `todo` | `bg-zinc-800` | `text-zinc-400` | `bg-zinc-500` |
| `in_progress` | `bg-blue-950` | `text-blue-300` | `bg-blue-400` |
| `validated` | `bg-emerald-950` | `text-emerald-300` | `bg-emerald-400` |
| `blocked` | `bg-red-950` | `text-red-300` | `bg-red-500` |

#### `<RoleBadge role="admin" />`

```jsx
const colors = {
  admin:     'bg-brand-red/20 text-brand-red',
  coach:     'bg-blue-950 text-blue-300',
  assistant: 'bg-zinc-800 text-zinc-400',
}
```

### 8.5 Avatar (pattern, pas un composant)

```jsx
{/* Avatar liste élèves (small, 40px) */}
<div className="w-10 h-10 rounded-full bg-brand-red/20 flex items-center justify-center shrink-0">
  <span className="text-sm font-bold text-brand-red">
    {firstName[0]}{lastName[0]}
  </span>
</div>

{/* Avatar fiche détail (large, 48-56px) */}
<div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-brand-red/20 flex items-center justify-center shrink-0">
  <span className="text-lg lg:text-xl font-bold text-brand-red">JD</span>
</div>
```

**Règle** : avatar = `bg-brand-red/20` + `text-brand-red` + initiales en `font-bold`.

### 8.6 Spinner / Loader

```jsx
<div className="w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
{/* Plein écran : */}
<div className="flex items-center justify-center min-h-screen bg-brand-dark">
  <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
</div>
```

Variante Lucide (utilisée dans le portail) :

```jsx
<Loader2 size={28} className="text-red-500 animate-spin" />
```

### 8.7 Toast / notification (impératif via DOM)

Pas de composant React — création directe en DOM dans [RelanceButton.jsx](src/components/students/RelanceButton.jsx) :

```js
const notif = document.createElement('div')
notif.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:#10b981;color:#fff;padding:14px 20px;border-radius:12px;font-size:13px;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,.4);max-width:420px;line-height:1.4'
document.body.appendChild(notif)
setTimeout(() => notif.remove(), 5000)
```

> **À refacto** : créer un composant `<Toast />` réutilisable (cf [§12](#12-incohérences-à-corriger)).

### 8.8 Progress bar

```jsx
<div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
  <div
    className="h-full bg-brand-red rounded-full transition-all"
    style={{ width: `${progress}%` }}
  />
</div>
```

Variante portail (différente — incohérence) :

```jsx
<div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
  <div className="h-full bg-red-500 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
</div>
```

---

## 9. Composants métier

### 9.1 Card de page (pattern de base)

```jsx
<div className="bg-brand-surface border border-brand-border rounded-xl p-4">
  ...
</div>
```

Variantes par état :

```jsx
{/* Card avec ouverture (litige, bloqués) */}
<div className="bg-red-950/40 border border-red-800/60 rounded-xl p-4 mb-4">

{/* Card warning (inactifs) */}
<div className="bg-brand-surface border border-amber-900/40 rounded-xl overflow-hidden">

{/* Card success (rare) */}
<div className="bg-brand-surface border border-emerald-900/40 rounded-xl p-4">
```

### 9.2 StatCard — Dashboard

```jsx
function StatCard({ icon: Icon, label, value, color = 'text-white' }) {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center">
          <Icon size={16} className="text-zinc-400" />
        </div>
      </div>
    </div>
  )
}
```

Source : [Dashboard.jsx:11](src/pages/Dashboard.jsx#L11).

### 9.3 StepCard (les 9 étapes) — [src/components/students/StepCard.jsx](src/components/students/StepCard.jsx)

**Structure** : accordéon avec bordure colorée selon le statut.

```jsx
<div className={`border rounded-lg overflow-hidden transition-colors ${
  status === 'blocked'     ? 'border-red-800/50' :
  status === 'validated'   ? 'border-emerald-800/30' :
  status === 'in_progress' ? 'border-blue-800/40' :
                             'border-brand-border'
}`}>
  <button className="w-full flex items-center gap-3 px-4 py-3 bg-brand-card hover:bg-white/5 transition-colors text-left">
    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${statusBg} ${statusText}`}>
      {step.number}
    </span>
    <span className="flex-1 text-sm font-medium text-white">{step.name}</span>
    <StatusBadge status={status} />
    <ChevronDown size={14} className="text-zinc-500" />
  </button>
  {open && (
    <div className="px-4 py-4 border-t border-brand-border space-y-3 bg-brand-surface">
      ...formulaire (Select, Textarea, Input, Button)...
    </div>
  )}
</div>
```

### 9.4 OfferTimer / OfferBadge — [src/components/students/OfferTimer.jsx](src/components/students/OfferTimer.jsx)

```jsx
{/* Badge seul */}
<OfferBadge offre="6_mois" />
{/* → bg-purple-950 text-purple-300 px-2 py-0.5 rounded-full text-xs font-medium */}

{/* Timer compact (utilisé dans liste élèves) */}
<OfferTimer offre="6_mois" startDate="2025-01-15" compact />
{/* → <OfferBadge /> + texte "Xj restants" en text-zinc-400 (urgent: text-amber-400, expired: text-red-400) */}

{/* Timer complet (utilisé dans fiche détail) */}
<OfferTimer offre="6_mois" startDate="2025-01-15" />
{/* → bloc px-3 py-2 rounded-lg avec icône Timer + 2 lignes de texte */}
```

États :
- **Expiré** : `bg-red-950/40 border-red-800/50`, texte rouge
- **Urgent** (≤30j) : `bg-amber-950/40 border-amber-800/40`, texte amber
- **Standard** : `bg-brand-surface border-brand-border`

### 9.5 RelanceButton — [src/components/students/RelanceButton.jsx](src/components/students/RelanceButton.jsx)

```jsx
{/* Actif */}
<button className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors shrink-0">
  <MessageCircle size={14} className="text-emerald-400" />
</button>

{/* Désactivé */}
<span className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800/40 border border-zinc-700/40 cursor-not-allowed">
  <MessageCircle size={14} className="text-zinc-600" />
</span>
```

Tailles : `md` (8x8, défaut), `sm` (7x7, sur Dashboard).

### 9.6 Item de liste (élève / inactif / bloqué)

```jsx
{/* Liste élèves complète */}
<Link className="block bg-brand-surface border border-brand-border hover:border-zinc-700 rounded-xl p-4 transition-colors group">
  <div className="flex items-center gap-4">
    {/* Avatar */}
    {/* Info (nom + meta) */}
    {/* Progress + actions */}
  </div>
</Link>
```

**Pattern hover** : `hover:border-zinc-700` (la bordure passe de `brand-border` `#222` à `zinc-700` `#3F3F46`).

### 9.7 Filtre pill (desktop) / Select (mobile)

```jsx
{/* Mobile : select */}
<select className="sm:hidden bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5 text-xs text-white">
  ...
</select>

{/* Desktop : boutons pill */}
<div className="hidden sm:flex items-center gap-2 flex-wrap">
  <button className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${active
    ? 'bg-brand-red text-white'
    : 'bg-brand-surface border border-brand-border text-zinc-400 hover:text-white'
  }`}>
    Label
  </button>
</div>
```

### 9.8 Tabs (header de Sales / sous-pages admin)

```jsx
<button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
  active
    ? 'bg-brand-surface text-white'
    : 'text-zinc-500 hover:text-white'
}`}>
  <Icon size={14} />
  Label
</button>
```

Source : [Sales.jsx](src/pages/admin/Sales.jsx).

---

## 10. Layout & navigation

### 10.1 Structure globale — [src/components/Layout.jsx](src/components/Layout.jsx)

```
┌─────────────────────────────────────────────┐
│  Sidebar (lg)        │   Mobile header       │  
│  w-56 (224px)        │   (lg:hidden)         │
│  bg-brand-surface    ├───────────────────────┤
│  border-r            │                       │
│                      │   <Outlet />          │
│                      │   flex-1 overflow     │
│                      │   bg-brand-dark       │
└──────────────────────┴───────────────────────┘
```

- Mobile : sidebar en overlay (`fixed inset-y-0 left-0 z-50`) avec backdrop noir 60%, slide animé `duration-200`
- Desktop : sidebar `lg:static lg:translate-x-0`

### 10.2 Sidebar — [src/components/Sidebar.jsx](src/components/Sidebar.jsx)

**Largeur** : `w-56` (224px).

**Sections** :
1. **Logo block** (`px-5 py-5 border-b border-brand-border`) — carré rouge 7×7 + Zap + nom + sous-titre
2. **Nav principale** (`px-3 py-4 space-y-0.5 overflow-y-auto flex-1`) — items :
   ```jsx
   <NavLink className={({ isActive }) =>
     `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
       isActive
         ? 'bg-brand-red text-white'
         : 'text-zinc-400 hover:text-white hover:bg-white/5'
     }`
   }>
     <Icon size={16} /><span>{label}</span>
     {/* Badge unread (Feedbacks) */}
   </NavLink>
   ```
3. **Section admin** (séparateur `pt-3 mt-2 border-t border-brand-border`) avec label uppercase `text-[10px] font-semibold uppercase tracking-widest text-zinc-600`
4. **Footer profil + déconnexion** (`px-3 py-4 border-t border-brand-border`)

### 10.3 Mobile header

```jsx
<div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-brand-border bg-brand-surface shrink-0 z-30">
  <button className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-white">
    <Menu size={18} />
  </button>
  <span className="text-sm font-bold text-white">FastBrand Club</span>
</div>
```

### 10.4 Header de page

Pattern récurrent (Dashboard, Élèves) :

```jsx
<div className="flex items-center justify-between mb-4 lg:mb-6">
  <div>
    <h1 className="text-xl font-bold text-white">Titre</h1>
    <p className="text-sm text-zinc-500 mt-0.5">Sous-titre</p>
  </div>
  <Button onClick={...}>
    <Plus size={15} /> Nouvel élément
  </Button>
</div>
```

### 10.5 Breakpoints

Tailwind par défaut. Conventions observées :

| Breakpoint | Min | Usage typique |
|---|---|---|
| (default) | 0 | Mobile-first, base style |
| `sm` | 640px | Show/hide labels textuels (`hidden sm:inline`) |
| `lg` | 1024px | **Bascule mobile/desktop** : sidebar visible, padding doublé, grid 2-col |

---

## 11. Patterns récurrents

### 11.1 Empty state

```jsx
<div className="text-center py-16 text-zinc-500">
  <p className="text-sm">Aucun élève pour le moment</p>
</div>
```

### 11.2 Section divider

```jsx
<div className="mt-4 pt-4 border-t border-brand-border">
  ...nouveau bloc...
</div>
```

### 11.3 Erreur de formulaire inline

```jsx
<p className="text-sm text-red-400 bg-red-950/50 border border-red-800 rounded-md px-3 py-2">
  {error.message}
</p>
```

### 11.4 Confirmation positive inline (sauvegarde)

```jsx
<div className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
  <CheckCircle2 size={15} />
  Sauvegardé !
</div>
```

### 11.5 Action group (chips de statut manuel)

```jsx
<button className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
  active
    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
    : 'bg-white/5 border-white/10 text-zinc-500'
}`}>
  Actif
</button>
```

### 11.6 Group hover sur Link

```jsx
<Link className="flex items-center justify-between group">
  <p className="text-sm font-medium text-white group-hover:text-brand-red transition-colors">{name}</p>
  <ArrowRight className="text-zinc-600 group-hover:text-brand-red transition-colors" />
</Link>
```

---

## 12. Incohérences à corriger

Repérées pendant l'audit. À aligner via le DA central.

### 12.1 Backgrounds en hardcode dans le portail élève

Dans [src/pages/StudentPortal.jsx](src/pages/StudentPortal.jsx), les couleurs sont écrites en dur au lieu d'utiliser les tokens `brand-*` :

| Hardcode | Devrait être |
|---|---|
| `bg-[#0f0f0f]` | `bg-brand-dark` (#0A0A0A — léger glissement, mais cohérent) |
| `bg-[#161616]` | `bg-brand-card` (déjà #161616 ✓ — utiliser le token) |
| `bg-[#1e1e1e]` | **Nouvelle couleur non documentée** — à aligner sur `brand-surface` (#111) ou créer un token |
| `border-white/8`, `/10`, `/15` | `border-brand-border` (#222) ou échelle white/X cohérente |

### 12.2 `rounded-2xl` uniquement dans le portail

Le reste du CRM utilise `rounded-xl` pour les cards. Le portail utilise `rounded-2xl`. À harmoniser.

### 12.3 Progress bar avec `bg-white/5` (portail) vs `bg-brand-border` (CRM)

```diff
- <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
+ <div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
```

### 12.4 Couleurs sémantiques `red-500` / `emerald-300` au lieu de tokens centralisés

Le portail utilise `bg-red-500` direct, le reste du CRM utilise `bg-brand-red`. Comme `brand-red = #E8000D` ≠ `red-500 = #EF4444`, les deux n'affichent pas exactement la même couleur.

### 12.5 Toasts via DOM impératif

[RelanceButton.jsx](src/components/students/RelanceButton.jsx) crée des toasts en `document.createElement` avec styles inline en hex. À refacto en composant React `<Toast />` réutilisable consommant les tokens.

### 12.6 Loader inconsistant

- CRM : div CSS `animate-spin` avec bordure `brand-red`
- Portail : icône Lucide `Loader2` `text-red-500 animate-spin`

Choisir un seul pattern (préférence : composant `<Spinner />` partagé).

### 12.7 Statut "indéterminé" dans OfferBadge

Mappe sur `bg-zinc-800` qui est aussi le badge "À faire" — léger conflit visuel (les deux pills se ressemblent). Pas critique mais à noter.

### 12.8 Typographie : `text-base sm:text-sm` dans le portail

Le portail force la taille à `text-base` (16px) sur mobile pour les inputs (anti-zoom iOS), puis revient à `text-sm`. C'est volontaire et **bonne pratique** — à généraliser au CRM (qui ne le fait pas, ce qui peut zoomer sur Safari mobile).

### 12.9 Pas de tokens `border-radius`/`shadow` formalisés

Les valeurs (`rounded-xl`, `rounded-lg`, etc.) sont éparpillées en classes Tailwind. Ajouter des tokens nommés (`radius-card`, `radius-control`) pour pouvoir les ajuster centralement.

---

## Annexe — Fichiers de référence

| Fichier | Rôle |
|---|---|
| [tailwind.config.js](tailwind.config.js) | Tokens Tailwind (étendu après audit) |
| [src/styles/tokens.css](src/styles/tokens.css) | Variables CSS `:root` (créé après audit) |
| [src/index.css](src/index.css) | Base globale (font, scrollbar) |
| [src/components/ui/](src/components/ui/) | Composants atomiques (Badge, Button, Input, Modal) |
| [src/components/Layout.jsx](src/components/Layout.jsx) | Chrome global |
| [src/components/Sidebar.jsx](src/components/Sidebar.jsx) | Navigation principale |
| [src/components/students/](src/components/students/) | Composants métier (StepCard, OfferTimer, RelanceButton, StudentForm) |
| [src/lib/constants.js](src/lib/constants.js) | Mappings de couleurs sémantiques (statuts, rôles) |
| [src/pages/Login.jsx](src/pages/Login.jsx) | Référence visuelle compacte du DA |
| [src/pages/Dashboard.jsx](src/pages/Dashboard.jsx) | Référence visuelle exhaustive du DA |
| [src/pages/StudentPortal.jsx](src/pages/StudentPortal.jsx) | **Cible de migration** (à aligner sur le DA) |
