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
    <section className={`flex min-w-0 flex-1 flex-col overflow-hidden bg-surface-950 ${className}`}>
      {/* ── Header ── */}
      <header className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-slate-800/60 bg-surface-900/80 px-4 py-3 backdrop-blur-md sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          {/* Back button (mobile) */}
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition-colors hover:border-slate-500 hover:text-white lg:hidden"
          >
            <ArrowLeft size={15} />
          </button>

          {/* Room icon */}
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600/30 to-primary-500/10 ring-1 ring-primary-500/20">
            <MessageSquare size={16} className="text-primary-300" />
          </div>

          {/* Title */}
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold text-white sm:text-base">{title}</h1>
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
          <div className="hidden shrink-0 items-center gap-1.5 rounded-xl border border-slate-700/50 bg-surface-800/60 px-3 py-1.5 text-xs text-slate-400 sm:flex">
            <Users size={12} />
            <span>{members.length}</span>
          </div>
        )}
      </header>

      {/* ── Loading skeleton ── */}
      {loadingMessages && (
        <div className="flex flex-1 flex-col gap-4 overflow-hidden px-5 py-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
              <div className="h-8 w-8 flex-shrink-0 rounded-full skeleton" />
              <div className={`flex max-w-[60%] flex-col gap-1.5 ${i % 2 === 0 ? 'items-end' : ''}`}>
                <div className="h-3 w-16 rounded skeleton" />
                <div className={`h-10 rounded-2xl skeleton ${i % 2 === 0 ? 'w-48' : 'w-56'}`} />
              </div>
            </div>
          ))}
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
