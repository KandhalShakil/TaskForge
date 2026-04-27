import { useState, useEffect } from 'react'
import { UserPlus, Trash2, Shield, User, Search, Mail } from 'lucide-react'
import { useProjectStore } from '../../store/projectStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useAuthStore } from '../../store/authStore'
import { connectSocket } from '../../utils/socket'
import toast from 'react-hot-toast'
import ConfirmModal from '../common/ConfirmModal'

export default function ProjectMembersView({ projectId, workspaceId }) {
  const { projectMembers, fetchProjectMembers, addProjectMember, removeProjectMember } = useProjectStore()
  const { members: workspaceMembers, fetchMembers, getUserRole } = useWorkspaceStore()
  const { user: currentUser } = useAuthStore()
  
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState(null)
  const [isRemoving, setIsRemoving] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  const currentUserRole = getUserRole(currentUser?.id)
  const isAdmin = currentUserRole === 'admin'

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([
        fetchProjectMembers(projectId),
        fetchMembers(workspaceId)
      ])
      setLoading(false)
    }
    load()
  }, [projectId, workspaceId])

  const handleAddMember = async (userId) => {
    setIsAdding(true)
    try {
      await addProjectMember(projectId, { user_id: userId, role: 'member' })
      toast.success('Member added to project')
      setShowAddModal(false)
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to add member')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemove = async () => {
    if (!memberToRemove) return
    setIsRemoving(true)
    try {
      await removeProjectMember(projectId, memberToRemove.user.id)
      
      // Emit real-time event
      const socket = connectSocket()
      socket.emit('employee_removed', {
        projectId,
        userId: memberToRemove.user.id
      })
      
      toast.success('Member removed from project')
      setMemberToRemove(null)
    } catch (err) {
      toast.error('Failed to remove member')
    } finally {
      setIsRemoving(false)
    }
  }

  const filteredMembers = projectMembers.filter(m => 
    m.user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const availableWorkspaceMembers = workspaceMembers.filter(wm => 
    !projectMembers.some(pm => pm.user.id === wm.user.id)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text"
            placeholder="Search project members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 h-10 w-full"
          />
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus size={16} /> Add Member
          </button>
        )}
      </div>

      <div className="card overflow-hidden divide-y divide-slate-800">
        {filteredMembers.length === 0 ? (
          <div className="p-12 text-center">
            <User className="mx-auto text-slate-600 mb-4" size={48} />
            <h3 className="text-white font-semibold">No members found</h3>
            <p className="text-slate-400 text-sm mt-1">
              {searchQuery ? 'Try a different search term' : 'Start by adding members to this project'}
            </p>
          </div>
        ) : (
          filteredMembers.map((member) => (
            <div key={member.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400 font-bold border border-primary-500/20">
                  {member.user.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    {member.user.full_name}
                    {member.user.id === currentUser?.id && <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">YOU</span>}
                  </p>
                  <p className="text-xs text-slate-500">{member.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge bg-primary-900/30 text-primary-400 border border-primary-800/50 flex items-center gap-1.5 text-[11px] font-bold">
                  <Shield size={12} /> {member.role}
                </span>
                {isAdmin && member.user.id !== currentUser?.id && (
                  <button 
                    onClick={() => setMemberToRemove(member)}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="modal-overlay !z-[10000]" onClick={() => setShowAddModal(false)}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <UserPlus size={20} className="text-primary-400" /> Add Project Member
              </h2>
              <p className="text-sm text-slate-400 mt-1">Select a workspace member to add to this project.</p>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto space-y-2">
              {availableWorkspaceMembers.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  <Mail className="mx-auto mb-2 opacity-20" size={32} />
                  <p>All workspace members are already in this project.</p>
                </div>
              ) : (
                availableWorkspaceMembers.map(wm => (
                  <button
                    key={wm.id}
                    onClick={() => handleAddMember(wm.user.id)}
                    disabled={isAdding}
                    className="w-full p-3 rounded-xl flex items-center justify-between hover:bg-white/5 border border-transparent hover:border-slate-800 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                        {wm.user.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{wm.user.full_name}</p>
                        <p className="text-xs text-slate-500">{wm.user.email}</p>
                      </div>
                    </div>
                    <UserPlus size={14} className="text-primary-500" />
                  </button>
                ))
              )}
            </div>
            <div className="p-4 bg-slate-900/50 flex justify-end">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation */}
      <ConfirmModal 
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemove}
        title="Remove from Project?"
        message={`Are you sure you want to remove "${memberToRemove?.user?.full_name}" from this project? They will lose access to project-specific tasks.`}
        confirmText="Remove Member"
        isDanger={true}
        isLoading={isRemoving}
      />
    </div>
  )
}
