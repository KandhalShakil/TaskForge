import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { X, Layers, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { WORKSPACE_ICONS, WORKSPACE_COLORS } from '../../utils/constants'
import Button from '../common/Button'
import Input from '../common/Input'

export default function CreateWorkspaceModal({ onClose }) {
  const { createWorkspace } = useWorkspaceStore()
  const [selectedIcon, setSelectedIcon] = useState('🚀')
  const [selectedColor, setSelectedColor] = useState('#6366f1')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async (data) => {
    try {
      await createWorkspace({ ...data, icon: selectedIcon, color: selectedColor })
      toast.success('Workspace created successfully!')
      onClose()
    } catch (err) {
      toast.error('Failed to create workspace')
    }
  }

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        className="relative w-full max-w-md max-h-[90vh] bg-[#0b0c10] rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400 border border-primary-500/20 shadow-inner">
              <Layers size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight leading-none">New Workspace</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 opacity-60">Enterprise Entry Point</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-all flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto no-scrollbar flex-1">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="space-y-5">
            <Input
              label="Organizational Title"
              placeholder="e.g., Acme Corp Global"
              error={errors.name?.message}
              {...register('name', { required: 'Name required' })}
            />

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 block opacity-70">Identity Color / Theme</label>
              <div className="flex items-center gap-4 bg-white/[0.03] p-4 rounded-[1.5rem] border border-white/5 overflow-x-auto no-scrollbar">
                {WORKSPACE_COLORS.map((color) => {
                  const isSelected = selectedColor === color
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className="relative flex-shrink-0 outline-none group"
                    >
                      <motion.div
                        animate={{ 
                          scale: isSelected ? 1.2 : 1,
                          opacity: isSelected ? 1 : 0.6
                        }}
                        whileHover={{ scale: 1.1, opacity: 1 }}
                        className="w-7 h-7 rounded-full shadow-lg transition-shadow"
                        style={{ 
                          backgroundColor: color,
                          boxShadow: isSelected ? `0 0 20px ${color}66` : 'none',
                          border: isSelected ? '2px solid white' : '1px solid rgba(255,255,255,0.1)'
                        }}
                      >
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              className="absolute inset-0 flex items-center justify-center"
                            >
                              <Check size={14} className="text-white" strokeWidth={4} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Brand Identifier</label>
              <div className="grid grid-cols-5 gap-2">
                {WORKSPACE_ICONS.slice(0, 10).map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setSelectedIcon(icon)}
                    className={`h-12 rounded-xl flex items-center justify-center text-xl transition-all border ${
                      selectedIcon === icon 
                        ? 'bg-primary-500 border-primary-400 text-white shadow-lg' 
                        : 'bg-white/[0.02] border-white/5 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-950/40 rounded-2xl p-4 flex items-center gap-4 border border-white/5 shadow-inner">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg" style={{ backgroundColor: selectedColor + '20', color: selectedColor, border: `1px solid ${selectedColor}30` }}>
              {selectedIcon}
            </div>
            <div>
              <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">V-Identity Preview</p>
              <p className="text-[9px] text-slate-500 font-bold mt-1.5 uppercase tracking-wider opacity-60">Sidebar Presentation</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" size="md" onClick={onClose} className="flex-1">
              Discard
            </Button>
            <Button type="submit" variant="primary" size="md" loading={isSubmitting} className="flex-1">
              Launch Entity
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
    </div>
  )
}
