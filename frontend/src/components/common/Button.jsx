import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary: 'bg-[#00d1ff] hover:bg-[#33dbff] text-slate-950 shadow-[0_4px_0_0_#00a3c7] hover:shadow-[0_2px_0_0_#00a3c7] hover:translate-y-[2px] active:translate-y-[4px] active:shadow-none',
  secondary: 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 shadow-xl',
  premium: 'bg-gradient-to-r from-[#00d1ff] to-[#7000ff] text-white shadow-[0_0_20px_rgba(0,209,255,0.3)] hover:shadow-[0_0_30px_rgba(0,209,255,0.5)] border border-white/20',
  glass: 'bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 shadow-2xl',
  ghost: 'bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-100 disabled:bg-transparent',
  danger: 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_4px_0_0_#be123c] hover:shadow-[0_2px_0_0_#be123c] hover:translate-y-[2px] active:translate-y-[4px] active:shadow-none',
}

const SIZES = {
  sm: 'h-10 px-4 text-[10px] rounded-xl',
  md: 'h-12 px-6 text-[11px] rounded-2xl',
  lg: 'h-14 px-10 text-xs rounded-3xl',
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
  fullWidth = false,
  ...props
}) {
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      className={`
        relative flex items-center justify-center gap-3 font-black 
        uppercase tracking-[0.2em] transition-all duration-200
        disabled:cursor-not-allowed disabled:opacity-40 disabled:translate-y-0 disabled:shadow-none
        ${fullWidth ? 'w-full' : 'w-fit'}
        ${VARIANTS[variant]}
        ${SIZES[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin opacity-60" />
      ) : (
        <div className={`flex items-center justify-center ${children ? 'gap-2.5 ml-[0.2em]' : ''}`}>
          {Icon && iconPosition === 'left' && (
            <Icon 
              size={18} 
              strokeWidth={2.5} 
              className={`shrink-0 opacity-90 ${children ? '-ml-1' : ''}`} 
            />
          )}
          {children && (
            <span className="relative z-10 whitespace-nowrap">
              {loadingText && loading ? loadingText : children}
            </span>
          )}
          {Icon && iconPosition === 'right' && (
            <Icon 
              size={18} 
              strokeWidth={2.5} 
              className={`shrink-0 opacity-90 ${children ? '-mr-1' : ''}`} 
            />
          )}
        </div>
      )}
      
      {/* Glossy overlay for premium/primary */}
      {(variant === 'primary' || variant === 'premium') && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none rounded-[inherit]" />
      )}
    </button>
  )
}
