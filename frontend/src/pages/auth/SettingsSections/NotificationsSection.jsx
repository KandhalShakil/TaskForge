import { useState } from 'react'
import { Bell, Mail, MessageSquare, ListTodo, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../../store/authStore'

export default function NotificationsSection() {
  const { user, updateProfile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    email: user?.settings?.notifications?.email ?? true,
    chat: user?.settings?.notifications?.chat ?? true,
    tasks: user?.settings?.notifications?.tasks ?? true,
  })

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateProfile({
        settings: {
          notifications: settings
        }
      })
      toast.success('Preferences saved')
    } catch (error) {
      toast.error('Failed to save preferences')
    } finally {
      setLoading(false)
    }
  }

  const sections = [
    {
      id: 'email',
      title: 'Email Notifications',
      description: 'Receive project updates, reminders, and summaries via email.',
      icon: Mail,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10'
    },
    {
      id: 'chat',
      title: 'Chat Notifications',
      description: 'Get notified when you receive a direct message or mention in chat.',
      icon: MessageSquare,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10'
    },
    {
      id: 'tasks',
      title: 'Task Updates',
      description: 'Alerts for task assignments, due dates, and status changes.',
      icon: ListTodo,
      color: 'text-green-400',
      bg: 'bg-green-400/10'
    }
  ]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div 
        className="max-w-2xl divide-y border rounded-2xl overflow-hidden shadow-sm"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-main)', divideColor: 'var(--border-main)' }}
      >
        {sections.map((section) => {
          const Icon = section.icon
          const isActive = settings[section.id]
          
          return (
            <div key={section.id} className="p-6 flex items-center justify-between gap-6 hover:bg-surface-800/30 transition-colors">
              <div className="flex gap-4">
                <div className={`p-2.5 rounded-xl ${section.bg} ${section.color} flex-shrink-0 h-fit`}>
                  <Icon size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>{section.title}</h4>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{section.description}</p>
                </div>
              </div>

              <button
                onClick={() => toggleSetting(section.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  isActive ? 'bg-primary-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )
        })}
      </div>

      <div className="pt-4">
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-primary px-8 py-2.5 flex items-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={18} />
          )}
          Save Preferences
        </button>
      </div>
    </div>
  )
}
