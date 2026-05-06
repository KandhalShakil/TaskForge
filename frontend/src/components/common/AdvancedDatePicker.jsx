import { useState, useMemo } from 'react'
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, 
  eachDayOfInterval 
} from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdvancedDatePicker({ 
  label, 
  value, 
  onChange, 
  error, 
  className = "", 
  compact = false, 
  placeholder = 'Select Target Date',
  align = 'left',
  position = 'bottom'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date())
  
  const selectedDate = value ? new Date(value) : null

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth))
    const end = endOfWeek(endOfMonth(currentMonth))
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const handleDateSelect = (date) => {
    onChange(format(date, 'yyyy-MM-dd'))
    setIsOpen(false)
  }

  return (
    <div className={`w-full relative ${className}`}>
      {label && (
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 block opacity-70 mb-2">
          {label}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center gap-2 px-3 rounded-xl ${compact ? 'h-10 text-[11px]' : 'h-12 text-[13px]'} font-bold
          bg-[#12141a]/60 border border-white/5 text-slate-200 transition-all
          ${isOpen ? 'border-primary-500/50 bg-[#12141a]/80 shadow-lg shadow-primary-500/5' : 'hover:border-white/10'}
          ${error ? 'border-rose-500/50' : ''}
          ${compact ? 'whitespace-nowrap' : ''}
        `}
      >
        <CalendarIcon size={compact ? 12 : 14} className={selectedDate ? 'text-primary-400' : 'text-slate-600'} strokeWidth={2.5} />
        <span className={selectedDate ? 'text-slate-200' : 'text-slate-500'}>
          {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : placeholder}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for easy closing */}
            <div className="fixed inset-0 z-[1200]" onClick={() => setIsOpen(false)} />
            
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} ${align === 'right' ? 'right-0' : 'left-0'} w-72 bg-[#0b0c10] border border-white/10 rounded-2xl shadow-2xl z-[1201] overflow-hidden backdrop-blur-xl`}
            >
              {/* Calendar Header */}
              <div className="p-4 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
                <button 
                  type="button" 
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-200">
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
                <button 
                  type="button" 
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Weekdays */}
              <div className="grid grid-cols-7 gap-1 p-2 text-center border-b border-white/5">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <span key={d} className="text-[9px] font-black text-slate-600 uppercase py-1">{d}</span>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 p-2">
                {days.map((day, idx) => {
                  const isSelected = selectedDate && isSameDay(day, selectedDate)
                  const isToday = isSameDay(day, new Date())
                  const isCurrentMonth = isSameMonth(day, currentMonth)
                  
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleDateSelect(day)}
                      className={`
                        h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all
                        ${!isCurrentMonth ? 'text-slate-800 opacity-0 pointer-events-none' : ''}
                        ${isSelected 
                          ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' 
                          : isToday 
                            ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' 
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }
                      `}
                    >
                      {format(day, 'd')}
                    </button>
                  )
                })}
              </div>

              <div className="p-3 bg-white/[0.02] border-t border-white/5 flex justify-end">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {error && (
        <p className="mt-1.5 text-[9px] font-black text-rose-500 uppercase tracking-widest ml-1 opacity-90">
          {error}
        </p>
      )}
    </div>
  )
}
