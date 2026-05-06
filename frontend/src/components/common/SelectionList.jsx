import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

export default function SelectionList({ 
  label, 
  options, 
  value, 
  onChange, 
  error, 
  icon: Icon,
  className = "",
  emptyMessage = "No options available"
}) {
  return (
    <div className={`w-full space-y-2 ${className}`}>
      {label && (
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 block opacity-70">
          {label}
        </label>
      )}
      <div className="max-h-32 overflow-y-auto no-scrollbar rounded-xl border border-white/5 bg-[#12141a]/40 p-1 space-y-1">
        {options.map((opt) => {
          const isSelected = opt.id === value
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left
                ${isSelected 
                  ? 'bg-primary-500/20 text-white border border-primary-500/30' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                }
              `}
            >
              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center text-sm
                ${isSelected ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-white/5 text-slate-500'}
              `}>
                {opt.icon || (Icon && <Icon size={14} />) || '•'}
              </div>
              <span className="flex-1 text-[11px] font-black uppercase tracking-wider truncate">
                {opt.name}
              </span>
              {isSelected && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <Check size={14} className="text-primary-400" strokeWidth={3} />
                </motion.div>
              )}
            </button>
          )
        })}
        {options.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 px-4 bg-white/[0.01] rounded-lg border border-dashed border-white/5 mx-1 my-1">
            <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] text-center">
              {emptyMessage}
            </p>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-[9px] font-black text-rose-500 uppercase tracking-widest ml-1 opacity-90">
          {error}
        </p>
      )}
    </div>
  )
}
