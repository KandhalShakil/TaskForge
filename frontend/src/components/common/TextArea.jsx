import { forwardRef } from 'react'

const TextArea = forwardRef(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className="w-full group">
      {label && (
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block group-focus-within:text-primary-400 transition-colors">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={`
          w-full rounded-2xl min-h-[120px] px-5 py-4 resize-none text-sm font-medium leading-relaxed
          bg-slate-950/40 border border-white/5 text-slate-200 placeholder:text-slate-600
          focus:border-primary-500/30 focus:ring-4 focus:ring-primary-500/5 
          transition-all duration-300
          ${error ? 'border-rose-500/50 focus:border-rose-500/50 focus:ring-rose-500/5' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-2 text-[10px] font-bold text-rose-500 uppercase tracking-widest ml-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  )
})

TextArea.displayName = 'TextArea'

export default TextArea
