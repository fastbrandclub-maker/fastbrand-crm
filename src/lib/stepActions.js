// Helpers d'écriture en DB pour les transitions d'étapes.
// Encapsule les cascades + le logging dans step_history.

import { addDays } from 'date-fns'
import { supabase } from './supabase'
import { computeStepDeadline } from './deadlines'

// Insertion bas niveau dans step_history. Best effort : si ça échoue, on ne propage pas l'erreur
// (les actions principales doivent rester non-bloquantes).
async function logStepAction({ stepId, action, actor, actorId, oldValue, newValue, reason }) {
  if (!stepId) return
  try {
    await supabase.from('step_history').insert({
      student_step_id: stepId,
      action,
      actor,
      actor_id: actorId || null,
      old_value: oldValue || null,
      new_value: newValue || null,
      reason: reason || null,
    })
  } catch (e) {
    // Logging non-critique : on n'interrompt pas le flux
    console.warn('step_history insert failed', e)
  }
}

// Marque une étape comme validée et démarre automatiquement la suivante.
// `by` : 'student' | 'coach' ; `actorId` : profile.id si coach, sinon null.
export async function markStepValidated({ studentId, stepNumber, by, actorId, programEndDate }) {
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

  await logStepAction({
    stepId: validatedStep.id,
    action: 'validated',
    actor: by,
    actorId,
    oldValue: null,
    newValue: { status: 'validated', validated_at: now },
    reason: null,
  })

  const nextStepNumber = stepNumber + 1
  if (nextStepNumber > 9) return { validatedStep, startedStep: null }

  const { data: nextStepData } = await supabase
    .from('student_steps')
    .select('*')
    .eq('student_id', studentId)
    .eq('step_number', nextStepNumber)
    .single()

  if (!nextStepData) return { validatedStep, startedStep: null }
  if (nextStepData.status === 'validated') return { validatedStep, startedStep: null }

  const deadline = computeStepDeadline(
    nextStepNumber, now, nextStepData.custom_delay_days, programEndDate,
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

// Dévalide une étape (coach uniquement) avec cascade-stop sur l'étape suivante.
// Reset l'étape concernée (started_at = now, deadline_at recalculée) + remet
// l'étape suivante en 'todo' si elle était in_progress.
export async function devalidateStep({
  studentId, stepNumber, programEndDate, customDelayDays,
  actorId, reason,
}) {
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

  if (error) return { error }

  // Cascade-stop : étape suivante in_progress → todo (cf. spec : "si en cours")
  let resetStep = null
  const nextStepNumber = stepNumber + 1
  if (nextStepNumber <= 9) {
    const { data: nextStepData } = await supabase
      .from('student_steps')
      .select('*')
      .eq('student_id', studentId)
      .eq('step_number', nextStepNumber)
      .single()

    if (nextStepData && nextStepData.status === 'in_progress') {
      const { data: reset } = await supabase
        .from('student_steps')
        .update({
          status: 'todo',
          started_at: null,
          deadline_at: null,
          updated_at: now,
        })
        .eq('id', nextStepData.id)
        .select()
        .single()
      resetStep = reset
    }
  }

  await logStepAction({
    stepId: data.id,
    action: 'devalidated',
    actor: 'coach',
    actorId,
    oldValue: { status: 'validated' },
    newValue: { status: 'in_progress' },
    reason,
  })

  return { data, resetStep }
}

// Modifie le délai d'une étape (coach uniquement).
export async function updateStepDeadline({
  studentId, stepNumber, days, reason,
  currentNbExtensions, startedAt, actorId,
}) {
  const now = new Date().toISOString()
  const newDeadline = startedAt ? addDays(new Date(startedAt), days).toISOString() : null

  // Capture l'ancien délai pour log
  const { data: prev } = await supabase
    .from('student_steps')
    .select('id, custom_delay_days, deadline_at')
    .eq('student_id', studentId)
    .eq('step_number', stepNumber)
    .single()

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

  if (!error && data) {
    await logStepAction({
      stepId: data.id,
      action: 'delay_changed',
      actor: 'coach',
      actorId,
      oldValue: { days: prev?.custom_delay_days ?? null, deadline_at: prev?.deadline_at ?? null },
      newValue: { days, deadline_at: newDeadline },
      reason,
    })
  }

  return { data, error }
}
