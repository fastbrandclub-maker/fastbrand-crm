import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, AlertTriangle, Clock, CheckCircle, ArrowRight, Phone, MessageSquare, CalendarDays, ShieldAlert, Timer, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { STEPS, INACTIVITY_DAYS, TEAM } from '../lib/constants'
import { formatDistanceToNow, differenceInDays, format, isThisWeek } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getEndDate, OfferBadge } from '../components/students/OfferTimer'

function StatCard({ icon: Icon, label, value, color = 'text-white' }) {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center">
          <Icon size={16} className="text-zinc-400" />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { profile, isAdmin } = useAuth()
  const [students, setStudents] = useState([])
  const [calls, setCalls] = useState([])
  const [feedbacks, setFeedbacks] = useState([])
  const [nextAppt, setNextAppt] = useState(null)
  const [loading, setLoading] = useState(true)

  const firstName = profile?.full_name?.split(' ')[0] ?? profile?.email?.split('@')[0] ?? 'toi'

  useEffect(() => {
    async function load() {
      const studentsQuery = supabase
        .from('students')
        .select('*, student_steps(*), profiles:coach_id(full_name)')
        .order('created_at', { ascending: false })
      if (!isAdmin) studentsQuery.eq('coach_id', profile?.id)

      const callsQuery = supabase
        .from('calls')
        .select('*, students(first_name, last_name, id)')
        .order('call_date', { ascending: false })
        .limit(5)
      if (!isAdmin) callsQuery.eq('coach_id', profile?.id)

      const feedbacksQuery = supabase
        .from('student_messages')
        .select('*, students(first_name, last_name, id)')
        .order('created_at', { ascending: false })
        .limit(6)

      const apptQuery = supabase
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(1)

      const [s, c, f, a] = await Promise.all([studentsQuery, callsQuery, feedbacksQuery, apptQuery])
      setStudents(s.data ?? [])
      setCalls(c.data ?? [])
      setFeedbacks(f.data ?? [])
      setNextAppt(a.data?.[0] ?? null)
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
    return steps?.find(s => s.status === 'todo')?.step_number ?? 9
  }

  function isInactive(student) {
    return differenceInDays(new Date(), new Date(student.last_updated_at)) >= INACTIVITY_DAYS
  }

  function hasBlocked(student) {
    return student.student_steps?.some(s => s.status === 'blocked')
  }

  const [dismissedExpired, setDismissedExpired] = useState(
    () => new Set(JSON.parse(localStorage.getItem('dismissedExpired') ?? '[]'))
  )

  const blockedStudents = students.filter(hasBlocked)
  const inactiveStudents = students.filter(s => isInactive(s) && !hasBlocked(s))
  const litigeStudents = students.filter(s => s.has_litige)
  const callsThisWeek = calls.filter(c => isThisWeek(new Date(c.call_date), { weekStartsOn: 1 }))
  const expiredStudents = students.filter(s => {
    const end = getEndDate(s.offre, s.start_date)
    return end && differenceInDays(new Date(), end) >= 0 && !dismissedExpired.has(s.id)
  })

  function dismissExpired(id) {
    const next = new Set([...dismissedExpired, id])
    setDismissedExpired(next)
    localStorage.setItem('dismissedExpired', JSON.stringify([...next]))
  }

  async function deleteFeedback(id) {
    await supabase.from('student_messages').delete().eq('id', id)
    setFeedbacks(prev => prev.filter(f => f.id !== id))
  }

  async function resolveLitige(student) {
    await supabase.from('students').update({ has_litige: false, litige_description: null }).eq('id', student.id)
    setStudents(prev => prev.map(s => s.id === student.id ? { ...s, has_litige: false, litige_description: null } : s))
  }

  function sendLitigeWA(student) {
    const lilian = TEAM.find(m => m.name === 'Lilian')
    if (!lilian) return
    const msg = encodeURIComponent(`⚠️ Litige signalé pour ${student.first_name} ${student.last_name} — à traiter`)
    window.open(`https://wa.me/${lilian.phone}?text=${msg}`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-white">Bonjour {firstName} 👋</h1>
        <p className="text-sm text-zinc-500 mt-0.5 capitalize">
          {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
        </p>
      </div>

      {/* Litiges */}
      {litigeStudents.length > 0 && (
        <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert size={14} className="text-brand-red" />
            <p className="text-sm font-bold text-brand-red">Litiges en cours</p>
          </div>
          <div className="space-y-2">
            {litigeStudents.map(s => (
              <div key={s.id} className="flex items-start justify-between gap-2">
                <Link to={`/students/${s.id}`} className="text-sm font-medium text-white hover:text-brand-red transition-colors min-w-0">
                  <p className="truncate">{s.first_name} {s.last_name}</p>
                  {s.litige_description && (
                    <p className="text-xs text-zinc-400 font-normal truncate">{s.litige_description}</p>
                  )}
                </Link>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => sendLitigeWA(s)} className="text-xs text-brand-red hover:underline flex items-center gap-1">
                    <Phone size={10} /> <span className="hidden sm:inline">Notifier</span>
                  </button>
                  <button
                    onClick={() => resolveLitige(s)}
                    className="text-xs bg-emerald-900/50 hover:bg-emerald-800/60 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded-md transition-colors whitespace-nowrap"
                  >
                    C'est géré
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accompagnements expirés */}
      {expiredStudents.length > 0 && (
        <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Timer size={14} className="text-brand-red" />
            <p className="text-sm font-bold text-brand-red">Accompagnements expirés ({expiredStudents.length})</p>
          </div>
          <div className="space-y-2">
            {expiredStudents.map(s => {
              const end = getEndDate(s.offre, s.start_date)
              const daysAgo = differenceInDays(new Date(), end)
              return (
                <div key={s.id} className="flex items-center justify-between gap-2">
                  <Link to={`/students/${s.id}`} className="flex items-center gap-2 min-w-0 group flex-1">
                    <OfferBadge offre={s.offre} />
                    <p className="text-sm font-medium text-white group-hover:text-brand-red transition-colors truncate">
                      {s.first_name} {s.last_name}
                    </p>
                  </Link>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-red-400 hidden sm:inline">{daysAgo}j</span>
                    <button
                      onClick={() => dismissExpired(s.id)}
                      className="text-xs bg-emerald-900/50 hover:bg-emerald-800/60 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded-md transition-colors whitespace-nowrap"
                    >
                      C'est géré
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard icon={Users} label="Élèves actifs" value={students.length} />
        <StatCard icon={AlertTriangle} label="Bloqués" value={blockedStudents.length} color={blockedStudents.length > 0 ? 'text-brand-red' : 'text-white'} />
        <StatCard icon={Clock} label="Inactifs +7j" value={inactiveStudents.length} color={inactiveStudents.length > 0 ? 'text-amber-400' : 'text-white'} />
        <StatCard icon={Phone} label="Calls cette semaine" value={callsThisWeek.length} color="text-blue-400" />
      </div>

      {/* Prochain RDV */}
      {nextAppt && (
        <Link to="/calendar" className="flex items-center gap-3 bg-brand-surface border border-brand-border hover:border-zinc-700 rounded-xl p-4 mb-4 transition-colors">
          <div className="w-9 h-9 bg-brand-red/10 rounded-lg flex items-center justify-center shrink-0">
            <CalendarDays size={15} className="text-brand-red" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-500">Prochain RDV</p>
            <p className="text-sm font-semibold text-white truncate">{nextAppt.title}</p>
            <p className="text-xs text-zinc-500 capitalize">
              {format(new Date(nextAppt.event_date), "EEEE d MMM 'à' HH:mm", { locale: fr })}
              {nextAppt.assigned_to && ` · ${nextAppt.assigned_to}`}
            </p>
          </div>
          <ArrowRight size={14} className="text-zinc-600 shrink-0" />
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Alertes */}
        <div className="space-y-3">
          {blockedStudents.length > 0 && (
            <div className="bg-brand-surface border border-red-900/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={13} className="text-brand-red" />
                <p className="text-sm font-semibold text-white">Élèves bloqués</p>
              </div>
              <div className="space-y-2">
                {blockedStudents.map(s => (
                  <Link key={s.id} to={`/students/${s.id}`} className="flex items-center justify-between group">
                    <div>
                      <p className="text-sm font-medium text-white group-hover:text-brand-red transition-colors">{s.first_name} {s.last_name}</p>
                      <p className="text-xs text-zinc-500">Étape {getCurrentStep(s.student_steps)} — {STEPS[getCurrentStep(s.student_steps) - 1]?.name}</p>
                    </div>
                    <ArrowRight size={13} className="text-zinc-600 group-hover:text-brand-red transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {inactiveStudents.length > 0 && (
            <div className="bg-brand-surface border border-amber-900/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={13} className="text-amber-400" />
                <p className="text-sm font-semibold text-white">Inactifs +7j</p>
              </div>
              <p className="text-xs text-zinc-600 mb-3">Aucune mise à jour depuis plus de 7 jours</p>
              <div className="space-y-2">
                {inactiveStudents.map(s => (
                  <Link key={s.id} to={`/students/${s.id}`} className="flex items-center justify-between group">
                    <div>
                      <p className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors">{s.first_name} {s.last_name}</p>
                      <p className="text-xs text-zinc-500">{formatDistanceToNow(new Date(s.last_updated_at), { locale: fr, addSuffix: true })}</p>
                    </div>
                    <ArrowRight size={13} className="text-zinc-600 group-hover:text-amber-400 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {blockedStudents.length === 0 && inactiveStudents.length === 0 && litigeStudents.length === 0 && (
            <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={13} className="text-emerald-400" />
                <p className="text-sm text-zinc-400">Aucune alerte — tout est à jour !</p>
              </div>
            </div>
          )}
        </div>

        {/* Feedbacks + Calls */}
        <div className="space-y-3">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare size={13} className="text-blue-400" />
                <p className="text-sm font-semibold text-white">Feedbacks récents</p>
                {feedbacks.filter(f => !f.read_by_coach).length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-red text-white">
                    {feedbacks.filter(f => !f.read_by_coach).length}
                  </span>
                )}
              </div>
            </div>
            {feedbacks.length === 0 ? (
              <p className="text-xs text-zinc-500">Aucun feedback enregistré.</p>
            ) : (
              <div className="space-y-2">
                {feedbacks.map(fb => (
                  <div key={fb.id} className="flex items-start gap-2 group">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${!fb.read_by_coach ? 'bg-brand-red' : 'bg-zinc-600'}`} />
                    <Link to={`/students/${fb.students?.id}`} className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white hover:text-brand-red transition-colors">
                        {fb.students?.first_name} {fb.students?.last_name}
                        {fb.step_number && <span className="text-zinc-500 font-normal"> · Étape {fb.step_number}</span>}
                      </p>
                      <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">{fb.message}</p>
                    </Link>
                    <button
                      onClick={() => deleteFeedback(fb.id)}
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded text-zinc-600 hover:text-red-400 hover:bg-red-950/30 transition-all shrink-0"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Phone size={13} className="text-zinc-400" />
              <p className="text-sm font-semibold text-white">Derniers calls</p>
            </div>
            {calls.length === 0 ? (
              <p className="text-xs text-zinc-500">Aucun call enregistré.</p>
            ) : (
              <div className="space-y-2">
                {calls.map(call => (
                  <Link key={call.id} to={`/students/${call.students?.id}`} className="block group">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-red shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white group-hover:text-brand-red transition-colors truncate">
                          {call.students?.first_name} {call.students?.last_name}
                          {call.duration_minutes && <span className="text-zinc-500 font-normal ml-1">· {call.duration_minutes} min</span>}
                        </p>
                        <p className="text-xs text-zinc-600">{format(new Date(call.call_date), 'd MMM à HH:mm', { locale: fr })}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
