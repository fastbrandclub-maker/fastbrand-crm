import { useState, useEffect } from 'react'
import { Plus, Trash2, Megaphone, FileText, Lightbulb } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/ui/Button'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const CATEGORIES = [
  { value: 'idee', label: 'Idée', icon: Lightbulb, color: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-800/40' },
  { value: 'post', label: 'Post', icon: Megaphone, color: 'text-blue-400', bg: 'bg-blue-950/40 border-blue-800/40' },
  { value: 'divers', label: 'Divers', icon: FileText, color: 'text-zinc-400', bg: 'bg-zinc-800/40 border-zinc-700/40' },
]

export default function Contenu() {
  const { profile } = useAuth()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [form, setForm] = useState({ title: '', content: '', category: 'idee' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    function loadNotes() {
      supabase
        .from('admin_notes')
        .select('*, profiles:author_id(full_name)')
        .eq('type', 'contenu')
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setNotes(data ?? [])
          setLoading(false)
        })
    }
    loadNotes()
    const interval = setInterval(loadNotes, 30000)
    return () => clearInterval(interval)
  }, [])

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    const { data } = await supabase
      .from('admin_notes')
      .insert({ ...form, type: 'contenu', author_id: profile?.id })
      .select('*, profiles:author_id(full_name)')
      .single()
    setSaving(false)
    if (data) {
      setNotes(prev => [data, ...prev])
      setForm({ title: '', content: '', category: 'idee' })
      setShowForm(false)
    }
  }

  async function handleDelete(id) {
    await supabase.from('admin_notes').delete().eq('id', id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  const filtered = activeCategory === 'all' ? notes : notes.filter(n => n.category === activeCategory)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Contenu</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Idées & planning — Lilian & Selim</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={15} />
          Ajouter
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {[{ value: 'all', label: 'Tout' }, ...CATEGORIES].map(cat => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeCategory === cat.value
                ? 'bg-brand-red text-white'
                : 'bg-brand-surface border border-brand-border text-zinc-400 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Form inline */}
      {showForm && (
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 mb-4">
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="flex gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                  className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                    form.category === cat.value
                      ? 'bg-brand-red border-brand-red text-white'
                      : 'border-brand-border text-zinc-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Titre *"
              required
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            />
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Détails, idée, brief..."
              rows={4}
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : 'Ajouter'}</Button>
            </div>
          </form>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 text-sm">Aucune note pour le moment</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(note => {
            const cat = CATEGORIES.find(c => c.value === note.category) ?? CATEGORIES[2]
            const Icon = cat.icon
            return (
              <div key={note.id} className={`rounded-xl border p-4 ${cat.bg}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Icon size={13} className={cat.color} />
                    <span className={`text-xs font-semibold uppercase tracking-wider ${cat.color}`}>{cat.label}</span>
                  </div>
                  <button onClick={() => handleDelete(note.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
                <p className="text-sm font-semibold text-white mb-1">{note.title}</p>
                {note.content && <p className="text-xs text-zinc-400 whitespace-pre-wrap">{note.content}</p>}
                <p className="text-[10px] text-zinc-600 mt-3">
                  {note.profiles?.full_name} · {format(new Date(note.created_at), 'd MMM yyyy', { locale: fr })}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
