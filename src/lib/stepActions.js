// Helpers d'écriture en DB pour les transitions d'étapes.
// Encapsule les cascades (validation auto-démarrage suivant) et les invariants
// (started_at posé quand on démarre, deadline_at recalculée, etc.).

import { addDays } from 'date-fns'
import { supabase } from './supabase'
import { computeStepDeadline } from './deadlines'

// Marque une étape comme validée et démarre automatiquement la suivante.
// `by` : 'student' | 'coach'
export async function markStepValidated({ studentId, stepNumber, by, programEndDate }) {
  const now = new Date().toISOString()

  const { data: validatedStep, error: e1 } = await supabase
    .from('student_steps')
    .update({
      status: 'validated',
      validated_at: now,
      validated_by: by,
      updated_at: now,
    })
    .eq('student_id', studentId)
    .eq('step_number', stepNumber)
    .select()
    .single()

  if (e1) return { error: e1 }

  const nextStepNumber = stepNumber + 1
  if (nextStepNumber > 9) return { validatedStep, startedStep: null }

  const { data: nextStepData } = await supabase
    .from('student_steps')
    .select('*')
    .eq('student_id', studentId)
    .eq('step_number', nextStepNumber)
    .single()

  if (!nextStepData) return { validatedStep, startedStep: null }
  // Pas de cascade si déjà validé (cf. Q3 du plan)
  if (nextStepData.status === 'validated') return { validatedStep, startedStep: null }

  const deadline = computeStepDeadline(
    nextStepNumber,
    now,
    nextStepData.custom_delay_days,
    programEndDate,
  )

  const { data: startedStep, error: e2 } = await supabase
    .from('student_steps')
    .update({
      status: 'in_progress',
      started_at: now,
      deadline_at: deadline ? deadline.toISOString() : null,
      updated_at: now,
    })
    .eq('student_id', studentId)
    .eq('step_number', nextStepNumber)
    .select()
    .single()

  return { validatedStep, startedStep, error: e2 }
}

// Dévalide une étape (coach uniquement). Pas de cascade.
// Recalcule deadline_at depuis le nouveau started_at.
export async function devalidateStep({ studentId, stepNumber, programEndDate, customDelayDays }) {
  const now = new Date().toISOString()
  const deadline = computeStepDeadline(stepNumber, now, customDelayDays, programEndDate)

  const { data, error } = await supabase
    .from('student_steps')
    .update({
      status: 'in_progress',
      validated_at: null,
      validated_by: null,
      started_at: now,
      deadline_at: deadline ? deadline.toISOString() : null,
      updated_at: now,
    })
    .eq('student_id', studentId)
    .eq('step_number', stepNumber)
    .select()
    .single()
  return { data, error }
}

// Modifie le délai d'une étape (coach uniquement).
// Recalcule deadline_at = started_at + days. Incrémente nb_extensions.
export async function updateStepDeadline({
  studentId, stepNumber, days, reason,
  currentNbExtensions, startedAt,
}) {
  const now = new Date().toISOString()
  const newDeadline = startedAt ? addDays(new Date(startedAt), days).toISOString() : null

  const { data, error } = await supabase
    .from('student_steps')
    .update({
      custom_delay_days: days,
      deadline_at: newDeadline,
      nb_extensions: (currentNbExtensions || 0) + 1,
      extension_reason: reason || null,
      updated_at: now,
    })
    .eq('student_id', studentId)
    .eq('step_number', stepNumber)
    .select()
    .single()
  return { data, error }
}
