import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, X } from 'lucide-react'

export default function FilterDropdown({ 
  label, 
  options, 
  value, 
  onChange, 
  placeholder,
  icon: Icon,
  align = 'left' 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt.value === value || opt.id === value)
  const displayLabel = selectedOption ? (selectedOption.label || selectedOption.name) : placeholder

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all whitespace-nowrap
          ${isOpen || value 
            ? 'bg-primary-500/10 border-primary-500/30 text-primary-400' 
            : 'bg-[#12141a]/40 border-white/5 text-slate-500 hover:border-white/10'
          }
        `}
      >
        {Icon && <Icon size={12} className={value ? 'text-primary-400' : 'text-slate-600'} />}
        <span>{displayLabel}</span>
        <ChevronDown size={12} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        {value && (
          <div 
            onClick={(e) => {
              e.stopPropagation()
              onChange('')
            }}
            className="ml-1 p-0.5 hover:bg-primary-500/20 rounded-md"
          >
            <X size={10} />
          </div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className={`absolute top-full ${align === 'right' ? 'right-0' : 'left-0'} mt-2 min-w-[160px] bg-[#0b0c10] border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden backdrop-blur-xl`}
          >
            <div className="p-1 space-y-0.5">
              {options.map((opt) => {
                const optValue = opt.value ?? opt.id
                const optLabel = opt.label ?? opt.name
                const isSelected = optValue === value
                
                return (
                  <button
                    key={optValue}
                    type="button"
                    onClick={() => {
                      onChange(optValue)
                      setIsOpen(false)
                    }}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
                      ${isSelected 
                        ? 'bg-primary-500/20 text-white' 
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                      }
                    `}
                  >
                    <span className="flex items-center gap-2">
                      {opt.icon && <span>{opt.icon}</span>}
                      {optLabel}
                    </span>
                    {isSelected && <Check size={12} className="text-primary-400" strokeWidth={3} />}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
