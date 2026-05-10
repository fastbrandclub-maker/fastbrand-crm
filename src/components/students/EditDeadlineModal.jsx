import { useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input, { Textarea } from '../ui/Input'
import { updateStepDeadline } from '../../lib/stepActions'
import { DEFAULT_STEP_DEADLINES } from '../../config/programDefaults'

// Modal partagée — utilisée depuis StudentDetail (coach) ET StudentPortal (admin/coach connecté).
// Encapsule l'écriture (updateStepDeadline) + un toast de confirmation au save.
//
// Props :
//   open       boolean
//   onClose    () => void
//   step       { number, name }                        — l'étape ciblée
//   stepData   { custom_delay_days, started_at, nb_extensions, extension_reason }
//   studentId  uuid
//   actorId    uuid | null  (profile.id du coach connecté)
//   onSaved    (updatedStep) => void                   — pour rafraîchir le state parent
export default function EditDeadlineModal({
  open, onClose,
  step, stepData,
  studentId, actorId,
  onSaved,
}) {
  const [days, setDays] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  // Reset à l'ouverture / changement de cible
  useEffect(() => {
    if (!open || !stepData) return
    setDays(String(stepData.custom_delay_days ?? ''))
    setReason('')
  }, [open, stepData?.custom_delay_days, step?.number])

  if (!step) return null

  const cfg = DEFAULT_STEP_DEADLINES[step.number]
  const defaultLabel = typeof cfg?.days === 'number'
    ? `${cfg.days}j`
    : (cfg?.days === 'program_end' ? 'fin du programme' : '—')
  const currentDays = stepData?.custom_delay_days ?? (typeof cfg?.days === 'number' ? cfg.days : null)
  const currentLabel = currentDays != null ? `${currentDays}j` : defaultLabel

  async function handleSave() {
    const n = parseInt(days, 10)
    if (isNaN(n) || n < 1 || n > 60) return
    setSaving(true)
    const { data } = await updateStepDeadline({
      studentId,
      stepNumber: step.number,
      days: n,
      reason: reason.trim() || null,
      currentNbExtensions: stepData?.nb_extensions ?? 0,
      startedAt: stepData?.started_at,
      actorId,
    })
    setSaving(false)
    if (data) {
      showToast('Délai mis à jour ✓')
      onSaved?.(data)
      onClose()
    } else {
      showToast('Erreur — réessaie', true)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Modifier le délai — Étape ${step.number}`}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-zinc-400">
          Étape : <strong className="text-white">{step.name}</strong>
        </p>
        <div className="text-xs text-zinc-500 bg-brand-dark border border-brand-border rounded-md px-3 py-2 flex items-center justify-between">
          <span>Délai par défaut : <strong className="text-zinc-300">{defaultLabel}</strong></span>
          <span>Délai actuel : <strong className="text-white">{currentLabel}</strong></span>
        </div>
        <Input
          label="Nouveau délai (jours)"
          type="number"
          min="1"
          max="60"
          value={days}
          onChange={e => setDays(e.target.value)}
          placeholder="ex: 7"
        />
        <Textarea
          label="Raison (optionnel)"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Ex : élève en vacances, fournisseur en retard..."
          rows={3}
        />
        {stepData?.nb_extensions > 0 && (
          <p className="text-xs text-zinc-500">
            Délai déjà modifié <strong className="text-white">{stepData.nb_extensions}</strong> fois.
            {stepData.extension_reason && ` Dernière raison : "${stepData.extension_reason}".`}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving || !days}>
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function showToast(message, isError = false) {
  const notif = document.createElement('div')
  notif.textContent = message
  notif.style.cssText = `position:fixed;top:80px;left:50%;transform:translateX(-50%);
    background:${isError ? '#7f1d1d' : '#10b981'};color:#fff;padding:12px 20px;
    border-radius:12px;font-size:13px;font-weight:600;z-index:99999;
    box-shadow:0 8px 24px rgba(0,0,0,.4)`
  document.body.appendChild(notif)
  setTimeout(() => notif.remove(), 3000)
}
