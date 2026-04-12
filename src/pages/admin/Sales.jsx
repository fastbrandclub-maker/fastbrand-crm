import { ExternalLink, TrendingUp } from 'lucide-react'

const CRM_URL = 'https://silly-begonia-5cb75f.netlify.app/'

export default function Sales() {
  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 0px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-emerald-400" />
          <h1 className="text-sm font-bold text-white">Sales CRM</h1>
        </div>
        <a
          href={CRM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ExternalLink size={12} />
          Ouvrir dans un nouvel onglet
        </a>
      </div>

      {/* Iframe */}
      <iframe
        src={CRM_URL}
        className="flex-1 w-full border-0"
        title="Sales CRM"
        allow="fullscreen"
      />
    </div>
  )
}
