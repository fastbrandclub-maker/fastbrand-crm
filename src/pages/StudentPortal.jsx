import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { STEPS } from '../lib/constants'
import {
  Zap, CheckCircle2, Circle, AlertTriangle, Clock,
  Send, ChevronDown, ChevronUp, MessageSquare, Loader2,
  Link as LinkIcon, ExternalLink
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getEndDate } from '../components/students/OfferTimer'

const STATUS_CONFIG = {
  todo:        { label: 'À faire',  color: 'text-zinc-500',    bg: 'bg-zinc-800/40',      border: 'border-zinc-700/40' },
  in_progress: { label: 'En cours', color: 'text-blue-400',   bg: 'bg-blue-950/30',      border: 'border-blue-800/40' },
  validated:   { label: 'Validé',   color: 'text-emerald-400', bg: 'bg-emerald-950/30',   border: 'border-emerald-800/40' },
  blocked:     { label: 'Bloqué',   color: 'text-red-400',    bg: 'bg-red-950/30',       border: 'border-red-800/40' },
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
  const [stepForms, setStepForms] = useState({}) // { [stepNumber]: { feedback, link1, link2, status } }
  const [submitting, setSubmitting] = useState({})
  const [submitted, setSubmitted] = useState({})
  const [generalMsg, setGeneralMsg] = useState('')
  const [sendingGeneral, setSendingGeneral] = useState(false)
  const [sentGeneral, setSentGeneral] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: result } = await supabase.rpc('get_portal_data', { p_token: token })
      if (!result) { setNotFound(true); setLoading(false); return }
      setData(result)
      setLoading(false)
      const current = result.steps?.find(s => s.status === 'in_progress') ?? result.steps?.find(s => s.status === 'todo')
      if (current) setExpandedStep(current.step_number)
    }
    load()
  }, [token])

  function getStepForm(stepNum, currentStatus) {
    return stepForms[stepNum] ?? { feedback: '', link1: '', link2: '', status: currentStatus }
  }

  function setStepForm(stepNum, patch) {
    setStepForms(f => ({ ...f, [stepNum]: { ...getStepForm(stepNum, ''), ...patch } }))
  }

  async function handleSubmitStep(e, step, stepData) {
    e.preventDefault()
    const form = getStepForm(step.number, stepData?.status)
    if (!form.feedback.trim()) return
    setSubmitting(s => ({ ...s, [step.number]: true }))

    // Mettre à jour le statut si changé
    if (form.status && form.status !== stepData?.status) {
      await supabase.rpc('portal_update_step_status', {
        p_token: token,
        p_step_number: step.number,
        p_status: form.status,
      })
      setData(prev => ({
        ...prev,
        steps: prev.steps.map(s => s.step_number === step.number ? { ...s, status: form.status } : s)
      }))
    }

    // Envoyer le message + liens
    await supabase.rpc('portal_add_message', {
      p_token: token,
      p_message: form.feedback.trim(),
      p_type: form.status === 'blocked' ? 'block' : 'update',
      p_step_number: step.number,
      p_link_url: form.link1.trim() || null,
      p_link_url_2: form.link2.trim() || null,
    })

    setSubmitting(s => ({ ...s, [step.number]: false }))
    setSubmitted(s => ({ ...s, [step.number]: true }))
    setStepForms(f => ({ ...f, [step.number]: { feedback: '', link1: '', link2: '', status: form.status } }))
    setTimeout(() => setSubmitted(s => ({ ...s, [step.number]: false })), 3000)
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

  const { student, steps = [], messages = [] } = data
  const progress = steps.length ? Math.round((steps.filter(s => s.status === 'validated').length / 9) * 100) : 0
  const endDate = getEndDate(student.offre, student.start_date)
  const daysLeft = endDate ? differenceInDays(endDate, new Date()) : null

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-16">
      {/* Header */}
      <div className="bg-[#161616] border-b border-white/8 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center gap-3">
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

      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* Card élève */}
        <div className="bg-[#161616] border border-white/8 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-red-400">{student.first_name[0]}{student.last_name[0]}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white">{student.first_name} {student.last_name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">{offreLabel(student.offre)}</span>
                {daysLeft !== null && (
                  <span className={`text-[11px] font-medium ${daysLeft >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {daysLeft >= 0 ? `${daysLeft}j restants` : `Expiré ${Math.abs(daysLeft)}j`}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[11px] text-zinc-600 mt-1.5">
            {steps.filter(s => s.status === 'validated').length}/9 étapes validées
          </p>
        </div>

        {/* Étapes */}
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Mes étapes</h2>
        <div className="space-y-2 mb-6">
          {STEPS.map(step => {
            const stepData = steps.find(s => s.step_number === step.number)
            const status = stepData?.status ?? 'todo'
            const cfg = STATUS_CONFIG[status]
            const isExpanded = expandedStep === step.number
            const form = getStepForm(step.number, status)
            const stepMessages = messages?.filter(m => m.step_number === step.number) ?? []

            return (
              <div key={step.number} className={`rounded-xl border transition-all ${cfg.bg} ${cfg.border}`}>
                {/* En-tête étape */}
                <button
                  onClick={() => setExpandedStep(isExpanded ? null : step.number)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  <div className="shrink-0">
                    {status === 'validated' ? (
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    ) : status === 'blocked' ? (
                      <AlertTriangle size={18} className="text-red-400" />
                    ) : status === 'in_progress' ? (
                      <div className="w-[18px] h-[18px] rounded-full border-2 border-blue-400 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                      </div>
                    ) : (
                      <Circle size={18} className="text-zinc-700" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-600">Étape {step.number}</span>
                      <span className={`text-[10px] font-bold uppercase ${cfg.color}`}>{cfg.label}</span>
                      {stepMessages.length > 0 && (
                        <span className="text-[10px] text-zinc-600">{stepMessages.length} envoi{stepMessages.length > 1 ? 's' : ''}</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-white leading-tight mt-0.5 truncate">{step.name}</p>
                  </div>
                  {isExpanded ? <ChevronUp size={14} className="text-zinc-600 shrink-0" /> : <ChevronDown size={14} className="text-zinc-600 shrink-0" />}
                </button>

                {/* Contenu expandé */}
                {isExpanded && (
                  <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-4">

                    {/* Historique des envois */}
                    {stepMessages.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Tes envois précédents</p>
                        {stepMessages.slice(0, 3).map(msg => (
                          <div key={msg.id} className="bg-white/5 rounded-lg p-3 space-y-1.5">
                            <p className="text-xs text-zinc-300">{msg.message}</p>
                            {(msg.link_url || msg.link_url_2) && (
                              <div className="flex flex-col gap-1">
                                {msg.link_url && (
                                  <a href={msg.link_url} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 truncate">
                                    <ExternalLink size={10} />{msg.link_url}
                                  </a>
                                )}
                                {msg.link_url_2 && (
                                  <a href={msg.link_url_2} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 truncate">
                                    <ExternalLink size={10} />{msg.link_url_2}
                                  </a>
                                )}
                              </div>
                            )}
                            <p className="text-[10px] text-zinc-600">{format(new Date(msg.created_at), "d MMM à HH:mm", { locale: fr })}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Formulaire */}
                    {submitted[step.number] ? (
                      <div className="flex items-center gap-2 bg-emerald-950/50 border border-emerald-800/40 rounded-xl px-4 py-3">
                        <CheckCircle2 size={15} className="text-emerald-400" />
                        <p className="text-sm text-emerald-400 font-medium">Envoyé à ton coach !</p>
                      </div>
                    ) : (
                      <form onSubmit={e => handleSubmitStep(e, step, stepData)} className="space-y-3">
                        {/* Statut */}
                        <div>
                          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Où en es-tu ?</p>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { value: 'in_progress', label: '🔵 En cours' },
                              { value: 'validated',   label: '✅ Terminé' },
                              { value: 'blocked',     label: '🆘 Bloqué' },
                            ].map(opt => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setStepForm(step.number, { ...form, status: opt.value })}
                                className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                                  form.status === opt.value
                                    ? opt.value === 'validated' ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                                    : opt.value === 'blocked'   ? 'bg-red-500/20 border-red-500/60 text-red-300'
                                    : 'bg-blue-500/20 border-blue-500/60 text-blue-300'
                                    : 'bg-white/5 border-white/10 text-zinc-500'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Feedback */}
                        <div>
                          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Feedback *</p>
                          <textarea
                            value={form.feedback}
                            onChange={e => setStepForm(step.number, { ...form, feedback: e.target.value })}
                            placeholder={form.status === 'blocked' ? "Décris ce qui te bloque..." : "Décris ton avancement, ce que tu as fait..."}
                            rows={3}
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/25 resize-none"
                          />
                        </div>

                        {/* Liens */}
                        <div className="space-y-2">
                          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Liens (optionnel)</p>
                          <div className="relative">
                            <LinkIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                            <input
                              type="url"
                              value={form.link1}
                              onChange={e => setStepForm(step.number, { ...form, link1: e.target.value })}
                              placeholder="https://... (boutique, doc, fichier...)"
                              className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/25"
                            />
                          </div>
                          <div className="relative">
                            <LinkIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                            <input
                              type="url"
                              value={form.link2}
                              onChange={e => setStepForm(step.number, { ...form, link2: e.target.value })}
                              placeholder="https://... (2ème lien)"
                              className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/25"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={submitting[step.number] || !form.feedback.trim()}
                          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                            submitting[step.number] || !form.feedback.trim()
                              ? 'bg-white/5 text-zinc-500 cursor-not-allowed'
                              : form.status === 'blocked'
                              ? 'bg-red-500 hover:bg-red-600 text-white'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                        >
                          {submitting[step.number] ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                          {submitting[step.number] ? 'Envoi...' : 'Envoyer à mon coach'}
                        </button>
                      </form>
                    )}
                  </div>
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
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/25 resize-none"
              />
              <button
                type="submit"
                disabled={sendingGeneral || !generalMsg.trim()}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                  sendingGeneral || !generalMsg.trim()
                    ? 'bg-white/5 text-zinc-500 cursor-not-allowed'
                    : 'bg-[#1e1e1e] border border-white/15 hover:border-white/25 text-white'
                }`}
              >
                {sendingGeneral ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {sendingGeneral ? 'Envoi...' : 'Envoyer le feedback'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-zinc-700 pb-4">FastBrand Club · Lien personnel — ne pas partager</p>
      </div>
    </div>
  )
}
