import { useEffect, useState } from 'react'
import { Edit3, Paperclip, SendHorizonal, X } from 'lucide-react'

export default function MessageInput({
  value,
  onChange,
  onSend,
  onTyping,
  onFileSelected,
  disabled,
  editingMessage,
  onCancelEdit,
  attachment,
  onClearAttachment,
}) {
  const [localTypingTimer, setLocalTypingTimer] = useState(null)

  useEffect(() => () => {
    if (localTypingTimer) {
      clearTimeout(localTypingTimer)
    }
  }, [localTypingTimer])

  const handleChange = (nextValue) => {
    onChange(nextValue)
    onTyping?.(true)
    if (localTypingTimer) {
      clearTimeout(localTypingTimer)
    }
    const timer = setTimeout(() => onTyping?.(false), 1000)
    setLocalTypingTimer(timer)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!value.trim() && !attachment) return
    Promise.resolve()
      .then(() => onSend())
      .catch(() => {})
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-800 bg-surface-950/95 px-4 py-4">
      {editingMessage && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-primary-500/30 bg-primary-500/10 px-3 py-2 text-xs text-primary-200">
          <span className="inline-flex items-center gap-2">
            <Edit3 size={13} /> Editing message
          </span>
          <button type="button" onClick={onCancelEdit} className="text-primary-200 transition-colors hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {attachment && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-slate-700 bg-surface-900 px-3 py-2 text-xs text-slate-300">
          <span className="truncate">Attachment: {attachment.name}</span>
          <button type="button" onClick={onClearAttachment} className="text-slate-500 transition-colors hover:text-slate-200">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-3 rounded-2xl border border-slate-800 bg-surface-900 px-3 py-3 shadow-lg shadow-black/10">
        <label className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition-colors hover:border-slate-500 hover:text-white">
          <Paperclip size={16} />
          <input type="file" className="hidden" onChange={onFileSelected} disabled={disabled} />
        </label>

        <textarea
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          placeholder="Write a message..."
          rows={1}
          disabled={disabled}
          className="min-h-[44px] flex-1 resize-none border-0 bg-transparent px-1 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600"
          onKeyDown={async (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              handleSubmit(event)
            }
          }}
        />

        <button
          type="submit"
          disabled={disabled || (!value.trim() && !attachment)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white transition-colors hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SendHorizonal size={16} />
        </button>
      </div>
    </form>
  )
}
