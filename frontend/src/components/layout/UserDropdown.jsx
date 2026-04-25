import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, Settings, LogOut, ChevronUp } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export default function UserDropdown({ user }) {
  const [isOpen, setIsOpen] = useState(false)
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
        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border transition-all group ${
          isOpen 
            ? 'border-primary-500/50 bg-primary-500/5 shadow-lg shadow-primary-900/10' 
            : 'border-transparent hover:bg-opacity-50'
        }`}
        style={!isOpen ? { backgroundColor: 'transparent' } : {}}
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-lg shadow-primary-900/20 group-hover:scale-105 transition-transform">
          {user?.avatar ? (
             <img src={user.avatar} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
          ) : (
            user?.initials || user?.full_name?.charAt(0) || '?'
          )}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-bold truncate leading-tight" style={{ color: 'var(--text-main)' }}>{user?.full_name}</p>
          <p className="text-[10px] font-medium truncate uppercase mt-0.5 tracking-wider" style={{ color: 'var(--text-muted)' }}>{user?.user_type || 'User'}</p>
        </div>
        <ChevronUp 
          size={16} 
          className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          style={{ color: 'var(--text-muted)' }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute bottom-full left-0 w-full mb-2 border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-[1001]"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-main)' }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-main)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Account</p>
            <p className="text-sm font-bold truncate" style={{ color: 'var(--text-main)' }}>{user?.email}</p>
          </div>

          {/* Options */}
          <div className="p-1.5">
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-surface-800 transition-all group"
            >
              <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-primary-500/10 group-hover:text-primary-400 transition-colors">
                <User size={16} />
              </div>
              <span className="text-sm font-medium">Profile</span>
            </Link>

            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-surface-800 transition-all group"
            >
              <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-primary-500/10 group-hover:text-primary-400 transition-colors">
                <Settings size={16} />
              </div>
              <span className="text-sm font-medium">Settings</span>
            </Link>

            <div className="h-px bg-slate-800 my-1.5 mx-2" />

            <button
              onClick={() => {
                setIsOpen(false)
                logout()
              }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all group"
            >
              <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-red-400/10 transition-colors">
                <LogOut size={16} />
              </div>
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
