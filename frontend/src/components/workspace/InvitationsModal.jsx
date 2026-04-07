import { X, Check, Trash2, Mail } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import toast from 'react-hot-toast'
import { useState } from 'react'
import ConfirmModal from '../common/ConfirmModal'

export default function InvitationsModal({ onClose }) {
  const { invitations, acceptInvitation, declineInvitation } = useWorkspaceStore()
  const [inviteToDecline, setInviteToDecline] = useState(null)
  const [isDeclining, setIsDeclining] = useState(false)

  const handleAccept = async (id) => {
    try {
      await acceptInvitation(id)
      toast.success('Invitation accepted!')
    } catch (err) {
      toast.error('Failed to accept invitation')
    }
  }

  const handleDecline = async () => {
    if (!inviteToDecline) return
    setIsDeclining(true)
    try {
      await declineInvitation(inviteToDecline.id)
      toast.success('Invitation declined')
      setInviteToDecline(null)
    } catch (err) {
      toast.error('Failed to decline invitation')
    } finally {
      setIsDeclining(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Mail size={18} className="text-primary-400" /> Workspace Invitations
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <div className="p-6 max-h-[400px] overflow-y-auto">
          {invitations.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mx-auto mb-3">
                <Mail size={24} className="text-slate-600" />
              </div>
              <p className="text-slate-400 text-sm font-medium">No pending invitations</p>
              <button onClick={onClose} className="btn-secondary mt-4">Close Info</button>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((invite) => (
                <div 
                  key={invite.id} 
                  className="bg-surface-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4 hover:border-slate-700/50 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-inner" style={{ background: invite.workspace.color + '20' }}>
                    {invite.workspace.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{invite.workspace.name}</p>
                    <p className="text-xs text-slate-500 truncate">Invited by: {invite.workspace.owner.full_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setInviteToDecline(invite)}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-all font-bold"
                      title="Decline"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleAccept(invite.id)}
                      className="p-2 rounded-lg bg-primary-600/20 text-primary-400 hover:bg-primary-600 hover:text-white transition-all shadow-lg shadow-primary-900/20"
                      title="Accept"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <ConfirmModal
          isOpen={!!inviteToDecline}
          onClose={() => setInviteToDecline(null)}
          onConfirm={handleDecline}
          title="Decline Invitation?"
          message={`Are you sure you want to decline the invitation to join "${inviteToDecline?.workspace?.name}"?`}
          confirmText="Decline Invitation"
          isDanger={true}
          isLoading={isDeclining}
        />
      </div>
    </div>
  )
}
