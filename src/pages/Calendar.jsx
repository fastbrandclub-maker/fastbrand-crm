import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Phone, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, isSameMonth } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function Calendar() {
  const { profile, isAdmin } = useAuth()
  const [calls, setCalls] = useState([])
  const [appointments, setAppointments] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const query = supabase
        .from('calls')
        .select('*, students(first_name, last_name, id), profiles:coach_id(full_name)')
        .not('next_appointment', 'is', null)
        .order('next_appointment', { ascending: true })

      if (!isAdmin) query.eq('coach_id', profile?.id)

      const { data } = await query
      setAppointments(data ?? [])

      const callsQuery = supabase
        .from('calls')
        .select('*, students(first_name, last_name, id), profiles:coach_id(full_name)')
        .order('call_date', { ascending: false })
        .limit(20)

      if (!isAdmin) callsQuery.eq('coach_id', profile?.id)

      const { data: callsData } = await callsQuery
      setCalls(callsData ?? [])
      setLoading(false)
    }
    if (profile) load()
  }, [profile, isAdmin])

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  const startPadding = startOfMonth(currentMonth).getDay()
  const adjustedPadding = startPadding === 0 ? 6 : startPadding - 1

  function getDayAppointments(day) {
    return appointments.filter(a => isSameDay(new Date(a.next_appointment), day))
  }

  function getSelectedDayEvents() {
    return appointments.filter(a => isSameDay(new Date(a.next_appointment), selectedDay))
  }

  const upcomingAppointments = appointments.filter(
    a => new Date(a.next_appointment) >= new Date()
  ).slice(0, 10)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Calendrier</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Prochains RDV et historique des calls</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendrier */}
        <div className="lg:col-span-2 bg-brand-surface border border-brand-border rounded-xl p-5">
          {/* Navigation mois */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(m => subMonths(m, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-sm font-semibold text-white capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </h2>
            <button
              onClick={() => setCurrentMonth(m => addMonths(m, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 mb-2">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
              <div key={d} className="text-center text-xs text-zinc-600 font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Grille */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: adjustedPadding }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {days.map(day => {
              const dayAppts = getDayAppointments(day)
              const isSelected = isSameDay(day, selectedDay)
              const isCurrentDay = isToday(day)

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                    isSelected
                      ? 'bg-brand-red text-white'
                      : isCurrentDay
                      ? 'bg-white/10 text-white'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-medium">{format(day, 'd')}</span>
                  {dayAppts.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayAppts.slice(0, 3).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-brand-red'}`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Événements du jour sélectionné */}
          {getSelectedDayEvents().length > 0 && (
            <div className="mt-4 pt-4 border-t border-brand-border">
              <p className="text-xs font-medium text-zinc-400 mb-3 capitalize">
                {format(selectedDay, 'EEEE d MMMM', { locale: fr })}
              </p>
              <div className="space-y-2">
                {getSelectedDayEvents().map(appt => (
                  <Link
                    key={appt.id}
                    to={`/students/${appt.students?.id}`}
                    className="flex items-center gap-3 p-2 bg-brand-dark rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-red/20 flex items-center justify-center shrink-0">
                      <Phone size={12} className="text-brand-red" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {appt.students?.first_name} {appt.students?.last_name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {format(new Date(appt.next_appointment), 'HH:mm', { locale: fr })}
                        {appt.profiles?.full_name && ` · ${appt.profiles.full_name}`}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Prochains RDV */}
        <div className="space-y-4">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={13} className="text-brand-red" />
              <h2 className="text-sm font-semibold text-white">Prochains RDV</h2>
            </div>

            {loading ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <p className="text-xs text-zinc-500">Aucun RDV planifié.</p>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map(appt => (
                  <Link
                    key={appt.id}
                    to={`/students/${appt.students?.id}`}
                    className="block group"
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-red mt-1.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-brand-red transition-colors">
                          {appt.students?.first_name} {appt.students?.last_name}
                        </p>
                        <p className="text-xs text-zinc-500 capitalize">
                          {format(new Date(appt.next_appointment), 'EEEE d MMM à HH:mm', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Derniers calls */}
          <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Phone size={13} className="text-zinc-400" />
              <h2 className="text-sm font-semibold text-white">Derniers calls</h2>
            </div>
            {calls.length === 0 ? (
              <p className="text-xs text-zinc-500">Aucun call.</p>
            ) : (
              <div className="space-y-3">
                {calls.slice(0, 8).map(call => (
                  <Link key={call.id} to={`/students/${call.students?.id}`} className="block group">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-white group-hover:text-brand-red transition-colors">
                          {call.students?.first_name} {call.students?.last_name}
                        </p>
                        <p className="text-xs text-zinc-600">
                          {format(new Date(call.call_date), 'd MMM à HH:mm', { locale: fr })}
                          {call.duration_minutes && ` · ${call.duration_minutes} min`}
                        </p>
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
