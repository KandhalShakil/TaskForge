import { MessageSquarePlus, Users, Hash, Workflow, SendHorizonal } from 'lucide-react'

export default function ChatSidebar({
  workspace,
  threads = [],
  members = [],
  activeRoom,
  activeTaskRoom,
  onSelectThread,
  onStartDirectMessage,
}) {
  const workspaceThread = threads.find((thread) => thread.chatType === 'workspace')
  const taskThread = threads.find((thread) => thread.chatType === 'task') || (activeTaskRoom ? { roomId: activeTaskRoom, chatType: 'task', title: 'Task chat', subtitle: 'Current task' } : null)
  const directThreads = threads.filter((thread) => thread.chatType === 'direct')

  return (
    <aside className="flex w-full shrink-0 flex-col border-r border-slate-800 bg-surface-950/95 lg:w-80">
      <div className="border-b border-slate-800 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary-500/20 bg-primary-500/10 text-2xl">
            {workspace?.icon || '💬'}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Chat</p>
            <h2 className="truncate text-lg font-semibold text-white">{workspace?.name || 'Workspace chat'}</h2>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {workspaceThread && (
          <section>
            <div className="mb-2 flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
              <Workflow size={12} /> Workspace
            </div>
            <button
              type="button"
              onClick={() => onSelectThread(workspaceThread)}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${activeRoom === workspaceThread.roomId ? 'border-primary-500/40 bg-primary-500/10' : 'border-slate-800 bg-surface-900 hover:border-slate-600'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{workspaceThread.title}</p>
                  <p className="truncate text-xs text-slate-500">{workspaceThread.subtitle}</p>
                </div>
                {!!workspaceThread.unreadCount && (
                  <span className="rounded-full bg-primary-500 px-2 py-0.5 text-[11px] font-semibold text-white">{workspaceThread.unreadCount}</span>
                )}
              </div>
              <p className="mt-2 truncate text-xs text-slate-400">{workspaceThread.lastMessage || 'No messages yet'}</p>
            </button>
          </section>
        )}

        {taskThread && (
          <section>
            <div className="mb-2 flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
              <Hash size={12} /> Task
            </div>
            <button
              type="button"
              onClick={() => onSelectThread(taskThread)}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${activeRoom === taskThread.roomId ? 'border-primary-500/40 bg-primary-500/10' : 'border-slate-800 bg-surface-900 hover:border-slate-600'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{taskThread.title}</p>
                  <p className="truncate text-xs text-slate-500">{taskThread.subtitle}</p>
                </div>
                {!!taskThread.unreadCount && (
                  <span className="rounded-full bg-primary-500 px-2 py-0.5 text-[11px] font-semibold text-white">{taskThread.unreadCount}</span>
                )}
              </div>
              <p className="mt-2 truncate text-xs text-slate-400">{taskThread.lastMessage || 'No messages yet'}</p>
            </button>
          </section>
        )}

        <section>
          <div className="mb-2 flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
            <Users size={12} /> Direct Messages
          </div>
          <div className="space-y-2">
            {directThreads.map((thread) => (
              <button
                key={thread.roomId}
                type="button"
                onClick={() => onSelectThread(thread)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${activeRoom === thread.roomId ? 'border-primary-500/40 bg-primary-500/10' : 'border-slate-800 bg-surface-900 hover:border-slate-600'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{thread.title}</p>
                    <p className="truncate text-xs text-slate-500">{thread.subtitle}</p>
                  </div>
                  {!!thread.unreadCount && (
                    <span className="rounded-full bg-primary-500 px-2 py-0.5 text-[11px] font-semibold text-white">{thread.unreadCount}</span>
                  )}
                </div>
                <p className="mt-2 truncate text-xs text-slate-400">{thread.lastMessage || 'No messages yet'}</p>
              </button>
            ))}
            {directThreads.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-surface-900/50 px-4 py-5 text-sm text-slate-500">
                No direct messages yet.
              </div>
            )}
          </div>
        </section>

        {members.length > 0 && (
          <section>
            <div className="mb-2 flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
              <MessageSquarePlus size={12} /> Start a DM
            </div>
            <div className="space-y-2">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => onStartDirectMessage(member)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-slate-800 bg-surface-900 px-4 py-3 text-left text-sm text-slate-200 transition-colors hover:border-slate-600"
                >
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-surface-800 text-xs text-slate-300">
                    {member.avatar ? <img src={member.avatar} alt={member.full_name} className="h-full w-full object-cover" /> : member.initials || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{member.full_name}</p>
                    <p className="truncate text-xs text-slate-500">{member.role}</p>
                  </div>
                  <SendHorizonal size={14} className="text-slate-600" />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </aside>
  )
}
