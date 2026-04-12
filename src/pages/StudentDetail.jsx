import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Edit,
  Phone,
  Plus,
  Trash2,
  ExternalLink,
  StickyNote,
  ChevronLeft,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { STEPS, TEAM } from '../lib/constants'
import StepCard from '../components/students/StepCard'
import CallForm from '../components/students/CallForm'
import { OfferTimer } from '../components/students/OfferTimer'
import StudentForm from '../components/students/StudentForm'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { Textarea } from '../components/ui/Input'
import { Select } from '../components/ui/Input'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile, isAdmin, isCoach, isReadOnly } = useAuth()

  const [student, setStudent] = useState(null)
  const [steps, setSteps] = useState([])
  const [calls, setCalls] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  const [showEditStudent, setShowEditStudent] = useState(false)
  const [showAddCall, setShowAddCall] = useState(false)
  const [showAddNote, setShowAddNote] = useState(false)
  const [showLitige, setShowLitige] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteStep, setNoteStep] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [litigeText, setLitigeText] = useState('')
  const [savingLitige, setSavingLitige] = useState(false)

  async function handleLitige() {
    setSavingLitige(true)
    const newLitige = !student.has_litige
    await supabase
      .from('students')
      .update({ has_litige: newLitige, litige_description: newLitige ? litigeText : null })
      .eq('id', id)
    setStudent(prev => ({ ...prev, has_litige: newLitige, litige_description: newLitige ? litigeText : null }))
    setSavingLitige(false)
    setShowLitige(false)

    if (newLitige) {
      const lilian = TEAM.find(m => m.name === 'Lilian')
      if (lilian) {
        const msg = encodeURIComponent(`⚠️ Litige signalé pour ${student.first_name} ${student.last_name}${litigeText ? ` : ${litigeText}` : ''} — à traiter`)
        window.open(`https://wa.me/${lilian.phone}?text=${msg}`, '_blank')
      }
    }
  }

  async function loadData() {
    const [studentRes, stepsRes, callsRes, notesRes] = await Promise.all([
      supabase
        .from('students')
        .select('*, profiles:coach_id(full_name)')
        .eq('id', id)
        .single(),
      supabase
        .from('student_steps')
        .select('*')
        .eq('student_id', id)
        .order('step_number'),
      supabase
        .from('calls')
        .select('*, profiles:coach_id(full_name)')
        .eq('student_id', id)
        .order('call_date', { ascending: false }),
      supabase
        .from('improvement_notes')
        .select('*, profiles:author_id(full_name)')
        .eq('student_id', id)
        .order('created_at', { ascending: false }),
    ])

    setStudent(studentRes.data)
    setSteps(stepsRes.data ?? [])
    setCalls(callsRes.data ?? [])
    setNotes(notesRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [id])

  function handleStepUpdate(updated) {
    setSteps(prev => prev.map(s =>
      s.step_number === updated.step_number ? updated : s
    ))
  }

  async function handleAddNote() {
    setSavingNote(true)
    const { data } = await supabase
      .from('improvement_notes')
      .insert({
        student_id: id,
        note: noteText,
        step_number: noteStep ? parseInt(noteStep) : null,
        author_id: profile?.id,
      })
      .select('*, profiles:author_id(full_name)')
      .single()

    setSavingNote(false)
    if (data) {
      setNotes(prev => [data, ...prev])
      setNoteText('')
      setNoteStep('')
      setShowAddNote(false)
    }
  }

  async function handleDeleteNote(noteId) {
    await supabase.from('improvement_notes').delete().eq('id', noteId)
    setNotes(prev => prev.filter(n => n.id !== noteId))
  }

  async function handleDeleteCall(callId) {
    await supabase.from('calls').delete().eq('id', callId)
    setCalls(prev => prev.filter(c => c.id !== callId))
  }

  function getProgress() {
    if (!steps.length) return 0
    return Math.round((steps.filter(s => s.status === 'validated').length / 9) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="p-6 text-center">
        <p className="text-zinc-500">Élève introuvable.</p>
        <Link to="/students" className="text-brand-red text-sm mt-2 inline-block">← Retour</Link>
      </div>
    )
  }

  const progress = getProgress()

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back */}
      <Link
        to="/students"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white transition-colors mb-4"
      >
        <ChevronLeft size={14} />
        Retour aux élèves
      </Link>

      {/* Student header */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-red/20 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-brand-red">
                {student.first_name[0]}{student.last_name[0]}
              </span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">
                {student.first_name} {student.last_name}
              </h1>
              <p className="text-sm text-zinc-500">{student.email}</p>
              {student.phone && (
                <p className="text-sm text-zinc-500">{student.phone}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isCoach && (
              <Button variant="secondary" size="sm" onClick={() => setShowEditStudent(true)}>
                <Edit size={13} />
                Modifier
              </Button>
            )}
            {isCoach && (
              <Button
                size="sm"
                variant={student.has_litige ? 'danger' : 'secondary'}
                onClick={() => student.has_litige ? handleLitige() : setShowLitige(true)}
              >
                {student.has_litige ? <><ShieldCheck size={13} /> Résoudre litige</> : <><ShieldAlert size={13} /> Signaler litige</>}
              </Button>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-brand-border">
          <div>
            <p className="text-xs text-zinc-500">Démarrage</p>
            <p className="text-sm text-white font-medium">
              {format(new Date(student.start_date), 'd MMM yyyy', { locale: fr })}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Coach</p>
            <p className="text-sm text-white font-medium">
              {student.profiles?.full_name ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Calls effectués</p>
            <p className="text-sm text-white font-medium">{calls.length}</p>
          </div>
          {isAdmin && (
            <div>
              <p className="text-xs text-zinc-500">Montant</p>
              <p className="text-sm text-white font-medium">
                {student.montant_collecte ?? 0}€
                {student.montant_restant > 0 && (
                  <span className="text-amber-400 text-xs ml-1">({student.montant_restant}€ restants)</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Offre + Timer */}
        {student.offre && (
          <div className="mt-4 pt-4 border-t border-brand-border">
            <OfferTimer offre={student.offre} startDate={student.start_date} />
          </div>
        )}

        {/* Progress */}
        <div className="mt-3 pt-3 border-t border-brand-border">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-zinc-500">Progression du programme</p>
            <span className="text-xs font-medium text-white">{progress}%</span>
          </div>
          <div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
            <div className="h-full bg-brand-red rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Links */}
        {(student.shop_url || student.project_url || student.doc_url) && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-brand-border flex-wrap">
            {student.shop_url && (
              <a href={student.shop_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">
                <ExternalLink size={12} /> Boutique
              </a>
            )}
            {student.project_url && (
              <a href={student.project_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">
                <ExternalLink size={12} /> Projet / Drive
              </a>
            )}
            {student.doc_url && (
              <a href={student.doc_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">
                <ExternalLink size={12} /> Documentation
              </a>
            )}
          </div>
        )}

        {student.general_notes && (
          <div className="mt-4 pt-4 border-t border-brand-border">
            <p className="text-xs text-zinc-500 mb-1">Notes générales</p>
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{student.general_notes}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Steps — left 2/3 */}
        <div className="lg:col-span-2 space-y-2">
          <h2 className="text-sm font-semibold text-white mb-3">Les 9 étapes de la méthode</h2>
          {STEPS.map(step => (
            <StepCard
              key={step.number}
              step={step}
              stepData={steps.find(s => s.step_number === step.number)}
              studentId={id}
              readOnly={isReadOnly}
              onUpdate={handleStepUpdate}
            />
          ))}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Calls */}
          <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-zinc-400" />
                <h2 className="text-sm font-semibold text-white">Calls ({calls.length})</h2>
              </div>
              {isCoach && (
                <button
                  onClick={() => setShowAddCall(true)}
                  className="w-6 h-6 flex items-center justify-center rounded-md bg-brand-red hover:bg-red-700 transition-colors"
                >
                  <Plus size={12} className="text-white" />
                </button>
              )}
            </div>

            {calls.length === 0 ? (
              <p className="text-xs text-zinc-500">Aucun call enregistré.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {calls.map(call => (
                  <div key={call.id} className="group relative">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-red mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white">
                          {format(new Date(call.call_date), 'd MMM yyyy à HH:mm', { locale: fr })}
                          {call.duration_minutes && (
                            <span className="text-zinc-500 font-normal ml-1.5">· {call.duration_minutes} min</span>
                          )}
                        </p>
                        {call.summary && (
                          <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{call.summary}</p>
                        )}
                        {call.next_appointment && (
                          <p className="text-xs text-emerald-400 mt-0.5">
                            Prochain RDV : {format(new Date(call.next_appointment), 'd MMM à HH:mm', { locale: fr })}
                          </p>
                        )}
                      </div>
                      {isCoach && (
                        <button
                          onClick={() => handleDeleteCall(call.id)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Improvement notes */}
          <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <StickyNote size={13} className="text-zinc-400" />
                <h2 className="text-sm font-semibold text-white">Points d'amélioration</h2>
              </div>
              {isCoach && (
                <button
                  onClick={() => setShowAddNote(true)}
                  className="w-6 h-6 flex items-center justify-center rounded-md bg-brand-red hover:bg-red-700 transition-colors"
                >
                  <Plus size={12} className="text-white" />
                </button>
              )}
            </div>

            {notes.length === 0 ? (
              <p className="text-xs text-zinc-500">Aucune note.</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {notes.map(note => (
                  <div key={note.id} className="group relative bg-brand-dark rounded-lg p-3">
                    {note.step_number && (
                      <p className="text-[10px] text-zinc-600 mb-1">
                        Étape {note.step_number} — {STEPS[note.step_number - 1]?.name}
                      </p>
                    )}
                    <p className="text-xs text-zinc-300">{note.note}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[10px] text-zinc-600">
                        {note.profiles?.full_name} · {format(new Date(note.created_at), 'd MMM', { locale: fr })}
                      </p>
                      {(isAdmin || note.author_id === profile?.id) && (
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal open={showEditStudent} onClose={() => setShowEditStudent(false)} title="Modifier l'élève" size="lg">
        <StudentForm
          student={student}
          onSave={(updated) => {
            setStudent(prev => ({ ...prev, ...updated }))
            setShowEditStudent(false)
          }}
          onCancel={() => setShowEditStudent(false)}
        />
      </Modal>

      <Modal open={showAddCall} onClose={() => setShowAddCall(false)} title="Ajouter un call">
        <CallForm
          studentId={id}
          onSave={(call) => {
            setCalls(prev => [call, ...prev])
            setShowAddCall(false)
          }}
          onCancel={() => setShowAddCall(false)}
        />
      </Modal>

      <Modal open={showLitige} onClose={() => setShowLitige(false)} title="Signaler un litige">
        <div className="space-y-4">
          <div className="flex items-start gap-2 bg-red-950/30 border border-red-800/30 rounded-lg p-3">
            <ShieldAlert size={14} className="text-brand-red mt-0.5 shrink-0" />
            <p className="text-xs text-zinc-400">
              Un message WhatsApp sera automatiquement envoyé à Lilian pour traiter le litige.
            </p>
          </div>
          <Textarea
            label="Description du litige *"
            value={litigeText}
            onChange={e => setLitigeText(e.target.value)}
            placeholder="Décris le problème avec cet élève..."
            rows={4}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowLitige(false)}>Annuler</Button>
            <Button variant="danger" onClick={handleLitige} disabled={!litigeText.trim() || savingLitige}>
              {savingLitige ? 'Envoi...' : '⚠️ Signaler & notifier'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showAddNote} onClose={() => setShowAddNote(false)} title="Ajouter un feedback">
        <div className="space-y-4">
          <Select
            label="Étape concernée (optionnel)"
            value={noteStep}
            onChange={e => setNoteStep(e.target.value)}
          >
            <option value="">— Générale —</option>
            {STEPS.map(s => (
              <option key={s.number} value={s.number}>
                {s.number}. {s.name}
              </option>
            ))}
          </Select>
          <Textarea
            label="Note *"
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Point d'amélioration à travailler..."
            rows={4}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAddNote(false)}>Annuler</Button>
            <Button onClick={handleAddNote} disabled={!noteText.trim() || savingNote}>
              {savingNote ? 'Enregistrement...' : 'Ajouter'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
