import { useMemo } from 'react'
import { CheckCheck, Clock3, AlertCircle, RotateCcw, PencilLine, Trash2 } from 'lucide-react'
import { formatChatTimestamp } from '../../utils/chat'

export default function MessageBubble({ message, isMine, onEdit, onDelete, onRetry }) {
  const sender = message.sender
  const time = useMemo(() => formatChatTimestamp(message.createdAt), [message.createdAt])
  const readCount = Array.isArray(message.readBy) ? message.readBy.length : 0
  const statusLabel = message.status === 'sending' ? 'Sending' : message.status === 'failed' ? 'Failed' : ''
  const StatusIcon = message.status === 'sending' ? Clock3 : message.status === 'failed' ? AlertCircle : null

  return (
    <div className={`flex gap-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
      {!isMine && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-surface-800 text-xs text-slate-300">
          {sender?.avatar ? (
            <img src={sender.avatar} alt={sender.full_name} className="h-full w-full object-cover" />
          ) : (
            <span>{sender?.initials || 'U'}</span>
          )}
        </div>
      )}

      <div className={`max-w-[75%] rounded-2xl border px-4 py-3 ${isMine ? 'border-primary-500/30 bg-primary-600/20' : 'border-slate-800 bg-surface-900'}`}>
        <div className="mb-1 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {isMine ? 'You' : sender?.full_name || 'Unknown'}
          </div>
          <div className="text-[11px] text-slate-500">{time}</div>
        </div>

        {message.isDeleted ? (
          <p className="text-sm italic text-slate-500">Message deleted</p>
        ) : (
          <>
            {message.message && <p className="break-words whitespace-pre-wrap text-sm text-slate-100">{message.message}</p>}
            {message.attachmentUrl && (
              <a
                href={message.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block rounded-xl border border-slate-700 bg-surface-950/60 px-3 py-2 text-sm text-primary-300 transition-colors hover:border-primary-500/40 hover:text-primary-200"
              >
                {message.attachmentName || 'Download attachment'}
              </a>
            )}
          </>
        )}

        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            {message.isEdited && !message.isDeleted && <span>Edited</span>}
          </div>
          <div className="flex items-center gap-2">
            {isMine && statusLabel && (
              <span className={`inline-flex items-center gap-1 text-[11px] ${message.status === 'failed' ? 'text-rose-400' : 'text-amber-400'}`}>
                {StatusIcon && <StatusIcon size={13} />} {statusLabel}
              </span>
            )}
            {isMine && message.status === 'failed' && (
              <button
                type="button"
                onClick={() => onRetry?.(message)}
                className="inline-flex items-center gap-1 text-[11px] text-sky-300 transition-colors hover:text-sky-200"
                title="Retry message"
              >
                <RotateCcw size={12} /> Retry
              </button>
            )}
            {isMine && !message.isDeleted && (
              <>
                <button type="button" onClick={() => onEdit?.(message)} className="text-slate-500 transition-colors hover:text-slate-200" title="Edit message">
                  <PencilLine size={13} />
                </button>
                <button type="button" onClick={() => onDelete?.(message)} className="text-slate-500 transition-colors hover:text-red-300" title="Delete message">
                  <Trash2 size={13} />
                </button>
              </>
            )}
            {isMine && !message.isDeleted && readCount > 1 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                <CheckCheck size={13} /> Read
              </span>
            )}
          </div>
        </div>
      </div>

      {isMine && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-surface-800 text-xs text-slate-300">
          {sender?.avatar ? (
            <img src={sender.avatar} alt={sender.full_name} className="h-full w-full object-cover" />
          ) : (
            <span>{sender?.initials || 'U'}</span>
          )}
        </div>
      )}
    </div>
  )
}
