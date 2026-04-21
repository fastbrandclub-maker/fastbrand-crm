import { useState } from 'react'
import { ExternalLink, TrendingUp, BookOpen } from 'lucide-react'
import Resources from '../Resources'

const CRM_URL = 'https://silly-begonia-5cb75f.netlify.app/'

export default function Sales() {
  const [tab, setTab] = useState('sales')

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 0px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-brand-border shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTab('sales')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'sales' ? 'bg-brand-surface text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            <TrendingUp size={14} />
            Sales CRM
          </button>
          <button
            onClick={() => setTab('resources')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'resources' ? 'bg-brand-surface text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            <BookOpen size={14} />
            Ressources
          </button>
        </div>
        {tab === 'sales' && (
          <a
            href={CRM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ExternalLink size={12} />
            Ouvrir dans un nouvel onglet
          </a>
        )}
      </div>

      {tab === 'sales' ? (
        <iframe
          src={CRM_URL}
          className="flex-1 w-full border-0"
          title="Sales CRM"
          allow="fullscreen"
        />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <Resources />
        </div>
      )}
    </div>
  )
}
