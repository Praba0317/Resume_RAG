import { useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { ArrowUp } from 'lucide-react'

interface ChatInputBarProps { onSubmit: (query: string) => void; disabled?: boolean }

export function ChatInputBar({ onSubmit, disabled = false }: ChatInputBarProps) {
  const [value, setValue] = useState('')
  function submit(event?: FormEvent) { event?.preventDefault(); const query = value.trim(); if (!query || disabled) return; onSubmit(query); setValue('') }
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit() } }
  return <form className="chat-input-form" onSubmit={submit}><textarea aria-label="Search candidates" value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={handleKeyDown} placeholder="Describe the candidate you need..." rows={1} disabled={disabled} /><button type="submit" aria-label="Send search" disabled={disabled || !value.trim()}><ArrowUp size={18} /></button><span>Enter to search · Shift+Enter for a new line</span></form>
}
