export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-zinc-400">{label}</label>
      )}
      <input
        className={`bg-brand-surface border border-brand-border rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors ${error ? 'border-red-700' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-zinc-400">{label}</label>
      )}
      <textarea
        className={`bg-brand-surface border border-brand-border rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors resize-none ${error ? 'border-red-700' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-zinc-400">{label}</label>
      )}
      <select
        className={`bg-brand-surface border border-brand-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600 transition-colors ${error ? 'border-red-700' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
