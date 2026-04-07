import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import CommandPalette from '../common/CommandPalette'
import GlobalLoadingBar from '../common/GlobalLoadingBar'
import { useWorkspaceStore } from '../../store/workspaceStore'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const location = useLocation()
  const { fetchWorkspaces, fetchInvitations } = useWorkspaceStore()

  // Prefetch core data on mount
  useEffect(() => {
    fetchWorkspaces()
    fetchInvitations()
  }, [])

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Global Command+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-surface-950">
      <GlobalLoadingBar />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header onMenuClick={() => setSidebarOpen(true)} onSearchClick={() => setCommandPaletteOpen(true)} />
        <main className="flex-1 overflow-y-auto w-full">
          <Outlet />
        </main>
      </div>

      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
      />
    </div>
  )
}
