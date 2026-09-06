import { Trash2 } from 'lucide-react'
import { useChatStore } from '../lib/stores/chat.store'
import { useSearchStore } from '../lib/stores/search.store'

export function ClearChatButton() {
  const clearMessages = useChatStore((state) => state.clearMessages)
  const clearResults = useSearchStore((state) => state.clearResults)
  return <button className="clear-chat-button" type="button" onClick={() => { clearMessages(); clearResults() }}><Trash2 size={15} /> Clear chat</button>
}
