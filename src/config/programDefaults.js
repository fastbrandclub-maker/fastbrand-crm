// Délais par défaut de chaque étape du programme FastBrand Club.
// `days: null`             → étape sans timer (onboarding, commandes test)
// `days: <number>`         → délai en jours après le démarrage de l'étape
// `days: 'program_end'`    → deadline = student.program_end_date
//
// Modifiable au cas par cas via `student_steps.custom_delay_days` (cf. updateStepDeadline).

export const DEFAULT_STEP_DEADLINES = {
  1: { days: null,           label: "Pas de timer" }, // Call d'onboarding
  2: { days: 4 },                                     // Recherche produit
  3: { days: 2 },                                     // Étude de marché
  4: { days: 1 },                                     // Analyse du persona
  5: { days: 5 },                                     // Sourcing fournisseur
  6: { days: null,           label: "Pas de timer" }, // Commandes test (dépend fournisseur)
  7: { days: 5 },                                     // Création site + visuels IA
  8: { days: 5 },                                     // Contenu & publicités
  9: { days: 'program_end' },                         // Suivi perfs = fin du programme
}

export function hasTimer(stepNumber) {
  const cfg = DEFAULT_STEP_DEADLINES[stepNumber]
  return !!cfg && cfg.days != null
}
