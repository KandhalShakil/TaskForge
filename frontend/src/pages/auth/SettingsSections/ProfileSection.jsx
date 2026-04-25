import { useState } from 'react'
import { User, Camera, Mail, Shield, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../../store/authStore'

export default function ProfileSection() {
  const { user, updateProfile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    avatar: user?.avatar || '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateProfile(formData)
      toast.success('Profile updated')
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  className="input pl-10"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Your name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  className="input pl-10 bg-surface-800/50 cursor-not-allowed"
                  value={user?.email}
                  disabled
                />
              </div>
              <p className="text-[10px] text-slate-500">Email cannot be changed. Contact support for help.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Avatar URL</label>
              <div className="relative">
                <Camera size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="url"
                  className="input pl-10"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full sm:w-auto px-6 py-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save Changes
            </button>
          </form>
        </div>

        <div 
          className="w-full md:w-64 flex flex-col items-center text-center p-6 rounded-2xl border"
          style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-main)' }}
        >
          <div 
            className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-primary-900/10 mb-4 overflow-hidden border-2"
            style={{ borderColor: 'var(--border-main)' }}
          >
            {formData.avatar ? (
              <img src={formData.avatar} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              user?.initials || '?'
            )}
          </div>
          <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text-main)' }}>Preview</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>This is how your avatar looks to others</p>
        </div>
      </div>
    </div>
  )
}
