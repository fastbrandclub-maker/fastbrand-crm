import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { differenceInDays, addDays, addMonths, format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { fr } from 'date-fns/locale'
import { AlertTriangle, Clock, Plus, TrendingUp, Wallet, X, Receipt, ChevronDown, ChevronUp, Pencil } from 'lucide-react'
import Button from '../../components/ui/Button'

function getExpiryDate(offre, datePaiement) {
  if (!datePaiement || offre === 'a_vie' || offre === 'resultats' || offre === 'indetermine') return null
  const d = new Date(datePaiement)
  if (offre === '70_jours') return addDays(d, 70)
  if (offre === '2_mois') return addMonths(d, 2)
  if (offre === '6_mois') return addMonths(d, 6)
  if (offre === '12_mois') return addMonths(d, 12)
  return null
}

function offreLabel(offre) {
  const map = { '70_jours': '60 JOURS', '6_mois': '6 MOIS', '12_mois': '12 MOIS', 'a_vie': 'À vie', 'resultats': 'Résultats', 'indetermine': 'Indét.' }
  return map[offre] ?? offre ?? '—'
}

function fmt(n) {
  if (n == null || n === '') return '—'
  return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + '€'
}

const FRAIS_CATS = ['pub', 'outil', 'logiciel', 'autre']

export default function Compta() {
  const { profile } = useAuth()
  const [entries, setEntries] = useState([])
  const [frais, setFrais] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'MMMM yyyy', { locale: fr }))
  const [collapsed, setCollapsed] = useState({})
  const [showClientForm, setShowClientForm] = useState(false)
  const [showFraisForm, setShowFraisForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [saving, setSaving] = useState(false)

  const emptyClientForm = {
    client_name: '', closer: '', coach: '', offre: '6_mois', prix: '',
    date_paiement: new Date().toISOString().slice(0, 10),
    paiement_recu: '', restant_du: 0, frais_closer: '', frais_coach: '', net_apres_frais: '',
    moyen_paiement: '', cta_group: '3ème CTA',
  }
  const [clientForm, setClientForm] = useState(emptyClientForm)
  const [fraisForm, setFraisForm] = useState({
    description: '', montant: '', date_frais: new Date().toISOString().slice(0, 10), category: 'autre',
  })

  useEffect(() => {
    function loadAll() {
      Promise.all([
        supabase.from('compta_entries').select('*').order('date_paiement', { ascending: true, nullsFirst: false }),
        supabase.from('compta_frais').select('*, profiles:author_id(full_name)').order('date_frais', { ascending: true }),
      ]).then(([e, f]) => {
        setEntries(e.data ?? [])
        setFrais(f.data ?? [])
        setLoading(false)
      })
    }
    loadAll()
    const interval = setInterval(loadAll, 30000)
    return () => clearInterval(interval)
  }, [])

  function setC(k, v) { setClientForm(f => ({ ...f, [k]: v })) }
  function setF(k, v) { setFraisForm(f => ({ ...f, [k]: v })) }

  async function handleAddClient(e) {
    e.preventDefault()
    setSaving(true)
    if (editingEntry) {
      const { data } = await supabase.from('compta_entries').update(clientForm).eq('id', editingEntry).select().single()
      setSaving(false)
      if (data) {
        setEntries(prev => prev.map(en => en.id === editingEntry ? data : en))
        setEditingEntry(null)
        setShowClientForm(false)
        setClientForm(emptyClientForm)
      }
    } else {
      const { data } = await supabase.from('compta_entries').insert(clientForm).select().single()
      setSaving(false)
      if (data) { setEntries(prev => [...prev, data].sort((a, b) => (a.date_paiement ?? '') > (b.date_paiement ?? '') ? 1 : -1)); setShowClientForm(false) }
    }
  }

  function startEdit(entry) {
    setClientForm({
      client_name: entry.client_name ?? '',
      closer: entry.closer ?? '',
      coach: entry.coach ?? '',
      offre: entry.offre ?? '6_mois',
      prix: entry.prix ?? '',
      date_paiement: entry.date_paiement ?? new Date().toISOString().slice(0, 10),
      paiement_recu: entry.paiement_recu ?? '',
      restant_du: entry.restant_du ?? 0,
      frais_closer: entry.frais_closer ?? '',
      frais_coach: entry.frais_coach ?? '',
      net_apres_frais: entry.net_apres_frais ?? '',
      moyen_paiement: entry.moyen_paiement ?? '',
      cta_group: entry.cta_group ?? '3ème CTA',
    })
    setEditingEntry(entry.id)
    setShowClientForm(true)
    setShowFraisForm(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleAddFrais(e) {
    e.preventDefault()
    setSaving(true)
    const { data } = await supabase.from('compta_frais').insert({ ...fraisForm, author_id: profile?.id }).select('*, profiles:author_id(full_name)').single()
    setSaving(false)
    if (data) { setFrais(prev => [...prev, data].sort((a, b) => a.date_frais > b.date_frais ? 1 : -1)); setShowFraisForm(false) }
  }

  async function deleteEntry(id) {
    if (!window.confirm('Supprimer ?')) return
    await supabase.from('compta_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  async function deleteFrais(id) {
    if (!window.confirm('Supprimer ?')) return
    await supabase.from('compta_frais').delete().eq('id', id)
    setFrais(prev => prev.filter(f => f.id !== id))
  }

  const filteredEntries = selectedMonth === 'all'
    ? entries
    : entries.filter(e => e.date_paiement && format(new Date(e.date_paiement), 'MMMM yyyy', { locale: fr }) === selectedMonth)
  const filteredFrais = selectedMonth === 'all'
    ? frais
    : frais.filter(f => f.date_frais && format(new Date(f.date_frais), 'MMMM yyyy', { locale: fr }) === selectedMonth)

  // Stats
  const totalCollecte = filteredEntries.reduce((s, e) => s + (Number(e.paiement_recu) || 0), 0)
  const totalRestant = filteredEntries.reduce((s, e) => s + (Number(e.restant_du) || 0), 0)
  const totalNet = filteredEntries.reduce((s, e) => s + (Number(e.net_apres_frais) || 0), 0)
  const totalFrais = filteredFrais.reduce((s, f) => s + (Number(f.montant) || 0), 0)
  const netReel = totalNet - totalFrais
  const totalCommCloser = filteredEntries.reduce((s, e) => s + (Number(e.frais_closer) || 0), 0)
  const totalCommCoach = filteredEntries.reduce((s, e) => s + (Number(e.frais_coach) || 0), 0)

  // Warnings (toujours sur tout)
  const today = new Date()
  const pendingPayments = entries.filter(e => Number(e.restant_du) > 0)
  const expiredOffres = entries.filter(e => {
    const exp = getExpiryDate(e.offre, e.date_paiement)
    return exp && differenceInDays(today, exp) > 0
  })

  // Liste des mois disponibles (pour le dropdown)
  const allMonthKeys = Array.from(new Set(
    [...entries.map(e => e.date_paiement), ...frais.map(f => f.date_frais)]
      .filter(Boolean)
      .map(d => format(new Date(d), 'MMMM yyyy', { locale: fr }))
  )).sort((a, b) => {
    const da = entries.find(e => e.date_paiement && format(new Date(e.date_paiement), 'MMMM yyyy', { locale: fr }) === a)?.date_paiement
    const db = entries.find(e => e.date_paiement && format(new Date(e.date_paiement), 'MMMM yyyy', { locale: fr }) === b)?.date_paiement
    return (da ?? '') < (db ?? '') ? -1 : 1
  })

  function getMonthKey(dateStr) {
    if (!dateStr) return 'Sans date'
    return format(new Date(dateStr), 'MMMM yyyy', { locale: fr })
  }

  const monthKeys = selectedMonth === 'all'
    ? ['Sans date', ...allMonthKeys]
    : [selectedMonth]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Comptabilité</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{entries.length} clients — accès admin uniquement</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => { setShowFraisForm(true); setShowClientForm(false) }}>
            <Receipt size={14} /> Ajouter des frais
          </Button>
          <Button onClick={() => { setEditingEntry(null); setClientForm(emptyClientForm); setShowClientForm(true); setShowFraisForm(false) }}>
            <Plus size={15} /> Ajouter un client
          </Button>
        </div>
      </div>

      {/* Sélecteur de mois */}
      <div className="flex items-center gap-2 mb-5">
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:border-zinc-600 capitalize"
        >
          <option value="all">Tous les mois</option>
          {allMonthKeys.map(m => (
            <option key={m} value={m} className="capitalize">{m}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-7 gap-3 mb-5">
        {[
          { label: 'Collecté', value: fmt(totalCollecte), color: 'text-emerald-400' },
          { label: 'Restant dû', value: fmt(totalRestant), color: totalRestant > 0 ? 'text-amber-400' : 'text-zinc-400' },
          { label: 'Net', value: fmt(totalNet), color: 'text-blue-400' },
          { label: 'Frais', value: fmt(totalFrais), color: totalFrais > 0 ? 'text-red-400' : 'text-zinc-400' },
          { label: 'Net réel', value: fmt(netReel), color: 'text-white' },
          { label: 'Comm. closer', value: fmt(totalCommCloser), color: 'text-purple-400' },
          { label: 'Comm. coach', value: fmt(totalCommCoach), color: 'text-cyan-400' },
        ].map(s => (
          <div key={s.label} className="bg-brand-surface border border-brand-border rounded-xl p-4">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {(pendingPayments.length > 0 || expiredOffres.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-5">
          {pendingPayments.length > 0 && (
            <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={13} className="text-amber-400" />
                <p className="text-sm font-bold text-amber-400">Paiements en attente ({pendingPayments.length})</p>
              </div>
              <div className="space-y-2">
                {pendingPayments.map(e => (
                  <div key={e.id} className="flex items-center justify-between">
                    <p className="text-sm text-white font-medium">{e.client_name}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-amber-400 font-semibold">{fmt(e.restant_du)} restants</span>
                      {e.date_paiement && <span className="text-xs text-zinc-500">depuis {differenceInDays(today, new Date(e.date_paiement))}j</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {expiredOffres.length > 0 && (
            <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={13} className="text-brand-red" />
                <p className="text-sm font-bold text-brand-red">Accompagnements expirés ({expiredOffres.length})</p>
              </div>
              <div className="space-y-2">
                {expiredOffres.map(e => {
                  const exp = getExpiryDate(e.offre, e.date_paiement)
                  return (
                    <div key={e.id} className="flex items-center justify-between">
                      <p className="text-sm text-white font-medium">{e.client_name}</p>
                      <span className="text-xs text-red-400 font-semibold">expiré depuis {differenceInDays(today, exp)}j</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Formulaire client */}
      {showClientForm && (
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-white">{editingEntry ? `Modifier — ${clientForm.client_name}` : 'Nouveau client'}</p>
            <button onClick={() => { setShowClientForm(false); setEditingEntry(null); setClientForm(emptyClientForm) }}><X size={16} className="text-zinc-500 hover:text-white" /></button>
          </div>
          <form onSubmit={handleAddClient} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Client *</label>
              <input required value={clientForm.client_name} onChange={e => setC('client_name', e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Closer</label>
              <select value={clientForm.closer} onChange={e => setC('closer', e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                {['', 'selim', 'ronie', 'loic', 'theo'].map(o => <option key={o} value={o}>{o || '—'}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Coach</label>
              <input value={clientForm.coach} onChange={e => setC('coach', e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Moyen de paiement</label>
              <input value={clientForm.moyen_paiement} onChange={e => setC('moyen_paiement', e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Offre</label>
              <select value={clientForm.offre} onChange={e => setC('offre', e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                <option value="70_jours">60 JOURS</option>
                <option value="6_mois">6 MOIS</option>
                <option value="12_mois">12 MOIS</option>
              </select>
            </div>
            {[
              { label: 'Prix (€)', key: 'prix', type: 'number' },
              { label: 'Date paiement', key: 'date_paiement', type: 'date' },
              { label: 'Reçu (€)', key: 'paiement_recu', type: 'number' },
              { label: 'Restant dû (€)', key: 'restant_du', type: 'number' },
              { label: 'Comm. closer (€)', key: 'frais_closer', type: 'number' },
              { label: 'Comm. coach (€)', key: 'frais_coach', type: 'number' },
              { label: 'Net après frais (€)', key: 'net_apres_frais', type: 'number' },
            ].map(field => (
              <div key={field.key}>
                <label className="text-xs text-zinc-500 block mb-1">{field.label}</label>
                <input type={field.type} value={clientForm[field.key]} onChange={e => setC(field.key, e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
              </div>
            ))}
            <div className="col-span-2 lg:col-span-4 flex justify-end gap-2 pt-1">
              <Button variant="secondary" type="button" onClick={() => setShowClientForm(false)}>Annuler</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : editingEntry ? 'Modifier' : 'Ajouter'}</Button>
            </div>
          </form>
        </div>
      )}

      {/* Formulaire frais */}
      {showFraisForm && (
        <div className="bg-brand-surface border border-red-900/40 rounded-xl p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-white">Ajouter des frais</p>
            <button onClick={() => setShowFraisForm(false)}><X size={16} className="text-zinc-500 hover:text-white" /></button>
          </div>
          <form onSubmit={handleAddFrais} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-zinc-500 block mb-1">Description *</label>
              <input required value={fraisForm.description} onChange={e => setF('description', e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Montant (€) *</label>
              <input required type="number" value={fraisForm.montant} onChange={e => setF('montant', e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Date</label>
              <input type="date" value={fraisForm.date_frais} onChange={e => setF('date_frais', e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Catégorie</label>
              <select value={fraisForm.category} onChange={e => setF('category', e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                {FRAIS_CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2 lg:col-span-4 flex justify-end gap-2 pt-1">
              <Button variant="secondary" type="button" onClick={() => setShowFraisForm(false)}>Annuler</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : 'Ajouter'}</Button>
            </div>
          </form>
        </div>
      )}

      {/* Tableau par mois */}
      <div className="space-y-4">
        {monthKeys.map(monthKey => {
          const monthEntries = filteredEntries.filter(e => getMonthKey(e.date_paiement) === monthKey)
          const monthFrais = filteredFrais.filter(f => getMonthKey(f.date_frais) === monthKey)
          if (monthEntries.length === 0 && monthFrais.length === 0) return null

          const monthCollecte = monthEntries.reduce((s, e) => s + (Number(e.paiement_recu) || 0), 0)
          const monthRestant = monthEntries.reduce((s, e) => s + (Number(e.restant_du) || 0), 0)
          const monthNet = monthEntries.reduce((s, e) => s + (Number(e.net_apres_frais) || 0), 0)
          const monthFraisTotal = monthFrais.reduce((s, f) => s + (Number(f.montant) || 0), 0)
          const isCollapsed = collapsed[monthKey]

          return (
            <div key={monthKey} className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
              {/* Month header */}
              <button
                onClick={() => setCollapsed(c => ({ ...c, [monthKey]: !c[monthKey] }))}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold text-white capitalize">{monthKey}</p>
                  <span className="text-xs text-zinc-500">{monthEntries.length} client{monthEntries.length > 1 ? 's' : ''}</span>
                  {monthRestant > 0 && <span className="text-xs text-amber-400">{fmt(monthRestant)} en attente</span>}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-zinc-500">{fmt(monthCollecte)} collecté</span>
                  {monthFraisTotal > 0 && <span className="text-xs text-red-400">−{fmt(monthFraisTotal)} frais</span>}
                  <span className="text-sm font-bold text-emerald-400">{fmt(monthNet - monthFraisTotal)} net</span>
                  {isCollapsed ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronUp size={14} className="text-zinc-500" />}
                </div>
              </button>

              {!isCollapsed && (
                <div className="border-t border-brand-border">
                  {/* Clients */}
                  {monthEntries.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-brand-border/50">
                            {['Client', 'Closer', 'Coach', 'Offre', 'Prix', 'Reçu', 'Restant', 'Comm. closer', 'Comm. coach', 'Net', 'Paiement', ''].map(h => (
                              <th key={h} className="px-3 py-2 text-left text-zinc-500 font-medium whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {monthEntries.map(e => {
                            const expiry = getExpiryDate(e.offre, e.date_paiement)
                            const isExpired = expiry && differenceInDays(today, expiry) > 0
                            const hasPending = Number(e.restant_du) > 0
                            return (
                              <tr key={e.id} className={`border-b border-brand-border/30 hover:bg-white/5 ${isExpired ? 'bg-red-950/10' : hasPending ? 'bg-amber-950/10' : ''}`}>
                                <td className="px-3 py-2.5 font-medium text-white whitespace-nowrap">
                                  {e.client_name}
                                  {isExpired && <span className="ml-1.5 text-red-400 text-[10px]">⏰</span>}
                                  {hasPending && <span className="ml-1.5 text-amber-400 text-[10px]">💰</span>}
                                </td>
                                <td className="px-3 py-2.5 text-zinc-400 capitalize">{e.closer ?? '—'}</td>
                                <td className="px-3 py-2.5 text-zinc-400 capitalize">{e.coach ?? '—'}</td>
                                <td className="px-3 py-2.5 text-zinc-300">{offreLabel(e.offre)}</td>
                                <td className="px-3 py-2.5 text-zinc-300">{fmt(e.prix)}</td>
                                <td className="px-3 py-2.5 text-emerald-400 font-medium">{fmt(e.paiement_recu)}</td>
                                <td className={`px-3 py-2.5 font-medium ${hasPending ? 'text-amber-400' : 'text-zinc-500'}`}>{Number(e.restant_du) > 0 ? fmt(e.restant_du) : '—'}</td>
                                <td className="px-3 py-2.5 text-purple-400">{fmt(e.frais_closer)}</td>
                                <td className="px-3 py-2.5 text-cyan-400">{fmt(e.frais_coach)}</td>
                                <td className="px-3 py-2.5 text-blue-400 font-medium">{fmt(e.net_apres_frais)}</td>
                                <td className="px-3 py-2.5 text-zinc-500 max-w-[100px] truncate">{e.moyen_paiement ?? '—'}</td>
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => startEdit(e)} className="text-zinc-600 hover:text-blue-400 transition-colors"><Pencil size={13} /></button>
                                    <button onClick={() => deleteEntry(e.id)} className="text-zinc-600 hover:text-red-400 transition-colors"><X size={13} /></button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Frais du mois */}
                  {monthFrais.length > 0 && (
                    <div className="border-t border-brand-border/50 bg-red-950/5">
                      <div className="px-3 py-2 flex items-center gap-2">
                        <Receipt size={11} className="text-red-400" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400">Frais</span>
                      </div>
                      {monthFrais.map(f => (
                        <div key={f.id} className="flex items-center justify-between px-3 py-1.5 border-t border-brand-border/20 hover:bg-white/5">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-zinc-300">{f.description}</span>
                            <span className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">{f.category}</span>
                            {f.profiles?.full_name && <span className="text-[10px] text-zinc-600">{f.profiles.full_name}</span>}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-red-400">−{fmt(f.montant)}</span>
                            <button onClick={() => deleteFrais(f.id)} className="text-zinc-600 hover:text-red-400 transition-colors"><X size={12} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
