import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, AlertTriangle, Clock, ChevronRight, ExternalLink, Bell } from 'lucide-react'
import { OfferTimer, getEndDate } from '../components/students/OfferTimer'

const RONALDO_PHONE = '33641016134'

function RelanceButton({ firstName }) {
  const message = encodeURIComponent(`Hello, tu peux relancer ${firstName} ça fait 5 jours qu'on a pas échangé`)
  const url = `https://wa.me/${RONALDO_PHONE}?text=${message}`
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      title={`Relancer ${firstName} via WhatsApp`}
      className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors shrink-0"
    >
      <Bell size={14} className="text-amber-400" />
    </a>
  )
}
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { STEPS, INACTIVITY_DAYS } from '../lib/constants'
import { StatusBadge } from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import StudentForm from '../components/students/StudentForm'
import { differenceInDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function Students() {
  const { profile, isAdmin, isCoach, isReadOnly } = useAuth()
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [filterOffre, setFilterOffre] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  async function loadStudents() {
    const query = supabase
      .from('students')
      .select('*, student_steps(*), profiles:coach_id(full_name)')
      .order('created_at', { ascending: false })

    if (!isAdmin) {
      query.eq('coach_id', profile?.id)
    }

    const { data } = await query
    setStudents(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (profile) loadStudents()
  }, [profile])

  function getCurrentStep(steps) {
    const inProgress = steps?.find(s => s.status === 'in_progress')
    if (inProgress) return inProgress.step_number
    const firstTodo = steps?.find(s => s.status === 'todo')
    return firstTodo?.step_number ?? 9
  }

  function isInactive(student) {
    return differenceInDays(new Date(), new Date(student.last_updated_at)) >= INACTIVITY_DAYS
  }

  function hasBlocked(student) {
    return student.student_steps?.some(s => s.status === 'blocked')
  }

  function getProgress(steps) {
    if (!steps?.length) return 0
    const validated = steps.filter(s => s.status === 'validated').length
    return Math.round((validated / 9) * 100)
  }

  const filtered = students.filter(s => {
    if (search) {
      const q = search.toLowerCase()
      const match = s.first_name?.toLowerCase().includes(q) ||
        s.last_name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q)
      if (!match) return false
    }
    if (filterOffre !== 'all' && s.offre !== filterOffre) return false
    if (filterStatus === 'blocked' && !s.student_steps?.some(st => st.status === 'blocked')) return false
    if (filterStatus === 'inactive' && differenceInDays(new Date(), new Date(s.last_updated_at)) < INACTIVITY_DAYS) return false
    if (filterStatus === 'expired') {
      const end = getEndDate(s.offre, s.start_date)
      if (!end || differenceInDays(new Date(), end) < 0) return false
    }
    return true
  })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Élèves</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{students.length} élève{students.length > 1 ? 's' : ''} au total</p>
        </div>
        {isCoach && (
          <Button onClick={() => setShowForm(true)}>
            <Plus size={15} />
            Nouvel élève
          </Button>
        )}
      </div>

      {/* Search + Filtres */}
      <div className="space-y-2 mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un élève..."
            className="w-full bg-brand-surface border border-brand-border rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtre offre */}
          {[
            { value: 'all', label: 'Toutes les offres' },
            { value: '70_jours', label: '60 Jours' },
            { value: '6_mois', label: '6 Mois' },
            { value: '12_mois', label: '12 Mois' },
            { value: 'resultats', label: 'Résultats' },
            { value: 'indetermine', label: 'Indéterminé' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterOffre(opt.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filterOffre === opt.value
                  ? 'bg-brand-red text-white'
                  : 'bg-brand-surface border border-brand-border text-zinc-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <div className="w-px h-4 bg-brand-border mx-1" />
          {/* Filtre statut */}
          {[
            { value: 'all', label: 'Tous' },
            { value: 'blocked', label: '🔴 Bloqués' },
            { value: 'inactive', label: '🟡 Inactifs' },
            { value: 'expired', label: '⏰ Expirés' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filterStatus === opt.value
                  ? 'bg-zinc-700 text-white'
                  : 'bg-brand-surface border border-brand-border text-zinc-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-sm">{search ? 'Aucun résultat' : 'Aucun élève pour le moment'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(student => {
            const currentStep = getCurrentStep(student.student_steps)
            const stepName = STEPS[currentStep - 1]?.name
            const progress = getProgress(student.student_steps)
            const inactive = isInactive(student)
            const blocked = hasBlocked(student)

            return (
              <Link
                key={student.id}
                to={`/students/${student.id}`}
                className="block bg-brand-surface border border-brand-border hover:border-zinc-700 rounded-xl p-4 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-brand-red/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-brand-red">
                      {student.first_name[0]}{student.last_name[0]}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white group-hover:text-brand-red transition-colors">
                        {student.first_name} {student.last_name}
                      </p>
                      {blocked && (
                        <span className="inline-flex items-center gap-1 text-xs text-brand-red">
                          <AlertTriangle size={10} />
                          Bloqué
                        </span>
                      )}
                      {inactive && !blocked && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                          <Clock size={10} />
                          Inactif
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <p className="text-xs text-zinc-500 truncate">
                        Étape {currentStep}/9 — {stepName}
                      </p>
                      {student.offre && (
                        <OfferTimer offre={student.offre} startDate={student.start_date} compact />
                      )}
                      {student.montant_restant > 0 && isAdmin && (
                        <span className="text-xs text-amber-400 font-medium shrink-0">
                          {student.montant_restant}€ restants
                        </span>
                      )}
                      {student.profiles?.full_name && isAdmin && (
                        <p className="text-xs text-zinc-600 shrink-0">
                          Coach : {student.profiles.full_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress + actions */}
                  <div className="hidden sm:flex items-center gap-3 shrink-0">
                    <div className="w-28">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-500">Progression</span>
                        <span className="text-xs font-medium text-zinc-300">{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-red rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <RelanceButton firstName={student.first_name} />
                    <ChevronRight size={15} className="text-zinc-600 group-hover:text-brand-red transition-colors" />
                  </div>
                </div>

                {/* Links row */}
                {(student.shop_url || student.project_url || student.doc_url) && (
                  <div className="flex items-center gap-3 mt-3 pl-14">
                    {student.shop_url && (
                      <a
                        href={student.shop_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
                      >
                        <ExternalLink size={10} />
                        Boutique
                      </a>
                    )}
                    {student.project_url && (
                      <a
                        href={student.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
                      >
                        <ExternalLink size={10} />
                        Projet
                      </a>
                    )}
                    {student.doc_url && (
                      <a
                        href={student.doc_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
                      >
                        <ExternalLink size={10} />
                        Doc
                      </a>
                    )}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {/* Modal nouveau élève */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nouvel élève" size="lg">
        <StudentForm
          onSave={(newStudent) => {
            setStudents(prev => [newStudent, ...prev])
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  )
}
