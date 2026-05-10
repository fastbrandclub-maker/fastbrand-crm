// Helpers purs pour le calcul des deadlines par étape.
// Aucune dépendance Supabase ici — composables et testables.

import { addDays, differenceInCalendarDays } from 'date-fns'
import { DEFAULT_STEP_DEADLINES, hasTimer } from '../config/programDefaults'

// Calcule la deadline théorique d'une étape, indépendamment de ce qui est en DB.
// Utilisé en fallback si stepData.deadline_at n'est pas encore renseigné.
export function computeStepDeadline(stepNumber, startedAt, customDelayDays, programEndDate) {
  if (!startedAt) return null
  const cfg = DEFAULT_STEP_DEADLINES[stepNumber]
  if (!cfg) return null

  if (customDelayDays != null) {
    return addDays(new Date(startedAt), customDelayDays)
  }
  if (cfg.days === 'program_end') {
    return programEndDate ? new Date(programEndDate) : null
  }
  if (cfg.days == null) return null
  return addDays(new Date(startedAt), cfg.days)
}

// Retourne la deadline effective : la valeur DB si présente, sinon le calcul à la volée.
export function effectiveDeadline(stepData, stepNumber, programEndDate) {
  if (stepData?.deadline_at) return new Date(stepData.deadline_at)
  return computeStepDeadline(
    stepNumber,
    stepData?.started_at,
    stepData?.custom_delay_days,
    programEndDate,
  )
}

// État de la deadline pour le rendu visuel.
// Valeurs : null | 'safe' | 'urgent' | 'overdue' | 'completed'
export function getDeadlineState(stepData, stepNumber, programEndDate) {
  if (stepData?.status === 'validated') return 'completed'
  if (!hasTimer(stepNumber) && DEFAULT_STEP_DEADLINES[stepNumber]?.days !== 'program_end') return null
  if (!stepData?.started_at) return null

  const deadline = effectiveDeadline(stepData, stepNumber, programEndDate)
  if (!deadline) return null

  const now = new Date()
  if (now > deadline) return 'overdue'

  const startedAt = new Date(stepData.started_at)
  const total = differenceInCalendarDays(deadline, startedAt)
  if (total <= 0) return 'urgent'
  const used = differenceInCalendarDays(now, startedAt)
  return used / total >= 0.5 ? 'urgent' : 'safe'
}

// Jours restants (positif si reste du temps, négatif si dépassé, 0 le jour J).
export function daysRemaining(stepData, stepNumber, programEndDate) {
  const deadline = effectiveDeadline(stepData, stepNumber, programEndDate)
  if (!deadline) return null
  return differenceInCalendarDays(deadline, new Date())
}

// Ratio temporel utilisé (0..1) pour la barre de progression de DeadlineTimer.
export function progressRatio(stepData, stepNumber, programEndDate) {
  if (!stepData?.started_at) return 0
  const deadline = effectiveDeadline(stepData, stepNumber, programEndDate)
  if (!deadline) return 0
  const total = differenceInCalendarDays(deadline, new Date(stepData.started_at))
  if (total <= 0) return 1
  const used = differenceInCalendarDays(new Date(), new Date(stepData.started_at))
  return Math.max(0, Math.min(1, used / total))
}

// Identifie la première étape non-validée d'un élève (utile pour un "tu en es ici").
export function firstActiveStep(steps) {
  if (!steps) return null
  return (
    steps.find(s => s.status === 'in_progress') ||
    steps.find(s => s.status === 'blocked') ||
    steps.find(s => s.status === 'todo') ||
    null
  )
}
