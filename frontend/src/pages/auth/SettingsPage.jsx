import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    <div className="flex-1 overflow-y-auto bg-page font-['Outfit']">
      <div className="app-container py-10 md:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Settings</h1>
            <p className="mt-2 text-slate-500 font-medium">Control your TaskForge experience and account security</p>
          </div>
  
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            {/* Sidebar Navigation */}
            <aside className={`
              lg:w-80 w-full flex-shrink-0 space-y-1.5 sticky top-24
              ${showMobileSidebar ? 'fixed inset-0 z-50 p-6 overflow-y-auto bg-slate-950' : 'hidden lg:block'}
            `}>
              {showMobileSidebar && (
                <div className="flex items-center justify-between mb-8 lg:hidden">
                  <span className="font-bold text-white uppercase tracking-widest text-xs">Settings Menu</span>
                  <button onClick={() => setShowMobileSidebar(false)} className="text-slate-500">Close</button>
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
                      w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group border-2
                      ${isActive 
                        ? 'bg-primary-600/10 text-primary-400 border-primary-500/20 shadow-xl shadow-primary-900/10' 
                        : 'text-slate-500 hover:text-slate-300 border-transparent hover:bg-white/5'
                      }
                    `}
                  >
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center transition-all
                      ${isActive ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'bg-slate-800/50 group-hover:bg-slate-800'}
                    `}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-bold truncate leading-tight">{section.label}</p>
                      <p className={`text-[10px] truncate mt-0.5 ${isActive ? 'text-primary-400/60' : 'text-slate-600'}`}>
                        {section.desc}
                      </p>
                    </div>
                    {isActive && (
                      <motion.div layoutId="active-settings-indicator">
                        <ChevronRight size={16} className="text-primary-500" />
                      </motion.div>
                    )}
                  </button>
                )
              })}
            </aside>
  
            {/* Mobile Sidebar Toggle */}
            <button 
              onClick={() => setShowMobileSidebar(true)}
              className="lg:hidden w-full flex items-center gap-3 px-5 py-4 bg-slate-900 border border-white/5 rounded-2xl text-slate-300"
            >
              <Menu size={20} />
              <span className="text-sm font-bold flex-1 text-left">Navigation</span>
              <div className="flex items-center gap-2 text-primary-400">
                <span className="text-[10px] uppercase font-black tracking-[0.2em]">{activeSection.label}</span>
                <ChevronRight size={14} />
              </div>
            </button>
  
            {/* Content Area */}
            <div className="flex-1 min-w-0 w-full">
              <div className="card-hover border-white/5 bg-slate-900/40 p-8 md:p-10 cursor-default">
                <div className="mb-10 pb-8 border-b border-white/5">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-white/5 rounded-2xl text-slate-400">
                      <activeSection.icon size={24} />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight">{activeSection.label}</h2>
                  </div>
                  <p className="text-sm text-slate-500 font-medium ml-14">{activeSection.desc}</p>
                </div>
                
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {renderContent()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
