import { Workflow, Hash, Users, MessageSquarePlus, SendHorizonal, Radio } from 'lucide-react'

export default function ChatSidebar({
  workspace,
  threads = [],
  members = [],
  activeRoom,
  activeTaskRoom,
  onSelectThread,
  onStartDirectMessage,
  className = '',
}) {
  const workspaceThread = threads.find((t) => t.chatType === 'workspace')
  const taskThread =
    threads.find((t) => t.chatType === 'task') ||
    (activeTaskRoom
      ? { roomId: activeTaskRoom, chatType: 'task', title: 'Task chat', subtitle: 'Current task' }
      : null)
  const directThreads = threads.filter((t) => t.chatType === 'direct')

  return (
    <aside
      className={`w-full shrink-0 flex-col overflow-hidden border-r border-slate-800/60 bg-surface-950 lg:w-72 xl:w-80 ${className}`}
    >
      {/* Header */}
      <div className="border-b border-slate-800/60 bg-surface-900/60 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600/30 to-primary-500/10 text-xl ring-1 ring-primary-500/20">
            {workspace?.icon || '💬'}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-600">Chat</p>
            <h2 className="truncate text-sm font-bold text-white">{workspace?.name || 'Workspace'}</h2>
          </div>
        </div>
      </div>

      {/* Threads */}
      <div className="flex-1 space-y-5 overflow-y-auto px-3 py-4 sm:px-4">
        {/* Workspace thread */}
        {workspaceThread && (
          <Section label="Workspace" icon={<Workflow size={11} />}>
            <ThreadItem
              thread={workspaceThread}
              isActive={activeRoom === workspaceThread.roomId}
              onClick={() => onSelectThread(workspaceThread)}
            />
          </Section>
        )}

        {/* Task thread */}
        {taskThread && (
          <Section label="Task" icon={<Hash size={11} />}>
            <ThreadItem
              thread={taskThread}
              isActive={activeRoom === taskThread.roomId}
              onClick={() => onSelectThread(taskThread)}
            />
          </Section>
        )}

        {/* Direct messages */}
        <Section label="Direct Messages" icon={<Users size={11} />}>
          {directThreads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-surface-900/40 px-4 py-5 text-center text-xs text-slate-600">
              No direct messages yet
            </div>
          ) : (
            directThreads.map((thread) => (
              <ThreadItem
                key={thread.roomId}
                thread={thread}
                isActive={activeRoom === thread.roomId}
                onClick={() => onSelectThread(thread)}
              />
            ))
          )}
        </Section>

        {/* Start a DM */}
        {members.length > 0 && (
          <Section label="Start a DM" icon={<MessageSquarePlus size={11} />}>
            <div className="space-y-1.5">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => onStartDirectMessage(member)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-slate-800/60 bg-surface-900/60 px-3 py-2.5 text-left transition-all hover:border-slate-600/60 hover:bg-surface-800"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-slate-700 to-slate-600 text-xs font-bold text-slate-200 ring-1 ring-slate-700">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.full_name} className="h-full w-full object-cover" />
                    ) : (
                      member.initials || member.full_name?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{member.full_name}</p>
                    <p className="truncate text-[11px] text-slate-500">{member.role}</p>
                  </div>
                  <SendHorizonal size={13} className="shrink-0 text-slate-700" />
                </button>
              ))}
            </div>
          </Section>
        )}
      </div>
    </aside>
  )
}

function Section({ label, icon, children }) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-600">
        {icon}
        {label}
      </div>
      <div className="space-y-1.5">{children}</div>
    </section>
  )
}

function ThreadItem({ thread, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border px-3.5 py-3 text-left transition-all duration-150 ${
        isActive
          ? 'border-primary-500/30 bg-primary-600/10 shadow-sm shadow-primary-900/10'
          : 'border-slate-800/60 bg-surface-900/60 hover:border-slate-700/60 hover:bg-surface-800/60'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-semibold ${isActive ? 'text-primary-200' : 'text-white'}`}>
            {thread.title}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">{thread.subtitle}</p>
        </div>

        {!!thread.unreadCount && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-500 px-1.5 text-[10px] font-bold text-white shadow-sm shadow-primary-900/30">
            {thread.unreadCount > 99 ? '99+' : thread.unreadCount}
          </span>
        )}
      </div>

      {thread.lastMessage && (
        <p className={`mt-1.5 truncate text-[11px] ${isActive ? 'text-primary-300/70' : 'text-slate-600'}`}>
          {thread.lastMessage}
        </p>
      )}
    </button>
  )
}
