import { useEffect, useState, useRef } from 'react'
import { Plus, ExternalLink, Trash2, Search, BookOpen, Link as LinkIcon, FileText, Edit2, Upload, File, X, Eye, Copy, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input, { Select } from '../components/ui/Input'
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

const EMPTY_FORM = { title: '', description: '', url: '', category: 'general', resource_type: 'link', content: '', file_url: '' }

export default function Resources() {
  const { profile, isAdmin, isCoach } = useAuth()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editResource, setEditResource] = useState(null)
  const [viewResource, setViewResource] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

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

  function openAdd() {
    setForm(EMPTY_FORM)
    setFile(null)
    setError('')
    setEditResource(null)
    setShowForm(true)
  }

  function openEdit(r) {
    setForm({
      title: r.title ?? '',
      description: r.description ?? '',
      url: r.url ?? '',
      category: r.category ?? 'general',
      resource_type: r.resource_type ?? 'link',
      content: r.content ?? '',
      file_url: r.file_url ?? '',
    })
    setFile(null)
    setError('')
    setEditResource(r)
    setShowForm(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    let fileUrl = form.file_url
    if (file && form.resource_type === 'file') {
      setUploading(true)
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}_${file.name.replace(/\s/g, '_')}`
      const { error: uploadErr } = await supabase.storage.from('resource-files').upload(path, file, { upsert: true })
      if (uploadErr) {
        setError('Erreur upload PDF : ' + uploadErr.message)
        setSaving(false)
        setUploading(false)
        return
      }
      const { data: urlData } = supabase.storage.from('resource-files').getPublicUrl(path)
      fileUrl = urlData.publicUrl
      setUploading(false)
    }

    const payload = {
      title: form.title,
      description: form.description || null,
      category: form.category,
      resource_type: form.resource_type,
      url: form.resource_type === 'link' ? (form.url || null) : null,
      content: form.resource_type === 'page' ? (form.content || null) : null,
      file_url: form.resource_type === 'file' ? (fileUrl || null) : null,
    }

    if (editResource) {
      const { data, error: err } = await supabase.from('resources').update(payload).eq('id', editResource.id).select('*, profiles:author_id(full_name)').single()
      setSaving(false)
      if (err) { setError(err.message); return }
      setResources(prev => prev.map(r => r.id === editResource.id ? data : r))
    } else {
      const { data, error: err } = await supabase.from('resources').insert({ ...payload, author_id: profile?.id }).select('*, profiles:author_id(full_name)').single()
      setSaving(false)
      if (err) { setError(err.message); return }
      setResources(prev => [data, ...prev])
    }

    setShowForm(false)
    setEditResource(null)
    setForm(EMPTY_FORM)
    setFile(null)
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

  const canEdit = (r) => isAdmin || r.author_id === profile?.id

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Ressources</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{resources.length} ressource{resources.length > 1 ? 's' : ''} disponible{resources.length > 1 ? 's' : ''}</p>
        </div>
        {isCoach && (
          <Button onClick={openAdd}>
            <Plus size={15} />
            Ajouter
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-5">
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
          className="bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600 w-full sm:w-auto"
        >
          <option value="all">Toutes les catégories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={32} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">{search ? 'Aucun résultat' : 'Aucune ressource pour le moment'}</p>
          {isCoach && !search && (
            <button onClick={openAdd} className="text-brand-red text-sm mt-2 hover:underline">
              Ajouter la première ressource
            </button>
          )}
        </div>
      ) : filterCategory !== 'all' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(r => (
            <ResourceCard key={r.id} resource={r} onDelete={handleDelete} onEdit={openEdit} onView={setViewResource} canEdit={canEdit(r)} />
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
                  <ResourceCard key={r.id} resource={r} onDelete={handleDelete} onEdit={openEdit} onView={setViewResource} canEdit={canEdit(r)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal add/edit */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditResource(null) }} title={editResource ? 'Modifier la ressource' : 'Ajouter une ressource'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          {/* Type selector */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">Type de ressource</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'link', icon: <LinkIcon size={14} />, label: 'Lien' },
                { value: 'page', icon: <FileText size={14} />, label: 'Page' },
                { value: 'file', icon: <File size={14} />, label: 'PDF' },
              ].map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, resource_type: t.value }))}
                  className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${form.resource_type === t.value ? 'bg-brand-red/15 border-brand-red/50 text-brand-red' : 'bg-brand-surface border-brand-border text-zinc-400 hover:text-white'}`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Titre *"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            required
            placeholder="Nom de la ressource"
          />

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Catégorie</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
            >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description courte</label>
            <input
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="À quoi sert cette ressource..."
              className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>

          {form.resource_type === 'link' && (
            <Input
              label="URL"
              type="url"
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder="https://..."
            />
          )}

          {form.resource_type === 'page' && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Contenu de la page</label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder={"Écris ton contenu ici...\n\nTu peux utiliser des titres, des listes, structurer comme tu veux."}
                rows={14}
                className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 resize-y font-mono"
              />
            </div>
          )}

          {form.resource_type === 'file' && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Fichier PDF</label>
              <input ref={fileRef} type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} className="hidden" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-brand-border rounded-lg text-sm text-zinc-400 hover:border-zinc-600 hover:text-white transition-colors"
              >
                <Upload size={15} />
                {file ? file.name : (form.file_url ? 'Remplacer le fichier' : 'Choisir un PDF')}
              </button>
              {!file && form.file_url && (
                <p className="text-xs text-zinc-500 mt-1.5">Fichier actuel : <a href={form.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Voir le PDF</a></p>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 bg-red-950/50 border border-red-800 rounded-md px-3 py-2">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => { setShowForm(false); setEditResource(null) }}>Annuler</Button>
            <Button type="submit" disabled={saving || uploading}>
              {uploading ? 'Upload...' : saving ? 'Sauvegarde...' : editResource ? 'Sauvegarder' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal view page */}
      {viewResource && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-[#161616] border border-white/10 rounded-2xl mt-8 mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <div>
                <h2 className="text-base font-bold text-white">{viewResource.title}</h2>
                {viewResource.description && <p className="text-xs text-zinc-500 mt-0.5">{viewResource.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                {canEdit(viewResource) && (
                  <button
                    onClick={() => { setViewResource(null); openEdit(viewResource) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-zinc-300 hover:text-white transition-colors"
                  >
                    <Edit2 size={12} />
                    Modifier
                  </button>
                )}
                <button onClick={() => setViewResource(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <X size={15} className="text-zinc-400" />
                </button>
              </div>
            </div>
            <div className="px-6 py-5">
              <pre className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed font-sans">
                {viewResource.content || <span className="text-zinc-600 italic">Aucun contenu.</span>}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ResourceCard({ resource, onDelete, onEdit, onView, canEdit }) {
  const type = resource.resource_type ?? 'link'
  const [copied, setCopied] = useState(false)

  const icon = type === 'page' ? <FileText size={13} className="text-brand-red" />
    : type === 'file' ? <File size={13} className="text-brand-red" />
    : <LinkIcon size={13} className="text-brand-red" />

  const typeLabel = type === 'page' ? 'Page' : type === 'file' ? 'PDF' : null

  function handleOpen(e) {
    e.preventDefault()
    if (type === 'page') { onView(resource); return }
    if (type === 'file' && resource.file_url) { window.open(resource.file_url, '_blank'); return }
    if (type === 'link' && resource.url) { window.open(resource.url, '_blank'); return }
  }

  function handleCopy(e) {
    e.stopPropagation()
    const text = type === 'page' ? (resource.content ?? '')
      : type === 'file' ? (resource.file_url ?? '')
      : (resource.url ?? '')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-brand-surface border border-brand-border hover:border-zinc-700 rounded-xl p-4 transition-colors group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center shrink-0 mt-0.5">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-white truncate">{resource.title}</p>
              {typeLabel && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-700/60 text-zinc-400">{typeLabel}</span>
              )}
            </div>
            {resource.description && (
              <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{resource.description}</p>
            )}
            {type === 'page' && resource.content && (
              <p className="text-xs text-zinc-600 mt-0.5 line-clamp-1 font-mono">{resource.content}</p>
            )}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <button
                onClick={handleOpen}
                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
              >
                {type === 'page' ? <Eye size={11} /> : <ExternalLink size={11} />}
                {type === 'page' ? 'Lire' : 'Ouvrir'}
              </button>
              <span className="text-xs text-zinc-600">
                {resource.profiles?.full_name} · {format(new Date(resource.created_at), 'd MMM', { locale: fr })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleCopy}
            className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-all ${copied ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-brand-surface border-brand-border text-zinc-500 hover:text-white hover:border-zinc-600'}`}
            title="Copier"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
          {canEdit && (
            <button
              onClick={() => onEdit(resource)}
              className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-zinc-600 hover:text-white transition-all"
            >
              <Edit2 size={12} />
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => onDelete(resource.id)}
              className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-all"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
