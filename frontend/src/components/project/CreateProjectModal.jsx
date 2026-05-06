import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { X, Layout, Info, Calendar as CalendarIcon, Hash, Folder, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useProjectStore } from '../../store/projectStore'
import { WORKSPACE_ICONS, WORKSPACE_COLORS } from '../../utils/constants'
import Button from '../common/Button'
import Input from '../common/Input'
import TextArea from '../common/TextArea'
import SelectionList from '../common/SelectionList'
import AdvancedDatePicker from '../common/AdvancedDatePicker'
import { extractApiError, validateProject } from '../../utils/validation'

export default function CreateProjectModal({ workspace, defaultSpaceId = '', defaultFolderId = '', onClose }) {
  const { createProject, spaces, folders } = useProjectStore()
  const [selectedIcon, setSelectedIcon] = useState('📁')
  const [selectedColor, setSelectedColor] = useState('#8b5cf6')
  const [formError, setFormError] = useState('')
  const defaultValues = useMemo(() => ({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    space: defaultSpaceId || '',
    folder: defaultFolderId || '',
  }), [defaultSpaceId, defaultFolderId])
  
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    clearErrors,
    control,
    formState: { errors, isSubmitting, isValid },
  } = useForm({ mode: 'onChange', defaultValues })

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  const selectedSpaceId = watch('space')
  const selectedFolderId = watch('folder')

  // Filter folders: only show folders belonging to the selected space
  const availableFolders = useMemo(
    () => folders.filter((folder) => selectedSpaceId && folder.space === selectedSpaceId),
    [folders, selectedSpaceId]
  )

  // Reset folder selection if space changes and current folder is not in the new available list
  useEffect(() => {
    if (selectedFolderId && !availableFolders.some(f => f.id === selectedFolderId)) {
      reset({ ...watch(), folder: '' })
    }
  }, [selectedSpaceId, availableFolders, selectedFolderId, reset, watch])

  const onSubmit = async (data) => {
    setFormError('')
    clearErrors()

    const validation = validateProject(data)
    if (!validation.isValid) {
      setFormError(validation.generalError || 'Check your input')
      Object.entries(validation.errors).forEach(([field, message]) => {
        setError(field, { type: 'manual', message })
      })
      return
    }

    const payload = {
      ...data,
      name: (data.name || '').trim(),
      description: (data.description || '').trim(),
      workspace: workspace.id,
      icon: selectedIcon,
      color: selectedColor,
      space: data.space || null,
      folder: data.folder || null,
    }

    try {
      await createProject(payload)
      toast.success('Project created successfully')
      onClose()
    } catch (err) {
      const message = extractApiError(err, 'Creation failed')
      setFormError(message)
      toast.error(message)
    }
  }

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        className="relative w-full max-w-xl max-h-[90vh] bg-[#0b0c10] rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Compact */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400 border border-primary-500/20">
              <Layout size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight leading-none">Initialize Project</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 opacity-60">System Configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-all flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto no-scrollbar flex-1">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <AnimatePresence>
            {formError && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10px] font-black text-rose-400 uppercase tracking-widest overflow-hidden">
                {formError}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-5">
            <Input
              label="Project Identity"
              placeholder="e.g., Enterprise Core V2"
              error={errors.name?.message}
              {...register('name', { required: 'Name is required' })}
            />

            <TextArea
              label="Project Mission / Brief"
              placeholder="Define the primary objectives and mission protocols..."
              {...register('description')}
              className="min-h-[100px]"
            />

            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="space"
                control={control}
                render={({ field }) => (
                  <SelectionList
                    label="Space Assignment"
                    options={spaces}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.space?.message}
                    icon={Hash}
                  />
                )}
              />
              <Controller
                name="folder"
                control={control}
                render={({ field }) => (
                  <SelectionList
                    label="Folder Assignment"
                    options={availableFolders}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.folder?.message}
                    icon={Folder}
                    emptyMessage={selectedSpaceId ? "No Folder in this Space" : "Select a space first"}
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="start_date"
                control={control}
                rules={{ required: 'Required' }}
                render={({ field }) => (
                  <AdvancedDatePicker
                    label="Kickoff"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.start_date?.message}
                  />
                )}
              />
              <Controller
                name="end_date"
                control={control}
                rules={{ required: 'Required' }}
                render={({ field }) => (
                  <AdvancedDatePicker
                    label="Deadline"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.end_date?.message}
                  />
                )}
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 block opacity-70">Visual Branding / Theme</label>
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

            <div className="grid grid-cols-10 gap-2">
              {WORKSPACE_ICONS.slice(0, 10).map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`h-11 rounded-xl flex items-center justify-center text-lg transition-all border ${
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

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" size="md" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={isSubmitting} disabled={!isValid} className="flex-1">
              Finalize Project
            </Button>
          </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
