import { useState } from 'react'
import { Lock, ShieldCheck, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../../store/authStore'

export default function SecuritySection() {
  const { changePassword } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (passwords.new !== passwords.confirm) {
      return toast.error('Passwords do not match')
    }
    if (passwords.new.length < 8) {
      return toast.error('Password must be at least 8 characters')
    }

    setLoading(true)
    try {
      await changePassword({ 
        current_password: passwords.current,
        new_password: passwords.new,
        confirm_password: passwords.confirm
      })
      toast.success('Password updated successfully')
      setPasswords({ current: '', new: '', confirm: '' })
    } catch (error) {
      const errorMsg = error.response?.data?.current_password?.[0] || 
                       error.response?.data?.error || 
                       'Failed to update password'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="max-w-2xl space-y-6">
        <div className="bg-amber-900/10 border border-amber-900/30 rounded-xl p-4 flex gap-4 items-start">
          <div className="p-2 bg-amber-900/20 rounded-lg text-amber-500">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-200">Security Recommendation</h4>
            <p className="text-xs text-amber-500/80 mt-1 leading-relaxed">
              Use a strong password with at least 8 characters, including symbols and numbers to ensure your account remains secure.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Current Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                className="input pl-10"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  className="input pl-10"
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Confirm New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  className="input pl-10"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-8 py-2.5 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ShieldCheck size={18} />
              )}
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
