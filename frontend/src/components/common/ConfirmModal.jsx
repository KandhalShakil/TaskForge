import { X, Trash2, AlertTriangle } from 'lucide-react'
import Button from './Button'

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
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-content max-w-sm text-center !p-8 relative overflow-hidden transition-all duration-500 ${
          isDanger ? 'border-red-500/20 shadow-[0_32px_64px_-16px_rgba(239,68,68,0.2)]' : 'border-primary-500/20 shadow-[0_32px_64px_-16px_rgba(6,182,212,0.2)]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative background element */}
        <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 pointer-events-none ${
          isDanger ? 'bg-red-500' : 'bg-primary-500'
        }`} />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all z-10"
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div className={`relative w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-6 border-2 transition-all duration-500 group ${
          isDanger 
            ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_40px_-10px_rgba(239,68,68,0.3)]' 
            : 'bg-primary-500/10 text-primary-400 border-primary-500/20 shadow-[0_0_40px_-10px_rgba(6,182,212,0.3)]'
        }`}>
          {isDanger ? <Trash2 size={32} strokeWidth={1.5} /> : <AlertTriangle size={32} strokeWidth={1.5} />}
          
          {/* Animated rings */}
          <div className={`absolute inset-0 rounded-[24px] animate-ping opacity-20 ${
            isDanger ? 'bg-red-500' : 'bg-primary-500'
          }`} style={{ animationDuration: '3s' }} />
        </div>

        {/* Text */}
        <div className="space-y-3 mb-10">
          <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
            {title}
          </h2>
          <p className="text-[15px] font-medium text-slate-400 leading-relaxed max-w-[280px] mx-auto">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1 !rounded-2xl !bg-white/5 !border-white/10 hover:!bg-white/10"
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={isDanger ? 'danger' : 'primary'}
            onClick={onConfirm}
            className="flex-1 !rounded-2xl shadow-2xl"
            loading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
