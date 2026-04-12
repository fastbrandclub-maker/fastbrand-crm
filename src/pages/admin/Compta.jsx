import { Receipt } from 'lucide-react'

export default function Compta() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Comptabilité</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Suivi financier — accès admin uniquement</p>
      </div>

      <div className="bg-brand-surface border border-brand-border rounded-xl p-12 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center mb-4">
          <Receipt size={22} className="text-brand-red" />
        </div>
        <p className="text-white font-semibold mb-1">Section en cours de construction</p>
        <p className="text-sm text-zinc-500">Le contenu comptable sera intégré ici.</p>
      </div>
    </div>
  )
}
