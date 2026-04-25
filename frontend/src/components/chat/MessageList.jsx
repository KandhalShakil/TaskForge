import { useEffect, useRef, useCallback } from 'react'
import MessageBubble from './MessageBubble'
import { MessageSquare } from 'lucide-react'

export default function MessageList({
  messages = [],
  currentUserId,
  onEdit,
  onDelete,
  onRetry,
  onLoadMore,
  hasMore,
  loadingMore,
  typingUsers = {},
}) {
  const scrollRef = useRef(null)
  const bottomRef = useRef(null)
  const isAtBottomRef = useRef(true)
  const prevScrollHeightRef = useRef(0)
  const prevMessageCountRef = useRef(0)

  // Sort messages oldest → newest for display
  const visibleMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  )

  // Track whether user is near bottom
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // Smart scroll: preserve position when loading older messages, scroll down for new ones
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const prevCount = prevMessageCountRef.current
    const newCount = visibleMessages.length

    if (newCount > prevCount) {
      const prevScrollHeight = prevScrollHeightRef.current
      const addedAtTop = el.scrollHeight > prevScrollHeight && el.scrollTop < 50

      if (addedAtTop) {
        // Loaded older messages — keep position
        el.scrollTop = el.scrollHeight - prevScrollHeight
      } else if (isAtBottomRef.current || newCount - prevCount === 1) {
        // New message or first load — scroll to bottom
        bottomRef.current?.scrollIntoView({ behavior: newCount === 1 ? 'instant' : 'smooth' })
      }
    }

    prevScrollHeightRef.current = el.scrollHeight
    prevMessageCountRef.current = newCount
  }, [visibleMessages.length])

  const typingCount = Object.keys(typingUsers).length

  // Group messages by date
  const grouped = []
  let lastDate = null
  visibleMessages.forEach((msg) => {
    const d = msg.createdAt ? new Date(msg.createdAt).toDateString() : null
    if (d && d !== lastDate) {
      grouped.push({ type: 'date', label: formatDateLabel(d), key: `date-${d}` })
      lastDate = d
    }
    grouped.push({ type: 'message', msg, key: msg.id || msg.clientMessageId })
  })

  return (
    <div
      ref={scrollRef}
      className="flex flex-1 flex-col overflow-y-auto overscroll-contain scroll-smooth px-3 py-4 sm:px-5 sm:py-5"
      style={{ scrollbarGutter: 'stable' }}
    >
      {/* Load more */}
      {hasMore && (
        <div className="mb-4 flex justify-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-medium transition-all disabled:opacity-50"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-main)', color: 'var(--text-muted)' }}
          >
            {loadingMore ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                Loading…
              </>
            ) : 'Load older messages'}
          </button>
        </div>
      )}

      {/* Empty state */}
      {visibleMessages.length === 0 && !loadingMore && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div 
            className="flex h-16 w-16 items-center justify-center rounded-3xl border"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-main)', color: 'var(--text-muted)' }}
          >
            <MessageSquare size={28} />
          </div>
          <div>
            <p className="text-base font-semibold" style={{ color: 'var(--text-main)' }}>No messages yet</p>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Be the first to say something 👋</p>
          </div>
        </div>
      )}

      {/* Messages grouped by date */}
      <div className="flex flex-col gap-3">
        {grouped.map((item) =>
          item.type === 'date' ? (
            <div key={item.key} className="flex items-center gap-3 py-1">
              <div className="h-px flex-1" style={{ backgroundColor: 'var(--border-main)' }} />
              <span 
                className="rounded-full border px-3 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-main)', color: 'var(--text-muted)' }}
              >
                {item.label}
              </span>
              <div className="h-px flex-1" style={{ backgroundColor: 'var(--border-main)' }} />
            </div>
          ) : (
            <MessageBubble
              key={item.key}
              message={item.msg}
              isMine={String(item.msg.senderId) === String(currentUserId)}
              onEdit={onEdit}
              onDelete={onDelete}
              onRetry={onRetry}
            />
          )
        )}
      </div>

      {/* Typing indicator */}
      {typingCount > 0 && (
        <div className="mt-2 flex items-center gap-2 px-12">
          <div className="flex gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:0ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:300ms]" />
          </div>
          <span className="text-xs text-slate-500">
            {typingCount === 1 ? 'Someone is typing' : `${typingCount} people are typing`}
          </span>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={bottomRef} className="h-px shrink-0" />
    </div>
  )
}

function formatDateLabel(dateString) {
  const d = new Date(dateString)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  if (d.toDateString() === now.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
