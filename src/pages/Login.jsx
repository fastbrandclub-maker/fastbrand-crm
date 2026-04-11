import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Zap } from 'lucide-react'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await signIn(email, password)
    setLoading(false)
    if (err) setError('Email ou mot de passe incorrect.')
  }

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-brand-red rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-brand-red/20">
            <Zap size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">FastBrand Club</h1>
          <p className="text-sm text-zinc-500 mt-1">CRM Coaching E-commerce</p>
        </div>

        {/* Card */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6 shadow-xl">
          <h2 className="text-base font-semibold text-white mb-5">Connexion</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="vous@fastbrand.com"
                className="w-full bg-brand-dark border border-brand-border rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-brand-dark border border-brand-border rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-950/50 border border-red-800/50 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-red hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-md px-4 py-2.5 text-sm transition-colors mt-1"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          Accès réservé à l'équipe FastBrand Club
        </p>
      </div>
    </div>
  )
}
