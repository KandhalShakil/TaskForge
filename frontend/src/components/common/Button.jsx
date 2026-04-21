import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary: 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-900/20 disabled:bg-primary-800/50',
  secondary: 'bg-surface-800 hover:bg-surface-700 text-slate-100 border border-slate-700/50 disabled:bg-surface-900/50',
  ghost: 'bg-transparent hover:bg-surface-800 text-slate-400 hover:text-slate-100 disabled:bg-transparent',
  danger: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 disabled:bg-red-800/50',
}

const SIZES = {
  sm: 'min-h-10 px-3 py-1.5 text-xs',
  md: 'min-h-11 px-4 py-2 text-sm',
  lg: 'min-h-12 px-6 py-3 text-base',
}

export default function Button({
  children,
  loading = false,
  loadingText,
  disabled = false,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  className = '',
  ...props
}) {
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      className={`
        relative flex items-center justify-center gap-2 font-semibold rounded-xl 
        transition-all duration-200 active:scale-95 disabled:scale-100
        disabled:cursor-not-allowed disabled:opacity-70
        ${VARIANTS[variant]}
        ${SIZES[size]}
        ${className}
      `}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin text-current" />}
      
      {!loading && Icon && iconPosition === 'left' && (
        <Icon size={16} className="text-current" />
      )}
      
      <span>{loading && loadingText ? loadingText : children}</span>

      {!loading && Icon && iconPosition === 'right' && (
        <Icon size={16} className="text-current" />
      )}
    </button>
  )
}
