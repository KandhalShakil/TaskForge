import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

const Select = forwardRef(({ label, error, icon: Icon, children, className = '', ...props }, ref) => {
  return (
    <div className="w-full group">
      {label && (
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1 block group-focus-within:text-primary-400 transition-colors opacity-70">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary-500 transition-colors pointer-events-none">
            <Icon size={14} strokeWidth={2.5} />
          </div>
        )}
        <select
          ref={ref}
          className={`
            w-full rounded-xl h-12 px-4 text-[13px] font-bold appearance-none
            bg-[#12141a]/60 border border-white/5 text-slate-200
            focus:border-primary-500/50 focus:bg-[#12141a]/80
            transition-all duration-200 cursor-pointer outline-none
            ${Icon ? 'pl-11' : ''}
            ${error ? 'border-rose-500/50 focus:border-rose-500/50' : ''}
            ${className}
          `}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary-500 transition-colors pointer-events-none">
          <ChevronDown size={14} strokeWidth={2.5} />
        </div>
      </div>
      {error && (
        <p className="mt-1.5 text-[9px] font-black text-rose-500 uppercase tracking-widest ml-1 opacity-90">
          {error}
        </p>
      )}
    </div>
  )
})

Select.displayName = 'Select'

export default Select
