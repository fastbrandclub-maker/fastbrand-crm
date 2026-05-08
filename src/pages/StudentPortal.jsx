import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { STEPS } from '../lib/constants'
import {
  Zap, AlertTriangle, ChevronRight,
  MessageSquare, CheckCircle2, Send, Loader2,
} from 'lucide-react'
import { differenceInDays } from 'date-fns'
import { getEndDate, OfferBadge } from '../components/students/OfferTimer'
import { StatusBadge } from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input, { Textarea, Select } from '../components/ui/Input'

const STATUS_OPTIONS = [
  { value: 'todo',        label: 'À faire' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'validated',   label: 'Validé' },
  { value: 'blocked',     label: 'Bloqué' },
]

export default function StudentPortal() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [expandedStep, setExpandedStep] = useState(null)
  const [forms, setForms] = useState({})
  const [saving, setSaving] = useState({})
  const [saved, setSaved] = useState({})
  const [generalMsg, setGeneralMsg] = useState('')
  const [sendingGeneral, setSendingGeneral] = useState(false)
  const [sentGeneral, setSentGeneral] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: result } = await supabase.rpc('get_portal_data', { p_token: token })
      if (!result) { setNotFound(true); setLoading(false); return }
      setData(result)
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
    const studentId = data.student.id

    await supabase.from('student_steps').update({
      status: form.status,
      student_note: form.note || null,
      resource_link: form.link || null,
      updated_at: new Date().toISOString(),
    }).eq('student_id', studentId).eq('step_number', stepNum)

    const noteText = form.note.trim() || `Statut mis à jour : ${STATUS_OPTIONS.find(o => o.value === form.status)?.label ?? form.status}`
    await supabase.from('student_messages').insert({
      student_id: studentId,
      step_number: stepNum,
      message: noteText,
      type: form.status === 'blocked' ? 'block' : 'update',
      link_url: form.link || null,
    })

    await supabase.from('students').update({ last_updated_at: new Date().toISOString() }).eq('id', studentId)

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
    setErrorGeneral(false)

    const { error } = await supabase.from('student_messages').insert({
      student_id: data.student.id,
      message: generalMsg.trim(),
      type: 'feedback',
    })

    setSendingGeneral(false)
    if (error) { setErrorGeneral(true); return }
    setSentGeneral(true)
    setGeneralMsg('')
    setTimeout(() => setSentGeneral(false), 3000)
  }

  if (loading) return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center px-6 text-center">
      <div className="w-12 h-12 bg-brand-red/20 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle size={20} className="text-brand-red" />
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
    <div className="min-h-screen bg-brand-dark pb-16">
      {/* Header sticky */}
      <div className="bg-brand-surface border-b border-brand-border px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center shrink-0">
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
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 mb-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-brand-red/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-brand-red">{student.first_name[0]}{student.last_name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">{student.first_name} {student.last_name}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <OfferBadge offre={student.offre} />
                {daysLeft !== null && daysLeft >= 0 && (
                  <span className="text-[11px] font-medium text-emerald-400">
                    {daysLeft}j restants
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
            <div className="h-full bg-brand-red rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[11px] text-zinc-600 mt-1.5">Progression du programme · {steps.filter(s => s.status === 'validated').length}/9 étapes validées</p>
        </div>

        {/* Étapes */}
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">Les 9 étapes de la méthode</h2>
        <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden mb-5">
          {STEPS.map((step, idx) => {
            const stepData = steps.find(s => s.step_number === step.number)
            const status = stepData?.status ?? 'todo'
            const isExpanded = expandedStep === step.number
            const form = getForm(step.number)

            return (
              <div key={step.number} className={idx > 0 ? 'border-t border-brand-border' : ''}>
                <button
                  onClick={() => setExpandedStep(isExpanded ? null : step.number)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-zinc-400">
                    {step.number}
                  </span>
                  <span className="flex-1 text-sm font-medium text-white truncate">{step.name}</span>
                  <div className="hidden sm:block shrink-0">
                    <StatusBadge status={status} />
                  </div>
                  <div className="sm:hidden flex items-center gap-1.5 shrink-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      status === 'validated' ? 'bg-emerald-400' :
                      status === 'in_progress' ? 'bg-blue-400' :
                      status === 'blocked' ? 'bg-red-500' : 'bg-zinc-500'
                    }`} />
                  </div>
                  <ChevronRight size={14} className={`text-zinc-600 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>

                {isExpanded && (
                  <form onSubmit={e => handleSave(e, step.number)} className="border-t border-brand-border px-4 pb-4 pt-4 space-y-4 bg-white/5">
                    <Select
                      label="Statut"
                      value={form.status}
                      onChange={e => patchForm(step.number, { status: e.target.value })}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </Select>

                    <Textarea
                      label="Notes"
                      value={form.note}
                      onChange={e => patchForm(step.number, { note: e.target.value })}
                      placeholder="Notes sur cette étape..."
                      rows={3}
                    />

                    <Input
                      label="Lien ressource"
                      value={form.link}
                      onChange={e => patchForm(step.number, { link: e.target.value })}
                      placeholder="https://..."
                    />

                    <div className="flex justify-end">
                      {saved[step.number] ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
                          <CheckCircle2 size={15} />Sauvegardé !
                        </div>
                      ) : (
                        <Button type="submit" disabled={saving[step.number]}>
                          {saving[step.number] && <Loader2 size={14} className="animate-spin" />}
                          Sauvegarder
                        </Button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            )
          })}
        </div>

        {/* Feedback général */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={14} className="text-brand-red" />
            <h2 className="text-sm font-bold text-white">Feedback général</h2>
          </div>
          {sentGeneral ? (
            <div className="flex items-center gap-2 bg-emerald-950/50 border border-emerald-800/40 rounded-xl px-4 py-3">
              <CheckCircle2 size={15} className="text-emerald-400" />
              <p className="text-sm text-emerald-400 font-medium">Feedback envoyé !</p>
            </div>
          ) : (
            <form onSubmit={handleSendGeneral} className="space-y-3">
              {errorGeneral && (
                <div className="flex items-center gap-2 bg-red-950/50 border border-red-800/40 rounded-xl px-4 py-3">
                  <AlertTriangle size={15} className="text-red-400" />
                  <p className="text-sm text-red-400 font-medium">Erreur d'envoi — réessaie.</p>
                </div>
              )}
              <Textarea
                value={generalMsg}
                onChange={e => setGeneralMsg(e.target.value)}
                placeholder="Une question, une suggestion, un retour sur ton expérience..."
                rows={4}
                required
              />
              <div className="flex justify-end">
                <Button variant="secondary" type="submit" disabled={sendingGeneral || !generalMsg.trim()}>
                  {sendingGeneral ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {sendingGeneral ? 'Envoi...' : 'Envoyer'}
                </Button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-zinc-700 pb-4">FastBrand Club · Lien personnel — ne pas partager</p>
      </div>
    </div>
  )
}
