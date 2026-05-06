import { X, Trash2, AlertTriangle, ShieldAlert } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Are you sure?', 
  message = 'This action cannot be undone.', 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  isDanger = false,
  isLoading = false,
  requireConfirmationText = false,
  confirmationKeyword = 'DELETE'
}) {
  const [confirmInput, setConfirmInput] = useState('')

  if (!isOpen) return null

  const handleConfirm = () => {
    if (requireConfirmationText && confirmInput !== confirmationKeyword) return
    onConfirm()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-[420px] overflow-hidden rounded-[32px] border shadow-2xl ${
              isDanger 
                ? 'bg-[#0f0f12] border-red-500/20 shadow-red-500/10' 
                : 'bg-[#0f0f12] border-primary-500/20 shadow-primary-500/10'
            }`}
          >
            {/* Top Accent Line */}
            <div className={`h-1.5 w-full ${isDanger ? 'bg-red-500' : 'bg-primary-500'}`} />

            <div className="p-8 md:p-10">
              {/* Close Button */}
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full text-slate-500 hover:text-white hover:bg-white/5 transition-all z-10"
              >
                <X size={20} />
              </button>

              {/* Icon Section */}
              <div className="relative mb-8 flex justify-center">
                <div className={`w-20 h-20 rounded-[30%] flex items-center justify-center relative z-10 ${
                  isDanger 
                    ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                    : 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                }`}>
                  {isDanger ? <Trash2 size={36} strokeWidth={1.5} /> : <AlertTriangle size={36} strokeWidth={1.5} />}
                </div>
                {/* Glow effect */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 blur-[50px] opacity-20 rounded-full ${
                  isDanger ? 'bg-red-500' : 'bg-primary-500'
                }`} />
              </div>

              {/* Content */}
              <div className="space-y-3 mb-8 text-center">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {title}
                </h2>
                <p className="text-sm md:text-base font-medium text-slate-400 leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Confirmation Keyword Requirement */}
              {requireConfirmationText && (
                <div className="mb-8 space-y-3">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">
                    Type <span className="text-red-400">{confirmationKeyword}</span> to confirm
                  </p>
                  <input 
                    type="text"
                    value={confirmInput}
                    onChange={(e) => setConfirmInput(e.target.value)}
                    placeholder={confirmationKeyword}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-center text-white font-bold tracking-widest focus:border-red-500/50 outline-none transition-all placeholder:opacity-20"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleConfirm}
                  disabled={isLoading || (requireConfirmationText && confirmInput !== confirmationKeyword)}
                  className={`w-full py-4 rounded-2xl text-sm font-black text-white transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none ${
                    isDanger 
                      ? 'bg-red-500 hover:bg-red-400 shadow-red-500/30' 
                      : 'bg-primary-500 hover:bg-primary-400 shadow-primary-500/30'
                  }`}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {isDanger && <ShieldAlert size={18} />}
                      {confirmText}
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="w-full py-4 rounded-2xl text-sm font-bold text-slate-500 hover:text-white transition-all"
                >
                  {cancelText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
