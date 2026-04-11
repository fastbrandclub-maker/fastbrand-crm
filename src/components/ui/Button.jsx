export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...props
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-brand-red text-white hover:bg-red-700',
    secondary: 'bg-white/5 text-white hover:bg-white/10 border border-brand-border',
    ghost: 'text-zinc-400 hover:text-white hover:bg-white/5',
    danger: 'bg-red-900/50 text-red-300 hover:bg-red-900 border border-red-800',
  }

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5',
    md: 'text-sm px-3.5 py-2',
    lg: 'text-sm px-5 py-2.5',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
