import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Phone, Clock, ChevronLeft, ChevronRight, Plus, Trash2, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { TEAM } from '../lib/constants'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Input, { Textarea, Select } from '../components/ui/Input'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isToday, addMonths, subMonths,
} from 'date-fns'
import { fr } from 'date-fns/locale'

export default function Calendar() {
  const { profile } = useAuth()
  const [events, setEvents] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const defaultDatetime = (() => {
    const d = new Date(selectedDay)
    d.setHours(10, 0, 0, 0)
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  })()

  const [form, setForm] = useState({
    title: '',
    description: '',
    event_date: defaultDatetime,
    assigned_to: '',
  })
  const [saving, setSaving] = useState(false)

  async function loadEvents() {
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true })
    setEvents(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadEvents() }, [])

  function getDayEvents(day) {
    return events.filter(e => isSameDay(new Date(e.event_date), day))
  }

  function getSelectedEvents() {
    return events.filter(e => isSameDay(new Date(e.event_date), selectedDay))
  }

  const upcoming = events
    .filter(e => new Date(e.event_date) >= new Date())
    .slice(0, 10)

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)

    const { data, error } = await supabase
      .from('events')
      .insert({
        title: form.title,
        description: form.description || null,
        event_date: form.event_date,
        assigned_to: form.assigned_to || null,
        created_by: profile?.id,
      })
      .select()
      .single()

    setSaving(false)
    if (error) return

    setEvents(prev => [...prev, data].sort((a, b) => new Date(a.event_date) - new Date(b.event_date)))
    setShowForm(false)

    // Notification WhatsApp si quelqu'un est assigné
    if (form.assigned_to) {
      const member = TEAM.find(m => m.name === form.assigned_to)
      if (member) {
        const dateStr = format(new Date(form.event_date), "EEEE d MMMM 'à' HH:mm", { locale: fr })
        const msg = encodeURIComponent(
          `Hey ${form.assigned_to} ! Tu as un événement prévu : *${form.title}* — ${dateStr} 📅`
        )
        window.open(`https://wa.me/${member.phone}?text=${msg}`, '_blank')
      }
    }

    setForm({ title: '', description: '', event_date: defaultDatetime, assigned_to: '' })
  }

  async function handleDelete(id) {
    await supabase.from('events').delete().eq('id', id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })
  const startPadding = startOfMonth(currentMonth).getDay()
  const adjustedPadding = startPadding === 0 ? 6 : startPadding - 1

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Calendrier</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Planifie et notifie l'équipe via WhatsApp</p>
        </div>
        <Button onClick={() => {
          setForm({ title: '', description: '', event_date: defaultDatetime, assigned_to: '' })
          setShowForm(true)
        }}>
          <Plus size={15} />
          Nouvel événement
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendrier */}
        <div className="lg:col-span-2 bg-brand-surface border border-brand-border rounded-xl p-5">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(m => subMonths(m, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-sm font-semibold text-white capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </h2>
            <button
              onClick={() => setCurrentMonth(m => addMonths(m, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Jours */}
          <div className="grid grid-cols-7 mb-2">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
              <div key={d} className="text-center text-xs text-zinc-600 font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Grille */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: adjustedPadding }).map((_, i) => <div key={`pad-${i}`} />)}
            {days.map(day => {
              const dayEvts = getDayEvents(day)
              const isSelected = isSameDay(day, selectedDay)
              const isCurrentDay = isToday(day)
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                    isSelected ? 'bg-brand-red text-white'
                    : isCurrentDay ? 'bg-white/10 text-white'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-medium">{format(day, 'd')}</span>
                  {dayEvts.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayEvts.slice(0, 3).map((_, i) => (
                        <div key={i} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-brand-red'}`} />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Événements du jour sélectionné */}
          <div className="mt-4 pt-4 border-t border-brand-border">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-zinc-400 capitalize">
                {format(selectedDay, 'EEEE d MMMM', { locale: fr })}
              </p>
              <button
                onClick={() => {
                  const d = new Date(selectedDay)
                  d.setHours(10, 0, 0, 0)
                  const dt = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                  setForm({ title: '', description: '', event_date: dt, assigned_to: '' })
                  setShowForm(true)
                }}
                className="text-xs text-brand-red hover:underline flex items-center gap-1"
              >
                <Plus size={11} />
                Ajouter
              </button>
            </div>
            {getSelectedEvents().length === 0 ? (
              <p className="text-xs text-zinc-600">Aucun événement ce jour.</p>
            ) : (
              <div className="space-y-2">
                {getSelectedEvents().map(evt => (
                  <EventRow key={evt.id} event={evt} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Prochains événements */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={13} className="text-brand-red" />
            <h2 className="text-sm font-semibold text-white">Prochains événements</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
            </div>
          ) : upcoming.length === 0 ? (
            <p className="text-xs text-zinc-500">Aucun événement planifié.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map(evt => (
                <div key={evt.id} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-red mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{evt.title}</p>
                    <p className="text-xs text-zinc-500 capitalize">
                      {format(new Date(evt.event_date), "d MMM 'à' HH:mm", { locale: fr })}
                    </p>
                    {evt.assigned_to && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 mt-0.5">
                        → {evt.assigned_to}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal création */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nouvel événement">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Titre *"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            required
            placeholder="Ex: Call de suivi, Réunion équipe..."
          />
          <Input
            label="Date & heure *"
            type="datetime-local"
            value={form.event_date}
            onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
            required
          />
          <Select
            label="Assigner à"
            value={form.assigned_to}
            onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
          >
            <option value="">— Personne —</option>
            {TEAM.map(m => (
              <option key={m.name} value={m.name}>{m.name}</option>
            ))}
          </Select>
          <Textarea
            label="Description"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Détails de l'événement..."
            rows={3}
          />

          {form.assigned_to && (
            <div className="flex items-center gap-2 bg-green-950/40 border border-green-800/30 rounded-lg px-3 py-2">
              <Send size={12} className="text-green-400 shrink-0" />
              <p className="text-xs text-green-300">
                Un message WhatsApp sera envoyé à <strong>{form.assigned_to}</strong> à la création
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Création...' : 'Créer l\'événement'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function EventRow({ event, onDelete }) {
  const member = TEAM.find(m => m.name === event.assigned_to)

  function sendReminder() {
    if (!member) return
    const dateStr = format(new Date(event.event_date), "EEEE d MMMM 'à' HH:mm", { locale: fr })
    const msg = encodeURIComponent(`Rappel : *${event.title}* — ${dateStr} 📅`)
    window.open(`https://wa.me/${member.phone}?text=${msg}`, '_blank')
  }

  return (
    <div className="group flex items-start gap-2 p-2 bg-brand-dark rounded-lg">
      <div className="w-1.5 h-1.5 rounded-full bg-brand-red mt-1.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{event.title}</p>
        <p className="text-xs text-zinc-500">
          {format(new Date(event.event_date), "HH:mm", { locale: fr })}
          {event.assigned_to && <span className="text-blue-400 ml-1.5">→ {event.assigned_to}</span>}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {member && (
          <button
            onClick={sendReminder}
            title="Envoyer rappel WhatsApp"
            className="w-6 h-6 flex items-center justify-center rounded text-green-500 hover:bg-white/5"
          >
            <Send size={11} />
          </button>
        )}
        <button
          onClick={() => onDelete(event.id)}
          className="w-6 h-6 flex items-center justify-center rounded text-zinc-600 hover:text-red-400 hover:bg-white/5"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  )
}
