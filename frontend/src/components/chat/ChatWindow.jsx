import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Hash, Users, Wifi, WifiOff } from 'lucide-react'
import toast from 'react-hot-toast'
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
  onStartEdit,
  onClearEditing,
  onBack,
  onStartDirectMessage,
  members = [],
  className = '',
}) {
  const [draft, setDraft] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const [fileUploading, setFileUploading] = useState(false)

  useEffect(() => {
    setDraft(editingMessage?.message || '')
    setAttachment(editingMessage?.attachmentUrl ? {
      url: editingMessage.attachmentUrl,
      name: editingMessage.attachmentName,
      type: editingMessage.attachmentType,
    } : null)
  }, [editingMessage?.id])

  const typingCount = Object.keys(typingUsers).length
  const statusLabel = realtimeStatus === 'open' ? 'Connected' : realtimeStatus === 'connecting' ? 'Connecting' : 'Offline'
  const StatusIcon = realtimeStatus === 'open' ? Wifi : WifiOff

  const handleSend = async () => {
    if (!draft.trim() && !attachment) return
    setIsSending(true)
    try {
      await onSend({
        message: draft.trim(),
        attachment,
        editingMessage,
      })
      setDraft('')
      setAttachment(null)
      onClearEditing?.()
    } catch (error) {
      toast.error(error?.message || 'Unable to send message')
    } finally {
      setIsSending(false)
    }
  }

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFileUploading(true)
    try {
      const result = await onAttachment(file)
      setAttachment(result)
    } catch (error) {
      toast.error(error?.message || 'Attachment upload failed')
    } finally {
      setFileUploading(false)
      event.target.value = ''
    }
  }

  const threadLabel = useMemo(() => {
    if (typingCount > 0) {
      return `${typingCount} user${typingCount > 1 ? 's' : ''} typing...`
    }
    return subtitle
  }, [subtitle, typingCount])

  return (
    <section className={`min-w-0 flex-1 flex-col bg-surface-950 ${className}`}>
      <header className="flex items-center justify-between gap-4 border-b border-slate-800 bg-surface-900/85 px-4 py-4 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 text-slate-400 transition-colors hover:border-slate-600 hover:text-white lg:hidden"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary-500/20 bg-primary-500/10 text-primary-200">
            <Hash size={16} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-white">{title}</h1>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <StatusIcon size={12} className={realtimeStatus === 'open' ? 'text-emerald-400' : 'text-slate-600'} />
              <span>{statusLabel}</span>
              <span>•</span>
              <span className="truncate">{threadLabel}</span>
            </div>
          </div>
        </div>

        {onStartDirectMessage && members.length > 0 && (
          <div className="hidden items-center gap-2 rounded-full border border-slate-800 bg-surface-950 px-3 py-2 text-xs text-slate-400 md:flex">
            <Users size={12} />
            <span>{members.length} members</span>
          </div>
        )}
      </header>

      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        onLoadMore={onLoadMore}
        hasMore={hasMore}
        loadingMore={loadingMessages}
        onEdit={onEdit}
        onDelete={onDelete}
        onRetry={onRetry}
        typingUsers={typingUsers}
      />

      <MessageInput
        value={draft}
        onChange={setDraft}
        onSend={handleSend}
        onTyping={onTyping}
        onFileSelected={handleFileSelected}
        disabled={isSending || fileUploading}
        editingMessage={editingMessage}
        onCancelEdit={onCancelEdit}
        attachment={attachment}
        onClearAttachment={() => setAttachment(null)}
      />
    </section>
  )
}
