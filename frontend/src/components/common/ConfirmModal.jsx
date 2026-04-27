import { X, Trash2, AlertTriangle } from 'lucide-react'

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Are you sure?', 
  message = 'This action cannot be undone.', 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  isDanger = false,
  isLoading = false 
}) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay !z-[9999]" onClick={onClose}>
      <div 
        className={`modal-content max-w-[380px] w-[90%] text-center !p-0 relative transition-all duration-500 border-0 ${
          isDanger 
            ? 'shadow-[0_20px_50px_rgba(239,68,68,0.3)] bg-gradient-to-b from-[#1a1010] to-[#09090b]' 
            : 'shadow-[0_20px_50px_rgba(6,182,212,0.2)] bg-gradient-to-b from-[#0f171a] to-[#09090b]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Line */}
        <div className={`h-1.5 w-full ${isDanger ? 'bg-red-500' : 'bg-primary-500'}`} />

        <div className="p-8">
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all z-10"
          >
            <X size={18} />
          </button>

          {/* Icon Section */}
          <div className="relative mb-8 pt-4">
            <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center mx-auto relative z-10 transition-transform duration-500 group-hover:scale-110 ${
              isDanger 
                ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                : 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
            }`}>
              {isDanger ? <Trash2 size={32} strokeWidth={1.5} /> : <AlertTriangle size={32} strokeWidth={1.5} />}
            </div>
            {/* Glow effect */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 blur-[40px] opacity-20 rounded-full ${
              isDanger ? 'bg-red-500' : 'bg-primary-500'
            }`} />
          </div>

          {/* Content */}
          <div className="space-y-3 mb-10 relative z-10">
            <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
              {title}
            </h2>
            <p className="text-[14px] font-medium text-slate-400 leading-relaxed px-2">
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 relative z-10">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-3 rounded-2xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 border border-white/5 transition-all"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-3 rounded-2xl text-sm font-bold text-white transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
                isDanger 
                  ? 'bg-red-500 hover:bg-red-400 shadow-red-500/20' 
                  : 'bg-primary-500 hover:bg-primary-400 shadow-primary-500/20'
              }`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : confirmText}
            </button>
          </div>
        </div>

        {/* Subtle Bottom Glow */}
        <div className={`absolute -bottom-12 left-1/2 -translate-x-1/2 w-48 h-24 blur-[60px] opacity-10 rounded-full pointer-events-none ${
          isDanger ? 'bg-red-500' : 'bg-primary-500'
        }`} />
      </div>
    </div>
  )
}
