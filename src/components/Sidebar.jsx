import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Columns,
  CalendarDays,
  BookOpen,
  LogOut,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ROLES } from '../lib/constants'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/students', icon: Users, label: 'Élèves' },
  { to: '/kanban', icon: Columns, label: 'Kanban' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendrier' },
  { to: '/resources', icon: BookOpen, label: 'Ressources' },
]

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-brand-surface border-r border-brand-border min-h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-brand-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-red rounded flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold leading-none text-white">FastBrand</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Club CRM</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-red text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-brand-border">
        {profile && (
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-white truncate">{profile.full_name}</p>
            <p className="text-xs text-zinc-500">{ROLES[profile.role] ?? profile.role}</p>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
