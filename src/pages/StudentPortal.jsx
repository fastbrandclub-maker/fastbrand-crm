import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { STEPS } from '../lib/constants'
import {
  Zap, AlertTriangle, Loader2, ChevronRight,
  MessageSquare, CheckCircle2, Send
} from 'lucide-react'
import { differenceInDays } from 'date-fns'
import { getEndDate } from '../components/students/OfferTimer'

const STATUS_OPTIONS = [
  { value: 'todo',        label: 'À faire' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'validated',   label: 'Validé' },
  { value: 'blocked',     label: 'Bloqué' },
]

const STATUS_BADGE = {
  todo:        { dot: 'bg-zinc-500',    text: 'text-zinc-400',    label: 'À faire' },
  in_progress: { dot: 'bg-blue-400',    text: 'text-blue-400',    label: 'En cours' },
  validated:   { dot: 'bg-emerald-400', text: 'text-emerald-400', label: 'Validé' },
  blocked:     { dot: 'bg-red-500',     text: 'text-red-400',     label: 'Bloqué' },
}

function offreLabel(o) {
  return { '70_jours': '60 JOURS', '6_mois': '6 MOIS', '12_mois': '12 MOIS', resultats: 'Résultats', indetermine: 'Indéterminé' }[o] ?? o ?? '—'
}

