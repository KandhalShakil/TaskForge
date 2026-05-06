import { motion } from 'framer-motion'

export default function SegmentedControl({ 
  label, 
  options, 
  value, 
  onChange, 
  error, 
  disabled = false,
  className = "" 
}) {
  return (
    <div className={`w-full space-y-2 ${className}`}>
      {label && (
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 block opacity-70">
          {label}
        </label>
      )}
      <div className={`
        flex p-1 gap-1 rounded-xl bg-[#12141a]/40 border border-white/5 overflow-hidden
        ${disabled ? 'opacity-50 pointer-events-none' : ''}
      `}>
        {options.map((opt) => {
          const isSelected = opt.value === value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`
                relative flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-all text-center
                ${isSelected ? 'text-white' : 'text-slate-500 hover:text-slate-300'}
              `}
            >
              {isSelected && (
                <motion.div
                  layoutId="segmented-highlight"
                  className="absolute inset-0 bg-primary-500/10 border border-primary-500/20 rounded-lg shadow-sm"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              {opt.icon && (
                <span className="relative z-10 flex items-center justify-center">
                  {opt.icon}
                </span>
              )}
              <span className="relative z-10 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                {opt.label}
              </span>
            </button>
          )
        })}
      </div>
      {error && (
        <p className="mt-1.5 text-[9px] font-black text-rose-500 uppercase tracking-widest ml-1 opacity-90">
          {error}
        </p>
      )}
    </div>
  )
}
