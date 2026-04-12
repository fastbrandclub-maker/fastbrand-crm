import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { STEPS, INACTIVITY_DAYS } from '../lib/constants'
import { differenceInDays } from 'date-fns'

function StudentMiniCard({ student }) {
  const isInactive = differenceInDays(new Date(), new Date(student.last_updated_at)) >= INACTIVITY_DAYS
  const isBlocked = student.student_steps?.some(s => s.status === 'blocked')

  return (
    <Link
      to={`/students/${student.id}`}
      className="block bg-brand-surface border border-brand-border hover:border-zinc-700 rounded-lg p-3 transition-colors group"
    >
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-full bg-brand-red/20 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[10px] font-bold text-brand-red">
            {student.first_name[0]}{student.last_name[0]}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white group-hover:text-brand-red transition-colors truncate">
            {student.first_name} {student.last_name}
          </p>
          {student.profiles?.full_name && (
            <p className="text-[10px] text-zinc-600 truncate">{student.profiles.full_name}</p>
          )}
        </div>
      </div>

      {(isBlocked || isInactive) && (
        <div className="flex items-center gap-2 mt-2">
          {isBlocked && (
            <span className="inline-flex items-center gap-1 text-[10px] text-brand-red">
              <AlertTriangle size={9} />
              Bloqué
            </span>
          )}
          {isInactive && !isBlocked && (
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
              <Clock size={9} />
              Inactif
            </span>
          )}
        </div>
      )}
    </Link>
  )
}

function KanbanColumn({ step, students }) {
  return (
    <div className="shrink-0 w-52">
      {/* Column header */}
      <div className="bg-brand-surface border border-brand-border rounded-t-lg px-3 py-2.5 border-b-0">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-brand-red/20 flex items-center justify-center text-[10px] font-bold text-brand-red shrink-0">
            {step.number}
          </span>
          <p className="text-xs font-semibold text-white leading-tight">{step.name}</p>
        </div>
        <p className="text-[10px] text-zinc-600 mt-1 ml-7">
          {students.length} élève{students.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Cards */}
      <div className="bg-brand-dark border border-brand-border border-t-0 rounded-b-lg p-2 space-y-2 min-h-24">
        {students.length === 0 ? (
          <div className="flex items-center justify-center h-16">
            <p className="text-[10px] text-zinc-700">Vide</p>
          </div>
        ) : (
          students.map(s => <StudentMiniCard key={s.id} student={s} />)
        )}
      </div>
    </div>
  )
}

export default function Kanban() {
  const { profile, isAdmin } = useAuth()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const query = supabase
        .from('students')
        .select('*, student_steps(*), profiles:coach_id(full_name)')
        .order('created_at', { ascending: false })

      if (!isAdmin) query.eq('coach_id', profile?.id)

      const { data } = await query
      setStudents(data ?? [])
      setLoading(false)
    }
    if (!profile) return
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [profile, isAdmin])

  function getCurrentStep(steps) {
    const inProgress = steps?.find(s => s.status === 'in_progress')
    if (inProgress) return inProgress.step_number
    const firstTodo = steps?.find(s => s.status === 'todo')
    return firstTodo?.step_number ?? 10 // 10 = terminé
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const completed = students.filter(s => getCurrentStep(s.student_steps) === 10)

  return (
    <div className="p-4 lg:p-6 h-full">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-white">Kanban</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          {students.length} élève{students.length > 1 ? 's' : ''} · Classés par étape en cours
        </p>
      </div>

      {/* Board — horizontal scroll */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {STEPS.map(step => (
            <KanbanColumn
              key={step.number}
              step={step}
              students={students.filter(s => getCurrentStep(s.student_steps) === step.number)}
            />
          ))}

          {/* Completed column */}
          {completed.length > 0 && (
            <div className="shrink-0 w-52">
              <div className="bg-emerald-950/50 border border-emerald-800/40 rounded-t-lg px-3 py-2.5 border-b-0">
                <p className="text-xs font-semibold text-emerald-300">Programme terminé</p>
                <p className="text-[10px] text-emerald-600 mt-1">
                  {completed.length} élève{completed.length > 1 ? 's' : ''}
                </p>
              </div>
              <div className="bg-brand-dark border border-emerald-800/30 border-t-0 rounded-b-lg p-2 space-y-2 min-h-24">
                {completed.map(s => <StudentMiniCard key={s.id} student={s} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
