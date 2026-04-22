import { useEffect, useRef } from 'react'
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
  const textareaRef = useRef(null)
  const typingTimerRef = useRef(null)

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  // Focus on edit start
  useEffect(() => {
    if (editingMessage) textareaRef.current?.focus()
  }, [editingMessage?.id])

  // Cleanup typing timer
  useEffect(() => () => clearTimeout(typingTimerRef.current), [])

  const handleChange = (e) => {
    onChange(e.target.value)
    onTyping?.(true)
    clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => onTyping?.(false), 1500)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      triggerSend()
    }
  }

  // ⚡ INSTANT SEND: clear draft immediately, then fire send (no await blocking)
  const triggerSend = () => {
    if (!value.trim() && !attachment) return
    // Clear immediately for zero perceived latency
    const msg = value.trim()
    const att = attachment
    onChange('')
    onClearAttachment?.()
    onCancelEdit?.() // clear edit mode too if any
    // Re-focus for next message
    setTimeout(() => textareaRef.current?.focus(), 0)
    // Fire send (non-blocking)
    Promise.resolve().then(() => onSend({ message: msg, attachment: att, editingMessage })).catch(() => {})
  }

  const canSend = (value.trim().length > 0 || !!attachment) && !disabled

  return (
    <div className="flex-shrink-0 border-t border-slate-800/60 bg-surface-950 px-3 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3">
      {/* Edit banner */}
      {editingMessage && (
        <div className="mb-2 flex items-center justify-between rounded-xl border border-primary-500/20 bg-primary-500/8 px-3 py-2">
          <span className="flex items-center gap-2 text-xs font-medium text-primary-300">
            <Edit3 size={12} /> Editing message
          </span>
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded-md p-0.5 text-primary-400 hover:bg-primary-500/15 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Attachment preview */}
      {attachment && (
        <div className="mb-2 flex items-center justify-between rounded-xl border border-slate-700/60 bg-surface-900 px-3 py-2">
          <span className="flex items-center gap-2 text-xs text-slate-300">
            <span>📎</span>
            <span className="truncate max-w-[200px]">{attachment.name}</span>
          </span>
          <button
            type="button"
            onClick={onClearAttachment}
            className="ml-2 rounded-md p-0.5 text-slate-500 hover:bg-slate-700 hover:text-slate-200 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input row */}
      <div className={`flex items-end gap-2 rounded-2xl border bg-surface-900 px-3 py-2 shadow-lg transition-all duration-200 ${
        disabled ? 'border-slate-800 opacity-60' : 'border-slate-700/60 focus-within:border-primary-500/40 focus-within:shadow-primary-900/10'
      }`}>
        {/* Attachment button */}
        <label className={`flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl transition-all ${
          disabled ? 'text-slate-700' : 'text-slate-500 hover:bg-surface-700 hover:text-slate-200'
        }`}>
          <Paperclip size={18} />
          <input type="file" className="hidden" onChange={onFileSelected} disabled={disabled} />
        </label>

        {/* Textarea — NEVER disabled so typing always works */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Write a message…"
          rows={1}
          className="flex-1 resize-none border-0 bg-transparent py-[8px] text-sm leading-tight text-slate-100 outline-none placeholder:text-slate-600"
          style={{ minHeight: '36px', maxHeight: '160px' }}
        />

        {/* Send button */}
        <button
          type="button"
          onClick={triggerSend}
          disabled={!canSend}
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-md transition-all duration-150 ${
            canSend
              ? 'bg-gradient-to-br from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 hover:shadow-primary-900/30 active:scale-90'
              : 'cursor-not-allowed bg-surface-800 text-slate-600'
          }`}
        >
          <SendHorizonal size={16} className={canSend ? 'translate-x-[1px]' : ''} />
        </button>
      </div>

      <p className="mt-1.5 px-1 text-[10px] text-slate-700">
        <kbd className="rounded bg-surface-800 px-1 py-0.5 text-slate-600">Enter</kbd> send
        · <kbd className="rounded bg-surface-800 px-1 py-0.5 text-slate-600">Shift+Enter</kbd> new line
      </p>
    </div>
  )
}
