import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { UserPlus, Trash2, Crown, Shield, Eye, Loader2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { authAPI } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import ConfirmModal from '../../components/common/ConfirmModal'
import SegmentedControl from '../../components/common/SegmentedControl'
import { getApiErrorMessage } from '../../utils/apiError'
import { connectSocket } from '../../utils/socket'

const ROLE_ICONS = {
  admin: <Crown size={12} className="text-yellow-400" />,
  member: <Shield size={12} className="text-primary-400" />,
  viewer: <Eye size={12} className="text-slate-400" />,
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin', icon: <Crown size={10} /> },
  { value: 'member', label: 'Member', icon: <Shield size={10} /> },
  { value: 'viewer', label: 'Viewer', icon: <Eye size={10} /> },
]

export default function WorkspaceMembersPage() {
  const { workspaceId } = useParams()
  const { user } = useAuthStore()
  const { activeWorkspace, members, fetchMembers, addMember, removeMember, updateMemberRole } = useWorkspaceStore()
  const [allUsers, setAllUsers] = useState([])
  const [search, setSearch] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [loading, setLoading] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState(null)
  const [isRemoving, setIsRemoving] = useState(false)

  useEffect(() => {
    fetchMembers(workspaceId).catch((err) => {
      toast.error(getApiErrorMessage(err, 'Failed to load members'))
    })

    authAPI.listUsers()
      .then(({ data }) => setAllUsers(data.results || data))
      .catch((err) => {
        toast.error(getApiErrorMessage(err, 'Failed to load users'))
      })

    const socket = connectSocket()
    const workspaceRoom = `workspace_${workspaceId}`
    
    socket.emit('join', { chatId: workspaceRoom, userId: user?.id })

    const onMemberAccepted = (payload) => {
      fetchMembers(workspaceId)
    }

    const onRoleUpdated = (payload) => {
      fetchMembers(workspaceId)
    }

    socket.on('member_accepted', onMemberAccepted)
    socket.on('role_updated', onRoleUpdated)

    return () => {
      socket.off('member_accepted', onMemberAccepted)
      socket.off('role_updated', onRoleUpdated)
      socket.emit('leave', { chatId: workspaceRoom })
    }
  }, [workspaceId, user?.id, fetchMembers])

  const memberUserIds = new Set(members.map((m) => m.user.id))
  const availableUsers = allUsers.filter(
    (u) => u.user_type === 'employee' &&
      u.companyId === user?.companyId &&
      !memberUserIds.has(u.id) &&
      (u.email.toLowerCase().includes(search.toLowerCase()) ||
       u.full_name.toLowerCase().includes(search.toLowerCase()))
  )

  const handleAddMember = async (userId) => {
    setLoading(true)
    try {
      await addMember(workspaceId, { user_id: userId, role: inviteRole })
      
      const socket = connectSocket()
      socket.emit('send_invitation', {
        receiverId: userId,
        sender: user,
        workspace: activeWorkspace
      })
      
      toast.success('Member added!')
      setSearch('')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to add member'))
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async () => {
    if (!memberToRemove) return
    setIsRemoving(true)
    try {
      await removeMember(workspaceId, memberToRemove.user.id)
      toast.success('Member removed')
      setMemberToRemove(null)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Cannot remove member'))
    } finally {
      setIsRemoving(false)
    }
  }

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await updateMemberRole(workspaceId, memberId, newRole)
      
      const socket = connectSocket()
      socket.emit('role_updated', {
        workspaceId,
        userId: memberId,
        role: newRole
      })
      
      toast.success('Member role updated')
    } catch (err) {
      toast.error('Failed to update role')
    }
  }

  const currentUserMember = members.find((m) => m.user.id === user?.id)
  const isAdmin = currentUserMember?.role === 'admin'

  return (
    <div className="app-container py-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Security Protocol</h1>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">
          {activeWorkspace?.name} • {members.length} Authorized Entities
        </p>
      </div>

      {isAdmin && (
        <div className="bg-[#12141a]/40 border border-white/5 rounded-[2rem] p-8 mb-8 backdrop-blur-xl">
          <h2 className="text-[11px] font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
            <UserPlus size={16} className="text-primary-400" /> Personnel Induction
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 block opacity-70">Identify Personnel</label>
              <div className="relative">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  className="w-full rounded-xl h-12 pl-12 pr-4 text-[13px] font-bold bg-[#12141a]/60 border border-white/5 text-slate-200 focus:border-primary-500/50 outline-none transition-all"
                  placeholder="Email or Full Name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <SegmentedControl
              label="Assigned Clearance"
              options={ROLE_OPTIONS}
              value={inviteRole}
              onChange={setInviteRole}
            />
          </div>

          {search && (
            <div className="mt-4 bg-[#12141a]/60 border border-white/5 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
              {availableUsers.length === 0 ? (
                <div className="p-8 text-center text-[11px] font-black text-slate-600 uppercase tracking-widest">No matching personnel found</div>
              ) : (
                availableUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 transition-colors group"
                    onClick={() => handleAddMember(u.id)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 border border-white/5 flex items-center justify-center text-white text-[11px] font-black flex-shrink-0 group-hover:scale-110 transition-transform">
                      {u.initials}
                    </div>
                    <div>
                      <p className="text-[13px] font-black text-white uppercase tracking-tight">{u.full_name}</p>
                      <p className="text-[10px] font-bold text-slate-500">{u.email}</p>
                    </div>
                    <button className="ml-auto text-[10px] font-black text-primary-400 uppercase tracking-widest px-4 py-2 rounded-lg bg-primary-500/10 border border-primary-500/20 hover:bg-primary-500/20 transition-all">Induct</button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <div className="bg-[#12141a]/40 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-xl">
        <div className="px-8 py-6 border-b border-white/5">
          <h2 className="text-[11px] font-black text-white uppercase tracking-widest">Active Clearance List ({members.length})</h2>
        </div>
        <div className="divide-y divide-white/5">
          {members.map((member) => (
            <div key={member.id} className="flex flex-col sm:flex-row sm:items-center gap-6 px-8 py-6 group hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 border border-white/5 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                  {member.user.initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[14px] font-black text-white uppercase tracking-tight">{member.user.full_name}</p>
                    {member.user.id === user?.id && (
                      <span className="text-[9px] font-black bg-white/5 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-widest">Primary</span>
                    )}
                    {member.status === 'pending' && (
                      <span className="text-[9px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-md uppercase tracking-widest animate-pulse">Awaiting Approval</span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 mt-0.5">{member.user.email}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end gap-6">
                {isAdmin && member.user.id !== user?.id ? (
                  <div className="w-64">
                    <SegmentedControl
                      options={ROLE_OPTIONS}
                      value={member.role}
                      onChange={(newRole) => handleRoleChange(member.user.id, newRole)}
                    />
                  </div>
                ) : (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                    member.role === 'admin' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    : member.role === 'member' ? 'bg-primary-500/10 text-primary-400 border-primary-500/20'
                    : 'bg-white/5 text-slate-500 border-white/5'
                  }`}>
                    {ROLE_ICONS[member.role]}
                    {member.role}
                  </div>
                )}
                {isAdmin && member.user.id !== user?.id && (
                  <button
                    onClick={() => setMemberToRemove(member)}
                    className="p-3 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all opacity-0 group-hover:opacity-100"
                    title="Terminate Access"
                  >
                    <Trash2 size={16} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemove}
        title="Revoke Clearance?"
        message={`Warning: You are about to revoke all access for "${memberToRemove?.user?.full_name}". This will terminate their connection to all localized projects and data streams.`}
        confirmText="Revoke Access"
        isDanger={true}
        isLoading={isRemoving}
      />
    </div>
  )
}
