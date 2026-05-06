import { useForm } from 'react-hook-form'
import { X, Layout, Info, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProjectStore } from '../../store/projectStore'
import { WORKSPACE_ICONS, WORKSPACE_COLORS } from '../../utils/constants'
import Button from '../common/Button'
import Input from '../common/Input'

export default function CreateSpaceModal({ workspace, onClose, onCreated }) {
  const { createSpace } = useProjectStore()
  const [selectedIcon, setSelectedIcon] = useState('🧭')
  const [selectedColor, setSelectedColor] = useState('#3b82f6')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async (data) => {
    const name = (data.name || '').trim()
    if (!name) return toast.error('Space name is required')

    try {
      await createSpace({
        workspace: workspace.id,
        name,
        description: (data.description || '').trim(),
        icon: selectedIcon,
        color: selectedColor,
      })
      toast.success('Space created successfully')
      onCreated?.()
      onClose()
    } catch {
      toast.error('Failed to create space')
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
            <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400 border border-primary-500/20">
              <Layout size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight leading-none">New Space</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 opacity-60">Global Architecture</p>
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
              label="Space Identity"
              placeholder="e.g., Global Marketing"
              error={errors.name?.message}
              {...register('name', { required: 'Name required' })}
            />

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 block opacity-70">Visual Theme</label>
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
                        className="w-8 h-8 rounded-full shadow-lg transition-shadow"
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
                              <Check size={16} className="text-white" strokeWidth={4} />
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
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Classification Icon</label>
              <div className="grid grid-cols-5 gap-2">
                {WORKSPACE_ICONS.slice(0, 10).map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setSelectedIcon(icon)}
                    className={`h-12 rounded-xl flex items-center justify-center text-xl transition-all border ${
                      selectedIcon === icon 
                        ? 'bg-primary-500 border-primary-400 text-white shadow-lg shadow-primary-500/20' 
                        : 'bg-white/[0.02] border-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-primary-500/[0.03] rounded-2xl border border-primary-500/10">
            <Info size={16} className="text-primary-500 shrink-0" />
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase tracking-wider">
              Spaces are top-level silos for major organizational departments or huge initiatives.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" size="md" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={isSubmitting} className="flex-1">
              Finalize Space
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
    </div>
  )
}
