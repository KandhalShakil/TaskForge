import { useMemo, useRef } from 'react'
import { CheckCheck, Clock3, AlertCircle, RotateCcw, PencilLine, Trash2 } from 'lucide-react'
import { formatChatTimestamp } from '../../utils/chat'

export default function MessageBubble({ message, isMine, isContinued, onEdit, onDelete, onRetry }) {
  const sender = message.sender
  const time = useMemo(() => formatChatTimestamp(message.createdAt), [message.createdAt])
  const readCount = Array.isArray(message.readBy) ? message.readBy.length : 0

  const isSending = message.status === 'sending'
  const isFailed = message.status === 'failed'

  const avatarLetter = sender?.initials || sender?.full_name?.[0]?.toUpperCase() || 'U'
  const senderName = isMine ? 'You' : sender?.full_name || 'Unknown'

  return (
    <div className={`group flex items-end gap-2.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`mb-1 flex-shrink-0 transition-opacity duration-200 ${isContinued ? 'opacity-0 select-none' : 'opacity-100'}`}>
        {!isContinued && (
          sender?.avatar ? (
            <img
              src={sender.avatar}
              alt={senderName}
              className="h-8 w-8 rounded-full object-cover ring-2 ring-surface-800"
            />
          ) : (
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ring-2 ring-surface-800 ${
              isMine
                ? 'bg-gradient-to-br from-primary-600 to-primary-400 text-white'
                : 'bg-gradient-to-br from-slate-700 to-slate-600 text-slate-200'
            }`}>
              {avatarLetter}
            </div>
          )
        )}
        {isContinued && <div className="w-8" />}
      </div>

      {/* Bubble + meta */}
      <div className={`flex max-w-[72%] flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
        {/* Sender name + time (Only show if not continued) */}
        {!isContinued && (
          <div className={`flex items-center gap-2 px-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-[11px] font-semibold text-slate-400">{senderName}</span>
            <span className="text-[10px] text-slate-600">{time}</span>
          </div>
        )}

        {/* Bubble */}
        <div className={`relative rounded-2xl px-4 py-2.5 shadow-md transition-all ${
          isMine
            ? `bg-gradient-to-br from-primary-600 to-primary-500 text-white ${isContinued ? 'rounded-tr-2xl' : 'rounded-tr-sm'}`
            : `border border-slate-700/60 bg-surface-800 text-slate-100 ${isContinued ? 'rounded-tl-2xl' : 'rounded-tl-sm'}`
        } ${isSending ? 'opacity-70' : ''} ${isFailed ? 'ring-1 ring-rose-500/50' : ''}`}>

          {message.isDeleted ? (
            <p className="text-sm italic opacity-60">Message deleted</p>
          ) : (
            <>
              {message.message && (
                <p className="break-words whitespace-pre-wrap text-sm leading-relaxed">
                  {message.message}
                </p>
              )}
              {message.attachmentUrl && (
                <a
                  href={message.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                    isMine
                      ? 'bg-white/15 hover:bg-white/25 text-white'
                      : 'bg-surface-700 hover:bg-surface-600 text-primary-300'
                  }`}
                >
                  📎 {message.attachmentName || 'Download attachment'}
                </a>
              )}
            </>
          )}

          {/* Tail — Only on the first message of a group */}
          {!isContinued && isMine && (
            <span className="absolute -top-0 -right-1.5 text-primary-500">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <path d="M0 0 Q10 0 10 10 Q5 5 0 0Z" className="origin-center rotate-90" />
              </svg>
            </span>
          )}
          {!isContinued && !isMine && (
            <span className="absolute -top-0 -left-1.5 text-surface-800">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <path d="M10 0 Q0 0 0 10 Q5 5 10 0Z" className="origin-center -rotate-90" />
              </svg>
            </span>
          )}
        </div>

        {/* Status row */}
        <div className={`flex items-center gap-1.5 px-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
          {isMine && isSending && (
            <span className="flex items-center gap-1 text-[10px] text-amber-400">
              <Clock3 size={10} /> Sending…
            </span>
          )}
          {isMine && isFailed && (
            <>
              <span className="flex items-center gap-1 text-[10px] text-rose-400">
                <AlertCircle size={10} /> Failed
              </span>
              <button
                type="button"
                onClick={() => onRetry?.(message)}
                className="flex items-center gap-1 text-[10px] text-sky-400 transition-colors hover:text-sky-300"
              >
                <RotateCcw size={10} /> Retry
              </button>
            </>
          )}
          {isMine && !message.isDeleted && !isSending && !isFailed && (
            <span className={`flex items-center gap-1 text-[10px] ${readCount > 1 ? 'text-primary-300' : 'text-slate-500'}`}>
              {message.id ? (
                <CheckCheck size={11} strokeWidth={2.5} />
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </span>
          )}
          {message.isEdited && !message.isDeleted && (
            <span className="text-[10px] text-slate-600">edited</span>
          )}

          {/* Hover actions */}
          {isMine && !message.isDeleted && !isSending && (
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => onEdit?.(message)}
                className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-surface-700 hover:text-slate-200"
                title="Edit"
              >
                <PencilLine size={12} />
              </button>
              <button
                type="button"
                onClick={() => onDelete?.(message)}
                className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
