import { differenceInDays, addDays, addMonths, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Timer } from 'lucide-react'

export const OFFERS = {
  '70_jours':    { label: '60 Jours',     bg: 'bg-blue-950',    text: 'text-blue-300' },
  '6_mois':      { label: '6 Mois',       bg: 'bg-purple-950',  text: 'text-purple-300' },
  '12_mois':     { label: '12 Mois',      bg: 'bg-indigo-950',  text: 'text-indigo-300' },
  'resultats':   { label: 'Résultats',    bg: 'bg-emerald-950', text: 'text-emerald-300' },
  'indetermine': { label: 'Indéterminé',  bg: 'bg-zinc-800',    text: 'text-zinc-400' },
}

export function getEndDate(offre, startDate) {
  if (!startDate) return null
  const start = new Date(startDate)
  if (offre === '70_jours') return addDays(start, 70)
  if (offre === '6_mois')   return addMonths(start, 6)
  if (offre === '12_mois')  return addMonths(start, 12)
  return null
}

export function OfferBadge({ offre }) {
  const config = OFFERS[offre] ?? OFFERS.indetermine
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  )
}

export function OfferTimer({ offre, startDate, compact = false }) {
  const config = OFFERS[offre] ?? OFFERS.indetermine
  const endDate = getEndDate(offre, startDate)

  if (!endDate) {
    return <OfferBadge offre={offre} />
  }

  const daysLeft = differenceInDays(endDate, new Date())
  const expired = daysLeft < 0
  const urgent = !expired && daysLeft <= 30
  const endStr = format(endDate, 'd MMM yyyy', { locale: fr })

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <OfferBadge offre={offre} />
        <span className={`text-xs font-semibold ${
          expired ? 'text-red-400' : urgent ? 'text-amber-400' : 'text-zinc-400'
        }`}>
          {expired
            ? `⚠️ Expiré le ${endStr}`
            : `${daysLeft}j restants`}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
      expired ? 'bg-red-950/40 border border-red-800/50' :
      urgent  ? 'bg-amber-950/40 border border-amber-800/40' :
                'bg-brand-surface border border-brand-border'
    }`}>
      <Timer size={13} className={expired ? 'text-red-400' : urgent ? 'text-amber-400' : 'text-zinc-400'} />
      <div>
        <p className={`text-xs font-bold ${expired ? 'text-red-400' : urgent ? 'text-amber-400' : 'text-white'}`}>
          {expired ? `⚠️ Accompagnement expiré` : `${daysLeft} jours restants`}
        </p>
        <p className="text-[10px] text-zinc-500">
          {config.label} · Fin le {endStr}
        </p>
      </div>
    </div>
  )
}
