import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { STEPS, STEP_STATUS } from '../lib/constants'
import {
  Zap, AlertTriangle, ChevronRight, ExternalLink, Timer,
  MessageSquare, CheckCircle2, Send, Loader2,
} from 'lucide-react'
import { differenceInDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getEndDate, OfferBadge } from '../components/students/OfferTimer'
import { StatusBadge } from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input, { Textarea, Select } from '../components/ui/Input'
import DeadlineTimer from '../components/ui/DeadlineTimer'
import {
  getDeadlineState, daysRemaining, progressRatio,
  effectiveDeadline, firstActiveStep,
} from '../lib/deadlines'
import { markStepValidated } from '../lib/stepActions'
import { DEFAULT_STEP_DEADLINES } from '../config/programDefaults'

const STATUS_OPTIONS = [
  { value: 'todo',        label: 'À faire' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'validated',   label: 'Validé' },
  { value: 'blocked',     label: 'Bloqué' },
]

// Sous-composant : Card "EN COURS" — affiche l'étape active (in_progress prioritaire,
// sinon todo) avec son timer. Utilisée en sidebar gauche desktop + en mobile après
// la card identité.
function ActiveStepCard({ steps, programEndDate }) {
  const active = firstActiveStep(steps)
  if (!active) {
    return (
      <div className="bg-brand-surface border border-emerald-800/30 rounded-xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">En cours</p>
        <p className="text-sm text-emerald-400 font-medium">Programme terminé 🎉</p>
      </div>
    )
  }

  const stepDef = STEPS.find(s => s.number === active.step_number)
  const cfg = DEFAULT_STEP_DEADLINES[active.step_number]
  const cfgHasTimer = cfg && cfg.days != null
  const state = getDeadlineState(active, active.step_number, programEndDate)
  const days = daysRemaining(active, active.step_number, programEndDate)
  const ratio = progressRatio(active, active.step_number, programEndDate)
  const deadline = effectiveDeadline(active, active.step_number, programEndDate)

  const styles = {
    safe:    { text: 'text-emerald-400', bar: 'bg-emerald-500' },
    urgent:  { text: 'text-amber-400',   bar: 'bg-amber-500' },
    overdue: { text: 'text-brand-red',   bar: 'bg-brand-red' },
  }
  const s = state ? styles[state] : null

  return (
    <div className="bg-brand-surface border border-emerald-800/30 rounded-xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">En cours</p>
      <p className="text-sm font-bold text-white leading-snug">
        Étape {active.step_number} — {stepDef?.name ?? ''}
      </p>

      {cfgHasTimer && s ? (
        <>
          <div className={`mt-3 flex items-center gap-1.5 text-sm font-semibold ${s.text}`}>
            <Timer size={13} />
            {state === 'overdue'
              ? `${Math.abs(days)} jour${Math.abs(days) > 1 ? 's' : ''} de retard`
              : days === 0
                ? `Échéance aujourd'hui`
                : `${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}`}
          </div>
          <div className="mt-2 h-1 bg-brand-border rounded-full overflow-hidden">
            <div className={`h-full ${s.bar} rounded-full transition-all`}
                 style={{ width: `${Math.min(100, ratio * 100)}%` }} />
          </div>
          {deadline && (
            <p className="text-xs text-zinc-500 mt-2">
              Échéance le {format(deadline, 'd MMM', { locale: fr })}
            </p>
          )}
        </>
      ) : (
        <p className="text-xs text-zinc-500 italic mt-3">Pas de timer — avance à ton rythme</p>
      )}
    </div>
  )
}

