import { useEffect, useState, useMemo } from 'react'
import { ArrowLeft, MessageSquare, Users, Loader } from 'lucide-react'
import MessageList from './MessageList'
import MessageInput from './MessageInput'

export default function ChatWindow({
  workspace,
  title,
  subtitle,
  messages = [],
  currentUserId,
  onSend,
  onLoadMore,
  onEdit,
  onDelete,
  onRetry,
  onTyping,
  onAttachment,
  hasMore,
  loadingMessages,
  realtimeStatus,
  activeRoom,
  typingUsers = {},
  editingMessage,
  onCancelEdit,
  onClearEditing,
  onBack,
  onStartDirectMessage,
  members = [],
  className = '',
}) {
  const [draft, setDraft] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [fileUploading, setFileUploading] = useState(false)

  useEffect(() => {
    setDraft(editingMessage?.message || '')
    setAttachment(
      editingMessage?.attachmentUrl
        ? { url: editingMessage.attachmentUrl, name: editingMessage.attachmentName, type: editingMessage.attachmentType }
        : null
    )
  }, [editingMessage?.id])

  // Forwarded directly — MessageInput handles instant clear + fire-and-forget
  const handleSend = (payload) => onSend(payload)

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setFileUploading(true)
    try {
      const result = await onAttachment(file)
      setAttachment(result)
    } catch (error) {
      toast.error(error?.message || 'Upload failed')
    } finally {
      setFileUploading(false)
      event.target.value = ''
    }
  }

  const typingCount = Object.keys(typingUsers).length
  const threadLabel = useMemo(() => {
    if (typingCount > 0) return `${typingCount} typing…`
    return subtitle
  }, [subtitle, typingCount])

  const isConnected = realtimeStatus === 'open'
  const isConnecting = realtimeStatus === 'connecting'

  return (
    <section className={`flex min-w-0 flex-1 flex-col overflow-hidden ${className}`} style={{ backgroundColor: 'var(--bg-page)' }}>
      {/* ── Header ── */}
      <header 
        className="flex flex-shrink-0 items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur-md sm:px-5"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-main)' }}
      >
        <div className="flex min-w-0 items-center gap-3">
          {/* Back button (mobile) */}
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-xl border text-slate-400 transition-colors hover:text-white lg:hidden"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-main)' }}
          >
            <ArrowLeft size={15} />
          </button>

          {/* Room icon */}
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600/30 to-primary-500/10 ring-1 ring-primary-500/20">
            <MessageSquare size={16} className="text-primary-300" />
          </div>

          {/* Title */}
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold sm:text-base" style={{ color: 'var(--text-main)' }}>{title}</h1>
            <div className="flex items-center gap-1.5">
              {isConnected && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />}
              {isConnecting && <Loader size={10} className="animate-spin text-amber-400" />}
              {!isConnected && !isConnecting && <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />}
              <span className="truncate text-[11px] text-slate-500">{threadLabel}</span>
            </div>
          </div>
        </div>

        {/* Members pill */}
        {members.length > 0 && (
          <div 
            className="hidden shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs text-slate-400 sm:flex"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-main)' }}
          >
            <Users size={12} />
            <span>{members.length}</span>
          </div>
        )}
      </header>

      {/* ── Loading indicator ── */}
      {loadingMessages && (
        <div className="flex flex-1 flex-col items-center justify-center bg-surface-950/20 backdrop-blur-[2px]">
          <div className="relative flex items-center justify-center">
            {/* Outer spinning ring */}
            <div 
              className="h-12 w-12 rounded-full border-[3px] border-slate-800 border-t-primary-500 animate-spin shadow-[0_0_20px_rgba(6,182,212,0.15)]"
            ></div>
            {/* Inner pulsing core */}
            <div className="absolute h-6 w-6 rounded-full border-2 border-primary-500/10 animate-ping"></div>
          </div>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 animate-pulse">
            Synchronizing
          </p>
        </div>
      )}

      {/* ── Message list ── */}
      {!loadingMessages && (
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          onLoadMore={onLoadMore}
          hasMore={hasMore}
          loadingMore={false}
          onEdit={onEdit}
          onDelete={onDelete}
          onRetry={onRetry}
          typingUsers={typingUsers}
        />
      )}

      {/* ── Input ── */}
      <MessageInput
        value={draft}
        onChange={setDraft}
        onSend={handleSend}
        onTyping={onTyping}
        onFileSelected={handleFileSelected}
        disabled={fileUploading}
        editingMessage={editingMessage}
        onCancelEdit={onCancelEdit}
        attachment={attachment}
        onClearAttachment={() => setAttachment(null)}
      />
    </section>
  )
}
