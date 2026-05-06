import { createPortal } from 'react-dom'
import { X, Check, Trash2, Mail } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ConfirmModal from '../common/ConfirmModal'
import { connectSocket } from '../../utils/socket'
import Button from '../common/Button'

export default function InvitationsModal({ onClose }) {
  const { invitations, acceptInvitation, declineInvitation } = useWorkspaceStore()
  const [inviteToDecline, setInviteToDecline] = useState(null)
  const [isDeclining, setIsDeclining] = useState(false)

  const handleAccept = async (id) => {
    try {
      const invite = invitations.find((inv) => inv.id === id)
      await acceptInvitation(id)
      
      if (invite) {
        const socket = connectSocket()
        socket.emit('accept_invitation', {
          workspaceId: invite.workspace.id,
          member: {
            id: invite.id,
            user: invite.user,
            status: 'accepted'
          }
        })
      }
      
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

  return createPortal(
    <div className="fixed inset-0 z-[1100] grid place-items-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-thick w-full max-w-[440px] rounded-[2.5rem] overflow-hidden font-['Outfit'] shadow-[0_30px_100px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 flex items-center justify-center text-primary-400 border border-white/5 premium-glow">
              <Mail size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight text-gradient leading-tight">Invitations</h2>
              <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.15em] mt-0.5 opacity-80">Pending requests</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl hover:bg-white/5 text-slate-500 hover:text-white transition-all group">
            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        <div className="p-6 max-h-[500px] overflow-y-auto">
          {invitations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-[2rem] bg-slate-950/40 border border-white/5 flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Mail size={32} className="text-slate-600" />
              </div>
              <h3 className="text-white font-black text-lg uppercase tracking-widest mb-2">Inbox Clear</h3>
              <p className="text-slate-500 text-xs font-medium">No pending invitations at the moment.</p>
              <Button onClick={onClose} variant="secondary" size="md" className="mt-8">Close Info</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((invite) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={invite.id} 
                  className="group relative bg-[#12141a]/40 border border-white/5 rounded-[2rem] p-5 flex items-center gap-5 hover:border-primary-500/30 hover:bg-[#12141a]/60 transition-all duration-300 shadow-inner"
                >
                  {/* Workspace Icon Container */}
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-xl transition-all duration-500 group-hover:scale-105 group-hover:rotate-3 shrink-0" 
                    style={{ 
                      backgroundColor: invite.workspace.color + '15', 
                      color: invite.workspace.color, 
                      border: `1px solid ${invite.workspace.color}30` 
                    }}
                  >
                    <span className="flex items-center justify-center leading-none drop-shadow-md">
                      {invite.workspace.icon}
                    </span>
                  </div>

                  {/* Info Section */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className="text-sm font-black text-white truncate uppercase tracking-wider mb-1">
                      {invite.workspace.name}
                    </h4>
                    <div className="flex items-center gap-2 opacity-80">
                      <div className="w-1 h-1 rounded-full bg-primary-500/40" />
                      <p className="text-[10px] text-slate-500 truncate font-bold uppercase tracking-widest">
                        Invited by: <span className="text-slate-300">{invite.workspace.owner.full_name}</span>
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2.5 shrink-0 ml-auto">
                    <Button 
                      onClick={() => setInviteToDecline(invite)}
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      className="!w-10 !h-10 !px-0 rounded-xl hover:text-rose-400 hover:bg-rose-400/10 border border-transparent hover:border-rose-400/20 transition-all active:scale-90"
                      title="Decline"
                    />
                    <Button 
                      onClick={() => handleAccept(invite.id)}
                      variant="primary"
                      size="sm"
                      icon={Check}
                      className="!w-11 !h-11 !px-0 rounded-xl shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
                      title="Accept"
                    />
                  </div>
                </motion.div>
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
      </motion.div>
    </div>,
    document.body
  )
}