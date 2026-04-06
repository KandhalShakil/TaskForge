import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { UserPlus, Trash2, Crown, Shield, Eye, Loader2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { authAPI } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

const ROLE_ICONS = {
  admin: <Crown size={12} className="text-yellow-400" />,
  member: <Shield size={12} className="text-primary-400" />,
  viewer: <Eye size={12} className="text-slate-400" />,
}

export default function WorkspaceMembersPage() {
  const { workspaceId } = useParams()
  const { user } = useAuthStore()
  const { activeWorkspace, members, fetchMembers, addMember, removeMember } = useWorkspaceStore()
  const [allUsers, setAllUsers] = useState([])
  const [search, setSearch] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchMembers(workspaceId)
    authAPI.listUsers().then(({ data }) => setAllUsers(data.results || data))
  }, [workspaceId])

  const memberUserIds = new Set(members.map((m) => m.user.id))
  const availableUsers = allUsers.filter(
    (u) => !memberUserIds.has(u.id) &&
      (u.email.toLowerCase().includes(search.toLowerCase()) ||
       u.full_name.toLowerCase().includes(search.toLowerCase()))
  )

  const handleAddMember = async (userId) => {
    setLoading(true)
    try {
      await addMember(workspaceId, { user_id: userId, role: inviteRole })
      toast.success('Member added!')
      setSearch('')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (memberId) => {
    if (!confirm('Remove this member from the workspace?')) return
    try {
      await removeMember(workspaceId, memberId)
      toast.success('Member removed')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot remove member')
    }
  }

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await updateMemberRole(workspaceId, memberId, newRole)
      toast.success('Member role updated')
    } catch (err) {
      toast.error('Failed to update role')
    }
  }

  const currentUserMember = members.find((m) => m.user.id === user?.id)
  const isAdmin = currentUserMember?.role === 'admin'

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Workspace Members</h1>
        <p className="text-slate-400 text-sm mt-1">
          {activeWorkspace?.name} · {members.length} members
        </p>
      </div>

      {isAdmin && (
        <div className="card p-5 mb-6">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <UserPlus size={16} className="text-primary-400" /> Add Members
          </h2>
          <div className="flex gap-3 mb-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                className="input pl-9"
                placeholder="Search users by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="select w-32"
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          {search && (
            <div className="border border-slate-700 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              {availableUsers.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">No users found</div>
              ) : (
                availableUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-800 cursor-pointer border-b border-slate-800 last:border-0"
                    onClick={() => handleAddMember(u.id)}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {u.initials}
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">{u.full_name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                    <button className="ml-auto btn-primary py-1 px-3 text-xs">Add</button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Member list */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white">Current Members ({members.length})</h2>
        </div>
        <div className="divide-y divide-slate-800">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {member.user.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white">{member.user.full_name}</p>
                  {member.user.id === user?.id && (
                    <span className="badge bg-surface-800 text-slate-400 text-xs">You</span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{member.user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && member.user.id !== user?.id ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.user.id, e.target.value)}
                    className="select py-1 h-auto text-xs w-28 bg-surface-800 border-slate-700"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                ) : (
                  <span className={`badge flex items-center gap-1.5 px-2.5 py-1 ${
                    member.role === 'admin' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50'
                    : member.role === 'member' ? 'bg-primary-900/30 text-primary-400 border border-primary-800/50'
                    : 'bg-slate-800 text-slate-400'
                  }`}>
                    {ROLE_ICONS[member.role]}
                    {member.role}
                  </span>
                )}
                {isAdmin && member.user.id !== user?.id && (
                  <button
                    onClick={() => handleRemove(member.user.id)}
                    className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-all ml-1"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
