import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, AlertTriangle, Clock, CheckCircle, ArrowRight, Phone } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { STEPS, INACTIVITY_DAYS } from '../lib/constants'
import { formatDistanceToNow, differenceInDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'

function StatCard({ icon: Icon, label, value, color = 'text-white', sublabel }) {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          {sublabel && <p className="text-xs text-zinc-600 mt-1">{sublabel}</p>}
        </div>
        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
          <Icon size={18} className="text-zinc-400" />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { profile, isAdmin } = useAuth()
  const [students, setStudents] = useState([])
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const query = supabase
        .from('students')
        .select(`*, student_steps(*), profiles:coach_id(full_name)`)
        .order('created_at', { ascending: false })

      if (!isAdmin) {
        query.eq('coach_id', profile?.id)
      }

      const [studentsRes, callsRes] = await Promise.all([
        query,
        supabase
          .from('calls')
          .select('*, students(first_name, last_name)')
          .order('call_date', { ascending: false })
          .limit(5),
      ])

      setStudents(studentsRes.data ?? [])
      setCalls(callsRes.data ?? [])
      setLoading(false)
    }
    if (profile) load()
  }, [profile, isAdmin])

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

  const activeStudents = students.length
  const blockedStudents = students.filter(hasBlocked)
  const inactiveStudents = students.filter(isInactive)
  const validatedAll = students.filter(s =>
    s.student_steps?.every(st => st.status === 'validated')
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Bonjour {profile?.full_name?.split(' ')[0]} — {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Élèves actifs" value={activeStudents} />
        <StatCard
          icon={AlertTriangle}
          label="Élèves bloqués"
          value={blockedStudents.length}
          color={blockedStudents.length > 0 ? 'text-brand-red' : 'text-white'}
        />
        <StatCard
          icon={Clock}
          label="Inactifs +7j"
          value={inactiveStudents.length}
          color={inactiveStudents.length > 0 ? 'text-amber-400' : 'text-white'}
        />
        <StatCard
          icon={CheckCircle}
          label="Programme terminé"
          value={validatedAll.length}
          color="text-emerald-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Alerts */}
        <div className="space-y-3">
          {/* Blocked */}
          {blockedStudents.length > 0 && (
            <div className="bg-brand-surface border border-red-900/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-brand-red" />
                <p className="text-sm font-semibold text-white">Élèves bloqués</p>
              </div>
              <div className="space-y-2">
                {blockedStudents.map(s => (
                  <Link
                    key={s.id}
                    to={`/students/${s.id}`}
                    className="flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-sm font-medium text-white group-hover:text-brand-red transition-colors">
                        {s.first_name} {s.last_name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Étape {getCurrentStep(s.student_steps)} — {STEPS[getCurrentStep(s.student_steps) - 1]?.name}
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-zinc-600 group-hover:text-brand-red transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Inactive */}
          {inactiveStudents.length > 0 && (
            <div className="bg-brand-surface border border-amber-900/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} className="text-amber-400" />
                <p className="text-sm font-semibold text-white">Inactifs depuis +7 jours</p>
              </div>
              <div className="space-y-2">
                {inactiveStudents.map(s => (
                  <Link
                    key={s.id}
                    to={`/students/${s.id}`}
                    className="flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors">
                        {s.first_name} {s.last_name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Dernière activité{' '}
                        {formatDistanceToNow(new Date(s.last_updated_at), { locale: fr, addSuffix: true })}
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-zinc-600 group-hover:text-amber-400 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {blockedStudents.length === 0 && inactiveStudents.length === 0 && (
            <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-400" />
                <p className="text-sm text-zinc-400">Aucune alerte — tout est à jour !</p>
              </div>
            </div>
          )}
        </div>

        {/* Recent calls */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Phone size={14} className="text-zinc-400" />
            <p className="text-sm font-semibold text-white">Derniers calls</p>
          </div>
          {calls.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucun call enregistré.</p>
          ) : (
            <div className="space-y-3">
              {calls.map(call => (
                <div key={call.id} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-red mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">
                        {call.students?.first_name} {call.students?.last_name}
                      </p>
                      {call.duration_minutes && (
                        <span className="text-xs text-zinc-500 shrink-0">{call.duration_minutes} min</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">
                      {format(new Date(call.call_date), 'd MMM yyyy à HH:mm', { locale: fr })}
                    </p>
                    {call.summary && (
                      <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{call.summary}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
