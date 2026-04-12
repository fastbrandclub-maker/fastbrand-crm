import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Button from '../ui/Button'
import Input, { Textarea, Select } from '../ui/Input'

export default function StudentForm({ student, onSave, onCancel }) {
  const { profile, isAdmin } = useAuth()
  const [coaches, setCoaches] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    first_name: student?.first_name ?? '',
    last_name: student?.last_name ?? '',
    email: student?.email ?? '',
    start_date: student?.start_date ?? new Date().toISOString().slice(0, 10),
    offre: student?.offre ?? 'indetermine',
    montant_collecte: student?.montant_collecte ?? '',
    montant_restant: student?.montant_restant ?? '',
    coach_id: student?.coach_id ?? profile?.id ?? '',
    general_notes: student?.general_notes ?? '',
    project_url: student?.project_url ?? '',
    shop_url: student?.shop_url ?? '',
    doc_url: student?.doc_url ?? '',
  })

  useEffect(() => {
    if (!isAdmin) return
    supabase
      .from('profiles')
      .select('id, full_name, role')
      .in('role', ['admin', 'coach'])
      .then(({ data }) => setCoaches(data ?? []))
  }, [isAdmin])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      ...form,
      coach_id: form.coach_id || profile?.id,
    }

    let result
    if (student?.id) {
      result = await supabase.from('students').update(payload).eq('id', student.id).select().single()
    } else {
      result = await supabase.from('students').insert(payload).select().single()
    }

    setLoading(false)
    if (result.error) {
      setError(result.error.message)
    } else {
      onSave(result.data)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Prénom *"
        value={form.first_name}
        onChange={e => set('first_name', e.target.value)}
        required
        placeholder="Prénom"
      />
      <Input
        label="Nom"
        value={form.last_name}
        onChange={e => set('last_name', e.target.value)}
        placeholder="Nom (facultatif)"
      />
      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={e => set('email', e.target.value)}
        placeholder="email@exemple.com (facultatif)"
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Offre"
          value={form.offre}
          onChange={e => set('offre', e.target.value)}
        >
          <option value="70_jours">60 Jours (70j)</option>
          <option value="6_mois">6 Mois</option>
          <option value="12_mois">12 Mois</option>
          <option value="resultats">Résultats</option>
          <option value="indetermine">Indéterminé</option>
        </Select>
        <div />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Montant collecté (€)"
          type="number"
          value={form.montant_collecte}
          onChange={e => set('montant_collecte', e.target.value)}
          placeholder="2500"
        />
        <Input
          label="Montant restant (€)"
          type="number"
          value={form.montant_restant}
          onChange={e => set('montant_restant', e.target.value)}
          placeholder="0"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Date de démarrage *"
          type="date"
          value={form.start_date}
          onChange={e => set('start_date', e.target.value)}
          required
        />
        {isAdmin && coaches.length > 0 ? (
          <Select
            label="Coach assigné"
            value={form.coach_id}
            onChange={e => set('coach_id', e.target.value)}
          >
            <option value="">— Sélectionner —</option>
            {coaches.map(c => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </Select>
        ) : null}
      </div>

      <div className="space-y-3 pt-1 border-t border-brand-border">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Liens</p>
        <Input
          label="URL Projet / Drive"
          value={form.project_url}
          onChange={e => set('project_url', e.target.value)}
          placeholder="https://drive.google.com/..."
        />
        <Input
          label="URL Boutique"
          value={form.shop_url}
          onChange={e => set('shop_url', e.target.value)}
          placeholder="https://ma-boutique.myshopify.com"
        />
        <Input
          label="URL Documentation"
          value={form.doc_url}
          onChange={e => set('doc_url', e.target.value)}
          placeholder="https://notion.so/..."
        />
      </div>

      <Textarea
        label="Notes générales"
        value={form.general_notes}
        onChange={e => set('general_notes', e.target.value)}
        placeholder="Informations importantes sur l'élève..."
        rows={3}
      />

      {error && (
        <p className="text-sm text-red-400 bg-red-950/50 border border-red-800 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Enregistrement...' : student?.id ? 'Mettre à jour' : 'Créer l\'élève'}
        </Button>
      </div>
    </form>
  )
}
