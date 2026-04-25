import { useState } from 'react'
import { Sun, Moon, Monitor, Check, Plus } from 'lucide-react'
import { useAuthStore } from '../../../store/authStore'
import toast from 'react-hot-toast'

export default function AppearanceSection() {
  const { user, updateProfile } = useAuthStore()
  const [theme, setTheme] = useState(user?.settings?.appearance?.theme || 'dark')

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme)
    try {
      await updateProfile({
        settings: {
          ...user?.settings,
          appearance: { ...user?.settings?.appearance, theme: newTheme }
        }
      })
      toast.success(`Theme set to ${newTheme}`)
    } catch {
      toast.error('Failed to save theme preference')
    }
  }

  const handleAccentChange = async (newColor) => {
    try {
      await updateProfile({
        settings: {
          ...user?.settings,
          appearance: { ...user?.settings?.appearance, accentColor: newColor }
        }
      })
      toast.success('Accent color updated')
    } catch {
      toast.error('Failed to save accent color')
    }
  }

  const themes = [
    { id: 'light', label: 'Light', icon: Sun, desc: 'Clean and bright interface' },
    { id: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on the eyes, best for focus' },
    { id: 'system', label: 'System', icon: Monitor, desc: 'Matches your system settings' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
        {themes.map((t) => {
          const Icon = t.icon
          const isSelected = theme === t.id
          
          return (
            <button
              key={t.id}
              onClick={() => handleThemeChange(t.id)}
              className={`p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden group ${
                isSelected 
                  ? 'border-primary-600' 
                  : 'hover:border-primary-500/30'
              }`}
              style={{ 
                backgroundColor: isSelected ? 'var(--primary-glow)' : 'var(--bg-card)',
                borderColor: isSelected ? 'var(--primary-main)' : 'var(--border-main)'
              }}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 p-2 bg-primary-600 text-white rounded-bl-xl">
                  <Check size={12} />
                </div>
              )}
              
              <div 
                className={`p-2.5 rounded-xl w-fit mb-4 transition-colors ${
                  isSelected ? 'bg-primary-600 text-white' : 'text-slate-400 group-hover:text-white'
                }`}
                style={!isSelected ? { backgroundColor: 'var(--bg-page)' } : {}}
              >
                <Icon size={20} />
              </div>
              
              <h4 className="text-sm font-bold mb-1" style={{ color: 'var(--text-main)' }}>{t.label}</h4>
              <p className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>{t.desc}</p>
            </button>
          )
        })}
      </div>

      <div 
        className="p-6 rounded-2xl border max-w-3xl"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-main)' }}
      >
        <h4 className="text-sm font-bold mb-4" style={{ color: 'var(--text-main)' }}>Color Palette</h4>
        <div className="flex flex-wrap gap-3">
          {['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'].map((color) => {
            const isSelected = (user?.settings?.appearance?.accentColor || '#06b6d4') === color
            return (
              <div 
                key={color}
                onClick={() => handleAccentChange(color)}
                className={`w-10 h-10 rounded-full cursor-pointer hover:scale-110 transition-all border-2 flex items-center justify-center shadow-lg relative ${
                  isSelected ? 'border-white' : 'border-transparent hover:border-white/20'
                }`}
                style={{ backgroundColor: color }}
              >
                {isSelected && <Check size={16} className="text-white drop-shadow-sm" />}
              </div>
            )
          })}
          <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-500 cursor-help group relative">
            <Plus size={14} />
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-surface-950 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Custom colors coming soon!
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
