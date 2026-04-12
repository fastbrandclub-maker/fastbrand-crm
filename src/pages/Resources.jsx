import { useEffect, useState } from 'react'
import { Plus, ExternalLink, Trash2, Search, BookOpen, Link as LinkIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { STEPS } from '../lib/constants'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input, { Textarea, Select } from '../components/ui/Input'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const CATEGORIES = [
  { value: 'general', label: 'Général' },
  { value: 'step_1', label: "Call d'onboarding" },
  { value: 'step_2', label: 'Recherche produit' },
  { value: 'step_3', label: 'Étude de marché' },
  { value: 'step_4', label: 'Analyse du persona' },
  { value: 'step_5', label: 'Sourcing fournisseur' },
  { value: 'step_6', label: 'Commandes test' },
  { value: 'step_7', label: 'Création du site + visuels IA' },
  { value: 'step_8', label: 'Contenu & publicités' },
  { value: 'step_9', label: 'Suivi des performances' },
  { value: 'template', label: 'Template' },
  { value: 'tool', label: 'Outil' },
  { value: 'video', label: 'Vidéo' },
]

export default function Resources() {
  const { profile, isAdmin, isCoach } = useAuth()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', url: '', category: 'general' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function loadResources() {
    const { data } = await supabase
      .from('resources')
      .select('*, profiles:author_id(full_name)')
      .order('created_at', { ascending: false })
    setResources(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadResources()
    const interval = setInterval(loadResources, 30000)
    return () => clearInterval(interval)
  }, [])

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { data, error: err } = await supabase
      .from('resources')
      .insert({ ...form, author_id: profile?.id })
      .select('*, profiles:author_id(full_name)')
      .single()
    setSaving(false)
    if (err) {
      setError(err.message)
    } else {
      setResources(prev => [data, ...prev])
      setForm({ title: '', description: '', url: '', category: 'general' })
      setShowForm(false)
    }
  }

  async function handleDelete(id) {
    await supabase.from('resources').delete().eq('id', id)
    setResources(prev => prev.filter(r => r.id !== id))
  }

  const filtered = resources.filter(r => {
    const matchSearch = !search ||
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCategory === 'all' || r.category === filterCategory
    return matchSearch && matchCat
  })

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = filtered.filter(r => r.category === cat.value)
    if (items.length > 0) acc[cat.value] = { label: cat.label, items }
    return acc
  }, {})

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Ressources</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{resources.length} ressource{resources.length > 1 ? 's' : ''} disponible{resources.length > 1 ? 's' : ''}</p>
        </div>
        {isCoach && (
          <Button onClick={() => setShowForm(true)}>
            <Plus size={15} />
            Ajouter
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une ressource..."
            className="w-full bg-brand-surface border border-brand-border rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
        >
          <option value="all">Toutes les catégories</option>
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={32} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">
            {search ? 'Aucun résultat' : 'Aucune ressource pour le moment'}
          </p>
          {isCoach && !search && (
            <button
              onClick={() => setShowForm(true)}
              className="text-brand-red text-sm mt-2 hover:underline"
            >
              Ajouter la première ressource
            </button>
          )}
        </div>
      ) : filterCategory !== 'all' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(r => (
            <ResourceCard key={r.id} resource={r} onDelete={handleDelete} canDelete={isAdmin || r.author_id === profile?.id} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, { label, items }]) => (
            <div key={cat}>
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <div className="w-4 h-px bg-zinc-700" />
                {label}
                <span className="text-zinc-700 normal-case font-normal tracking-normal">({items.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map(r => (
                  <ResourceCard key={r.id} resource={r} onDelete={handleDelete} canDelete={isAdmin || r.author_id === profile?.id} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal ajout */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Ajouter une ressource">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input
            label="Titre *"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            required
            placeholder="Nom de la ressource"
          />
          <Input
            label="Lien URL"
            type="url"
            value={form.url}
            onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            placeholder="https://..."
          />
          <Select
            label="Catégorie"
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>
          <Textarea
            label="Description"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="À quoi sert cette ressource..."
            rows={3}
          />
          {error && (
            <p className="text-sm text-red-400 bg-red-950/50 border border-red-800 rounded-md px-3 py-2">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Ajout...' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function ResourceCard({ resource, onDelete, canDelete }) {
  return (
    <div className="bg-brand-surface border border-brand-border hover:border-zinc-700 rounded-xl p-4 transition-colors group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center shrink-0 mt-0.5">
            <LinkIcon size={13} className="text-brand-red" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{resource.title}</p>
            {resource.description && (
              <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{resource.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {resource.url && (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                >
                  <ExternalLink size={11} />
                  Ouvrir
                </a>
              )}
              <span className="text-xs text-zinc-600">
                {resource.profiles?.full_name} · {format(new Date(resource.created_at), 'd MMM', { locale: fr })}
              </span>
            </div>
          </div>
        </div>
        {canDelete && (
          <button
            onClick={() => onDelete(resource.id)}
            className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all shrink-0"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  )
}
