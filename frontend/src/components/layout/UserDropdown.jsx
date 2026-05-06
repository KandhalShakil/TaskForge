import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, Settings, LogOut, ChevronUp, Bell, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import ConfirmModal from '../common/ConfirmModal'
import { motion, AnimatePresence } from 'framer-motion'

export default function UserDropdown({ user }) {
  const [isOpen, setIsOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const dropdownRef = useRef(null)
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 w-full px-3 py-3 rounded-2xl border transition-all duration-300 group ${
          isOpen 
            ? 'border-primary-500/50 bg-primary-500/5 shadow-2xl shadow-primary-500/10' 
            : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'
        }`}
      >
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-lg border border-white/10 group-hover:scale-110 transition-all duration-300">
            {user?.avatar ? (
               <img src={user.avatar} alt={user.full_name} className="w-full h-full rounded-xl object-cover" />
            ) : (
              user?.initials || user?.full_name?.charAt(0) || '?'
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-sm" />
        </div>
        
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-black text-white truncate uppercase tracking-tighter leading-tight">{user?.full_name}</p>
          <p className="text-[10px] font-bold text-slate-500 truncate uppercase mt-0.5 tracking-[0.1em]">{user?.user_type || 'Personal'}</p>
        </div>
        
        <ChevronUp 
          size={14} 
          className={`text-slate-600 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-0 w-full mb-3 bg-slate-900 border border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[1001] backdrop-blur-xl"
          >
            {/* Header */}
            <div className="px-6 py-5 bg-white/[0.02] border-b border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Active Account</span>
                <ShieldCheck size={12} className="text-primary-500" />
              </div>
              <p className="text-xs font-bold text-slate-200 truncate">{user?.email}</p>
            </div>

            {/* Options */}
            <div className="p-3 space-y-1">
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 px-4 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center group-hover:bg-primary-500/10 group-hover:text-primary-400 transition-all duration-300">
                  <User size={14} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">Profile</span>
              </Link>

              <Link
                to="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 px-4 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center group-hover:bg-primary-500/10 group-hover:text-primary-400 transition-all duration-300">
                  <Settings size={14} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">Settings</span>
              </Link>

              <div className="h-px bg-white/5 my-2 mx-4" />

              <button
                onClick={() => {
                  setIsOpen(false)
                  setShowLogoutModal(true)
                }}
                className="flex items-center gap-4 w-full px-4 py-3 rounded-2xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center group-hover:bg-rose-500/10 transition-all duration-300">
                  <LogOut size={14} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={logout}
        title="Session Termination"
        message="You are about to end your current session. All unsaved progress will be maintained in the cloud."
        confirmText="Confirm Logout"
        cancelText="Remain Active"
        isDanger={true}
      />
    </div>
  )
}
