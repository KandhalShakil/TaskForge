import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { User, Mail, Shield, Camera, Save, Lock, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, updateProfile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    avatar: user?.avatar || '',
    password: '',
    password2: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.password && formData.password !== formData.password2) {
      return toast.error('Passwords do not match')
    }

    setLoading(true)
    try {
      const updateData = {
        full_name: formData.full_name,
        avatar: formData.avatar,
      }
      if (formData.password) {
        updateData.password = formData.password
        updateData.password2 = formData.password2
      }

      await updateProfile(updateData)
      toast.success('Profile updated successfully')
      setFormData(prev => ({ ...prev, password: '', password2: '' }))
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container py-8 md:py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Profile Settings</h1>
          <p className="text-slate-400 mt-1">Manage your personal information and account security.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Avatar Preview */}
          <div className="lg:col-span-1">
            <div className="card p-6 flex flex-col items-center text-center">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-primary-900/20 mb-4 overflow-hidden">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    user?.initials || '?'
                  )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera size={24} className="text-white" />
                </div>
              </div>
              <h2 className="text-lg font-bold text-white">{user?.full_name}</h2>
              <p className="text-sm text-slate-500 capitalize">{user?.user_type || 'Member'}</p>
              
              <div className="mt-6 w-full pt-6 border-t border-slate-800 space-y-3">
                <div className="flex items-center gap-3 text-slate-400">
                  <Mail size={14} />
                  <span className="text-xs truncate">{user?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <Shield size={14} />
                  <span className="text-xs capitalize">{user?.user_type} Role</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Edit Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="card p-6 md:p-8 space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">General Information</h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      className="input pl-10"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Avatar URL</label>
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
                  <p className="text-[10px] text-slate-500">Provide a direct link to an image (JPEG, PNG, etc.)</p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                   <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Security</h3>
                   <div className="flex items-center gap-1.5 text-xs text-amber-500 font-medium">
                      <AlertCircle size={12} />
                      Leave blank to keep current password
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">New Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        className="input pl-10"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Confirm Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        className="input pl-10"
                        value={formData.password2}
                        onChange={(e) => setFormData({ ...formData, password2: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary px-8 py-2.5 flex items-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
