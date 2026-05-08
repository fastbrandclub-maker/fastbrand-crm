# Migration — Alignement du portail élève sur le DA du CRM

> Plan d'action pour aligner [src/pages/StudentPortal.jsx](src/pages/StudentPortal.jsx) sur le Design System documenté dans [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

## TL;DR

Le portail élève fonctionne mais utilise des **valeurs hexadécimales en dur** (`bg-[#0f0f0f]`, `bg-[#1e1e1e]`, `border-white/8`) au lieu des tokens `brand-*` du CRM. Une fois aligné, le code sera plus court, plus cohérent visuellement avec le CRM coach, et toute évolution du DA se propagera automatiquement.

**Effort estimé** : 30 min de refacto pure (aucune logique métier touchée).

**Fichier impacté** : un seul → [src/pages/StudentPortal.jsx](src/pages/StudentPortal.jsx) (330 lignes).

---

## 1. Écarts identifiés

### 1.1 Backgrounds en hardcode

| Ligne (approx.) | Actuel | À remplacer par | Raison |
|---|---|---|---|
| L134, L139, L155 | `bg-[#0f0f0f]` | `bg-brand-dark` | Couleur très proche (#0A0A0A vs #0F0F0F). Le token est la source de vérité. |
| L141 | `bg-red-500/20` | `bg-brand-red/20` | `red-500` ≠ `brand-red`. Cohérence couleur d'accent. |
| L157 | `bg-[#161616]` | `bg-brand-card` | Valeur identique, juste utiliser le token. |
| L159 | `bg-red-500` | `bg-brand-red` | Logo block — doit être la couleur de marque exacte. |
| L175, L200, L286 | `bg-[#161616]` | `bg-brand-card` | Cards du portail. |
| L177 | `bg-red-500/20` | `bg-brand-red/20` | Avatar — doit matcher l'avatar du CRM. |
| L178 | `text-red-400` | `text-brand-red` | Initiales avatar — uniformiser. |
| L183 | `text-red-400 bg-red-500/10` | `text-brand-red bg-brand-red/10` | Badge offre. |
| L193 | `bg-red-500` | `bg-brand-red` | Barre de progression remplie. |
| L226 | `bg-white/2` | `bg-white/5` | `white/2` n'existe pas dans Tailwind par défaut — c'est un arbitrary qui rend de manière incohérente. |
| L232, L247, L258 | `bg-[#1e1e1e]` | `bg-brand-surface` | **Nouvelle couleur non documentée** (#1e1e1e) — l'aligner sur `brand-surface` (#111111). |
| L271 | `bg-red-500 hover:bg-red-600` | `bg-brand-red hover:bg-red-700` | Bouton submit — doit utiliser le composant `<Button variant="primary" />`. |
| L310 | `bg-[#1e1e1e]` | `bg-brand-surface` | Textarea du feedback. |
| L316 | `bg-[#1e1e1e]` | `bg-brand-surface` | Bouton "Envoyer" feedback. |

### 1.2 Bordures en `white/X` au lieu de tokens

| Ligne | Actuel | À remplacer par |
|---|---|---|
| L157 | `border-white/8` | `border-brand-border` |
| L175, L200, L286 | `border-white/8` | `border-brand-border` |
| L209 | `border-white/5` | `border-brand-border/50` ou `border-brand-border` |
| L226 | `border-white/5` | `border-brand-border/50` |
| L232, L247, L258, L310 | `border-white/10` | `border-brand-border` |

> Le motif `border-white/X` est techniquement valide (transparent) mais inconsistant avec le reste du CRM qui utilise `border-brand-border` opaque (`#222222`).

### 1.3 Border-radius : `rounded-2xl` non utilisé ailleurs

| Ligne | Actuel | À remplacer par |
|---|---|---|
| L175, L200, L286 | `rounded-2xl` | `rounded-xl` |
| L292, L299, L310 | `rounded-xl` | OK ✅ |

### 1.4 Progress bar — pas le pattern du CRM

```diff
- <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
-   <div className="h-full bg-red-500 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
+ <div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
+   <div className="h-full bg-brand-red rounded-full transition-all" style={{ width: `${progress}%` }} />
```

> Note : `duration-700` peut être conservée (comportement plus doux, valable). Mais l'aligner sur `transition-all` simple si on veut l'identique au CRM.

### 1.5 Loader inconsistant

```diff
- <Loader2 size={28} className="text-red-500 animate-spin" />
+ <div className="w-7 h-7 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
```

> Le CRM utilise systématiquement le pattern div + bordure, pas l'icône Lucide.

### 1.6 Boutons custom au lieu du composant `<Button />`

Le portail définit ses propres boutons inline (L268-275, L313-320). À remplacer par `<Button variant="primary">` et `<Button variant="secondary">` pour bénéficier du DA et garder un seul style.

### 1.7 Inputs custom au lieu de `<Input />` / `<Textarea />` / `<Select />`

Le portail réécrit chaque input (L229-237 select, L242-248 textarea, L253-259 input texte, L304-311 textarea feedback).

À remplacer par les composants atomiques de [src/components/ui/Input.jsx](src/components/ui/Input.jsx).

### 1.8 Background du body : `[#0f0f0f]` vs `bg-brand-dark` (#0A0A0A)

Léger glissement chromatique (#0F0F0F est légèrement plus clair que #0A0A0A). En l'alignant, le portail aura **exactement** la même profondeur visuelle que le CRM.

---

## 2. Plan d'action ordonné

### Phase 1 — Tokens couleurs (5 min)

**Find & replace dans [StudentPortal.jsx](src/pages/StudentPortal.jsx)** :

```
bg-[#0f0f0f]     → bg-brand-dark
bg-[#161616]     → bg-brand-card
bg-[#1e1e1e]     → bg-brand-surface
bg-red-500/20    → bg-brand-red/20
bg-red-500/10    → bg-brand-red/10
bg-red-500       → bg-brand-red
text-red-400     → text-brand-red
text-red-500     → text-brand-red
border-white/8   → border-brand-border
border-white/10  → border-brand-border
border-white/5   → border-brand-border/50
hover:bg-red-600 → hover:bg-red-700
```

### Phase 2 — Border-radius (2 min)

```
rounded-2xl → rounded-xl
```

### Phase 3 — Progress bar (1 min)

Remplacer le bloc L192-194 par le pattern du CRM (cf §1.4 ci-dessus).

### Phase 4 — Loader (1 min)

Remplacer `<Loader2>` par le pattern div + bordure (cf §1.5).

### Phase 5 — Refacto vers composants UI (15-20 min)

Importer et utiliser :

```jsx
import Button from '../components/ui/Button'
import Input, { Textarea, Select } from '../components/ui/Input'
import { StatusBadge } from '../components/ui/Badge'
import { OfferBadge } from '../components/students/OfferTimer'
```

#### 5.1 Remplacer l'avatar custom par le pattern documenté

```jsx
<div className="w-10 h-10 rounded-full bg-brand-red/20 flex items-center justify-center shrink-0">
  <span className="text-sm font-bold text-brand-red">
    {student.first_name[0]}{student.last_name[0]}
  </span>
</div>
```

#### 5.2 Remplacer le badge offre par `<OfferBadge />`

```diff
- <span className="text-[11px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
-   {offreLabel(student.offre)}
- </span>
+ <OfferBadge offre={student.offre} />
```

> ⚠️ Cela change le **mapping de couleur** : `OfferBadge` utilise les couleurs offres documentées (bleu pour 60J, violet pour 6M, etc.) — pas du rouge. C'est l'alignement attendu.

#### 5.3 Remplacer les badges de statut par `<StatusBadge />`

```diff
- <div className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
- <span className={`text-xs font-medium ${badge.text} hidden sm:block`}>{badge.label}</span>
+ <StatusBadge status={status} />
```

> Permet de supprimer la constante locale `STATUS_BADGE` (L19-24) qui dupliquait `STEP_STATUS` de constants.js.

#### 5.4 Refacto le formulaire d'étape vers `<Select>`, `<Textarea>`, `<Input>`

Le bloc L226-279 peut être remplacé par :

```jsx
<form onSubmit={e => handleSave(e, step.number)} className="border-t border-brand-border px-4 pb-4 pt-4 space-y-4 bg-white/5">
  <Select
    label="Statut"
    value={form.status}
    onChange={e => patchForm(step.number, { status: e.target.value })}
  >
    {STATUS_OPTIONS.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </Select>
  <Textarea
    label="Notes"
    value={form.note}
    onChange={e => patchForm(step.number, { note: e.target.value })}
    placeholder="Notes sur cette étape..."
    rows={3}
  />
  <Input
    label="Lien ressource"
    value={form.link}
    onChange={e => patchForm(step.number, { link: e.target.value })}
    placeholder="https://..."
  />
  <div className="flex justify-end">
    {saved[step.number] ? (
      <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
        <CheckCircle2 size={15} /> Sauvegardé !
      </div>
    ) : (
      <Button size="sm" type="submit" disabled={saving[step.number]}>
        {saving[step.number] && <Loader2 size={14} className="animate-spin" />}
        Sauvegarder
      </Button>
    )}
  </div>
</form>
```

> ⚠️ **Anti-zoom iOS** : les inputs custom du portail forçaient `text-base` sur mobile (`text-base sm:text-sm`). Les composants `<Input/Textarea/Select>` du CRM utilisent `text-sm` partout. **Décision** : ajouter cette règle anti-zoom dans les composants UI atomiques (s'applique aussi au CRM coach), ou la laisser dans le portail uniquement. Recommandation : la **généraliser au CRM** pour éviter le zoom auto Safari mobile.

#### 5.5 Refacto le bouton "Envoyer" feedback

```diff
- <button type="submit" disabled={...} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e1e1e] border border-white/15 hover:border-white/25 text-white text-sm font-semibold transition-colors disabled:opacity-40">
-   {sendingGeneral ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
-   {sendingGeneral ? 'Envoi...' : 'Envoyer'}
- </button>
+ <Button variant="secondary" type="submit" disabled={sendingGeneral || !generalMsg.trim()}>
+   {sendingGeneral ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
+   {sendingGeneral ? 'Envoi...' : 'Envoyer'}
+ </Button>
```

### Phase 6 — Page wrapper (2 min)

```diff
- <div className="min-h-screen bg-[#0f0f0f] pb-16">
+ <div className="min-h-screen bg-brand-dark pb-16">

- <div className="bg-[#161616] border-b border-white/8 px-4 py-4 sticky top-0 z-10">
+ <div className="bg-brand-surface border-b border-brand-border px-4 py-4 sticky top-0 z-10">
```

### Phase 7 — Tests visuels (5 min)

1. `npm run dev`
2. Ouvrir `/s/<token>` avec un élève existant
3. Comparer côte-à-côte avec le CRM coach (Dashboard / fiche élève)
4. Vérifier :
   - Couleur de l'avatar (rouge marque, pas red-500)
   - Couleur du badge offre (bleue pour 60J, etc.)
   - Bordures opaques sombres (pas translucides blanches)
   - Boutons identiques au CRM
   - Spinner identique au CRM

---

## 3. Risques

| Risque | Mitigation |
|---|---|
| L'élève voit la barre rouge plus terne (#E8000D vs #EF4444) | C'est l'alignement attendu, le rouge `brand-red` est plus intense — gain visuel net |
| Le badge offre passe de rouge à bleu (60J) / violet (6M) | C'est l'alignement attendu — cohérence avec le CRM coach |
| `text-base sm:text-sm` perdu si on utilise les composants `<Input/>` actuels | Ajouter la règle anti-zoom dans les composants atomiques **avant** la migration (à valider avec toi) |
| Backgrounds très sombres `bg-brand-dark` (#0A) au lieu de `bg-[#0f0f0f]` | Léger gain de contraste — à valider visuellement |

---

## 4. Ordre d'exécution recommandé

1. ✅ Lire et valider [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)
2. ⏸️ Décider sur la règle anti-zoom (cf §5.4) — l'inclure dans les composants `<Input>` ?
3. ⏳ Phases 1+2+3+4 (find & replace + 2 micro-fix) → premier commit "Align portal colors and radii on brand tokens"
4. ⏳ Phase 5 (refacto composants UI) → second commit "Use shared UI components in StudentPortal"
5. ⏳ Phase 6 (wrapper) → inclus dans le commit 1
6. ⏳ Phase 7 (test) → avant push

---

## 5. Checklist finale

- [ ] Aucun `bg-[#...]` ou `bg-red-500` ne reste dans `StudentPortal.jsx`
- [ ] Aucun `border-white/X` ne reste (sauf `bg-white/5` voulu en surface translucide)
- [ ] Aucun `rounded-2xl` ne reste
- [ ] La constante locale `STATUS_BADGE` (L19-24) est supprimée (utiliser `<StatusBadge />`)
- [ ] La fonction locale `offreLabel` (L26-28) est supprimée (utiliser `<OfferBadge />`)
- [ ] Tous les inputs/selects/textareas utilisent les composants `ui/Input`
- [ ] Tous les boutons utilisent le composant `ui/Button`
- [ ] Spinner aligné sur le pattern du CRM
- [ ] Test visuel OK sur un élève réel
