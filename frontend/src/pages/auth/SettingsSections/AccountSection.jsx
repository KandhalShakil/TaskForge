import { useState } from 'react'
import { Trash2, AlertCircle, Building, Info, UserX } from 'lucide-react'
import { useAuthStore } from '../../../store/authStore'
import ConfirmModal from '../../../components/common/ConfirmModal'
import toast from 'react-hot-toast'

export default function AccountSection() {
  const { user, deleteAccount, exportData } = useAuthStore()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  const handleDeleteAccount = async () => {
    setLoading(true)
    try {
      await deleteAccount()
      toast.success('Account deleted successfully')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete account')
    } finally {
      setLoading(false)
      setShowDeleteModal(false)
    }
  }

  const handleDownloadData = async () => {
    setExportLoading(true)
    try {
      const data = await exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `taskforge-data-${user.full_name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      toast.success('Data exported successfully')
    } catch (error) {
      toast.error('Failed to export data')
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-6">
        {/* Workspace Info */}
        <div 
          className="p-6 rounded-2xl border space-y-4"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-main)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-500/10 text-primary-400 rounded-xl">
              <Building size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>Default Workspace</h4>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Your primary organization for projects</p>
            </div>
          </div>
          
          <div 
            className="flex items-center justify-between p-3 rounded-xl"
            style={{ backgroundColor: 'var(--bg-page)' }}
          >
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  {user?.full_name?.charAt(0) || 'W'}
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>Main Workspace</span>
             </div>
             <span className="badge bg-primary-600/10 text-primary-400 border border-primary-500/20 px-2 py-0.5 text-[10px] uppercase">Primary</span>
          </div>
        </div>

        {/* Data Management */}
        <div 
          className="p-6 rounded-2xl border space-y-4"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-main)' }}
        >
          <div className="flex items-center gap-3">
             <div 
               className="p-2.5 rounded-xl"
               style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-muted)' }}
             >
                <Info size={20} />
             </div>
             <div>
                <h4 className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>Data & Privacy</h4>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Manage your data and exports</p>
             </div>
          </div>
          <button 
            onClick={handleDownloadData}
            disabled={exportLoading}
            className="btn-ghost text-xs font-medium w-full sm:w-auto border px-4 py-2 flex items-center justify-center gap-2"
            style={{ borderColor: 'var(--border-main)' }}
          >
            {exportLoading ? (
              <div className="w-3 h-3 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            ) : null}
            Download your data (.json)
          </button>
        </div>

        {/* Danger Zone */}
        <div 
          className="pt-8 mt-8 border-t space-y-4"
          style={{ borderColor: 'var(--border-main)' }}
        >
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-bold text-red-500 flex items-center gap-2">
               <AlertCircle size={16} /> Danger Zone
            </h4>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Once you delete your account, there is no going back. Please be certain.</p>
          </div>

          <button 
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-900/30 text-red-400 hover:bg-red-400/5 transition-all text-sm font-medium"
          >
            <UserX size={16} />
            Delete Account
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account?"
        message="Are you absolutely sure you want to delete your account? This action is permanent and will remove all your tasks, projects, and personal data from our servers."
        confirmText="Yes, delete my account"
        isDanger={true}
        isLoading={loading}
      />
    </div>
  )
}
