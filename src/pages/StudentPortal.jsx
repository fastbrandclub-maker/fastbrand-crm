import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { STEPS } from '../lib/constants'
import { Zap, CheckCircle2, Circle, AlertTriangle, Clock, Send, ChevronDown, ChevronUp, MessageSquare, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getEndDate } from '../components/students/OfferTimer'
import { differenceInDays } from 'date-fns'

const STATUS_CONFIG = {
  todo:        { label: 'À faire',  color: 'text-zinc-500', bg: 'bg-zinc-800/60',    border: 'border-zinc-700/40',    dot: 'bg-zinc-500' },
  in_progress: { label: 'En cours', color: 'text-blue-400', bg: 'bg-blue-950/40',   border: 'border-blue-800/40',    dot: 'bg-blue-400' },
  validated:   { label: 'Validé',   color: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-800/40', dot: 'bg-emerald-400' },
  blocked:     { label: 'Bloqué',   color: 'text-red-400',  bg: 'bg-red-950/40',    border: 'border-red-800/40',     dot: 'bg-red-500' },
}

function offreLabel(offre) {
  const m = { '70_jours': '60 JOURS', '6_mois': '6 MOIS', '12_mois': '12 MOIS', resultats: 'Résultats', indetermine: 'Indéterminé' }
  return m[offre] ?? offre ?? '—'
}

export default function StudentPortal() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [expandedStep, setExpandedStep] = useState(null)
  const [messageText, setMessageText] = useState('')
  const [messageStep, setMessageStep] = useState(null)
  const [messageType, setMessageType] = useState('update')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [showMessageForm, setShowMessageForm] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: result, error } = await supabase.rpc('get_portal_data', { p_token: token })
      if (error || !result) { setNotFound(true); setLoading(false); return }
      setData(result)
      setLoading(false)
      // Auto-expand current step
      const currentStep = result.steps?.find(s => s.status === 'in_progress') ?? result.steps?.find(s => s.status === 'todo')
      if (currentStep) setExpandedStep(currentStep.step_number)
    }
    load()
  }, [token])

  async function handleSend(e) {
    e.preventDefault()
    if (!messageText.trim()) return
    setSending(true)
    await supabase.rpc('portal_add_message', {
      p_token: token,
      p_message: messageText.trim(),
      p_type: messageType,
      p_step_number: messageStep ? parseInt(messageStep) : null,
    })
    setSending(false)
    setSent(true)
    setMessageText('')
    setShowMessageForm(false)
    setTimeout(() => setSent(false), 4000)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <Loader2 size={28} className="text-brand-red animate-spin" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-12 h-12 bg-brand-red/20 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle size={20} className="text-brand-red" />
      </div>
      <h1 className="text-lg font-bold text-white mb-2">Lien invalide</h1>
      <p className="text-sm text-zinc-500">Ce lien de suivi n'existe pas ou a expiré.<br />Contacte ton coach.</p>
    </div>
  )

  const { student, steps = [], messages = [] } = data
  const progress = steps.length ? Math.round((steps.filter(s => s.status === 'validated').length / 9) * 100) : 0
  const endDate = getEndDate(student.offre, student.start_date)
  const daysLeft = endDate ? differenceInDays(endDate, new Date()) : null

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-16">
      {/* Header */}
      <div className="bg-[#161616] border-b border-white/8 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center shrink-0">
            <Zap size={14} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white leading-none">FastBrand Club</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Ton suivi personnalisé</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5">
        {/* Student card */}
        <div className="bg-[#161616] border border-white/8 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full bg-brand-red/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-brand-red">{student.first_name[0]}{student.last_name[0]}</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-white">{student.first_name} {student.last_name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-semibold text-brand-red bg-brand-red/10 px-2 py-0.5 rounded-full">
                  {offreLabel(student.offre)}
                </span>
                {daysLeft !== null && (
                  <span className={`text-[11px] font-medium ${daysLeft >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {daysLeft >= 0 ? `${daysLeft}j restants` : `Expiré depuis ${Math.abs(daysLeft)}j`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-zinc-500">Progression</span>
              <span className="text-xs font-bold text-white">{progress}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-red to-red-400 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-600 mt-1">
              {steps.filter(s => s.status === 'validated').length} étape{steps.filter(s => s.status === 'validated').length > 1 ? 's' : ''} validée{steps.filter(s => s.status === 'validated').length > 1 ? 's' : ''} sur 9
            </p>
          </div>
        </div>

        {/* Steps */}
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Les 9 étapes</h2>
        <div className="space-y-2 mb-5">
          {STEPS.map(step => {
            const stepData = steps.find(s => s.step_number === step.number)
            const status = stepData?.status ?? 'todo'
            const cfg = STATUS_CONFIG[status]
            const isExpanded = expandedStep === step.number
            const isActive = status === 'in_progress' || status === 'blocked'

            return (
              <div key={step.number} className={`rounded-xl border transition-all ${cfg.bg} ${cfg.border} ${isActive ? 'ring-1 ring-white/5' : ''}`}>
                <button
                  onClick={() => setExpandedStep(isExpanded ? null : step.number)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  {/* Status icon */}
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
                      <span className="text-[10px] text-zinc-600 font-medium">Étape {step.number}</span>
                      <span className={`text-[10px] font-semibold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <p className="text-sm font-semibold text-white leading-tight mt-0.5 truncate">{step.name}</p>
                    {stepData?.student_note && !isExpanded && (
                      <p className="text-xs text-zinc-500 mt-0.5 truncate">{stepData.student_note}</p>
                    )}
                  </div>

                  <div className="shrink-0 text-zinc-600">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                    {/* Note de l'élève */}
                    {stepData?.student_note && (
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-[10px] text-zinc-500 mb-1 font-semibold uppercase tracking-wide">Ta dernière mise à jour</p>
                        <p className="text-sm text-zinc-300">{stepData.student_note}</p>
                      </div>
                    )}

                    {/* Messages liés à cette étape */}
                    {messages?.filter(m => m.step_number === step.number).length > 0 && (
                      <div className="space-y-2">
                        {messages.filter(m => m.step_number === step.number).slice(0, 3).map(msg => (
                          <div key={msg.id} className="bg-white/5 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-1.5 h-1.5 rounded-full ${msg.type === 'block' ? 'bg-red-400' : 'bg-blue-400'}`} />
                              <p className="text-[10px] text-zinc-500">{format(new Date(msg.created_at), "d MMM à HH:mm", { locale: fr })}</p>
                            </div>
                            <p className="text-xs text-zinc-300">{msg.message}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bouton envoyer un message pour cette étape */}
                    {status !== 'validated' && (
                      <button
                        onClick={() => { setMessageStep(step.number.toString()); setMessageType('update'); setShowMessageForm(true) }}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-white/10 text-xs text-zinc-400 hover:text-white hover:border-white/20 transition-colors"
                      >
                        <MessageSquare size={12} />
                        Envoyer une mise à jour sur cette étape
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Message général */}
        <div className="bg-[#161616] border border-white/8 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={14} className="text-brand-red" />
            <h2 className="text-sm font-bold text-white">Envoyer un message à ton coach</h2>
          </div>

          {sent && (
            <div className="flex items-center gap-2 bg-emerald-950/50 border border-emerald-800/40 rounded-lg px-3 py-2 mb-3">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <p className="text-xs text-emerald-400 font-medium">Message envoyé ! Ton coach sera notifié.</p>
            </div>
          )}

          {!showMessageForm ? (
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'update', label: '📊 Mise à jour', desc: 'Partager mon avancement' },
                { type: 'block',  label: '🆘 Je suis bloqué', desc: 'Besoin d\'aide urgente' },
                { type: 'question', label: '❓ Question', desc: 'Poser une question' },
              ].map(opt => (
                <button
                  key={opt.type}
                  onClick={() => { setMessageType(opt.type); setMessageStep(null); setShowMessageForm(true) }}
                  className="flex flex-col items-center text-center gap-1 py-3 px-2 rounded-xl border border-white/8 bg-white/3 hover:bg-white/8 hover:border-white/15 transition-colors"
                >
                  <span className="text-lg">{opt.label.split(' ')[0]}</span>
                  <span className="text-[11px] font-semibold text-white leading-tight">{opt.label.split(' ').slice(1).join(' ')}</span>
                  <span className="text-[10px] text-zinc-600 leading-tight">{opt.desc}</span>
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${messageType === 'block' ? 'bg-red-400' : messageType === 'question' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                <span className="text-xs font-semibold text-zinc-400">
                  {messageType === 'update' ? 'Mise à jour' : messageType === 'block' ? '🆘 Bloqué' : '❓ Question'}
                  {messageStep && ` — Étape ${messageStep}`}
                </span>
                <button type="button" onClick={() => setShowMessageForm(false)} className="ml-auto text-xs text-zinc-600 hover:text-zinc-400">Annuler</button>
              </div>

              {!messageStep && (
                <select
                  value={messageStep ?? ''}
                  onChange={e => setMessageStep(e.target.value || null)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="">— Étape concernée (optionnel) —</option>
                  {STEPS.map(s => <option key={s.number} value={s.number}>{s.number}. {s.name}</option>)}
                </select>
              )}

              <textarea
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                placeholder={messageType === 'block' ? 'Décris ce qui te bloque...' : messageType === 'question' ? 'Ta question...' : 'Décris ton avancement...'}
                rows={4}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 resize-none"
              />
              <button
                type="submit"
                disabled={sending || !messageText.trim()}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                  sending || !messageText.trim()
                    ? 'bg-white/5 text-zinc-500 cursor-not-allowed'
                    : messageType === 'block'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-brand-red hover:bg-red-700 text-white'
                }`}
              >
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {sending ? 'Envoi...' : 'Envoyer'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-zinc-700 pb-4">
          FastBrand Club · Ce lien est personnel, ne le partage pas
        </p>
      </div>
    </div>
  )
}
