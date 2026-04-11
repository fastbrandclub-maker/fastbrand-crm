import { useState } from 'react'
import { ChevronDown, ChevronRight, ExternalLink, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { STEP_STATUS } from '../../lib/constants'
import { StatusBadge } from '../ui/Badge'
import { Select, Textarea } from '../ui/Input'
import Input from '../ui/Input'
import Button from '../ui/Button'

export default function StepCard({ step, stepData, studentId, readOnly, onUpdate }) {
  const [open, setOpen] = useState(stepData?.status === 'in_progress' || stepData?.status === 'blocked')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    status: stepData?.status ?? 'todo',
    notes: stepData?.notes ?? '',
    resource_link: stepData?.resource_link ?? '',
  })

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

  const statusConfig = STEP_STATUS[form.status] ?? STEP_STATUS.todo
  const hasChanged =
    form.status !== (stepData?.status ?? 'todo') ||
    form.notes !== (stepData?.notes ?? '') ||
    form.resource_link !== (stepData?.resource_link ?? '')

  return (
    <div className={`border rounded-lg overflow-hidden transition-colors ${
      form.status === 'blocked'
        ? 'border-red-800/50'
        : form.status === 'validated'
        ? 'border-emerald-800/30'
        : form.status === 'in_progress'
        ? 'border-blue-800/40'
        : 'border-brand-border'
    }`}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-brand-card hover:bg-white/5 transition-colors text-left"
      >
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${statusConfig.bg} ${statusConfig.text}`}>
          {step.number}
        </span>
        <span className="flex-1 text-sm font-medium text-white">{step.name}</span>
        <StatusBadge status={form.status} />
        {open ? <ChevronDown size={14} className="text-zinc-500 ml-1 shrink-0" /> : <ChevronRight size={14} className="text-zinc-500 ml-1 shrink-0" />}
      </button>

      {/* Body */}
      {open && (
        <div className="px-4 py-4 border-t border-brand-border space-y-3 bg-brand-surface">
          {readOnly ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Statut :</span>
                <StatusBadge status={form.status} />
              </div>
              {form.notes && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Notes</p>
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

              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || !hasChanged}
                  variant={hasChanged ? 'primary' : 'secondary'}
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
