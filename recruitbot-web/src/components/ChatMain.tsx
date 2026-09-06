import { useChatStore } from '../lib/stores/chat.store'
import { useUiStore } from '../lib/stores/ui.store'
import { useSearchStore } from '../lib/stores/search.store'
import { ChatInputBar } from './ChatInputBar'
import { ChatMessages } from './ChatMessages'
import { ChatTopbar } from './ChatTopbar'
import { ResultsList } from './ResultsList'
import { SuggestionChips } from './SuggestionChips'
import { WelcomeMessage } from './WelcomeMessage'
import { useSearch } from '../hooks/use-search'

export function ChatMain() {
  const messages = useChatStore((state) => state.messages)
  const isSearching = useUiStore((state) => state.isSearching)
  const results = useSearchStore((state) => state.results)
  const searchMode = useSearchStore((state) => state.searchMode)
  const lastQuery = useSearchStore((state) => state.lastQuery)
  const { submitQuery } = useSearch()

  return (
    <section className="chat-panel">
      <ChatTopbar />
      <div className="chat-content chat-main-content">
        {messages.length === 0 ? (
          <WelcomeMessage />
        ) : (
          <>
            <ChatMessages />
            {results.length > 0 && <ResultsList results={results} searchMode={searchMode} query={lastQuery} />}
          </>
        )}
        <div className="chat-composer-area">
          <ChatInputBar onSubmit={submitQuery} disabled={isSearching} />
          {messages.length === 0 && <SuggestionChips onSelect={submitQuery} />}
        </div>
      </div>
      <footer className="chat-footer">Results are ranked from your private resume collection.</footer>
    </section>
  )
}
