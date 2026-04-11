import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Button from '../ui/Button'
import Input, { Textarea } from '../ui/Input'

export default function CallForm({ studentId, onSave, onCancel }) {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const now = new Date()
  const localDatetime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)

  const [form, setForm] = useState({
    call_date: localDatetime,
    duration_minutes: '',
    summary: '',
    next_appointment: '',
  })

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: err } = await supabase
      .from('calls')
      .insert({
        student_id: studentId,
        coach_id: profile?.id,
        call_date: form.call_date,
        duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
        summary: form.summary || null,
        next_appointment: form.next_appointment || null,
      })
      .select()
      .single()

    setLoading(false)
    if (err) setError(err.message)
    else onSave(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Date & heure du call *"
          type="datetime-local"
          value={form.call_date}
          onChange={e => set('call_date', e.target.value)}
          required
        />
        <Input
          label="Durée (minutes)"
          type="number"
          min={1}
          value={form.duration_minutes}
          onChange={e => set('duration_minutes', e.target.value)}
          placeholder="45"
        />
      </div>

      <Textarea
        label="Compte-rendu"
        value={form.summary}
        onChange={e => set('summary', e.target.value)}
        placeholder="Résumé du call, points abordés, actions à faire..."
        rows={4}
      />

      <Input
        label="Prochain RDV"
        type="datetime-local"
        value={form.next_appointment}
        onChange={e => set('next_appointment', e.target.value)}
      />

      {error && (
        <p className="text-sm text-red-400 bg-red-950/50 border border-red-800 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Enregistrement...' : 'Ajouter le call'}
        </Button>
      </div>
    </form>
  )
}
