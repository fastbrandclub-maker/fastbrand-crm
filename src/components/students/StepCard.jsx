import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, ExternalLink, Save, CheckCircle2, RotateCcw, Pencil, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { STEP_STATUS } from '../../lib/constants'
import { StatusBadge } from '../ui/Badge'
import { Select, Textarea } from '../ui/Input'
import Input from '../ui/Input'
import Button from '../ui/Button'
import DeadlineTimer from '../ui/DeadlineTimer'
import { getDeadlineState, daysRemaining } from '../../lib/deadlines'
import { markStepValidated, devalidateStep } from '../../lib/stepActions'

export default function StepCard({
  step,
  stepData,
  studentId,
  programEndDate,
  readOnly,
  onUpdate,
  onEditDeadline,
}) {
  const { profile } = useAuth()
  const [open, setOpen] = useState(stepData?.status === 'in_progress' || stepData?.status === 'blocked')
  const [saving, setSaving] = useState(false)
  const [acting, setActing] = useState(false)
  const [form, setForm] = useState({
    status: stepData?.status ?? 'todo',
    notes: stepData?.notes ?? '',
    resource_link: stepData?.resource_link ?? '',
  })

  useEffect(() => {
    setForm({
      status: stepData?.status ?? 'todo',
      notes: stepData?.notes ?? '',
      resource_link: stepData?.resource_link ?? '',
    })
  }, [stepData?.status, stepData?.notes, stepData?.resource_link])

  async function handleSave() {
    setSaving(true)
    const { data, error } = await supabase
      .from('student_steps')
      .update({
        status: form.status,
        notes: form.notes,
        resource_link: form.resource_link,
        updated_at: new Date().toISOString(),
      })
      .eq('student_id', studentId)
      .eq('step_number', step.number)
      .select()
      .single()

    setSaving(false)
    if (!error && data) onUpdate(data)
  }

  async function handleMarkDone() {
    setActing(true)
    const { validatedStep, startedStep } = await markStepValidated({
      studentId,
      stepNumber: step.number,
      by: 'coach',
      actorId: profile?.id,
      programEndDate,
    })
    setActing(false)
    if (validatedStep) onUpdate(validatedStep)
    if (startedStep) onUpdate(startedStep)
  }

  async function handleDevalidate() {
    if (!window.confirm(`Dévalider l'étape "${step.name}" ?`)) return
    setActing(true)
    const { data, resetStep } = await devalidateStep({
      studentId,
      stepNumber: step.number,
      programEndDate,
      customDelayDays: stepData?.custom_delay_days,
      actorId: profile?.id,
    })
    setActing(false)
    if (data) onUpdate(data)
    if (resetStep) onUpdate(resetStep)
  }

  const statusConfig = STEP_STATUS[form.status] ?? STEP_STATUS.todo
  const hasChanged =
    form.status !== (stepData?.status ?? 'todo') ||
    form.notes !== (stepData?.notes ?? '') ||
    form.resource_link !== (stepData?.resource_link ?? '')

  const deadlineState = getDeadlineState(stepData, step.number, programEndDate)
  const overdue = deadlineState === 'overdue'
  const overdueDays = overdue ? Math.abs(daysRemaining(stepData, step.number, programEndDate) ?? 0) : 0

  const borderColor = overdue
    ? 'border-brand-red/60'
    : form.status === 'blocked'   ? 'border-red-800/50'
    : form.status === 'validated' ? 'border-emerald-800/30'
    : form.status === 'in_progress' ? 'border-blue-800/40'
    : 'border-brand-border'

  return (
    <div className={`border rounded-lg overflow-hidden transition-colors ${borderColor}`}>
      {/* Header — div + role=button pour permettre un bouton crayon imbriqué */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(o => !o)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o) } }}
        className="w-full flex items-center gap-3 px-4 py-3 bg-brand-card hover:bg-white/5 transition-colors text-left cursor-pointer select-none"
      >
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${statusConfig.bg} ${statusConfig.text}`}>
          {step.number}
        </span>
        <span className="flex-1 text-sm font-medium text-white">{step.name}</span>
        {overdue && (
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-red/15 text-brand-red border border-brand-red/30">
            <AlertTriangle size={10} />
            +{overdueDays}j
          </span>
        )}
        <StatusBadge status={form.status} />
        {!readOnly && onEditDeadline && (
          <button
            onClick={(e) => { e.stopPropagation(); onEditDeadline(step, stepData) }}
            title="Modifier le délai"
            className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <Pencil size={12} />
          </button>
        )}
        {open ? <ChevronDown size={14} className="text-zinc-500 ml-1 shrink-0" /> : <ChevronRight size={14} className="text-zinc-500 ml-1 shrink-0" />}
      </div>

      {/* Body */}
      {open && (
        <div className="px-4 py-4 border-t border-brand-border space-y-3 bg-brand-surface">
          {/* Bandeau overdue */}
          {overdue && (
            <div className="flex items-start gap-2 rounded-lg border border-brand-red/40 bg-brand-red/10 px-3 py-2">
              <AlertTriangle size={13} className="text-brand-red mt-0.5 shrink-0" />
              <p className="text-xs text-zinc-300">
                Délai dépassé de <strong className="text-brand-red">{overdueDays} jour{overdueDays > 1 ? 's' : ''}</strong>. Reprends contact avec l'élève si besoin.
              </p>
            </div>
          )}

          {/* Timer (caché si étape sans timer ou validée) */}
          <DeadlineTimer
            stepNumber={step.number}
            stepData={stepData}
            programEndDate={programEndDate}
          />

          {/* Historique d'extensions */}
          {stepData?.nb_extensions > 0 && (
            <div
              title={stepData.extension_reason ? `Dernière raison : ${stepData.extension_reason}` : ''}
              className="text-[11px] text-zinc-500 inline-flex items-center gap-1"
            >
              <Pencil size={10} />
              Délai modifié {stepData.nb_extensions} fois
              {stepData.extension_reason && ` — ${stepData.extension_reason}`}
            </div>
          )}

          {readOnly ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Statut :</span>
                <StatusBadge status={form.status} />
              </div>
              {stepData?.student_note && (
                <div className="bg-blue-950/20 border border-blue-800/30 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-1">Note de l'élève</p>
                  <p className="text-sm text-zinc-300">{stepData.student_note}</p>
                </div>
              )}
              {form.notes && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Notes coach</p>
                  <p className="text-sm text-zinc-300">{form.notes}</p>
                </div>
              )}
              {form.resource_link && (
                <a
                  href={form.resource_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300"
                >
                  <ExternalLink size={12} />
                  Ressource associée
                </a>
              )}
            </>
          ) : (
            <>
              {stepData?.student_note && (
                <div className="bg-blue-950/20 border border-blue-800/30 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-1">Note de l'élève</p>
                  <p className="text-sm text-zinc-300">{stepData.student_note}</p>
                </div>
              )}
              <Select
                label="Statut"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              >
                {Object.entries(STEP_STATUS).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </Select>

              <Textarea
                label="Notes"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Notes sur cette étape..."
                rows={3}
              />

              <Input
                label="Lien ressource"
                value={form.resource_link}
                onChange={e => setForm(f => ({ ...f, resource_link: e.target.value }))}
                placeholder="https://..."
              />

              {form.resource_link && (
                <a
                  href={form.resource_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300"
                >
                  <ExternalLink size={12} />
                  Ouvrir le lien
                </a>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-brand-border">
                {form.status === 'validated' ? (
                  <Button variant="secondary" size="sm" onClick={handleDevalidate} disabled={acting}>
                    <RotateCcw size={12} />
                    Dévalider
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleMarkDone} disabled={acting}>
                    <CheckCircle2 size={12} />
                    Marquer comme terminé
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || !hasChanged}
                >
                  <Save size={12} />
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
