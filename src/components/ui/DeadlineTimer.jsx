import { Timer, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { DEFAULT_STEP_DEADLINES, hasTimer } from '../../config/programDefaults'
import {
  effectiveDeadline,
  getDeadlineState,
  daysRemaining,
  progressRatio,
} from '../../lib/deadlines'

// Badge + barre de progression temporelle d'une étape.
// Calqué sur OfferTimer pour la cohérence visuelle.
//
// Props :
//   stepNumber       (1..9)
//   stepData         { status, started_at, deadline_at, custom_delay_days }
//   programEndDate   string ISO (pour l'étape 9)
//   compact          true → badge inline ; false → bloc complet
export default function DeadlineTimer({ stepNumber, stepData, programEndDate, compact = false }) {
  const cfg = DEFAULT_STEP_DEADLINES[stepNumber]
  if (!cfg) return null

  // Étapes 1 et 6 (sans timer) : pas d'affichage
  const cfgHasTimer = hasTimer(stepNumber) || cfg.days === 'program_end'
  if (!cfgHasTimer) return null

  if (stepData?.status === 'validated') return null
  if (!stepData?.started_at) return null

  const state = getDeadlineState(stepData, stepNumber, programEndDate)
  if (!state || state === 'completed') return null

  const days = daysRemaining(stepData, stepNumber, programEndDate)
  const ratio = progressRatio(stepData, stepNumber, programEndDate)
  const deadline = effectiveDeadline(stepData, stepNumber, programEndDate)

  const styles = {
    safe:    { border: 'border-emerald-800/40', bg: 'bg-emerald-950/30', text: 'text-emerald-400', bar: 'bg-emerald-500' },
    urgent:  { border: 'border-amber-800/40',   bg: 'bg-amber-950/30',   text: 'text-amber-400',   bar: 'bg-amber-500' },
    overdue: { border: 'border-red-800/60',     bg: 'bg-red-950/30',     text: 'text-brand-red',   bar: 'bg-brand-red' },
  }
  const s = styles[state] ?? styles.safe

  function labelFor(state, days) {
    if (state === 'overdue') {
      const n = Math.abs(days)
      if (days === 0) return 'Échéance aujourd\'hui'
      return `${n} jour${n > 1 ? 's' : ''} de retard`
    }
    if (days === 0) return 'Échéance aujourd\'hui'
    return `${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}`
  }
  const Icon = state === 'overdue' ? AlertCircle : Timer

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${s.bg} ${s.text} ${s.border}`}>
        <Icon size={11} />
        {labelFor(state, days)}
      </span>
    )
  }

  return (
    <div className={`rounded-lg border ${s.border} ${s.bg} p-3 space-y-2`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon size={13} className={s.text} />
          <span className={`text-sm font-semibold ${s.text}`}>{labelFor(state, days)}</span>
        </div>
        {deadline && (
          <span className="text-[10px] text-zinc-500">
            Échéance {format(deadline, 'd MMM', { locale: fr })}
          </span>
        )}
      </div>
      <div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
        <div
          className={`h-full ${s.bar} rounded-full transition-all`}
          style={{ width: `${Math.min(100, ratio * 100)}%` }}
        />
      </div>
    </div>
  )
}
