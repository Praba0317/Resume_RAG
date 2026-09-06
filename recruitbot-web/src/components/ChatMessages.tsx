import { useEffect, useRef } from 'react'
import { LoaderCircle } from 'lucide-react'
import { useChatStore } from '../lib/stores/chat.store'
import { useUiStore } from '../lib/stores/ui.store'

function timestamp(value: Date) { return value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }

export function ChatMessages() {
  const messages = useChatStore((state) => state.messages)
  const isSearching = useUiStore((state) => state.isSearching)
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isSearching])
  return <div className="message-thread" aria-live="polite">{messages.map((message) => <div className={`message-row ${message.type}`} key={message.id}><div className="message-bubble">{message.text}<time>{timestamp(message.timestamp)}</time></div></div>)}{isSearching && <div className="message-row bot"><div className="message-bubble loading-bubble" role="status"><LoaderCircle size={15} className="spin" /> Searching your collection...</div></div>}<div ref={bottomRef} /></div>
}
