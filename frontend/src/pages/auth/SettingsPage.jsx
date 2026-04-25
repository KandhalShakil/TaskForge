import { useState } from 'react'
import { User, Settings, Shield, Bell, Palette, ChevronRight, Menu } from 'lucide-react'
import ProfileSection from './SettingsSections/ProfileSection'
import AccountSection from './SettingsSections/AccountSection'
import SecuritySection from './SettingsSections/SecuritySection'
import NotificationsSection from './SettingsSections/NotificationsSection'
import AppearanceSection from './SettingsSections/AppearanceSection'

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User, desc: 'Personal information and avatar' },
  { id: 'account', label: 'Account', icon: Settings, desc: 'Workspace and data management' },
  { id: 'security', label: 'Security', icon: Shield, desc: 'Password and authentication' },
  { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Email and app alerts' },
  { id: 'appearance', label: 'Appearance', icon: Palette, desc: 'Theme and styling' },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return <ProfileSection />
      case 'account': return <AccountSection />
      case 'security': return <SecuritySection />
      case 'notifications': return <NotificationsSection />
      case 'appearance': return <AppearanceSection />
      default: return <ProfileSection />
    }
  }

  const activeSection = SECTIONS.find(s => s.id === activeTab)

  return (
    <div className="app-container py-6 md:py-10">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>Settings</h1>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Manage your account preferences and settings.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
        {/* Sidebar Navigation */}
        <div className={`
          lg:w-72 flex-shrink-0 space-y-1
          ${showMobileSidebar ? 'fixed inset-0 z-50 p-6 overflow-y-auto' : 'hidden lg:block'}
        `} style={showMobileSidebar ? { backgroundColor: 'var(--bg-page)' } : {}}>
          {showMobileSidebar && (
            <div className="flex items-center justify-between mb-8 lg:hidden">
              <span className="font-bold" style={{ color: 'var(--text-main)' }}>Menu</span>
              <button onClick={() => setShowMobileSidebar(false)} style={{ color: 'var(--text-muted)' }}>Close</button>
            </div>
          )}

          {SECTIONS.map((section) => {
            const Icon = section.icon
            const isActive = activeTab === section.id
            
            return (
              <button
                key={section.id}
                onClick={() => {
                  setActiveTab(section.id)
                  setShowMobileSidebar(false)
                }}
                className={`
                  w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group border
                  ${isActive 
                    ? 'bg-primary-600/10 text-primary-400 border-primary-500/20 shadow-lg shadow-primary-900/5' 
                    : 'text-slate-500 hover:text-slate-200'
                  }
                `}
                style={!isActive ? { backgroundColor: 'transparent', borderColor: 'transparent' } : {}}
              >
                <div className={`
                  p-2 rounded-lg transition-colors
                  ${isActive ? 'bg-primary-600 text-white' : 'bg-surface-800 group-hover:bg-surface-700'}
                `}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold truncate">{section.label}</p>
                  <p className={`text-[10px] truncate ${isActive ? 'text-primary-400/70' : 'text-slate-600'}`}>
                    {section.desc}
                  </p>
                </div>
                {isActive && <ChevronRight size={14} className="text-primary-500" />}
              </button>
            )
          })}
        </div>

        {/* Mobile Sidebar Toggle */}
        <button 
          onClick={() => setShowMobileSidebar(true)}
          className="lg:hidden flex items-center gap-2 px-4 py-3 bg-surface-900 border border-slate-800 rounded-xl text-slate-300"
        >
          <Menu size={18} />
          <span className="text-sm font-medium">Settings Menu</span>
          <div className="ml-auto flex items-center gap-2 text-primary-400">
            <span className="text-xs uppercase font-bold tracking-wider">{activeSection.label}</span>
            <ChevronRight size={14} />
          </div>
        </button>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="card p-6 md:p-8 min-h-full">
            <div className="mb-8 pb-6 border-b" style={{ borderColor: 'var(--border-main)' }}>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>{activeSection.label}</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{activeSection.desc}</p>
            </div>
            
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}
