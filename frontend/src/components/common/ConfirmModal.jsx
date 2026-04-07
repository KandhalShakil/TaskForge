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
        className="modal-content max-w-sm text-center" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 border transition-all ${
          isDanger 
            ? 'bg-red-900/30 text-red-500 border-red-800/50 scale-110 shadow-lg shadow-red-900/20' 
            : 'bg-primary-900/30 text-primary-400 border-primary-800/50'
        }`}>
          {isDanger ? <Trash2 size={24} /> : <AlertTriangle size={24} />}
        </div>

        {/* Text */}
        <h2 className="text-xl font-bold text-white mb-2 tracking-tight">{title}</h2>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed px-2">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={isDanger ? 'danger' : 'primary'}
            onClick={onConfirm}
            className="flex-1"
            loading={isLoading}
          >
            {confirmText}
          </Button>
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-white hover:bg-surface-800 transition-all"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