// Sous-composant : feedback général. Factorisé pour être rendu en sidebar (compact)
// sur desktop ET en bas du portail (full) sur mobile, avec un seul state partagé.
function FeedbackForm({
  generalMsg, setGeneralMsg, sendingGeneral, sentGeneral, errorGeneral,
  onSubmit, compact = false,
}) {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
      {compact ? (
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Feedback général</p>
      ) : (
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare size={14} className="text-brand-red" />
          <h2 className="text-sm font-bold text-white">Feedback général</h2>
        </div>
      )}

      {sentGeneral ? (
        <div className="flex items-center gap-2 bg-emerald-950/50 border border-emerald-800/40 rounded-lg px-3 py-2">
          <CheckCircle2 size={13} className="text-emerald-400" />
          <p className="text-xs text-emerald-400 font-medium">Feedback envoyé !</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-2">
          {errorGeneral && (
            <div className="flex items-center gap-2 bg-red-950/50 border border-red-800/40 rounded-lg px-3 py-2">
              <AlertTriangle size={13} className="text-red-400" />
              <p className="text-xs text-red-400 font-medium">Erreur d'envoi — réessaie.</p>
            </div>
          )}
          <Textarea
            value={generalMsg}
            onChange={e => setGeneralMsg(e.target.value)}
            placeholder={compact ? "Une question, un retour..." : "Une question, une suggestion, un retour sur ton expérience..."}
            rows={compact ? 3 : 4}
            required
          />
          <Button
            variant="primary"
            type="submit"
            disabled={sendingGeneral || !generalMsg.trim()}
            className="w-full"
          >
            {sendingGeneral ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {sendingGeneral ? 'Envoi...' : 'Envoyer'}
          </Button>
        </form>
      )}
    </div>
  )
}

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
  const [marking, setMarking] = useState({})

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

  async function handleMarkDone(stepNum) {
    setMarking(m => ({ ...m, [stepNum]: true }))
    const { validatedStep, startedStep } = await markStepValidated({
      studentId: data.student.id,
      stepNumber: stepNum,
      by: 'student',
      actorId: null,
      programEndDate: data.student.program_end_date,
    })
    setMarking(m => ({ ...m, [stepNum]: false }))
    setData(prev => {
      if (!prev) return prev
      let nextSteps = prev.steps
      if (validatedStep) nextSteps = nextSteps.map(s => s.step_number === validatedStep.step_number ? validatedStep : s)
      if (startedStep)   nextSteps = nextSteps.map(s => s.step_number === startedStep.step_number   ? startedStep   : s)
      return { ...prev, steps: nextSteps }
    })
    if (startedStep) setExpandedStep(startedStep.step_number)
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
  const validatedCount = steps.filter(s => s.status === 'validated').length
  const progress = steps.length ? Math.round((validatedCount / 9) * 100) : 0
  const endDate = getEndDate(student.offre, student.start_date)
  const daysLeft = endDate ? differenceInDays(endDate, new Date()) : null
  const programDaysLeft = student.program_end_date
    ? differenceInDays(new Date(student.program_end_date), new Date())
    : null
  const countWithLink = steps.filter(s => s.resource_link).length

  const feedbackProps = {
    generalMsg, setGeneralMsg, sendingGeneral, sentGeneral, errorGeneral,
    onSubmit: handleSendGeneral,
  }

  return (
    <div className="min-h-screen bg-brand-dark pb-16">
      {/* Header sticky */}
      <div className="bg-brand-surface border-b border-brand-border px-4 lg:px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center shrink-0">
            <Zap size={14} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white leading-none">FastBrand Club</p>
            <p className="text-xs text-zinc-500 mt-0.5 truncate">Suivi de {student.first_name} {student.last_name}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-bold text-white">{progress}%</p>
            <p className="text-xs text-zinc-600">progression</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-5 lg:pt-6">
        <div className="lg:grid lg:grid-cols-[280px_1fr_280px] xl:grid-cols-[300px_1fr_300px] lg:gap-4 xl:gap-5">

          {/* ============ SIDEBAR GAUCHE — DESKTOP ONLY ============ */}
          <aside className="hidden lg:flex lg:flex-col lg:gap-3 lg:sticky lg:top-6 lg:self-start
                            lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
            {/* Card 1 — Identité */}
            <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-red/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-brand-red">{student.first_name[0]}{student.last_name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{student.first_name} {student.last_name}</p>
                  <p className="text-xs text-zinc-500">Programme 60 jours</p>
                </div>
              </div>
              {programDaysLeft != null && programDaysLeft >= 0 && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                text-xs font-semibold bg-brand-red/15 text-brand-red border border-brand-red/30">
                  <Timer size={11} />
                  {programDaysLeft} jour{programDaysLeft > 1 ? 's' : ''} restant{programDaysLeft > 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Card 2 — Progression */}
            <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Progression</p>
              <p className="text-2xl font-bold text-white leading-none">{progress}%</p>
              <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-brand-red rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-zinc-500 mt-2">{validatedCount} / 9 étapes validées</p>
            </div>

            {/* Card 3 — EN COURS */}
            <ActiveStepCard steps={steps} programEndDate={student.program_end_date} />

          </aside>

          {/* ============ MAIN ============ */}
          <main>
            {/* Identité combinée — MOBILE ONLY (look actuel inchangé) */}
            <div className="lg:hidden mb-5">
              <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-brand-red/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-brand-red">{student.first_name[0]}{student.last_name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{student.first_name} {student.last_name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <OfferBadge offre={student.offre} />
                      {daysLeft !== null && daysLeft >= 0 && (
                        <span className="text-xs font-medium text-emerald-400">
                          {daysLeft}j restants
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
                  <div className="h-full bg-brand-red rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-zinc-600 mt-1.5">Progression du programme · {validatedCount}/9 étapes validées</p>
              </div>
            </div>

            {/* EN COURS — MOBILE ONLY (sidebar gauche en desktop) */}
            <div className="lg:hidden mb-5">
              <ActiveStepCard steps={steps} programEndDate={student.program_end_date} />
            </div>

            {/* Étapes — toujours visible */}
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">
              Les 9 étapes de la méthode
            </h2>
            <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden mb-5">
              {STEPS.map((step, idx) => {
                const stepData = steps.find(s => s.step_number === step.number)
                const status = stepData?.status ?? 'todo'
                const isExpanded = expandedStep === step.number
                const form = getForm(step.number)
                const deadlineState = getDeadlineState(stepData, step.number, student.program_end_date)
                const overdue = deadlineState === 'overdue'
                const overdueDays = overdue ? Math.abs(daysRemaining(stepData, step.number, student.program_end_date) ?? 0) : 0

                return (
                  <div key={step.number} className={idx > 0 ? 'border-t border-brand-border' : ''}>
                    <button
                      onClick={() => setExpandedStep(isExpanded ? null : step.number)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/5 transition-colors"
                    >
                      <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-xs font-bold text-zinc-400">
                        {step.number}
                      </span>
                      <span className="flex-1 text-sm font-medium text-white truncate">{step.name}</span>
                      {overdue && (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-brand-red/15 text-brand-red border border-brand-red/30">
                          <AlertTriangle size={10} />
                          +{overdueDays}j
                        </span>
                      )}
                      <div className="hidden sm:block shrink-0">
                        <StatusBadge status={status} />
                      </div>
                      <div className="sm:hidden flex items-center gap-1.5 shrink-0">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          overdue ? 'bg-brand-red' :
                          status === 'validated' ? 'bg-emerald-400' :
                          status === 'in_progress' ? 'bg-blue-400' :
                          status === 'blocked' ? 'bg-red-500' : 'bg-zinc-500'
                        }`} />
                      </div>
                      <ChevronRight size={14} className={`text-zinc-600 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>

                    {isExpanded && (
                      <form onSubmit={e => handleSave(e, step.number)} className="border-t border-brand-border px-4 pb-4 pt-4 space-y-4 bg-white/5">
                        {overdue && (
                          <div className="flex items-start gap-2 rounded-lg border border-brand-red/40 bg-brand-red/10 px-3 py-2">
                            <AlertTriangle size={13} className="text-brand-red mt-0.5 shrink-0" />
                            <p className="text-xs text-zinc-300 leading-relaxed">
                              Tu as dépassé le délai prévu de <strong className="text-brand-red">{overdueDays} jour{overdueDays > 1 ? 's' : ''}</strong>. Tu peux toujours avancer, mais reprends contact avec ta coach pour rester sur les rails.
                            </p>
                          </div>
                        )}

                        <DeadlineTimer
                          stepNumber={step.number}
                          stepData={stepData}
                          programEndDate={student.program_end_date}
                        />

                        {status !== 'validated' && (
                          <Button
                            variant="primary"
                            type="button"
                            onClick={() => handleMarkDone(step.number)}
                            disabled={marking[step.number]}
                            className="w-full py-3"
                          >
                            {marking[step.number] ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                            Marquer comme terminé
                          </Button>
                        )}

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
                            <Button variant="secondary" type="submit" disabled={saving[step.number]}>
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

            {/* Feedback — MOBILE ONLY */}
            <div className="lg:hidden mb-4">
              <FeedbackForm {...feedbackProps} />
            </div>

            <p className="text-center text-xs text-zinc-700 pb-4">FastBrand Club · Lien personnel — ne pas partager</p>
          </main>

          {/* ============ SIDEBAR DROITE — DESKTOP ONLY ============ */}
          <aside className="hidden lg:flex lg:flex-col lg:gap-3 lg:sticky lg:top-6 lg:self-start
                            lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
            {/* Card — Mes documents */}
            <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Mes documents</p>
                <span className="text-xs font-bold text-brand-red bg-brand-red/15 px-1.5 py-0.5 rounded-full">
                  {countWithLink}/9
                </span>
              </div>
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {STEPS.map(step => {
                  const sd = steps.find(s => s.step_number === step.number)
                  const link = sd?.resource_link
                  const status = sd?.status ?? 'todo'
                  const cfg = STEP_STATUS[status] ?? STEP_STATUS.todo
                  if (link) {
                    return (
                      <a
                        key={step.number}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={link}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${cfg.bg} ${cfg.text}`}>
                          {step.number}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white font-medium truncate">{step.name}</p>
                          <p className="text-xs text-zinc-500 truncate">{link}</p>
                        </div>
                        <ExternalLink size={11} className="text-zinc-500 shrink-0" />
                      </a>
                    )
                  }
                  return (
                    <div key={step.number} className="flex items-center gap-2 px-2 py-1.5 opacity-40">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-zinc-800 text-zinc-500">
                        {step.number}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-400 truncate">{step.name}</p>
                        <p className="text-xs text-zinc-600 italic">Pas encore de lien</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Card — Feedback général (compact) */}
            <FeedbackForm {...feedbackProps} compact />
          </aside>

        </div>
      </div>
    </div>
  )
}