export default function StudentPortal() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [expandedStep, setExpandedStep] = useState(null)
  const [forms, setForms] = useState({}) // { [stepNum]: { status, note, link } }
  const [saving, setSaving] = useState({})
  const [saved, setSaved] = useState({})

  // Feedback général
  const [generalMsg, setGeneralMsg] = useState('')
  const [sendingGeneral, setSendingGeneral] = useState(false)
  const [sentGeneral, setSentGeneral] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: result } = await supabase.rpc('get_portal_data', { p_token: token })
      if (!result) { setNotFound(true); setLoading(false); return }
      setData(result)
      // Init forms from existing step data
      const init = {}
      ;(result.steps ?? []).forEach(s => {
        init[s.step_number] = {
          status: s.status ?? 'todo',
          note: s.student_note ?? '',
          link: s.resource_link ?? '',
        }
      })
      setForms(init)
      setLoading(false)
      // Auto-expand current step
      const current = result.steps?.find(s => s.status === 'in_progress') ?? result.steps?.find(s => s.status === 'todo')
      if (current) setExpandedStep(current.step_number)
    }
    load()
  }, [token])

  function getForm(stepNum) {
    return forms[stepNum] ?? { status: 'todo', note: '', link: '' }
  }

  function patchForm(stepNum, patch) {
    setForms(f => ({ ...f, [stepNum]: { ...getForm(stepNum), ...patch } }))
  }

  async function handleSave(e, stepNum) {
    e.preventDefault()
    setSaving(s => ({ ...s, [stepNum]: true }))
    const form = getForm(stepNum)

    await supabase.rpc('portal_save_step', {
      p_token: token,
      p_step_number: stepNum,
      p_status: form.status,
      p_student_note: form.note || null,
      p_link_url: form.link || null,
    })

    // Update local step status
    setData(prev => ({
      ...prev,
      steps: prev.steps.map(s => s.step_number === stepNum
        ? { ...s, status: form.status, student_note: form.note, resource_link: form.link }
        : s
      )
    }))

    setSaving(s => ({ ...s, [stepNum]: false }))
    setSaved(s => ({ ...s, [stepNum]: true }))
    setTimeout(() => setSaved(s => ({ ...s, [stepNum]: false })), 2500)
  }

  async function handleSendGeneral(e) {
    e.preventDefault()
    if (!generalMsg.trim()) return
    setSendingGeneral(true)
    await supabase.rpc('portal_add_message', {
      p_token: token,
      p_message: generalMsg.trim(),
      p_type: 'feedback',
    })
    setSendingGeneral(false)
    setSentGeneral(true)
    setGeneralMsg('')
    setTimeout(() => setSentGeneral(false), 3000)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <Loader2 size={28} className="text-red-500 animate-spin" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle size={20} className="text-red-500" />
      </div>
      <h1 className="text-lg font-bold text-white mb-2">Lien invalide</h1>
      <p className="text-sm text-zinc-500">Ce lien n'existe pas.<br />Contacte ton coach.</p>
    </div>
  )

  const { student, steps = [] } = data
  const progress = steps.length ? Math.round((steps.filter(s => s.status === 'validated').length / 9) * 100) : 0
  const endDate = getEndDate(student.offre, student.start_date)
  const daysLeft = endDate ? differenceInDays(endDate, new Date()) : null

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-16">
      {/* Header */}
      <div className="bg-[#161616] border-b border-white/8 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center shrink-0">
            <Zap size={14} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white leading-none">FastBrand Club</p>
            <p className="text-[11px] text-zinc-500 mt-0.5 truncate">Suivi de {student.first_name} {student.last_name}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-bold text-white">{progress}%</p>
            <p className="text-[10px] text-zinc-600">progression</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        {/* Infos élève */}
        <div className="bg-[#161616] border border-white/8 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-red-400">{student.first_name[0]}{student.last_name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">{student.first_name} {student.last_name}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[11px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">{offreLabel(student.offre)}</span>
                {daysLeft !== null && (
                  <span className={`text-[11px] font-medium ${daysLeft >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {daysLeft >= 0 ? `${daysLeft}j restants` : `Expiré ${Math.abs(daysLeft)}j`}
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[11px] text-zinc-600 mt-1.5">Progression du programme · {steps.filter(s => s.status === 'validated').length}/9 étapes validées</p>
        </div>

        {/* Étapes */}
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">Les 9 étapes de la méthode</h2>
        <div className="bg-[#161616] border border-white/8 rounded-2xl overflow-hidden mb-5">
          {STEPS.map((step, idx) => {
            const stepData = steps.find(s => s.step_number === step.number)
            const status = stepData?.status ?? 'todo'
            const badge = STATUS_BADGE[status] ?? STATUS_BADGE.todo
            const isExpanded = expandedStep === step.number
            const form = getForm(step.number)

            return (
              <div key={step.number} className={idx > 0 ? 'border-t border-white/5' : ''}>
                {/* Row */}
                <button
                  onClick={() => setExpandedStep(isExpanded ? null : step.number)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/3 transition-colors"
                >
                  <span className="w-5 h-5 rounded-full bg-white/8 flex items-center justify-center shrink-0 text-[10px] font-bold text-zinc-400">
                    {step.number}
                  </span>
                  <span className="flex-1 text-sm font-medium text-white truncate">{step.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    <span className={`text-xs font-medium ${badge.text} hidden sm:block`}>{badge.label}</span>
                  </div>
                  <ChevronRight size={14} className={`text-zinc-600 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>

                {/* Expanded form */}
                {isExpanded && (
                  <form onSubmit={e => handleSave(e, step.number)} className="border-t border-white/5 px-4 pb-4 pt-4 space-y-4 bg-white/2">
                    {/* Statut */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Statut</label>
                      <select
                        value={form.status}
                        onChange={e => patchForm(step.number, { status: e.target.value })}
                        className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2 text-base sm:text-sm text-white focus:outline-none focus:border-white/25 appearance-none"
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Notes</label>
                      <textarea
                        value={form.note}
                        onChange={e => patchForm(step.number, { note: e.target.value })}
                        placeholder="Notes sur cette étape..."
                        rows={3}
                        className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2.5 text-base sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/25 resize-none"
                      />
                    </div>

                    {/* Lien ressource */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Lien ressource</label>
                      <input
                        type="text"
                        value={form.link}
                        onChange={e => patchForm(step.number, { link: e.target.value })}
                        placeholder="https://..."
                        className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2.5 text-base sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/25"
                      />
                    </div>

                    {/* Sauvegarder */}
                    <div className="flex justify-end">
                      {saved[step.number] ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
                          <CheckCircle2 size={15} />
                          Sauvegardé !
                        </div>
                      ) : (
                        <button
                          type="submit"
                          disabled={saving[step.number]}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                          {saving[step.number] ? <Loader2 size={14} className="animate-spin" /> : null}
                          Sauvegarder
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            )
          })}
        </div>

        {/* Feedback général */}
        <div className="bg-[#161616] border border-white/8 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={14} className="text-red-400" />
            <h2 className="text-sm font-bold text-white">Feedback général</h2>
          </div>
          {sentGeneral ? (
            <div className="flex items-center gap-2 bg-emerald-950/50 border border-emerald-800/40 rounded-xl px-4 py-3">
              <CheckCircle2 size={15} className="text-emerald-400" />
              <p className="text-sm text-emerald-400 font-medium">Feedback envoyé !</p>
            </div>
          ) : (
            <form onSubmit={handleSendGeneral} className="space-y-3">
              <textarea
                value={generalMsg}
                onChange={e => setGeneralMsg(e.target.value)}
                placeholder="Une question, une suggestion, un retour sur ton expérience..."
                rows={4}
                required
                className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl px-3 py-2.5 text-base sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/25 resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={sendingGeneral || !generalMsg.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e1e1e] border border-white/15 hover:border-white/25 text-white text-sm font-semibold transition-colors disabled:opacity-40"
                >
                  {sendingGeneral ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {sendingGeneral ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-zinc-700 pb-4">FastBrand Club · Lien personnel — ne pas partager</p>
      </div>
    </div>
  )
}
