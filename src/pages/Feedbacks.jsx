import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { STEPS } from '../lib/constants'
import { MessageSquare, AlertTriangle, HelpCircle, BarChart2, ExternalLink, Check, ChevronRight } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { fr } from 'date-fns/locale'

const TYPE_CONFIG = {
  update:   { label: 'Mise à jour', color: 'text-blue-400',    bg: 'bg-blue-950/20 border-blue-800/30',    icon: BarChart2 },
  block:    { label: 'Bloqué',      color: 'text-red-400',     bg: 'bg-red-950/20 border-red-800/30',      icon: AlertTriangle },
  question: { label: 'Question',    color: 'text-amber-400',   bg: 'bg-amber-950/20 border-amber-800/30',  icon: HelpCircle },
  feedback: { label: 'Feedback',    color: 'text-purple-400',  bg: 'bg-purple-950/20 border-purple-800/30', icon: MessageSquare },
}

export default function Feedbacks() {
  const [messages, setMessages] = useState([])
  const [students, setStudents] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all | unread | block | feedback
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    loadAll()
    const interval = setInterval(loadAll, 30000)

    const channel = supabase
      .channel('feedbacks-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'student_messages' },
        (payload) => setMessages(prev => [payload.new, ...prev])
      )
      .subscribe()

    return () => { clearInterval(interval); supabase.removeChannel(channel) }
  }, [])

  async function loadAll() {
    const [{ data: msgs }, { data: studs }] = await Promise.all([
      supabase.from('student_messages').select('*').order('created_at', { ascending: false }),
      supabase.from('students').select('id, first_name, last_name'),
    ])
    setMessages(msgs ?? [])
    const map = {}
    ;(studs ?? []).forEach(s => { map[s.id] = s })
    setStudents(map)
    setLoading(false)
  }

  async function markRead(id) {
    await supabase.from('student_messages').update({ read_by_coach: true }).eq('id', id)
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read_by_coach: true } : m))
  }

  async function markAllRead() {
    setMarkingAll(true)
    await supabase.from('student_messages').update({ read_by_coach: true }).eq('read_by_coach', false)
    setMessages(prev => prev.map(m => ({ ...m, read_by_coach: true })))
    setMarkingAll(false)
  }

  const filtered = messages.filter(m => {
    if (filter === 'unread') return !m.read_by_coach
    if (filter === 'block') return m.type === 'block'
    if (filter === 'feedback') return m.type === 'feedback'
    return true
  })

  const unreadCount = messages.filter(m => !m.read_by_coach).length
  const blockCount = messages.filter(m => m.type === 'block' && !m.read_by_coach).length

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-white">Feedbacks</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {messages.length} message{messages.length > 1 ? 's' : ''} élèves
            {unreadCount > 0 && <span className="text-brand-red ml-1">· {unreadCount} non lu{unreadCount > 1 ? 's' : ''}</span>}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-surface border border-brand-border text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <Check size={12} />
            {markingAll ? 'Marquage...' : 'Tout marquer lu'}
          </button>
        )}
      </div>

      {/* Stats rapides */}
      {(unreadCount > 0 || blockCount > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Non lus', value: unreadCount, color: 'text-white' },
            { label: 'Bloqués', value: messages.filter(m => m.type === 'block').length, color: 'text-red-400' },
            { label: 'Questions', value: messages.filter(m => m.type === 'question').length, color: 'text-amber-400' },
            { label: 'Feedbacks', value: messages.filter(m => m.type === 'feedback').length, color: 'text-purple-400' },
          ].map(s => (
            <div key={s.label} className="bg-brand-surface border border-brand-border rounded-xl p-3">
              <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtres */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {[
          { value: 'all',      label: 'Tous' },
          { value: 'unread',   label: `Non lus ${unreadCount > 0 ? `(${unreadCount})` : ''}` },
          { value: 'block',    label: '🆘 Bloqués' },
          { value: 'feedback', label: '💬 Feedbacks' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              filter === f.value
                ? 'bg-brand-red text-white'
                : 'bg-brand-surface border border-brand-border text-zinc-400 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare size={32} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">Aucun message pour le moment</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(msg => {
            const student = students[msg.student_id]
            const cfg = TYPE_CONFIG[msg.type] ?? TYPE_CONFIG.update
            const Icon = cfg.icon
            const stepName = msg.step_number ? STEPS[msg.step_number - 1]?.name : null

            return (
              <div
                key={msg.id}
                className={`rounded-xl border p-4 transition-colors ${cfg.bg} ${!msg.read_by_coach ? 'ring-1 ring-white/5' : 'opacity-70'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-brand-red/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-brand-red">
                        {student ? `${student.first_name[0]}${student.last_name[0]}` : '?'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Meta */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Link
                          to={`/students/${msg.student_id}`}
                          className="text-sm font-semibold text-white hover:text-brand-red transition-colors"
                        >
                          {student ? `${student.first_name} ${student.last_name}` : 'Élève inconnu'}
                        </Link>
                        <div className="flex items-center gap-1">
                          <Icon size={11} className={cfg.color} />
                          <span className={`text-[10px] font-bold uppercase ${cfg.color}`}>{cfg.label}</span>
                        </div>
                        {stepName && (
                          <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                            Étape {msg.step_number} — {stepName}
                          </span>
                        )}
                        {!msg.read_by_coach && (
                          <div className="w-2 h-2 rounded-full bg-brand-red" />
                        )}
                      </div>

                      {/* Message */}
                      <p className="text-sm text-zinc-300 leading-relaxed">{msg.message}</p>

                      {/* Liens */}
                      {(msg.link_url || msg.link_url_2) && (
                        <div className="flex flex-col gap-1 mt-2">
                          {msg.link_url && (
                            <a href={msg.link_url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 truncate">
                              <ExternalLink size={11} /> {msg.link_url}
                            </a>
                          )}
                          {msg.link_url_2 && (
                            <a href={msg.link_url_2} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 truncate">
                              <ExternalLink size={11} /> {msg.link_url_2}
                            </a>
                          )}
                        </div>
                      )}

                      {/* Date */}
                      <p className="text-[11px] text-zinc-600 mt-2">
                        {formatDistanceToNow(new Date(msg.created_at), { locale: fr, addSuffix: true })}
                        {' · '}{format(new Date(msg.created_at), "d MMM à HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!msg.read_by_coach && (
                      <button
                        onClick={() => markRead(msg.id)}
                        title="Marquer comme lu"
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-emerald-400 transition-colors"
                      >
                        <Check size={13} />
                      </button>
                    )}
                    <Link
                      to={`/students/${msg.student_id}`}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
                    >
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
