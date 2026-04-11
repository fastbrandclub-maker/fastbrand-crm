export const STEPS = [
  { number: 1, name: "Call d'onboarding" },
  { number: 2, name: 'Recherche produit' },
  { number: 3, name: 'Étude de marché' },
  { number: 4, name: 'Analyse du persona' },
  { number: 5, name: 'Sourcing fournisseur' },
  { number: 6, name: 'Commandes test' },
  { number: 7, name: 'Création du site + visuels IA' },
  { number: 8, name: 'Contenu & publicités' },
  { number: 9, name: 'Suivi des performances et optimisation' },
]

export const STEP_STATUS = {
  todo: {
    label: 'À faire',
    bg: 'bg-zinc-800',
    text: 'text-zinc-400',
    dot: 'bg-zinc-500',
  },
  in_progress: {
    label: 'En cours',
    bg: 'bg-blue-950',
    text: 'text-blue-300',
    dot: 'bg-blue-400',
  },
  validated: {
    label: 'Validé',
    bg: 'bg-emerald-950',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
  },
  blocked: {
    label: 'Bloqué',
    bg: 'bg-red-950',
    text: 'text-red-300',
    dot: 'bg-red-500',
  },
}

export const ROLES = {
  admin: 'Admin',
  coach: 'Coach',
  assistant: 'Assistant',
}

export const INACTIVITY_DAYS = 7
