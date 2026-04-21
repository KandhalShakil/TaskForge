import { useEffect, useMemo, useRef } from 'react'
import MessageBubble from './MessageBubble'

export default function MessageList({ messages = [], currentUserId, onEdit, onDelete, onRetry, onLoadMore, hasMore, loadingMore, typingUsers = {} }) {
  const scrollRef = useRef(null)
  const visibleMessages = useMemo(() => [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)), [messages])

  const previousScrollHeight = useRef(0)
  const isScrolledToTop = useRef(false)

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    const handleScroll = () => {
      isScrolledToTop.current = element.scrollTop < 10
    }
    
    element.addEventListener('scroll', handleScroll)
    return () => element.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    // If scroll height increased and we were at the top, we just loaded older messages
    if (isScrolledToTop.current && previousScrollHeight.current < element.scrollHeight) {
      element.scrollTop = element.scrollHeight - previousScrollHeight.current
    } else {
      // Otherwise, assume new message and scroll to bottom
      const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 150
      const isMyMessage = visibleMessages.length > 0 && visibleMessages[visibleMessages.length - 1].senderId === currentUserId
      
      if (isNearBottom || isMyMessage) {
        element.scrollTop = element.scrollHeight
      }
    }
    
    previousScrollHeight.current = element.scrollHeight
  }, [visibleMessages.length, currentUserId])

  const typingNames = Object.keys(typingUsers).length
    ? `${Object.keys(typingUsers).length} user${Object.keys(typingUsers).length > 1 ? 's' : ''} typing...`
    : ''

  return (
    <div ref={scrollRef} className="flex-1 space-y-3 sm:space-y-4 overflow-y-auto px-3 py-4 sm:px-4 sm:py-5">
      {hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="rounded-full border border-slate-700 bg-surface-900 px-4 py-2 text-xs text-slate-300 transition-colors hover:border-slate-500 hover:text-white disabled:opacity-50"
          >
            {loadingMore ? 'Loading older messages...' : 'Load older messages'}
          </button>
        </div>
      )}

      {visibleMessages.length === 0 ? (
        <div className="flex min-h-[14rem] sm:min-h-[20rem] items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-surface-900/40 px-4 sm:px-6 text-center">
          <div>
            <p className="text-lg font-semibold text-white">No messages yet</p>
            <p className="mt-2 text-sm text-slate-500">Start the conversation with your team.</p>
          </div>
        </div>
      ) : (
        visibleMessages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isMine={message.senderId === currentUserId}
            onEdit={onEdit}
            onDelete={onDelete}
            onRetry={onRetry}
          />
        ))
      )}

      {typingNames && <div className="px-1 text-xs text-slate-400">{typingNames}</div>}
    </div>
  )
}
