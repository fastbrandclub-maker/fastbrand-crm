import { STEP_STATUS } from '../../lib/constants'

export function StatusBadge({ status }) {
  const s = STEP_STATUS[status] ?? STEP_STATUS.todo
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

export function RoleBadge({ role }) {
  const colors = {
    admin: 'bg-brand-red/20 text-brand-red',
    coach: 'bg-blue-950 text-blue-300',
    assistant: 'bg-zinc-800 text-zinc-400',
  }
  const labels = { admin: 'Admin', coach: 'Coach', assistant: 'Assistant' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[role] ?? colors.assistant}`}>
      {labels[role] ?? role}
    </span>
  )
}
