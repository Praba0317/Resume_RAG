import { useCallback } from 'react'
import { useChatStore } from '../lib/stores/chat.store'
import { useUiStore } from '../lib/stores/ui.store'
import { useSearchStore } from '../lib/stores/search.store'
import { searchResumes } from '../lib/api/search.api'

export function useSearch() {
  const addUserMessage = useChatStore((state) => state.addUserMessage)
  const addBotMessage = useChatStore((state) => state.addBotMessage)
  const setSearching = useUiStore((state) => state.setSearching)
  const setResults = useSearchStore((state) => state.setResults)
  const searchMode = useSearchStore((state) => state.searchMode)
  const topK = useSearchStore((state) => state.topK)
  const bm25Weight = useSearchStore((state) => state.bm25Weight)
  const vectorWeight = useSearchStore((state) => state.vectorWeight)

  const submitQuery = useCallback(
    async (query: string) => {
      addUserMessage(query)
      setSearching(true)

      try {
        const response = await searchResumes({
          query,
          topK,
          mode: searchMode,
          weights: searchMode === 'hybrid' ? { bm25: bm25Weight, vector: vectorWeight } : undefined,
        })

        if (response && response.results.length > 0) {
          setResults(response.results, query)
          addBotMessage(`Found ${response.results.length} matching candidates`)
        } else {
          addBotMessage('No candidates found. Try adjusting your search.')
        }
      } catch (error) {
        console.error('Search error:', error)
        addBotMessage('Search failed. Please try again.')
      } finally {
        setSearching(false)
      }
    },
    [addUserMessage, addBotMessage, setSearching, setResults, searchMode, topK, bm25Weight, vectorWeight],
  )

  return { submitQuery }
}
