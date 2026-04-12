import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { differenceInDays, addDays, addMonths, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { AlertTriangle, Clock, Plus, TrendingUp, Wallet, ChevronDown, ChevronUp, X } from 'lucide-react'
import Button from '../../components/ui/Button'

const CTA_ORDER = ['1er CTA', '2ème CTA', 'Evergreen', '3ème CTA', 'Autre']
const CTA_COLORS = {
  '1er CTA':   'text-blue-400 bg-blue-950/40 border-blue-800/40',
  '2ème CTA':  'text-purple-400 bg-purple-950/40 border-purple-800/40',
  'Evergreen': 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40',
  '3ème CTA':  'text-amber-400 bg-amber-950/40 border-amber-800/40',
  'Autre':     'text-zinc-400 bg-zinc-800/40 border-zinc-700/40',
}

function getExpiryDate(offre, datePaiement) {
  if (!datePaiement || offre === 'a_vie') return null
  const d = new Date(datePaiement)
  if (offre === '45j') return addDays(d, 45)
  if (offre === '2_mois') return addMonths(d, 2)
  if (offre === '6_mois') return addMonths(d, 6)
  return null
}

function offreLabel(offre) {
  if (offre === 'a_vie') return 'À vie'
  if (offre === '45j') return '45 Jours'
  if (offre === '2_mois') return '2 Mois'
  if (offre === '6_mois') return '6 Mois'
  return offre ?? '—'
}

function fmt(n) {
  if (n == null || n === '') return '—'
  return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + '€'
}

export default function Compta() {
  const { profile } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    cta_group: '3ème CTA', client_name: '', closer: '', offre: 'a_vie',
    prix: '', date_paiement: '', paiement_recu: '', restant_du: 0,
    frais_closer: '', net_apres_frais: '', moyen_paiement: '', frais_paiement: 0,
  })

  useEffect(() => {
    supabase.from('compta_entries').select('*').order('created_at')
      .then(({ data }) => { setEntries(data ?? []); setLoading(false) })
  }, [])

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    const { data } = await supabase.from('compta_entries').insert(form).select().single()
    setSaving(false)
    if (data) { setEntries(prev => [...prev, data]); setShowForm(false) }
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer cette entrée ?')) return
    await supabase.from('compta_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  // Stats
  const totalContracte = entries.reduce((s, e) => s + (Number(e.prix) || 0), 0)
  const totalCollecte = entries.reduce((s, e) => s + (Number(e.paiement_recu) || 0), 0)
  const totalRestant = entries.reduce((s, e) => s + (Number(e.restant_du) || 0), 0)
  const totalNet = entries.reduce((s, e) => s + (Number(e.net_apres_frais) || 0), 0)

  // Warnings
  const today = new Date()
  const pendingPayments = entries.filter(e => Number(e.restant_du) > 0)
  const expiredOffres = entries.filter(e => {
    const exp = getExpiryDate(e.offre, e.date_paiement)
    return exp && differenceInDays(today, exp) > 0
  })

  // Grouped
  const grouped = CTA_ORDER.map(group => ({
    group,
    items: entries.filter(e => e.cta_group === group),
  })).filter(g => g.items.length > 0)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Comptabilité</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{entries.length} clients — accès admin uniquement</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={15} /> Ajouter un client
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total contracté', value: fmt(totalContracte), icon: TrendingUp, color: 'text-white' },
          { label: 'Total collecté', value: fmt(totalCollecte), icon: Wallet, color: 'text-emerald-400' },
          { label: 'Restant dû', value: fmt(totalRestant), icon: Clock, color: totalRestant > 0 ? 'text-amber-400' : 'text-white' },
          { label: 'Net après frais', value: fmt(totalNet), icon: TrendingUp, color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="bg-brand-surface border border-brand-border rounded-xl p-4">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
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
                      {e.date_paiement && (
                        <span className="text-xs text-zinc-500">
                          depuis {differenceInDays(today, new Date(e.date_paiement))}j
                        </span>
                      )}
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
                  const daysAgo = differenceInDays(today, exp)
                  return (
                    <div key={e.id} className="flex items-center justify-between">
                      <p className="text-sm text-white font-medium">{e.client_name}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-500">{offreLabel(e.offre)}</span>
                        <span className="text-xs text-red-400 font-semibold">expiré depuis {daysAgo}j</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Formulaire ajout */}
      {showForm && (
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-white">Nouveau client</p>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-zinc-500 hover:text-white" /></button>
          </div>
          <form onSubmit={handleAdd} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="col-span-2 lg:col-span-1">
              <label className="text-xs text-zinc-500 block mb-1">Client *</label>
              <input required value={form.client_name} onChange={e => setF('client_name', e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">CTA</label>
              <select value={form.cta_group} onChange={e => setF('cta_group', e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                {CTA_ORDER.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Closer</label>
              <select value={form.closer} onChange={e => setF('closer', e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                <option value="">—</option>
                {['selim', 'ronie', 'loic', 'theo'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Offre</label>
              <select value={form.offre} onChange={e => setF('offre', e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                <option value="a_vie">À vie</option>
                <option value="6_mois">6 Mois</option>
                <option value="2_mois">2 Mois</option>
                <option value="45j">45 Jours</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Prix (€)</label>
              <input type="number" value={form.prix} onChange={e => setF('prix', e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Date paiement</label>
              <input type="date" value={form.date_paiement} onChange={e => setF('date_paiement', e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Reçu (€)</label>
              <input type="number" value={form.paiement_recu} onChange={e => setF('paiement_recu', e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Restant dû (€)</label>
              <input type="number" value={form.restant_du} onChange={e => setF('restant_du', e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Frais closer (€)</label>
              <input type="number" value={form.frais_closer} onChange={e => setF('frais_closer', e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Net après frais (€)</label>
              <input type="number" value={form.net_apres_frais} onChange={e => setF('net_apres_frais', e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Moyen de paiement</label>
              <input value={form.moyen_paiement} onChange={e => setF('moyen_paiement', e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div className="col-span-2 lg:col-span-4 flex justify-end gap-2 pt-1">
              <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : 'Ajouter'}</Button>
            </div>
          </form>
        </div>
      )}

      {/* Tables groupées par CTA */}
      <div className="space-y-4">
        {grouped.map(({ group, items }) => {
          const isCollapsed = collapsed[group]
          const groupNet = items.reduce((s, e) => s + (Number(e.net_apres_frais) || 0), 0)
          const groupRestant = items.reduce((s, e) => s + (Number(e.restant_du) || 0), 0)
          const colorClass = CTA_COLORS[group] ?? CTA_COLORS['Autre']

          return (
            <div key={group} className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
              {/* Group header */}
              <button
                onClick={() => setCollapsed(c => ({ ...c, [group]: !c[group] }))}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${colorClass}`}>{group}</span>
                  <span className="text-sm text-zinc-400">{items.length} client{items.length > 1 ? 's' : ''}</span>
                  {groupRestant > 0 && (
                    <span className="text-xs text-amber-400 font-medium">{fmt(groupRestant)} en attente</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-white">{fmt(groupNet)} net</span>
                  {isCollapsed ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronUp size={14} className="text-zinc-500" />}
                </div>
              </button>

              {/* Table */}
              {!isCollapsed && (
                <div className="overflow-x-auto border-t border-brand-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-brand-border">
                        {['Client', 'Closer', 'Offre', 'Prix', 'Date', 'Reçu', 'Restant', 'Frais closer', 'Net', 'Paiement', ''].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-zinc-500 font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(e => {
                        const expiry = getExpiryDate(e.offre, e.date_paiement)
                        const isExpired = expiry && differenceInDays(today, expiry) > 0
                        const hasPending = Number(e.restant_du) > 0

                        return (
                          <tr key={e.id} className={`border-b border-brand-border/50 hover:bg-white/5 transition-colors ${isExpired ? 'bg-red-950/10' : hasPending ? 'bg-amber-950/10' : ''}`}>
                            <td className="px-3 py-2.5 font-medium text-white whitespace-nowrap">
                              {e.client_name}
                              {isExpired && <span className="ml-1.5 text-red-400 text-[10px]">⏰ expiré</span>}
                              {hasPending && !isExpired && <span className="ml-1.5 text-amber-400 text-[10px]">💰 en attente</span>}
                            </td>
                            <td className="px-3 py-2.5 text-zinc-400 capitalize">{e.closer ?? '—'}</td>
                            <td className="px-3 py-2.5 text-zinc-300 whitespace-nowrap">{offreLabel(e.offre)}</td>
                            <td className="px-3 py-2.5 text-zinc-300 whitespace-nowrap">{fmt(e.prix)}</td>
                            <td className="px-3 py-2.5 text-zinc-400 whitespace-nowrap">
                              {e.date_paiement ? format(new Date(e.date_paiement), 'dd/MM/yy') : '—'}
                            </td>
                            <td className="px-3 py-2.5 text-emerald-400 font-medium whitespace-nowrap">{fmt(e.paiement_recu)}</td>
                            <td className={`px-3 py-2.5 font-medium whitespace-nowrap ${hasPending ? 'text-amber-400' : 'text-zinc-500'}`}>
                              {Number(e.restant_du) > 0 ? fmt(e.restant_du) : '—'}
                            </td>
                            <td className="px-3 py-2.5 text-zinc-400 whitespace-nowrap">{fmt(e.frais_closer)}</td>
                            <td className="px-3 py-2.5 text-blue-400 font-medium whitespace-nowrap">{fmt(e.net_apres_frais)}</td>
                            <td className="px-3 py-2.5 text-zinc-500 whitespace-nowrap max-w-[120px] truncate">{e.moyen_paiement ?? '—'}</td>
                            <td className="px-3 py-2.5">
                              <button onClick={() => handleDelete(e.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                                <X size={13} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
